# common.ps1 — helpers shared by the anton-toolkit hook scripts (dot-sourced, never run directly).
# Windows PowerShell 5.1 compatible. Every helper swallows its own errors: a hook must never hang or crash.
#
# Review-mark contract (used by review-mark.ps1 and review-gate.ps1):
#   * The fingerprint describes the CODE changes of the working tree relative to HEAD, independent of the
#     index: for every changed/untracked code file (see Test-CodeFile) it takes the SHA-256 of the file's
#     current content (or "deleted"), sorted by path, and hashes that list with SHA-256. Staging a file
#     therefore does not change the fingerprint; editing, adding or deleting a code file does.
#   * Untracked files under .claude/agent-memory/ and .claude/agent-memory-local/ (reviewer agents' notes)
#     and the opt-in file .claude/review-gate are ignored.
#   * The mark lives in <git-dir>/anton-toolkit-review-mark as "key=value" lines (fingerprint=, timestamp=, ...).
#
# Why external programs go through Invoke-Process instead of `& git`: Windows PowerShell 5.1 pumps its own
# stdin into every native child. When stdin is an open pipe with no data (a reviewer agent running a script
# by hand from its shell) `& git` blocks until that pipe closes. Invoke-Process gives the child a closed
# stdin, fixed UTF-8 decoding and a hard timeout.

Set-StrictMode -Off
$ErrorActionPreference = 'Continue'

$script:Utf8NoBom = New-Object System.Text.UTF8Encoding($false)
try { [Console]::OutputEncoding = $script:Utf8NoBom } catch { }

$script:CodeExtensions = @(
  'kt', 'kts', 'java', 'go', 'py', 'pyi', 'ts', 'tsx', 'js', 'jsx', 'mjs', 'cjs', 'css', 'scss', 'sql',
  'xml', 'yml', 'yaml', 'html', 'vue', 'rs', 'cs', 'swift', 'sh', 'ps1', 'gradle', 'properties', 'toml'
)
$script:MarkFileName = 'anton-toolkit-review-mark'
$script:GateFileRelative = '.claude/review-gate'
$script:UntrackedExcludePrefixes = @('.claude/agent-memory/', '.claude/agent-memory-local/')
$script:UntrackedExcludeExact = @('.claude/review-gate')
$script:GitExitCode = 0
$script:GitPath = $null

# Reads the hook event JSON from stdin. Returns the parsed object, or $null when there is no stdin, no data
# within the wait, or the data is not a JSON object. Uses an idle timeout so an inherited pipe that never
# closes cannot hang the script.
function Read-HookInput {
  param([int]$FirstWaitMs = 1000, [int]$IdleWaitMs = 300)
  try {
    if (-not [Console]::IsInputRedirected) { return $null }
    $stream = [Console]::OpenStandardInput()
    $buffer = New-Object byte[] 65536
    $memory = New-Object System.IO.MemoryStream
    $wait = $FirstWaitMs
    while ($true) {
      $task = $stream.ReadAsync($buffer, 0, $buffer.Length)
      if (-not $task.Wait($wait)) { break }
      $count = $task.Result
      if ($count -le 0) { break }
      $memory.Write($buffer, 0, $count)
      $wait = $IdleWaitMs
    }
    $text = $script:Utf8NoBom.GetString($memory.ToArray()).TrimStart([char]0xFEFF)
    if ([string]::IsNullOrWhiteSpace($text)) { return $null }
    if (-not $text.TrimStart().StartsWith('{')) { return $null }
    return ($text | ConvertFrom-Json)
  } catch {
    return $null
  }
}

# Property access that returns $null for a missing member or a non-object.
function Get-Prop {
  param($Object, [string]$Name)
  try {
    if ($null -eq $Object) { return $null }
    $member = $Object.PSObject.Properties[$Name]
    if ($null -eq $member) { return $null }
    return $member.Value
  } catch {
    return $null
  }
}

# Quotes one argument for a Windows command line (MSVCRT rules), so paths with spaces survive.
function ConvertTo-ArgumentString {
  param([string[]]$Arguments)
  $parts = foreach ($arg in $Arguments) {
    if ($null -eq $arg) { continue }
    if ($arg -ne '' -and $arg -notmatch '[\s"]') { $arg; continue }
    $builder = New-Object System.Text.StringBuilder
    $null = $builder.Append('"')
    $backslashes = 0
    foreach ($ch in $arg.ToCharArray()) {
      if ($ch -eq '\') { $backslashes++; continue }
      if ($ch -eq '"') { $null = $builder.Append('\', ($backslashes * 2 + 1)).Append('"'); $backslashes = 0; continue }
      if ($backslashes -gt 0) { $null = $builder.Append('\', $backslashes); $backslashes = 0 }
      $null = $builder.Append($ch)
    }
    if ($backslashes -gt 0) { $null = $builder.Append('\', ($backslashes * 2)) }
    $null = $builder.Append('"')
    $builder.ToString()
  }
  return (@($parts) -join ' ')
}

# Runs an executable with a closed stdin and captured UTF-8 stdout/stderr.
# Returns @{ ExitCode; StdOut; StdErr }; ExitCode is -1 when the program could not be started or timed out.
function Invoke-Process {
  param([string]$FilePath, [string[]]$Arguments, [string]$WorkDir, [int]$TimeoutMs = 15000)
  $result = @{ ExitCode = -1; StdOut = ''; StdErr = '' }
  $process = $null
  try {
    $info = New-Object System.Diagnostics.ProcessStartInfo
    $info.FileName = $FilePath
    $info.Arguments = ConvertTo-ArgumentString $Arguments
    if ($WorkDir) { $info.WorkingDirectory = $WorkDir }
    $info.UseShellExecute = $false
    $info.CreateNoWindow = $true
    $info.RedirectStandardInput = $true
    $info.RedirectStandardOutput = $true
    $info.RedirectStandardError = $true
    $info.StandardOutputEncoding = $script:Utf8NoBom
    $info.StandardErrorEncoding = $script:Utf8NoBom
    $info.EnvironmentVariables['GIT_OPTIONAL_LOCKS'] = '0'
    $process = [System.Diagnostics.Process]::Start($info)
    $process.StandardInput.Close()
    $outTask = $process.StandardOutput.ReadToEndAsync()
    $errTask = $process.StandardError.ReadToEndAsync()
    if (-not $process.WaitForExit($TimeoutMs)) {
      try { $process.Kill() } catch { }
      $result.StdErr = 'timeout'
      return $result
    }
    $tasks = [System.Threading.Tasks.Task[]]@($outTask, $errTask)
    if (-not [System.Threading.Tasks.Task]::WaitAll($tasks, 5000)) { return $result }
    $result.ExitCode = $process.ExitCode
    $result.StdOut = [string]$outTask.Result
    $result.StdErr = [string]$errTask.Result
  } catch {
    $result.ExitCode = -1
  } finally {
    if ($process) { try { $process.Dispose() } catch { } }
  }
  return $result
}

function Get-GitPath {
  if ($script:GitPath) { return $script:GitPath }
  $command = Get-Command git -CommandType Application -ErrorAction SilentlyContinue
  if ($command) { $script:GitPath = @($command)[0].Source }
  return $script:GitPath
}

function Test-GitAvailable {
  return [bool](Get-GitPath)
}

# Runs git in WorkDir; returns raw stdout (string, possibly empty) and sets $script:GitExitCode.
function Invoke-Git {
  param([string]$WorkDir, [string[]]$GitArgs)
  $script:GitExitCode = -1
  try {
    $git = Get-GitPath
    if (-not $git) { return '' }
    $run = Invoke-Process -FilePath $git -Arguments (@('--no-pager', '-C', $WorkDir) + $GitArgs) -WorkDir $WorkDir
    $script:GitExitCode = $run.ExitCode
    return [string]$run.StdOut
  } catch {
    $script:GitExitCode = -1
    return ''
  }
}

# Git Bash style "/c/dir" -> "C:/dir"; anything else is returned unchanged.
function ConvertTo-WindowsPath {
  param([string]$Path)
  if (-not $Path) { return $Path }
  if ($Path -match '^/([A-Za-z])(/.*)?$') {
    $rest = $Matches[2]
    if (-not $rest) { $rest = '/' }
    return ($Matches[1].ToUpperInvariant() + ':' + $rest)
  }
  return $Path
}

# Returns @{ Top = <work tree root>; GitDir = <absolute git dir> } or $null when StartDir is not inside a work tree.
function Get-RepoInfo {
  param([string]$StartDir)
  try {
    if (-not $StartDir) { return $null }
    if (-not (Test-Path -LiteralPath $StartDir -PathType Container)) { return $null }
    $output = Invoke-Git -WorkDir $StartDir -GitArgs @('rev-parse', '--show-toplevel', '--git-dir')
    if ($script:GitExitCode -ne 0) { return $null }
    $lines = @($output -split "`r?`n" | Where-Object { $_ -and $_.Trim() })
    if ($lines.Count -lt 2) { return $null }
    $top = $lines[0].Trim()
    $gitDir = $lines[1].Trim()
    if (-not [System.IO.Path]::IsPathRooted($gitDir)) {
      $gitDir = [System.IO.Path]::GetFullPath([System.IO.Path]::Combine($StartDir, $gitDir))
    }
    return @{ Top = $top; GitDir = $gitDir }
  } catch {
    return $null
  }
}

function Test-CodeFile {
  param([string]$RelPath)
  if (-not $RelPath) { return $false }
  $name = $RelPath
  $slash = $RelPath.LastIndexOfAny([char[]]@('/', '\'))
  if ($slash -ge 0) { $name = $RelPath.Substring($slash + 1) }
  if ($name -like 'Dockerfile*' -or $name -like 'docker-compose*') { return $true }
  $dot = $name.LastIndexOf('.')
  if ($dot -lt 0 -or $dot -eq ($name.Length - 1)) { return $false }
  $ext = $name.Substring($dot + 1).ToLowerInvariant()
  return ($script:CodeExtensions -contains $ext)
}

function Test-ExcludedUntracked {
  param([string]$RelPath)
  $p = $RelPath.Replace('\', '/')
  if ($script:UntrackedExcludeExact -contains $p) { return $true }
  foreach ($prefix in $script:UntrackedExcludePrefixes) {
    if ($p.StartsWith($prefix, [System.StringComparison]::OrdinalIgnoreCase)) { return $true }
  }
  return $false
}

# Splits NUL-separated git output (from -z) into non-empty entries.
function Split-NullSeparated {
  param([string]$Text)
  if (-not $Text) { return @() }
  return @($Text -split "`0" | Where-Object { $_ -and $_.Trim() })
}

function Get-SortedUnique {
  param([string[]]$Items)
  $set = New-Object 'System.Collections.Generic.HashSet[string]' ([System.StringComparer]::Ordinal)
  foreach ($item in $Items) { if ($item) { $null = $set.Add($item) } }
  $array = [string[]]@($set)
  [Array]::Sort($array, [System.StringComparer]::Ordinal)
  return ,$array
}

# Code files whose working-tree content differs from HEAD (tracked, staged or not) plus untracked code files.
function Get-ChangedCodeFiles {
  param($Repo)
  $top = $Repo.Top
  $null = Invoke-Git -WorkDir $top -GitArgs @('rev-parse', '--verify', '-q', 'HEAD')
  $hasHead = ($script:GitExitCode -eq 0)
  $tracked = @()
  if ($hasHead) {
    $tracked += Split-NullSeparated (Invoke-Git -WorkDir $top -GitArgs @('diff', 'HEAD', '--name-only', '--no-renames', '-z'))
  } else {
    $tracked += Split-NullSeparated (Invoke-Git -WorkDir $top -GitArgs @('diff', '--cached', '--name-only', '--no-renames', '-z'))
    $tracked += Split-NullSeparated (Invoke-Git -WorkDir $top -GitArgs @('diff', '--name-only', '--no-renames', '-z'))
  }
  $untracked = Split-NullSeparated (Invoke-Git -WorkDir $top -GitArgs @('ls-files', '--others', '--exclude-standard', '-z'))
  $code = @()
  foreach ($p in $tracked) { if (Test-CodeFile $p) { $code += $p } }
  foreach ($p in $untracked) { if (-not (Test-ExcludedUntracked $p) -and (Test-CodeFile $p)) { $code += $p } }
  return Get-SortedUnique $code
}

function ConvertTo-Hex {
  param([byte[]]$Bytes)
  return [BitConverter]::ToString($Bytes).Replace('-', '').ToLowerInvariant()
}

function Get-FileSha256Hex {
  param($Sha, [string]$FullPath)
  try {
    $stream = New-Object System.IO.FileStream($FullPath, [System.IO.FileMode]::Open, [System.IO.FileAccess]::Read, [System.IO.FileShare]::ReadWrite)
    try { return (ConvertTo-Hex $Sha.ComputeHash($stream)) } finally { $stream.Dispose() }
  } catch {
    return 'unreadable'
  }
}

# Returns @{ Fingerprint = <hex or '' when no code changed>; Files = <string[] of repo-relative paths> }.
function Get-TreeFingerprint {
  param($Repo)
  $files = Get-ChangedCodeFiles $Repo
  if ($files.Count -eq 0) { return @{ Fingerprint = ''; Files = @() } }
  $sha = [System.Security.Cryptography.SHA256]::Create()
  try {
    $builder = New-Object System.Text.StringBuilder
    foreach ($rel in $files) {
      $full = [System.IO.Path]::Combine($Repo.Top, $rel)
      $hash = 'deleted'
      if ([System.IO.File]::Exists($full)) { $hash = Get-FileSha256Hex -Sha $sha -FullPath $full }
      $null = $builder.Append($rel).Append([char]0).Append($hash).Append([char]10)
    }
    $fingerprint = ConvertTo-Hex $sha.ComputeHash($script:Utf8NoBom.GetBytes($builder.ToString()))
  } finally {
    $sha.Dispose()
  }
  return @{ Fingerprint = $fingerprint; Files = $files }
}

function Get-MarkPath {
  param($Repo)
  return [System.IO.Path]::Combine($Repo.GitDir, $script:MarkFileName)
}

# Returns @{ Fingerprint; Timestamp } or $null when no mark exists.
function Read-ReviewMark {
  param($Repo)
  try {
    $path = Get-MarkPath $Repo
    if (-not [System.IO.File]::Exists($path)) { return $null }
    $mark = @{ Fingerprint = ''; Timestamp = '' }
    foreach ($line in [System.IO.File]::ReadAllLines($path, $script:Utf8NoBom)) {
      $eq = $line.IndexOf('=')
      if ($eq -lt 1) { continue }
      $key = $line.Substring(0, $eq).Trim()
      $value = $line.Substring($eq + 1).Trim()
      if ($key -eq 'fingerprint') { $mark.Fingerprint = $value }
      elseif ($key -eq 'timestamp') { $mark.Timestamp = $value }
    }
    return $mark
  } catch {
    return $null
  }
}

function Write-ReviewMark {
  param($Repo, [string]$Fingerprint, [string[]]$Files, [string]$Source)
  $builder = New-Object System.Text.StringBuilder
  $null = $builder.Append("fingerprint=$Fingerprint`n")
  $null = $builder.Append("timestamp=$([DateTimeOffset]::Now.ToString('o'))`n")
  $null = $builder.Append("source=$Source`n")
  $null = $builder.Append("files=$($Files.Count)`n")
  $shown = 0
  foreach ($f in $Files) {
    if ($shown -ge 200) { $null = $builder.Append("file=... ($($Files.Count - $shown) more)`n"); break }
    $null = $builder.Append("file=$f`n")
    $shown++
  }
  [System.IO.File]::WriteAllText((Get-MarkPath $Repo), $builder.ToString(), $script:Utf8NoBom)
}
