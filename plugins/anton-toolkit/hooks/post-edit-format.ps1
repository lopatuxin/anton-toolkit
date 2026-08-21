# post-edit-format.ps1 — PostToolUse hook for every Edit/Write/MultiEdit. Always exits 0, never blocks.
#
# 1. Touched-files ledger: if the edited file lives inside a git work tree, records
#    "<session_id>\t<ISO timestamp>\t<repo-relative path>" in <git-dir>/anton-toolkit-touched (one line per
#    session+path, entries older than 30 days pruned). stop-gate.ps1 reads it to know which code files Claude
#    itself edited in the current session — the owner's own IDE edits are never in it.
# 2. gofmt: for a Go file with gofmt on PATH, runs `gofmt -w` (only when gofmt would change the file, so an
#    already-formatted file keeps its modification time). A gofmt parse error is passed to Claude as
#    additional context.

function Write-TouchedLedger {
  param([string]$File, [string]$SessionId)
  if (-not $SessionId) { return }
  if (-not (Test-GitAvailable)) { return }
  $dir = [System.IO.Path]::GetDirectoryName($File)
  if (-not $dir -or -not (Test-Path -LiteralPath $dir -PathType Container)) { return }
  $output = Invoke-Git -WorkDir $dir -GitArgs @('rev-parse', '--show-toplevel', '--git-dir', '--show-prefix')
  if ($script:GitExitCode -ne 0) { return }
  $lines = @($output -split "`r?`n")
  if ($lines.Count -lt 2) { return }
  $gitDir = $lines[1].Trim()
  if (-not $gitDir) { return }
  if (-not [System.IO.Path]::IsPathRooted($gitDir)) {
    $gitDir = [System.IO.Path]::GetFullPath([System.IO.Path]::Combine($dir, $gitDir))
  }
  $prefix = ''
  if ($lines.Count -ge 3) { $prefix = $lines[2].Trim() }
  $rel = ($prefix + [System.IO.Path]::GetFileName($File)).Replace('\', '/')
  $null = Add-TouchedEntry -GitDir $gitDir -SessionId $SessionId -RelPath $rel
}

function Invoke-Gofmt {
  param([string]$File)
  if (-not $File.ToLowerInvariant().EndsWith('.go')) { return }
  if (-not [System.IO.File]::Exists($File)) { return }
  $gofmt = Get-Command gofmt -CommandType Application -ErrorAction SilentlyContinue
  if (-not $gofmt) { return }
  $gofmtPath = @($gofmt)[0].Source
  $workDir = [System.IO.Path]::GetDirectoryName($File)

  $listing = Invoke-Process -FilePath $gofmtPath -Arguments @('-l', $File) -WorkDir $workDir
  if ($listing.ExitCode -ne 0) {
    $message = ("$($listing.StdErr)`n$($listing.StdOut)").Trim()
    if ($message.Length -gt 800) { $message = $message.Substring(0, 800) + ' ...' }
    if ($message) {
      $payload = @{
        hookSpecificOutput = @{
          hookEventName     = 'PostToolUse'
          additionalContext = "gofmt could not format $File (the file does not parse):`n$message"
        }
      }
      [Console]::Out.Write(($payload | ConvertTo-Json -Compress -Depth 4))
    }
    return
  }
  if (-not $listing.StdOut.Trim()) { return }
  $null = Invoke-Process -FilePath $gofmtPath -Arguments @('-w', $File) -WorkDir $workDir
}

function Invoke-PostEdit {
  $hookEvent = Read-HookInput
  if (-not $hookEvent) { return }
  $file = [string](Get-Prop (Get-Prop $hookEvent 'tool_input') 'file_path')
  if (-not $file) { return }
  $file = ConvertTo-WindowsPath $file
  try { $file = [System.IO.Path]::GetFullPath($file) } catch { return }
  try { Write-TouchedLedger -File $file -SessionId ([string](Get-Prop $hookEvent 'session_id')) } catch { }
  try { Invoke-Gofmt -File $file } catch { }
}

try {
  . (Join-Path $PSScriptRoot 'common.ps1')
  Invoke-PostEdit
} catch { }
exit 0
