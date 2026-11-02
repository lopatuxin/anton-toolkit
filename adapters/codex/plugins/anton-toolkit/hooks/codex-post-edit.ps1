# Adapt Codex apply_patch events to the owner's existing touched-file ledger and gofmt hook.
$ErrorActionPreference = 'Stop'
try {
    $event = [Console]::In.ReadToEnd() | ConvertFrom-Json
    if (-not $event) { exit 0 }
    $cwd = [string]$event.cwd
    if (-not $cwd) { $cwd = (Get-Location).ProviderPath }
    $files = New-Object 'System.Collections.Generic.HashSet[string]' ([StringComparer]::OrdinalIgnoreCase)
    if ($event.tool_input.file_path) { [void]$files.Add([string]$event.tool_input.file_path) }
    $patch = if ($event.tool_input -is [string]) { $event.tool_input } else { [string]$event.tool_input.command }
    if (-not $patch) { $patch = [string]$event.tool_input.input }
    foreach ($match in [regex]::Matches($patch, '(?m)^\*\*\* (?:Add File|Update File|Delete File|Move to): (.+?)\r?$')) {
        [void]$files.Add($match.Groups[1].Value)
    }
    foreach ($file in $files) {
        $resolved = $file
        if (-not [IO.Path]::IsPathRooted($resolved)) { $resolved = [IO.Path]::Combine($cwd, $resolved) }
        $payload = @{
            session_id = [string]$event.session_id
            cwd = $cwd
            hook_event_name = 'PostToolUse'
            tool_input = @{ file_path = [IO.Path]::GetFullPath($resolved) }
        } | ConvertTo-Json -Compress -Depth 5
        $payload | & powershell.exe -NoProfile -ExecutionPolicy Bypass -File (Join-Path $PSScriptRoot 'post-edit-format.ps1')
    }
} catch {
    [Console]::Error.WriteLine('Codex touched-file tracking failed: ' + $_.Exception.Message)
}
exit 0
