# Regression test: the Qwen package's review-gate hooks work with Qwen-shaped hook payloads
# (run_shell_command / edit tool ids, session_id + cwd fields). Runs against a throwaway git repo.
# Continue + explicit throws: git's CRLF warnings on stderr must not abort the test.
$ErrorActionPreference = 'Continue'
$hooks = Join-Path $PSScriptRoot '..\qwen\plugins\anton-toolkit\hooks'
$root = Join-Path ([IO.Path]::GetTempPath()) ('anton-qwen-hooks-' + [guid]::NewGuid().ToString('N'))
$utf8 = New-Object System.Text.UTF8Encoding($false)
$payload = Join-Path $root 'payload.json'

function Invoke-Hook([string]$Script, [string]$Json) {
    [IO.File]::WriteAllText($payload, $Json, $utf8)
    $ErrorActionPreference = 'Continue'
    $out = (Get-Content $payload -Raw | powershell -NoProfile -ExecutionPolicy Bypass -File (Join-Path $hooks $Script) 2>&1 | Out-String)
    $code = $LASTEXITCODE
    $ErrorActionPreference = 'Stop'
    return @{ Code = $code; Out = $out.Trim() }
}

try {
    New-Item -ItemType Directory -Force -Path $root | Out-Null
    git -C $root init -q 2>$null
    New-Item -ItemType Directory -Force -Path (Join-Path $root '.claude') | Out-Null
    [IO.File]::WriteAllText((Join-Path $root '.claude\review-gate'), 'opt-in', $utf8)
    [IO.File]::WriteAllText((Join-Path $root 'Sample.kt'), "fun main() { println(1) }`n", $utf8)
    git -C $root add Sample.kt 2>$null

    $cwd = $root.Replace('\', '/')
    $commit = '{"session_id":"qwen-test","cwd":"' + $cwd + '","tool_name":"run_shell_command","tool_input":{"command":"git commit -m test"}}'
    $edit = '{"session_id":"qwen-test","cwd":"' + $cwd + '","tool_name":"edit","tool_input":{"file_path":"' + $cwd + '/Sample.kt"}}'
    $stop = '{"session_id":"qwen-test","cwd":"' + $cwd + '","hook_event_name":"Stop"}'
    $mark = '{"session_id":"qwen-test","cwd":"' + $cwd + '","hook_event_name":"SubagentStop","agent_type":"anton-toolkit:code-reviewer"}'

    $denied = Invoke-Hook 'review-gate.ps1' $commit
    if ($denied.Code -ne 2 -or $denied.Out -notmatch '"permissionDecision":"deny"') { throw "review-gate must deny an unreviewed commit: $($denied | ConvertTo-Json -Compress)" }
    $ledger = Invoke-Hook 'post-edit-format.ps1' $edit
    if ($ledger.Code -ne 0) { throw "post-edit-format must exit 0: $($ledger.Out)" }
    $blocked = Invoke-Hook 'stop-gate.ps1' $stop
    if ($blocked.Code -ne 2 -or $blocked.Out -notmatch '"decision":"block"') { throw "stop-gate must block an unreviewed touched file: $($blocked | ConvertTo-Json -Compress)" }
    $marked = Invoke-Hook 'review-mark.ps1' $mark
    if ($marked.Code -ne 0 -or $marked.Out -notmatch 'review mark written') { throw "review-mark must write the mark: $($marked.Out)" }
    $allowedCommit = Invoke-Hook 'review-gate.ps1' $commit
    if ($allowedCommit.Code -ne 0) { throw "review-gate must allow the commit after the mark: $($allowedCommit.Out)" }
    $allowedStop = Invoke-Hook 'stop-gate.ps1' $stop
    if ($allowedStop.Code -ne 0) { throw "stop-gate must allow finishing after the mark: $($allowedStop.Out)" }
    Write-Output 'Qwen review-gate hooks: deny/block/mark/allow cycle passed.'
} finally {
    if (Test-Path $root) { Remove-Item $root -Recurse -Force }
}
