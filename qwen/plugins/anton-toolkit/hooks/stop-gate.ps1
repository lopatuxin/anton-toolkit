# stop-gate.ps1 — Stop hook: at the end of Claude's turn, refuses to finish while code files that Claude itself
# edited in this session are unreviewed in their current state.
#
# Exit 0 (nothing to do) unless ALL of the following hold:
#   * the session cwd is inside a repository whose root contains .claude/review-gate (opt-in per repo);
#   * the touched-files ledger (<git-dir>/anton-toolkit-touched, written by post-edit-format.ps1) lists code
#     files for THIS session_id — files the owner edited in the IDE are not in the ledger and never count;
#   * at least one of those files differs from HEAD (changed, new or deleted) and the review mark
#     (<git-dir>/anton-toolkit-review-mark, written by review-mark.ps1) has no "file=<path>\t<hash>" entry
#     matching its current content hash.
# Then: exit 2, the reason on stderr (the model reads it) and {"decision":"block","reason":...} on stdout.
# stop_hook_active gets no special treatment: the mark must match; Claude Code caps repeated blocks itself.
# Any internal error, garbage stdin, missing git: exit 0.

function Write-StopBlock {
  param([string]$Reason)
  try { [Console]::Out.Write((@{ decision = 'block'; reason = $Reason } | ConvertTo-Json -Compress)) } catch { }
  try { [Console]::Error.Write($Reason) } catch { }
}

function Format-FileList {
  param([string[]]$Files, [int]$Max = 20)
  if (-not $Files -or $Files.Count -eq 0) { return '(none)' }
  $shown = @($Files | Select-Object -First $Max)
  $text = $shown -join ', '
  if ($Files.Count -gt $Max) { $text += ", ... (+$($Files.Count - $Max) more)" }
  return $text
}

function Invoke-StopGate {
  $hookEvent = Read-HookInput
  if (-not $hookEvent) { return 0 }
  $sessionId = [string](Get-Prop $hookEvent 'session_id')
  if (-not $sessionId) { return 0 }
  $cwd = ConvertTo-WindowsPath ([string](Get-Prop $hookEvent 'cwd'))
  if (-not $cwd) { $cwd = (Get-Location).ProviderPath }

  # Cheap pre-check without git: most sessions are in repositories that never opted in.
  $gateRoot = Find-GateRoot $cwd
  if (-not $gateRoot) { return 0 }
  if (-not (Test-GitAvailable)) { return 0 }
  $repo = Get-RepoInfo $gateRoot
  if (-not $repo) { return 0 }
  if (-not (Test-SamePath $repo.Top $gateRoot)) { return 0 }

  $touched = @(@(Get-TouchedPaths -Repo $repo -SessionId $sessionId) | Where-Object { Test-CodeFile $_ })
  if ($touched.Count -eq 0) { return 0 }

  # Touched files that currently differ from HEAD (keyed case-insensitively, value = git's own spelling).
  $changed = New-Object 'System.Collections.Generic.Dictionary[string,string]' ([System.StringComparer]::OrdinalIgnoreCase)
  foreach ($rel in @(Get-ChangedCodeFiles $repo)) { $changed[$rel] = $rel }
  $pending = @()
  foreach ($rel in $touched) { if ($changed.ContainsKey($rel)) { $pending += $changed[$rel] } }
  if ($pending.Count -eq 0) { return 0 }

  $mark = Read-ReviewMark $repo
  $unreviewed = @()
  $sha = [System.Security.Cryptography.SHA256]::Create()
  try {
    foreach ($rel in $pending) {
      $current = Get-WorkTreeFileHash -Sha $sha -Repo $repo -RelPath $rel
      $known = $null
      if ($mark -and $mark.Files.ContainsKey($rel)) { $known = $mark.Files[$rel] }
      if (-not $known -or $known -ne $current) { $unreviewed += $rel }
    }
  } finally {
    $sha.Dispose()
  }
  if ($unreviewed.Count -eq 0) { return 0 }

  Write-StopBlock ("Review gate: code files you edited this session have not been reviewed in their current state: " +
    (Format-FileList $unreviewed) + ". Run the anton-toolkit:code-reviewer agent on these files now. " +
    "Fix the blockers it reports (bugs, security issues, violations of documented contracts), re-run the review " +
    "if you changed code, and only then finish. Do not auto-fix the remaining findings " + [char]0x2014 +
    " list them for the user in your final message.")
  return 2
}

$exitCode = 0
try {
  . (Join-Path $PSScriptRoot 'common.ps1')
  $exitCode = Invoke-StopGate
} catch {
  $exitCode = 0
}
if ($exitCode -ne 2) { $exitCode = 0 }
exit $exitCode
