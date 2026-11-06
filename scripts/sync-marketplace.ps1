param(
    [ValidateSet('All', 'Claude', 'Codex', 'Kimi')][string]$Client = 'All',
    [string]$ClaudeCommand,
    [string]$CodexCommand = 'codex',
    [string]$RepositoryRoot = (Join-Path $PSScriptRoot '..'),
    [string[]]$KimiHomes = @(),
    [string]$GitCommand = 'git',
    [string]$NpmCommand = 'npm',
    [switch]$InstallDefaults,
    [switch]$SkipRepositoryUpdate
)
$ErrorActionPreference = 'Stop'
$marketplaceName = 'anton-toolkit-marketplace'
$repositoryUrl = 'https://github.com/lopatuxin/anton-toolkit.git'
$defaults = @('anton-toolkit', 'blender-modeling', 'lichnost', 'plugin-builder', 'system-designer', 'youtube-toolkit')
$Utf8 = New-Object System.Text.UTF8Encoding($false)

function Invoke-Client([string]$Command, [string[]]$Arguments) {
    $result = & $Command @Arguments
    if ($LASTEXITCODE -ne 0) { throw "$Command $($Arguments -join ' ') failed with exit code $LASTEXITCODE" }
    return $result
}

function Write-Text([string]$Path, [string]$Text) {
    $parent = Split-Path $Path
    if (-not (Test-Path -LiteralPath $parent)) { New-Item -ItemType Directory -Force -Path $parent | Out-Null }
    [IO.File]::WriteAllText($Path, $Text, $Utf8)
}

function Set-JsonProperty([psobject]$Object, [string]$Name, $Value) {
    if ($Object.PSObject.Properties.Name -contains $Name) { $Object.$Name = $Value }
    else { $Object | Add-Member -NotePropertyName $Name -NotePropertyValue $Value }
}

function Install-KimiPackage([string]$Name, [string]$Source, [string]$KimiHome, [string]$Backup, [psobject]$Installed, [psobject]$Existing) {
    $pluginsRoot = Join-Path $KimiHome 'plugins'
    $managed = Join-Path $pluginsRoot "managed\$Name"
    $staging = Join-Path $pluginsRoot ('.staging\' + $Name + '-' + [guid]::NewGuid().ToString('N'))
    try {
        New-Item -ItemType Directory -Force -Path (Split-Path $staging) | Out-Null
        Copy-Item -LiteralPath $Source -Destination $staging -Recurse
        if (Test-Path -LiteralPath $managed) {
            $backupManaged = Join-Path $Backup "managed\$Name"
            New-Item -ItemType Directory -Force -Path (Split-Path $backupManaged) | Out-Null
            Copy-Item -LiteralPath $managed -Destination $backupManaged -Recurse
            Remove-Item -LiteralPath $managed -Recurse -Force
        }
        New-Item -ItemType Directory -Force -Path (Split-Path $managed) | Out-Null
        Move-Item -LiteralPath $staging -Destination $managed
    } finally {
        if (Test-Path -LiteralPath $staging) { Remove-Item -LiteralPath $staging -Recurse -Force }
    }

    $now = (Get-Date).ToUniversalTime().ToString('yyyy-MM-ddTHH:mm:ss.fffZ')
    $record = if ($Existing) { $Existing } else {
        $new = [pscustomobject]@{ id = $Name; enabled = $true; installedAt = $now }
        $Installed.plugins += $new
        $new
    }
    Set-JsonProperty $record 'root' $managed
    Set-JsonProperty $record 'source' 'local-path'
    Set-JsonProperty $record 'originalSource' $Source
    Set-JsonProperty $record 'updatedAt' $now
    Write-Text (Join-Path $pluginsRoot 'installed.json') ($Installed | ConvertTo-Json -Depth 20)
    Write-Output "Kimi ${Name}: installed from $Source"
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
    if ($CodexCommand -eq 'codex' -and -not (Get-Command codex -ErrorAction SilentlyContinue)) {
        $bundledCodexRoot = Join-Path $env:LOCALAPPDATA 'OpenAI\Codex\bin'
        $bundledCodex = Get-ChildItem -LiteralPath $bundledCodexRoot -Filter 'codex.exe' -File -Recurse -ErrorAction SilentlyContinue |
            Sort-Object LastWriteTime -Descending | Select-Object -First 1
        if (-not $bundledCodex) { throw 'Codex CLI was not found. Pass -CodexCommand with the full path to codex.exe.' }
        $CodexCommand = $bundledCodex.FullName
    }
    Invoke-Client $CodexCommand @('plugin', 'marketplace', 'add', $repositoryUrl, '--ref', 'main', '--json') | Write-Output
    $before = (Invoke-Client $CodexCommand @('plugin', 'list', '--json') | ConvertFrom-Json).installed |
        Where-Object { $_.marketplaceName -eq $marketplaceName }
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

if ($Client -in @('All', 'Kimi')) {
    if (-not $KimiHomes -or $KimiHomes.Count -eq 0) {
        $KimiHomes = @(
            (Join-Path $env:APPDATA 'kimi-desktop\daimon-share\daimon\runtime\kimi-code\home'),
            (Join-Path $env:USERPROFILE '.kimi-code')
        ) | Where-Object { Test-Path -LiteralPath $_ }
    }
    if (-not $KimiHomes -or $KimiHomes.Count -eq 0) {
        if ($Client -eq 'Kimi') { throw 'No Kimi home found. Start Kimi Code once or pass -KimiHomes.' }
        Write-Output 'Kimi Code is not installed; skipped Kimi synchronization.'
    } else {
        $RepositoryRoot = (Resolve-Path -LiteralPath $RepositoryRoot).Path
        if (-not $SkipRepositoryUpdate) {
            $pending = (Invoke-Client $GitCommand @('-C', $RepositoryRoot, 'status', '--porcelain') | Out-String).Trim()
            if ($pending) { throw "Marketplace repository has uncommitted changes. Commit or reconcile them before Git synchronization: $RepositoryRoot" }
            Invoke-Client $GitCommand @('-C', $RepositoryRoot, 'pull', '--ff-only', 'origin', 'main') | Write-Output
            $pathBeforeBuild = $env:PATH
            try {
                if ($NpmCommand -eq 'npm') {
                    $programFiles = [Environment]::GetFolderPath([Environment+SpecialFolder]::ProgramFiles)
                    if ($programFiles) {
                        $nodeHome = Join-Path $programFiles 'nodejs'
                        $systemNpm = Join-Path $nodeHome 'npm.cmd'
                        if (Test-Path -LiteralPath $systemNpm) {
                            $env:PATH = $nodeHome + [IO.Path]::PathSeparator + $env:PATH
                            $NpmCommand = $systemNpm
                        }
                    }
                }
                Invoke-Client $NpmCommand @('run', 'build', '--prefix', $RepositoryRoot) | Write-Output
            } finally {
                $env:PATH = $pathBeforeBuild
            }
        }
        $catalog = Get-Content -LiteralPath (Join-Path $RepositoryRoot '.claude-plugin\marketplace.json') -Raw | ConvertFrom-Json
        $catalogNames = @($catalog.plugins | ForEach-Object { $_.name })
        foreach ($kimiHome in @($KimiHomes | Sort-Object -Unique)) {
            $kimiHome = (Resolve-Path -LiteralPath $kimiHome).Path
            $installedPath = Join-Path $kimiHome 'plugins\installed.json'
            $installed = if (Test-Path -LiteralPath $installedPath) {
                Get-Content -LiteralPath $installedPath -Raw | ConvertFrom-Json
            } else { [pscustomobject]@{ version = 1; plugins = @() } }
            $before = @($installed.plugins | Where-Object { $catalogNames -contains $_.id })
            $selected = @($before | ForEach-Object { $_.id })
            if ($InstallDefaults) { $selected += $defaults }
            $backup = Join-Path $kimiHome ('backups\marketplace-sync-' + (Get-Date -Format 'yyyyMMdd-HHmmss-fff'))
            if (Test-Path -LiteralPath $installedPath) {
                New-Item -ItemType Directory -Force -Path $backup | Out-Null
                Copy-Item -LiteralPath $installedPath -Destination (Join-Path $backup 'installed.json')
            }
            foreach ($name in @($selected | Sort-Object -Unique)) {
                $source = Join-Path $RepositoryRoot "kimi\plugins\$name"
                if (-not (Test-Path -LiteralPath (Join-Path $source 'kimi.plugin.json'))) { throw "Kimi package is missing: $source" }
                $existing = @($before | Where-Object { $_.id -eq $name }) | Select-Object -First 1
                Install-KimiPackage $name $source $kimiHome $backup $installed $existing
            }
            $after = Get-Content -LiteralPath $installedPath -Raw | ConvertFrom-Json
            foreach ($plugin in $before) {
                $updated = @($after.plugins | Where-Object { $_.id -eq $plugin.id }) | Select-Object -First 1
                if (-not $updated -or $updated.enabled -ne $plugin.enabled) { throw "Kimi plugin selection changed unexpectedly: $($plugin.id)" }
            }
            Write-Output "Kimi marketplace synchronized in $kimiHome. Backups: $backup"
        }
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
Write-Output 'Marketplace synchronized from Git. Open new Claude and Codex chats; in Kimi open a new chat or run /plugins reload.'
