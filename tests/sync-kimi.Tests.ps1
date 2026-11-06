$ErrorActionPreference = 'Stop'
$global:kimiSyncEvents = New-Object System.Collections.Generic.List[string]
$global:kimiSyncDirty = $false
function Mock-Git {
    param([Parameter(ValueFromRemainingArguments=$true)][string[]]$Arguments)
    $global:LASTEXITCODE = 0
    $command = $Arguments -join ' '
    $global:kimiSyncEvents.Add('git ' + $command)
    if ($command -like '* status --porcelain' -and $global:kimiSyncDirty) { return ' M plugins/anton-toolkit/skills/commit/SKILL.md' }
    if ($command -like '* pull --ff-only origin main') { return 'Already up to date.' }
    return ''
}
function Mock-Npm {
    param([Parameter(ValueFromRemainingArguments=$true)][string[]]$Arguments)
    $global:LASTEXITCODE = 0
    $global:kimiSyncEvents.Add('npm ' + ($Arguments -join ' '))
    return ''
}
function Write-Json([string]$Path, $Value) {
    $parent = Split-Path $Path
    if (-not (Test-Path -LiteralPath $parent)) { New-Item -ItemType Directory -Force -Path $parent | Out-Null }
    [IO.File]::WriteAllText($Path, ($Value | ConvertTo-Json -Depth 20), (New-Object System.Text.UTF8Encoding($false)))
}
$fixture = Join-Path ([IO.Path]::GetTempPath()) ('anton-toolkit-kimi-sync-' + [guid]::NewGuid().ToString('N'))
try {
    $repository = Join-Path $fixture 'repository'
    $kimiHomeFixture = Join-Path $fixture 'kimi-home'
    New-Item -ItemType Directory -Force -Path $repository,$kimiHomeFixture | Out-Null
    $names = @('anton-toolkit', 'blender-modeling', 'character-animation', 'lichnost', 'plugin-builder', 'system-designer', 'vibe-coding-course', 'youtube-toolkit')
    Write-Json (Join-Path $repository '.claude-plugin\marketplace.json') @{ plugins = @($names | ForEach-Object { @{ name = $_; source = "./plugins/$_" } }) }
    foreach ($name in $names) {
        $package = Join-Path $repository "kimi\plugins\$name"
        Write-Json (Join-Path $package 'kimi.plugin.json') @{ name = $name; version = '1.0.0-kimi.test'; skills = './skills/' }
        [IO.File]::WriteAllText((Join-Path $package 'marker.txt'), 'first')
    }
    Write-Json (Join-Path $kimiHomeFixture 'plugins\installed.json') @{
        version = 1
        plugins = @(@{ id = 'kimi-browser-extension'; root = 'C:\official'; source = 'zip-url'; enabled = $true })
    }
    $sync = Join-Path $PSScriptRoot '..\scripts\sync-marketplace.ps1'
    & $sync -Client Kimi -RepositoryRoot $repository -KimiHomes @($kimiHomeFixture) -GitCommand Mock-Git -NpmCommand Mock-Npm -InstallDefaults | Out-Null
    $installed = Get-Content -LiteralPath (Join-Path $kimiHomeFixture 'plugins\installed.json') -Raw | ConvertFrom-Json
    if (@($installed.plugins | Where-Object { $_.source -eq 'local-path' }).Count -ne 6) { throw 'Defaults were not installed exactly once' }
    if ($installed.plugins.id -contains 'vibe-coding-course') { throw 'Optional plugin was installed without a request' }
    if (@($installed.plugins | Where-Object { $_.id -eq 'kimi-browser-extension' }).Count -ne 1) { throw 'Unrelated plugin was changed' }
    if ($global:kimiSyncEvents -notcontains ('git -C ' + $repository + ' pull --ff-only origin main')) { throw 'Git pull was not run' }
    if (@($global:kimiSyncEvents | Where-Object { $_ -eq 'npm run build --prefix ' + $repository }).Count -ne 1) { throw 'Packages were not rebuilt' }

    $installed.plugins | Where-Object { $_.id -eq 'anton-toolkit' } | ForEach-Object { $_.enabled = $false }
    Write-Json (Join-Path $kimiHomeFixture 'plugins\installed.json') $installed
    $managed = Join-Path $kimiHomeFixture 'plugins\managed\anton-toolkit'
    [IO.File]::WriteAllText((Join-Path $managed 'obsolete.txt'), 'stale')
    [IO.File]::WriteAllText((Join-Path $repository 'kimi\plugins\anton-toolkit\marker.txt'), 'second')
    & $sync -Client Kimi -RepositoryRoot $repository -KimiHomes @($kimiHomeFixture) -GitCommand Mock-Git -NpmCommand Mock-Npm | Out-Null
    $updated = Get-Content -LiteralPath (Join-Path $kimiHomeFixture 'plugins\installed.json') -Raw | ConvertFrom-Json
    if (@($updated.plugins | Where-Object { $_.id -eq 'anton-toolkit' -and -not $_.enabled }).Count -ne 1) { throw 'Disabled plugin was enabled' }
    if ([IO.File]::ReadAllText((Join-Path $managed 'marker.txt')) -ne 'second') { throw 'Installed copy was not refreshed' }
    if (Test-Path -LiteralPath (Join-Path $managed 'obsolete.txt')) { throw 'Removed package resource survived synchronization' }
    if (@(Get-ChildItem -LiteralPath (Join-Path $kimiHomeFixture 'backups') -Directory).Count -lt 2) { throw 'Managed copies were not backed up' }

    $global:kimiSyncDirty = $true
    $pullsBefore = @($global:kimiSyncEvents | Where-Object { $_ -like '* pull --ff-only origin main' }).Count
    $blocked = $false
    try { & $sync -Client Kimi -RepositoryRoot $repository -KimiHomes @($kimiHomeFixture) -GitCommand Mock-Git -NpmCommand Mock-Npm | Out-Null }
    catch { $blocked = $_.Exception.Message -like '*uncommitted changes*' }
    if (-not $blocked) { throw 'Dirty repository was not rejected' }
    if (@($global:kimiSyncEvents | Where-Object { $_ -like '* pull --ff-only origin main' }).Count -ne $pullsBefore) { throw 'Git pull ran in a dirty repository' }
    Write-Output 'Kimi Git synchronization, backups and plugin selection checks passed.'
} finally {
    Remove-Variable -Name kimiSyncEvents,kimiSyncDirty -Scope Global -ErrorAction SilentlyContinue
    if (Test-Path -LiteralPath $fixture) { Remove-Item -LiteralPath $fixture -Recurse -Force }
}
