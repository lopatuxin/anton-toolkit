# post-edit-format.ps1 — PostToolUse hook for Edit/Write/MultiEdit.
#
# If the edited file is a Go source file and gofmt is on PATH, runs `gofmt -w` on it (only when gofmt
# would actually change it, so an already-formatted file keeps its modification time). When gofmt
# rejects the file (syntax error) the message is passed to Claude as additional context.
# Always exits 0 — this hook never blocks anything.

function Invoke-PostEditFormat {
  $hookEvent = Read-HookInput
  if (-not $hookEvent) { return }
  $file = [string](Get-Prop (Get-Prop $hookEvent 'tool_input') 'file_path')
  if (-not $file) { return }
  if (-not $file.ToLowerInvariant().EndsWith('.go')) { return }
  $file = ConvertTo-WindowsPath $file
  if (-not [System.IO.File]::Exists($file)) { return }
  $gofmt = Get-Command gofmt -CommandType Application -ErrorAction SilentlyContinue
  if (-not $gofmt) { return }
  $gofmtPath = @($gofmt)[0].Source
  $workDir = [System.IO.Path]::GetDirectoryName($file)

  $listing = Invoke-Process -FilePath $gofmtPath -Arguments @('-l', $file) -WorkDir $workDir
  if ($listing.ExitCode -ne 0) {
    $message = ("$($listing.StdErr)`n$($listing.StdOut)").Trim()
    if ($message.Length -gt 800) { $message = $message.Substring(0, 800) + ' ...' }
    if ($message) {
      $payload = @{
        hookSpecificOutput = @{
          hookEventName     = 'PostToolUse'
          additionalContext = "gofmt could not format $file (the file does not parse):`n$message"
        }
      }
      [Console]::Out.Write(($payload | ConvertTo-Json -Compress -Depth 4))
    }
    return
  }
  if (-not $listing.StdOut.Trim()) { return }
  $null = Invoke-Process -FilePath $gofmtPath -Arguments @('-w', $file) -WorkDir $workDir
}

try {
  . (Join-Path $PSScriptRoot 'common.ps1')
  Invoke-PostEditFormat
} catch { }
exit 0
