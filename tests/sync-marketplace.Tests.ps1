$ErrorActionPreference = 'Stop'
$global:marketplaceSyncEvents = New-Object System.Collections.Generic.List[string]
$global:marketplaceCodexSourceReady = $false
$codexEntries = @(
    @{ pluginId='anton-toolkit@anton-toolkit-marketplace'; name='anton-toolkit'; marketplaceName='anton-toolkit-marketplace'; enabled=$true },
    @{ pluginId='plugin-builder@anton-toolkit-marketplace'; name='plugin-builder'; marketplaceName='anton-toolkit-marketplace'; enabled=$false }
)
$claudeEntries = @(
    @{ id='anton-toolkit@anton-toolkit-marketplace'; scope='user'; enabled=$true },
    @{ id='plugin-builder@anton-toolkit-marketplace'; scope='user'; enabled=$false }
)
function Mock-Codex {
    param([Parameter(ValueFromRemainingArguments=$true)][string[]]$Arguments)
    $global:LASTEXITCODE = 0
    $command = $Arguments -join ' '
    $global:marketplaceSyncEvents.Add('codex ' + $command)
    if (-not $global:marketplaceCodexSourceReady -and $command -in @('plugin list --json', 'plugin marketplace list --json')) {
        $global:LASTEXITCODE = 1
        return 'marketplace root does not contain a supported manifest'
    }
    switch -Wildcard ($command) {
        'plugin list --json' { return (@{installed=$codexEntries} | ConvertTo-Json -Depth 5 -Compress) }
        'plugin marketplace list --json' { return (@{marketplaces=@(@{name='anton-toolkit-marketplace';root='C:\projects\obsidian\.codex-sync\marketplace'})} | ConvertTo-Json -Depth 5 -Compress) }
        'plugin marketplace upgrade *' { return '{"upgradedRoots":["git-marketplace"]}' }
        'plugin marketplace remove *' { return '{}' }
        'plugin marketplace add *' { $global:marketplaceCodexSourceReady = $true; return '{}' }
        'plugin add *' { return '{}' }
        default { throw "Unexpected Codex call: $command" }
    }
}
function Mock-Claude {
    param([Parameter(ValueFromRemainingArguments=$true)][string[]]$Arguments)
    $global:LASTEXITCODE = 0
    $command = $Arguments -join ' '
    $global:marketplaceSyncEvents.Add('claude ' + $command)
    switch -Wildcard ($command) {
        'plugin list --json' { return (ConvertTo-Json -InputObject $claudeEntries -Depth 5 -Compress) }
        'plugin marketplace list --json' { return '[{"name":"anton-toolkit-marketplace","url":"https://github.com/lopatuxin/anton-toolkit.git"}]' }
        'plugin marketplace update *' { return '{}' }
        'plugin update *' { return '{}' }
        'plugin install *' { return '{}' }
        default { throw "Unexpected Claude call: $command" }
    }
}
try {
    & (Join-Path $PSScriptRoot '..\scripts\sync-marketplace.ps1') -CodexCommand Mock-Codex -ClaudeCommand Mock-Claude | Out-Null
    $events = $global:marketplaceSyncEvents.ToArray()
    if ($events -contains 'codex plugin marketplace remove anton-toolkit-marketplace --json') { throw 'Source should be replaced directly without deleting it first' }
    if ($events -notcontains 'codex plugin marketplace add https://github.com/lopatuxin/anton-toolkit.git --ref main --json') { throw 'Codex did not connect to Git' }
    if ($events -notcontains 'codex plugin add anton-toolkit@anton-toolkit-marketplace --json') { throw 'Enabled Codex plugin was not updated' }
    if ($events -contains 'codex plugin add plugin-builder@anton-toolkit-marketplace --json') { throw 'Disabled Codex plugin was enabled' }
    if (@($events | Where-Object { $_ -match 'codex plugin add ' }).Count -ne 1) { throw 'Unrequested Codex plugins were installed' }
    if (@($events | Where-Object { $_ -match 'claude plugin update ' }).Count -ne 2) { throw 'Existing Claude plugins were not refreshed' }
    if (@($events | Where-Object { $_ -match 'claude plugin (install|enable|disable) ' }).Count) { throw 'Claude selection changed' }
    Write-Output 'Sync migration and plugin selection checks passed.'
} finally {
    Remove-Variable -Name marketplaceSyncEvents,marketplaceCodexSourceReady -Scope Global
}
