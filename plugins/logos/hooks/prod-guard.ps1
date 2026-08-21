# prod-guard.ps1 - PreToolUse hook for the Bash and PowerShell tools: keeps every build / test / QA run away from
# the Logos PROD stand, which holds the owner's real personal memory.
#
# Blocks (exit 2, reason on stderr + PreToolUse deny JSON on stdout) a command that mentions
#   * docker-compose.prod.yml, or the compose project logos-prod in any form (-p logos-prod, COMPOSE_PROJECT_NAME,
#     a container or volume name such as logos-prod_pg / logos-prod-gateway-1);
#   * compose down with volume removal (-v / --volumes), docker volume rm|remove|prune, docker system prune --volumes -
#     regardless of project, because a prune is machine-wide and a bare `down -v` resolves its project from the
#     environment.
# Everything else exits 0: no stdin, garbage stdin, no command, a command that contains LOGOS_PROD_OK=1 (the
# deliberate escape hatch), any internal error. The check is content-based, so it applies wherever the plugin is
# enabled without needing to know which repository the command runs in.

$script:ProdPatterns = @(
  @{ What = 'the prod compose file docker-compose.prod.yml'; Pattern = 'docker-compose\.prod\.yml' },
  @{ What = 'the prod compose project logos-prod';           Pattern = '(?<![A-Za-z0-9])logos-prod(?![A-Za-z0-9])' },
  @{ What = 'the prod compose project logos-prod';           Pattern = '(?:-p|--project-name)[\s=]+["'']?logos-prod' },
  @{ What = 'compose down with volume removal';              Pattern = 'compose\b[^|;&]*\bdown\b[^|;&]*\s(?:-[A-Za-z]*v[A-Za-z]*|--volumes)\b' },
  @{ What = 'docker volume removal';                         Pattern = 'docker\s+volume\s+(?:rm|remove|prune)\b' },
  @{ What = 'docker system prune with volumes';              Pattern = 'docker\s+system\s+prune\b[^|;&]*--volumes' }
)
$script:EscapeHatch = 'LOGOS_PROD_OK\s*=\s*["'']?1'

function Find-ProdMatch {
  param([string]$Command)
  foreach ($entry in $script:ProdPatterns) {
    if ([regex]::IsMatch($Command, $entry.Pattern, [System.Text.RegularExpressions.RegexOptions]::IgnoreCase)) { return $entry.What }
  }
  return $null
}

function Invoke-ProdGuard {
  $hookEvent = Read-HookInput
  if (-not $hookEvent) { return 0 }
  $command = Get-CommandText $hookEvent
  if (-not $command) { return 0 }
  if ([regex]::IsMatch($command, $script:EscapeHatch, [System.Text.RegularExpressions.RegexOptions]::IgnoreCase)) { return 0 }
  $what = Find-ProdMatch $command
  if (-not $what) { return 0 }
  Write-PreToolUseDeny ("Prod stand is protected (this command touches " + $what + "): the logos-prod project, " +
    "docker-compose.prod.yml and its volumes hold the owner's real personal memory. Builds, tests and QA run on the " +
    "test stand (bare docker-compose.yml, project logos-test). Do not touch prod; if the owner explicitly wants a " +
    "prod operation, ask them to run it themselves or to prefix the command with LOGOS_PROD_OK=1.")
  return 2
}

$exitCode = 0
try {
  . (Join-Path $PSScriptRoot 'common.ps1')
  $exitCode = Invoke-ProdGuard
} catch {
  $exitCode = 0
}
if ($exitCode -ne 2) { $exitCode = 0 }
exit $exitCode
