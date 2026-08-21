# vault-guard.ps1 - PreToolUse hook for the Bash and PowerShell tools: no git write command may run inside the
# Obsidian vault, because the obsidian-git plugin commits the vault on its own every few minutes and a manual
# commit / push / reset collides with it.
#
# A command is blocked (exit 2, reason on stderr + PreToolUse deny JSON on stdout) when one of its segments is a
# git write (add, commit, push, stash, reset, checkout, rebase, merge, tag, rm, mv, clean, cherry-pick, revert,
# restore, switch, pull, am, apply) whose effective directory lies in a repository with an .obsidian/ directory at
# its root. The effective directory is the hook's cwd, moved by every `cd` / `Set-Location` / `pushd` segment that
# precedes the git call and by the call's own `git -C <dir>` options. A directory that cannot be resolved
# (a shell variable, a command substitution, popd) makes that git call unknown and it is NOT blocked - the guard
# fails open rather than stopping a legitimate commit of another repository.
# Read-only git (status, diff, log, stash list / show, tag -l), other repositories, non-git commands, garbage
# stdin and internal errors exit 0.

$script:GitWriteSubcommands = @(
  'add', 'commit', 'push', 'stash', 'reset', 'checkout', 'rebase', 'merge', 'tag',
  'rm', 'mv', 'clean', 'cherry-pick', 'revert', 'restore', 'switch', 'pull', 'am', 'apply'
)
# Global git options that take a separate value token (`--git-dir=x` forms are single tokens and skip themselves).
$script:GitValueOptions = @('-C', '-c', '--git-dir', '--work-tree', '--namespace', '--super-prefix', '--config-env', '--attr-source')
$script:ChangeDirectoryCommands = @('cd', 'chdir', 'sl', 'set-location', 'pushd', 'push-location')
$script:ChangeDirectoryFlags = @('-path', '-literalpath', '-litpath', '-lp', '-pspath', '-passthru', '/d')
$script:TagListFlags = @('-l', '--list', '--contains', '--no-contains', '--points-at', '--merged', '--no-merged')

# Splits a bash or PowerShell command into segments at ; | & newline ( ) { } outside quotes. Quotes nest the usual
# way (a single quote inside double quotes is literal); \" and `" inside quotes are escaped quotes.
function Split-CommandSegments {
  param([string]$Command)
  $segments = New-Object System.Collections.Generic.List[string]
  $current = New-Object System.Text.StringBuilder
  $quote = [char]0
  $chars = $Command.ToCharArray()
  for ($i = 0; $i -lt $chars.Length; $i++) {
    $ch = $chars[$i]
    if ($quote -ne [char]0) {
      if (($ch -eq '\' -or $ch -eq '`') -and ($i + 1 -lt $chars.Length) -and $chars[$i + 1] -eq $quote) {
        $null = $current.Append($ch).Append($quote)
        $i++
        continue
      }
      $null = $current.Append($ch)
      if ($ch -eq $quote) { $quote = [char]0 }
      continue
    }
    if ($ch -eq '"' -or $ch -eq "'") { $quote = $ch; $null = $current.Append($ch); continue }
    if ($ch -eq ';' -or $ch -eq '|' -or $ch -eq '&' -or $ch -eq "`n" -or $ch -eq "`r" -or
        $ch -eq '(' -or $ch -eq ')' -or $ch -eq '{' -or $ch -eq '}') {
      if ($current.Length -gt 0) { $segments.Add($current.ToString()); $null = $current.Clear() }
      continue
    }
    $null = $current.Append($ch)
  }
  if ($current.Length -gt 0) { $segments.Add($current.ToString()) }
  return $segments.ToArray()
}

# Whitespace-separated tokens of one segment with the quotes removed ("" is an empty token, not nothing).
function Get-CommandTokens {
  param([string]$Segment)
  $tokens = New-Object System.Collections.Generic.List[string]
  $current = New-Object System.Text.StringBuilder
  $hasToken = $false
  $quote = [char]0
  $chars = $Segment.ToCharArray()
  for ($i = 0; $i -lt $chars.Length; $i++) {
    $ch = $chars[$i]
    if ($quote -ne [char]0) {
      if (($ch -eq '\' -or $ch -eq '`') -and ($i + 1 -lt $chars.Length) -and $chars[$i + 1] -eq $quote) {
        $null = $current.Append($quote)
        $i++
        continue
      }
      if ($ch -eq $quote) { $quote = [char]0; continue }
      $null = $current.Append($ch)
      continue
    }
    if ($ch -eq '"' -or $ch -eq "'") { $quote = $ch; $hasToken = $true; continue }
    if ([char]::IsWhiteSpace($ch)) {
      if ($hasToken) { $tokens.Add($current.ToString()); $null = $current.Clear(); $hasToken = $false }
      continue
    }
    $null = $current.Append($ch)
    $hasToken = $true
  }
  if ($hasToken) { $tokens.Add($current.ToString()) }
  return $tokens.ToArray()
}

# The command word of a token: leading call/subshell sigils stripped, lower-cased.
function Get-CommandWord {
  param([string]$Token)
  if ($null -eq $Token) { return '' }
  return $Token.TrimStart('&', '$', '(', '{', '@').ToLowerInvariant()
}

function Test-GitToken {
  param([string]$Token)
  $word = Get-CommandWord $Token
  if (-not $word) { return $false }
  $slash = $word.LastIndexOfAny([char[]]@('/', '\'))
  if ($slash -ge 0) { $word = $word.Substring($slash + 1) }
  return ($word -eq 'git' -or $word -eq 'git.exe')
}

# Text that only the shell can resolve: variables, substitutions, the previous directory.
function Test-UnresolvableTarget {
  param([string]$Target)
  if (-not $Target) { return $true }
  if ($Target -eq '-') { return $true }
  return ($Target.IndexOfAny([char[]]@('$', '%', '`')) -ge 0)
}

# @{ Subcommand; Arguments; CTargets } for the first git call in Tokens, or $null when there is none.
function Get-GitInvocation {
  param([string[]]$Tokens)
  $start = -1
  for ($i = 0; $i -lt $Tokens.Length; $i++) {
    if (Test-GitToken $Tokens[$i]) { $start = $i; break }
  }
  if ($start -lt 0) { return $null }
  $cTargets = @()
  $subcommand = $null
  $i = $start + 1
  while ($i -lt $Tokens.Length) {
    $token = $Tokens[$i]
    if ($script:GitValueOptions -ccontains $token) {
      if ($token -ceq '-C' -and ($i + 1) -lt $Tokens.Length) { $cTargets += $Tokens[$i + 1] }
      $i += 2
      continue
    }
    if ($token.StartsWith('-')) { $i++; continue }
    $subcommand = $token.TrimEnd(')', '}').ToLowerInvariant()
    $i++
    break
  }
  if (-not $subcommand) { return $null }
  $arguments = @()
  if ($i -lt $Tokens.Length) { $arguments = @($Tokens[$i..($Tokens.Length - 1)]) }
  return @{ Subcommand = $subcommand; Arguments = $arguments; CTargets = $cTargets }
}

function Test-GitWrite {
  param($Invocation)
  $sub = $Invocation.Subcommand
  if ($script:GitWriteSubcommands -notcontains $sub) { return $false }
  $arguments = @($Invocation.Arguments)
  if ($sub -eq 'stash') {
    if ($arguments.Length -gt 0 -and ($arguments[0] -eq 'list' -or $arguments[0] -eq 'show')) { return $false }
    return $true
  }
  if ($sub -eq 'tag') {
    if ($arguments.Length -eq 0) { return $false }
    foreach ($argument in $arguments) {
      if ($script:TagListFlags -contains $argument -or $argument -match '^-n\d*$') { return $false }
    }
    return $true
  }
  return $true
}

# The directory a `cd`-like segment moves to, relative to Base; '' when the segment is not a cd; $null when the
# target cannot be resolved.
function Get-ChangeDirectoryTarget {
  param([string[]]$Tokens, [string]$Base)
  if ($Tokens.Length -eq 0) { return '' }
  $word = Get-CommandWord $Tokens[0]
  if ($word -eq 'popd' -or $word -eq 'pop-location') { return $null }
  if ($script:ChangeDirectoryCommands -notcontains $word) { return '' }
  $target = $null
  for ($i = 1; $i -lt $Tokens.Length; $i++) {
    if ($script:ChangeDirectoryFlags -contains $Tokens[$i].ToLowerInvariant()) { continue }
    if ($Tokens[$i].StartsWith('-') -and $Tokens[$i] -ne '-') { continue }
    $target = $Tokens[$i]
    break
  }
  # A bare `cd` goes home in bash and is a no-op in PowerShell 5.1: unknown rather than guessed.
  if ($null -eq $target) { return $null }
  if (Test-UnresolvableTarget $target) { return $null }
  $resolved = Resolve-PathFrom -Base $Base -Target $target
  if (-not $resolved) { return $null }
  return $resolved
}

function Test-VaultRoot {
  param([string]$Dir)
  if (-not $Dir) { return $false }
  $root = Find-RepoRoot $Dir
  if (-not $root) { return $false }
  return (Test-DirectoryExists ($root + '/.obsidian'))
}

# $true when some git write in Command runs inside the vault.
function Test-VaultGitWrite {
  param([string]$Command, [string]$Cwd)
  $dir = $Cwd
  foreach ($segment in @(Split-CommandSegments $Command)) {
    $tokens = @(Get-CommandTokens $segment)
    if ($tokens.Length -eq 0) { continue }
    $moved = Get-ChangeDirectoryTarget -Tokens $tokens -Base $dir
    if ($null -eq $moved) { $dir = $null; continue }
    if ($moved -ne '') { $dir = $moved; continue }
    $invocation = Get-GitInvocation $tokens
    if (-not $invocation) { continue }
    if (-not (Test-GitWrite $invocation)) { continue }
    $gitDir = $dir
    foreach ($target in @($invocation.CTargets)) {
      if (Test-UnresolvableTarget $target) { $gitDir = $null; break }
      $gitDir = Resolve-PathFrom -Base $gitDir -Target $target
      if (-not $gitDir) { break }
    }
    if (-not $gitDir) { continue }
    if (Test-VaultRoot $gitDir) { return $true }
  }
  return $false
}

function Invoke-VaultGuard {
  $hookEvent = Read-HookInput
  if (-not $hookEvent) { return 0 }
  $command = Get-CommandText $hookEvent
  if (-not $command) { return 0 }
  if ($command -notmatch '(?i)\bgit(?:\.exe)?\b') { return 0 }
  $cwd = Get-HookCwd $hookEvent
  if (-not (Test-VaultGitWrite -Command $command -Cwd $cwd)) { return 0 }
  Write-PreToolUseDeny ("This repository is the Obsidian vault: the obsidian-git plugin commits it automatically every " +
    "few minutes. Never run git write commands in the vault (add, commit, push, stash, reset, checkout, rebase, merge, " +
    "tag, pull, ...) - leave the files changed and they are picked up. Read-only git (status, diff, log) is fine. " +
    "If you meant another repository, run git there with an absolute path: git -C <repo> ...")
  return 2
}

$exitCode = 0
try {
  . (Join-Path $PSScriptRoot 'common.ps1')
  $exitCode = Invoke-VaultGuard
} catch {
  $exitCode = 0
}
if ($exitCode -ne 2) { $exitCode = 0 }
exit $exitCode
