# review-gate.ps1 — PreToolUse hook for `git commit` (Bash and PowerShell tools).
#
# Blocks the commit (exit 2, reason on stderr + JSON deny on stdout) when all of the following hold:
#   * the repository opted in: <repo>/.claude/review-gate exists (any content);
#   * the commit contains code files (see Test-CodeFile in common.ps1);
#   * the working tree's code changes do not match the last review mark written by review-mark.ps1
#     (or what is staged differs from the reviewed working tree).
# Everything else — no stdin, not a git command, no opt-in file, git missing, internal error — exits 0.
# Escape hatch: a command containing ANTON_SKIP_REVIEW=1 is never blocked.

function Write-Deny {
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

# Best-effort: the directory `git commit` will run in — honours `cd <dir> &&` / `Set-Location <dir>;`
# and `git -C <dir>` in the command; falls back to the hook's cwd.
function Resolve-CommandDir {
  param([string]$Command, [string]$Cwd)
  $dir = $Cwd
  try {
    $quoted = '(?:"([^"]+)"|''([^'']+)''|([^\s;&|]+))'
    $cdMatches = [regex]::Matches($Command, "(?:^|[;&|]\s*|\n\s*)(?:cd|Set-Location|pushd)\s+$quoted")
    foreach ($m in $cdMatches) {
      $target = $m.Groups[1].Value + $m.Groups[2].Value + $m.Groups[3].Value
      $dir = [System.IO.Path]::GetFullPath([System.IO.Path]::Combine($dir, (ConvertTo-WindowsPath $target)))
    }
    $cMatch = [regex]::Match($Command, "\bgit\s+(?:-c\s+\S+\s+)*-C\s+$quoted")
    if ($cMatch.Success) {
      $target = $cMatch.Groups[1].Value + $cMatch.Groups[2].Value + $cMatch.Groups[3].Value
      $dir = [System.IO.Path]::GetFullPath([System.IO.Path]::Combine($dir, (ConvertTo-WindowsPath $target)))
    }
    if (Test-Path -LiteralPath $dir -PathType Container) { return $dir }
  } catch { }
  return $Cwd
}

function Test-CommitAllFlag {
  param([string]$Command)
  foreach ($token in ($Command -split '\s+')) {
    if ($token -eq '--all') { return $true }
    if ($token -match '^-[A-Za-z]*a[A-Za-z]*$') { return $true }
  }
  return $false
}

function Format-FileList {
  param([string[]]$Files, [int]$Max = 20)
  if (-not $Files -or $Files.Count -eq 0) { return '(none)' }
  $shown = @($Files | Select-Object -First $Max)
  $text = $shown -join ', '
  if ($Files.Count -gt $Max) { $text += ", ... (+$($Files.Count - $Max) more)" }
  return $text
}

function Invoke-ReviewGate {
  $hookEvent = Read-HookInput
  if (-not $hookEvent) { return 0 }
  $command = [string](Get-Prop (Get-Prop $hookEvent 'tool_input') 'command')
  if (-not $command) { return 0 }
  if ($command -notmatch '\bgit\b[^|;&]*\bcommit\b') { return 0 }
  if ($command -match 'ANTON_SKIP_REVIEW\s*=\s*[''"]?1') { return 0 }
  if (-not (Test-GitAvailable)) { return 0 }

  $cwd = ConvertTo-WindowsPath ([string](Get-Prop $hookEvent 'cwd'))
  if (-not $cwd) { $cwd = (Get-Location).ProviderPath }
  $repo = Get-RepoInfo (Resolve-CommandDir -Command $command -Cwd $cwd)
  if (-not $repo) { return 0 }
  if (-not (Test-Path -LiteralPath ([System.IO.Path]::Combine($repo.Top, $script:GateFileRelative)) -PathType Leaf)) { return 0 }

  $allMode = Test-CommitAllFlag $command
  $staged = Split-NullSeparated (Invoke-Git -WorkDir $repo.Top -GitArgs @('diff', '--cached', '--name-only', '--no-renames', '-z'))
  $unstaged = Split-NullSeparated (Invoke-Git -WorkDir $repo.Top -GitArgs @('diff', '--name-only', '--no-renames', '-z'))
  $candidates = @($staged)
  if ($allMode) { $candidates += $unstaged }
  $pending = Get-SortedUnique @($candidates | Where-Object { Test-CodeFile $_ })
  if ($pending.Count -eq 0) { return 0 }

  if (-not $allMode) {
    $partial = @($pending | Where-Object { $unstaged -contains $_ })
    if ($partial.Count -gt 0) {
      Write-Deny ("Review gate: the staged content differs from the working tree for: " + (Format-FileList $partial) +
        ". The code review covers the working tree, so what you are about to commit was not reviewed. " +
        "Stage the current version of these files (git add <paths>) and commit again. " +
        "To bypass deliberately prefix the command with ANTON_SKIP_REVIEW=1.")
      return 2
    }
  }

  $tree = Get-TreeFingerprint $repo
  if (-not $tree.Fingerprint) { return 0 }
  $mark = Read-ReviewMark $repo
  if ($mark -and $mark.Fingerprint -eq $tree.Fingerprint) { return 0 }

  $why = 'no code review has been recorded for this repository'
  if ($mark) {
    $why = 'the working tree changed since the last code review'
    if ($mark.Timestamp) { $why += " (recorded $($mark.Timestamp))" }
  }
  Write-Deny ("Review gate: $why. Run the anton-toolkit:code-reviewer agent on the current changes (files: " +
    (Format-FileList $tree.Files) + "), fix the blockers, then commit again. The reviewer records the mark itself. " +
    "To bypass deliberately prefix the command with ANTON_SKIP_REVIEW=1.")
  return 2
}

$exitCode = 0
try {
  . (Join-Path $PSScriptRoot 'common.ps1')
  $exitCode = Invoke-ReviewGate
} catch {
  $exitCode = 0
}
if ($exitCode -ne 2) { $exitCode = 0 }
exit $exitCode
