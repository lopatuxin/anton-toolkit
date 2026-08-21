# common.ps1 - helpers shared by the logos hook scripts (dot-sourced, never run directly).
#
# Windows PowerShell 5.1 and PowerShell 7 compatible. Pure ASCII on purpose: PowerShell 5.1 reads a BOM-less
# script as ANSI, so every Cyrillic token in a hook lives in a \uXXXX regex escape, never as a literal.
# Every helper swallows its own errors: a hook must never hang or crash, and an internal error always means
# "do not block" (the caller exits 0).
#
# Why external programs go through Invoke-Process instead of `& git`: Windows PowerShell 5.1 pumps its own
# stdin into every native child. When stdin is an open pipe with no data, `& git` blocks until that pipe closes.
# Invoke-Process gives the child a closed stdin, fixed UTF-8 decoding and a hard timeout.

Set-StrictMode -Off
$ErrorActionPreference = 'Continue'

$script:Utf8NoBom = New-Object System.Text.UTF8Encoding($false)
try { [Console]::OutputEncoding = $script:Utf8NoBom } catch { }

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

# tool_input.command of a Bash or PowerShell tool call, '' when absent.
function Get-CommandText {
  param($HookEvent)
  try { return [string](Get-Prop (Get-Prop $HookEvent 'tool_input') 'command') } catch { return '' }
}

# The hook's working directory: the event's cwd, else the process cwd. Normalized (see Get-NormalizedPath).
function Get-HookCwd {
  param($HookEvent)
  $cwd = $null
  try { $cwd = Get-NormalizedPath ([string](Get-Prop $HookEvent 'cwd')) } catch { $cwd = $null }
  if (-not $cwd) { try { $cwd = Get-NormalizedPath ((Get-Location).ProviderPath) } catch { $cwd = $null } }
  return $cwd
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
  param([string]$FilePath, [string[]]$Arguments, [string]$WorkDir, [int]$TimeoutMs = 3000)
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
    if (-not [System.Threading.Tasks.Task]::WaitAll($tasks, 2000)) { return $result }
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

# Git Bash style "/c/dir" -> "C:/dir", "~" / "~/x" -> the user's home; anything else is returned unchanged.
function ConvertTo-WindowsPath {
  param([string]$Path)
  if (-not $Path) { return $Path }
  if ($Path -match '^/([A-Za-z])(/.*)?$') {
    $rest = $Matches[2]
    if (-not $rest) { $rest = '/' }
    return ($Matches[1].ToUpperInvariant() + ':' + $rest)
  }
  if ($Path -match '^~([/\\].*)?$') {
    $home = $env:USERPROFILE
    if (-not $home) { $home = $env:HOME }
    if ($home) { return ($home + $Matches[1]) }
  }
  return $Path
}

# Absolute path with forward slashes and no trailing slash (the drive root keeps its slash), or $null when the
# text is not a usable path. Accepts Windows, Git Bash (/c/...) and mixed-slash forms.
function Get-NormalizedPath {
  param([string]$Path)
  try {
    if (-not $Path) { return $null }
    $trimmed = $Path.Trim().Trim('"', "'")
    if (-not $trimmed) { return $null }
    $full = [System.IO.Path]::GetFullPath((ConvertTo-WindowsPath $trimmed)).Replace('\', '/')
    if ($full.Length -gt 3) { $full = $full.TrimEnd('/') }
    return $full
  } catch {
    return $null
  }
}

# Target resolved against Base (absolute targets ignore Base). $null when Base is unknown and Target is relative,
# or when the text is not a usable path.
function Resolve-PathFrom {
  param([string]$Base, [string]$Target)
  try {
    if (-not $Target) { return $null }
    $converted = ConvertTo-WindowsPath ($Target.Trim().Trim('"', "'"))
    if (-not $converted) { return $null }
    if ([System.IO.Path]::IsPathRooted($converted)) { return (Get-NormalizedPath $converted) }
    if (-not $Base) { return $null }
    return (Get-NormalizedPath ([System.IO.Path]::Combine($Base, $converted)))
  } catch {
    return $null
  }
}

# Repo-relative path (forward slashes) of Full under Root, '' when Full is Root itself, $null when Full is outside.
# Case-insensitive, as Windows paths are.
function Get-RelativePath {
  param([string]$Root, [string]$Full)
  try {
    if (-not $Root -or -not $Full) { return $null }
    if ([string]::Equals($Root, $Full, [System.StringComparison]::OrdinalIgnoreCase)) { return '' }
    $prefix = $Root.TrimEnd('/') + '/'
    if ($Full.StartsWith($prefix, [System.StringComparison]::OrdinalIgnoreCase)) { return $Full.Substring($prefix.Length) }
    return $null
  } catch {
    return $null
  }
}

# Nearest ancestor of Dir (inclusive) that holds a .git entry (directory, or the file of a linked work tree /
# submodule), normalized; falls back to `git rev-parse --show-toplevel` for layouts the walk-up cannot see
# (GIT_DIR in the environment). $null when Dir is not inside a repository.
function Find-RepoRoot {
  param([string]$Dir)
  try {
    $current = Get-NormalizedPath $Dir
    while ($current) {
      $dotGit = $current + '/.git'
      if ([System.IO.Directory]::Exists($dotGit) -or [System.IO.File]::Exists($dotGit)) { return $current }
      $parent = [System.IO.Path]::GetDirectoryName($current)
      if (-not $parent -or $parent -eq $current) { break }
      $current = Get-NormalizedPath $parent
    }
  } catch { }
  try {
    $start = Get-NormalizedPath $Dir
    if (-not $start -or -not [System.IO.Directory]::Exists($start)) { return $null }
    if (-not (Test-GitAvailable)) { return $null }
    $top = (Invoke-Git -WorkDir $start -GitArgs @('rev-parse', '--show-toplevel')).Trim()
    if ($script:GitExitCode -eq 0 -and $top) { return (Get-NormalizedPath $top) }
  } catch { }
  return $null
}

function Test-DirectoryExists {
  param([string]$Path)
  try { return [System.IO.Directory]::Exists($Path) } catch { return $false }
}

# PreToolUse refusal: deny JSON on stdout (read when the exit code is 0) and the reason on stderr (read when the
# exit code is 2). The caller exits 2.
function Write-PreToolUseDeny {
  param([string]$Reason)
  try {
    $payload = @{
      hookSpecificOutput = @{
        hookEventName            = 'PreToolUse'
        permissionDecision       = 'deny'
        permissionDecisionReason = $Reason
      }
    }
    [Console]::Out.Write(($payload | ConvertTo-Json -Compress -Depth 4))
  } catch { }
  try { [Console]::Error.Write($Reason) } catch { }
}

# PostToolUse refusal: the tool already ran; block JSON on stdout and the reason on stderr make the model act on
# it at once. The caller exits 2.
function Write-PostToolUseBlock {
  param([string]$Reason)
  try { [Console]::Out.Write((@{ decision = 'block'; reason = $Reason } | ConvertTo-Json -Compress)) } catch { }
  try { [Console]::Error.Write($Reason) } catch { }
}
