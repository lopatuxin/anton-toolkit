# review-mark.ps1 — records that the code changes currently in the working tree have been reviewed.
#
# Two ways to run it, both exit 0 whatever happens:
#   * SubagentStop hook (hooks.json): the event JSON arrives on stdin; the repository is taken from its `cwd`.
#   * By hand, as the last step of a reviewer agent, with no stdin:
#       powershell -NoProfile -ExecutionPolicy Bypass -File "<plugin>/hooks/review-mark.ps1" [-Path <dir inside repo>]
#     Without -Path the current directory is used.
#
# The mark (<git-dir>/anton-toolkit-review-mark) stores the fingerprint of the reviewed code changes;
# review-gate.ps1 compares it with the tree at `git commit` time. See common.ps1 for the fingerprint rules.

param([Parameter(Position = 0)][string]$Path)

function Invoke-ReviewMark {
  param([string]$ExplicitPath)
  $hookEvent = Read-HookInput
  $startDir = $ExplicitPath
  if (-not $startDir) { $startDir = [string](Get-Prop $hookEvent 'cwd') }
  if (-not $startDir) { $startDir = (Get-Location).ProviderPath }
  $startDir = ConvertTo-WindowsPath $startDir

  if (-not (Test-GitAvailable)) { return 'git is not on PATH; no mark written' }
  $repo = Get-RepoInfo $startDir
  if (-not $repo) { return "not inside a git work tree ($startDir); no mark written" }

  $result = Get-TreeFingerprint $repo
  $source = 'manual'
  $agentType = [string](Get-Prop $hookEvent 'agent_type')
  if ($agentType) { $source = "agent:$agentType" }
  elseif ($hookEvent) { $source = "hook:$([string](Get-Prop $hookEvent 'hook_event_name'))" }

  Write-ReviewMark -Repo $repo -Fingerprint $result.Fingerprint -Files $result.Files -Source $source

  $markPath = Get-MarkPath $repo
  if ($result.Files.Count -eq 0) { return "review mark written: $markPath (no code changes in the working tree)" }
  $short = $result.Fingerprint.Substring(0, 12)
  return "review mark written: $markPath ($($result.Files.Count) code file(s), fingerprint $short)"
}

$message = ''
try {
  . (Join-Path $PSScriptRoot 'common.ps1')
  $message = Invoke-ReviewMark -ExplicitPath $Path
} catch {
  $message = "review-mark: internal error ignored: $($_.Exception.Message)"
}
try { if ($message) { [Console]::Out.WriteLine($message) } } catch { }
exit 0
