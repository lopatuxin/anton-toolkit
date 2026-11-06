param([string]$CodexDirectory = $env:CODEX_HOME)

$ErrorActionPreference = 'Stop'
$threadId = $env:CODEX_THREAD_ID
if ($threadId -notmatch '^[a-f0-9]{8}(?:-[a-f0-9]{4}){3}-[a-f0-9]{12}$') { exit 2 }

if (-not $CodexDirectory) {
    $profilePath = $env:USERPROFILE
    if (-not $profilePath) { $profilePath = [Environment]::GetFolderPath('UserProfile') }
    $CodexDirectory = Join-Path $profilePath '.codex'
}

$transcripts = @(foreach ($folder in 'sessions', 'archived_sessions') {
    $sessionPath = Join-Path $CodexDirectory $folder
    if (Test-Path -LiteralPath $sessionPath) {
        Get-ChildItem -LiteralPath $sessionPath -Filter "rollout-*-$threadId.jsonl" -File -Recurse
    }
})
if ($transcripts.Count -ne 1) { exit 2 }

$turnId = $null
$model = $null
$turnRecords = Select-String -LiteralPath $transcripts[0].FullName -Pattern '"type"\s*:\s*"(task_started|task_complete|turn_context)"' -Encoding UTF8
foreach ($line in $turnRecords) {
    $record = ConvertFrom-Json -InputObject $line.Line
    if ($record.type -ceq 'event_msg' -and $record.payload.type -ceq 'task_started') {
        $turnId = $record.payload.turn_id
        $model = $null
    } elseif ($record.type -ceq 'event_msg' -and $record.payload.type -ceq 'task_complete' -and $record.payload.turn_id -ceq $turnId) {
        $turnId = $null
        $model = $null
    } elseif ($record.type -ceq 'turn_context' -and $turnId -and $record.payload.turn_id -ceq $turnId) {
        $model = $record.payload.model
    }
}

if (-not $model) { exit 2 }
Write-Output $model
if ($model -cne 'gpt-6-astra') { exit 1 }
