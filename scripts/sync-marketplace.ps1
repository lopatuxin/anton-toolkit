param(
    [ValidateSet('All', 'Claude', 'Codex')][string]$Client = 'All',
    [string]$ClaudeCommand,
    [string]$CodexCommand = 'codex',
    [switch]$InstallDefaults
)
$ErrorActionPreference = 'Stop'
$marketplaceName = 'anton-toolkit-marketplace'
$repositoryUrl = 'https://github.com/lopatuxin/anton-toolkit.git'
$defaults = @('anton-toolkit', 'blender-modeling', 'lichnost', 'plugin-builder', 'system-designer', 'youtube-toolkit')

function Invoke-Client([string]$Command, [string[]]$Arguments) {
    $result = & $Command @Arguments
    if ($LASTEXITCODE -ne 0) { throw "$Command $($Arguments -join ' ') failed with exit code $LASTEXITCODE" }
    return $result
}

function Find-ClaudeCommand {
    if ($ClaudeCommand) { return $ClaudeCommand }
    $command = Get-Command claude -ErrorAction SilentlyContinue
    if ($command) { return $command.Source }
    $desktopRoot = Join-Path $env:LOCALAPPDATA 'Claude-Data'
    $candidates = @(Get-ChildItem -LiteralPath $desktopRoot -Filter 'claude.exe' -File -Recurse -ErrorAction SilentlyContinue |
        Where-Object { $_.FullName -match '[\\/]claude-code[\\/]' } | Sort-Object LastWriteTime -Descending)
    if ($candidates.Count) { return $candidates[0].FullName }
    throw 'Claude Code executable was not found. Pass -ClaudeCommand with its path, or use -Client Codex.'
}

if ($Client -in @('All', 'Codex')) {
    $before = (Invoke-Client $CodexCommand @('plugin', 'list', '--json') | ConvertFrom-Json).installed |
        Where-Object { $_.marketplaceName -eq $marketplaceName }
    $markets = (Invoke-Client $CodexCommand @('plugin', 'marketplace', 'list', '--json') | ConvertFrom-Json).marketplaces
    $current = $markets | Where-Object { $_.name -eq $marketplaceName }
    if ($current -and $current.root -match '[\\/]obsidian[\\/]\.codex-sync[\\/]marketplace$') {
        Invoke-Client $CodexCommand @('plugin', 'marketplace', 'remove', $marketplaceName, '--json') | Write-Output
    }
    Invoke-Client $CodexCommand @('plugin', 'marketplace', 'add', $repositoryUrl, '--ref', 'main', '--json') | Write-Output
    $upgrade = Invoke-Client $CodexCommand @('plugin', 'marketplace', 'upgrade', $marketplaceName, '--json') | ConvertFrom-Json
    if (@($upgrade.errors | Where-Object { $_ }).Count -gt 0) { throw ($upgrade.errors | ConvertTo-Json -Depth 6) }
    $selected = @($before | Where-Object { $_.enabled } | ForEach-Object { $_.name })
    if ($InstallDefaults) { $selected += $defaults }
    foreach ($name in @($selected | Sort-Object -Unique)) {
        if (@($before | Where-Object { $_.name -eq $name -and -not $_.enabled }).Count) { continue }
        Invoke-Client $CodexCommand @('plugin', 'add', "$name@$marketplaceName", '--json') | Write-Output
    }
    $after = (Invoke-Client $CodexCommand @('plugin', 'list', '--json') | ConvertFrom-Json).installed
    foreach ($plugin in $before) {
        $updated = $after | Where-Object { $_.pluginId -eq $plugin.pluginId }
        if (-not $updated -or $updated.enabled -ne $plugin.enabled) { throw "Plugin selection changed unexpectedly: $($plugin.pluginId)" }
    }
}

if ($Client -in @('All', 'Claude')) {
    $claudeExecutable = Find-ClaudeCommand
    $installed = Invoke-Client $claudeExecutable @('plugin', 'list', '--json') | ConvertFrom-Json
    $before = @($installed | Where-Object { $_.id -like "*@$marketplaceName" })
    $markets = Invoke-Client $claudeExecutable @('plugin', 'marketplace', 'list', '--json') | ConvertFrom-Json
    $current = $markets | Where-Object { $_.name -eq $marketplaceName }
    if (-not $current) {
        Invoke-Client $claudeExecutable @('plugin', 'marketplace', 'add', $repositoryUrl, '--json') | Write-Output
    } elseif ($current.url -ne $repositoryUrl) {
        throw "Claude marketplace has another source: $($current.url). Reconcile it explicitly before updating."
    }
    Invoke-Client $claudeExecutable @('plugin', 'marketplace', 'update', $marketplaceName, '--json') | Write-Output
    foreach ($plugin in $before) {
        Invoke-Client $claudeExecutable @('plugin', 'update', $plugin.id, '--scope', $plugin.scope, '--json') | Write-Output
    }
    if ($InstallDefaults) {
        foreach ($name in $defaults) {
            if ($before.id -contains "$name@$marketplaceName") { continue }
            Invoke-Client $claudeExecutable @('plugin', 'install', "$name@$marketplaceName", '--scope', 'user') | Write-Output
        }
    }
    $after = Invoke-Client $claudeExecutable @('plugin', 'list', '--json') | ConvertFrom-Json
    foreach ($plugin in $before) {
        $updated = $after | Where-Object { $_.id -eq $plugin.id -and $_.scope -eq $plugin.scope }
        if (-not $updated -or $updated.enabled -ne $plugin.enabled) { throw "Plugin selection changed unexpectedly: $($plugin.id)" }
    }
}
Write-Output 'Marketplace synchronized from Git. Open new Claude and Codex chats to load the updated plugins.'
