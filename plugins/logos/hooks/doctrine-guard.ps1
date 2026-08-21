# doctrine-guard.ps1 - PostToolUse hook for Edit / Write / MultiEdit: the mechanical half of logos-build's "4a.
# Doctrine guard", run at edit time so the coder fixes a violation the moment it is written instead of after a
# review round-trip. The edit itself is already on disk; exit 2 hands the reason to the model.
#
# Applies ONLY to a file inside a git repository whose root holds both gateway/ and web/ (the Logos code repo,
# located by content, never by a fixed path), under gateway/app/, gateway/tests/ or web/src/, with a code
# extension (see $script:CodeExtensions; .md, .json, .txt and other data / doc files are skipped).
#
# Check 1 - phase history in the code (logos-project.md section 4 point 10; logos-build 4a check 1), applied to
# the text THIS tool call wrote and nothing else: tool_input.new_string (Edit), tool_input.content (Write), every
# tool_input.edits[].new_string (MultiEdit). tool_input.old_string is never scanned, and narrative that already
# sat in the file is not reported - the repo carries legacy narrative on hundreds of lines, and a guard that fired
# on all of it at every edit would derail every build. A written line is reported when it carries one of: a
# `Faza-NN` phase token (Cyrillic), a `DREYF-` drift token (Cyrillic), `superseded` as a prose word (not inside an
# identifier or a string literal - `superseded_by_id` and "superseded" are domain names), `prior standing`,
# `RETROSPECTIVE`, `What changed in Phase`, `Carried over from Phase`, `Verify ... Phase-NN`, or a `history:` /
# `changelog:` section (a comment-marked key, a bare key on its own line, or a key followed by prose - a code key
# such as `history: list[Entry] = []` is not a section). Allowed and never reported: the terse spec pointer - a
# line that starts (after whitespace / a comment or docstring marker) with `spec:` - and a phase document path
# such as `Fazy/Faza-41-....md` anywhere on a line (a reference, not a retelling; it also covers a spec pointer
# wrapped onto a second line). Line numbers: the written block is located verbatim in the saved file and its
# lines are numbered as the file has them; when it cannot be located (line endings normalised by the tool, a
# later edit of the same MultiEdit rewrote it) the line is reported as "new content line N".
#
# Check 2 - module size (section 4 point 9; 4a check 2), whole file: a .py/.pyi/.ts/.tsx/.js/.jsx module under
# gateway/app/ or web/src/ with more than 1000 lines (awk NR semantics). Tests are exempt.
#
# No repo, not the Logos repo, outside the three directories, a skipped extension, a vanished file, garbage stdin,
# any internal error: exit 0.

$script:CodeExtensions = @('py', 'pyi', 'ts', 'tsx', 'js', 'jsx', 'mjs', 'cjs', 'css', 'scss', 'html', 'sql', 'toml', 'yaml', 'yml', 'ini', 'cfg', 'sh', 'ps1')
$script:ModuleExtensions = @('py', 'pyi', 'ts', 'tsx', 'js', 'jsx')
$script:ModuleLineCeiling = 1000
$script:MaxReportedLines = 10
$script:MaxLineLength = 140

$script:RxNone = [System.Text.RegularExpressions.RegexOptions]::None
$script:RxIgnoreCase = [System.Text.RegularExpressions.RegexOptions]::IgnoreCase
# Regex fragments, kept as \u escapes so this file stays ASCII: "Faza" (phase) and "DREYF" (drift) in Cyrillic.
$script:CyrillicFaza = '\u0424\u0430\u0437\u0430'
$script:CyrillicDreyf = '\u0414\u0420\u0415\u0419\u0424'
$script:PhaseTokenPattern = $script:CyrillicFaza + '-[0-9]'
$script:DriftTokenPattern = $script:CyrillicDreyf + '-'
# A phase / drift document path (\u00AB and \u00BB are the Russian quotation marks that often wrap a title).
$script:DocumentPathPattern = '(?:' + $script:CyrillicFaza + '|' + $script:CyrillicDreyf + ')-[^\s\u00AB\u00BB"''(),;:]*\.md'
$script:SpecPointerPattern = '^\s*(?:#+|//+|/\*+|\*+|"""|''''''|<!--|\{/\*+)?\s*spec\s*:'
$script:NarrativeTokens = @(
  @{ Name = 'superseded (narrative)';     Pattern = '(?<![A-Za-z0-9_"''])superseded(?![A-Za-z0-9_"''])' },
  @{ Name = 'prior standing';             Pattern = 'prior standing' },
  @{ Name = 'RETROSPECTIVE';              Pattern = 'RETROSPECTIVE' },
  @{ Name = 'What changed in Phase';      Pattern = 'What changed in Phase' },
  @{ Name = 'Carried over from Phase';    Pattern = 'Carried over from Phase' },
  @{ Name = 'Verify ... Phase-NN';        Pattern = 'Verify.*Phase-?[0-9]' }
)
$script:SectionMarkedPattern = '^\s*(?:#+|//+|/\*+|\*+)\s*(?:history|changelog)\s*:'
$script:SectionBarePattern = '^\s*(?:history|changelog)\s*:(.*)$'
$script:CodeValuePattern = '[=\(\)\[\]\{\}<>|;"''`]'
# Per-block pre-check: a block that matches none of these cannot have an offending line, so the per-line scan
# runs only when something is there.
$script:AnyTokenPattern = '(?m)(?:' + ((@($script:PhaseTokenPattern, $script:DriftTokenPattern) +
  @($script:NarrativeTokens | ForEach-Object { $_.Pattern }) +
  @('(?i:^\s*(?:#+|//+|/\*+|\*+)?\s*(?:history|changelog)\s*:)')) -join '|') + ')'

function New-Regex {
  param([string]$Pattern, $Options)
  return New-Object System.Text.RegularExpressions.Regex($Pattern, $Options)
}

$script:Rx = @{
  AnyToken      = New-Regex $script:AnyTokenPattern $script:RxNone
  SpecPointer   = New-Regex $script:SpecPointerPattern $script:RxIgnoreCase
  DocumentPath  = New-Regex $script:DocumentPathPattern $script:RxNone
  PhaseToken    = New-Regex $script:PhaseTokenPattern $script:RxNone
  DriftToken    = New-Regex $script:DriftTokenPattern $script:RxNone
  SectionMarked = New-Regex $script:SectionMarkedPattern $script:RxIgnoreCase
  SectionBare   = New-Regex $script:SectionBarePattern $script:RxIgnoreCase
  CodeValue     = New-Regex $script:CodeValuePattern $script:RxNone
  Whitespace    = New-Regex '\s' $script:RxNone
}
$script:NarrativeRegexes = @($script:NarrativeTokens | ForEach-Object { @{ Name = $_.Name; Regex = (New-Regex $_.Pattern $script:RxNone) } })

function Get-ExtensionLower {
  param([string]$Path)
  try {
    $ext = [System.IO.Path]::GetExtension($Path)
    if (-not $ext) { return '' }
    return $ext.TrimStart('.').ToLowerInvariant()
  } catch {
    return ''
  }
}

# The token names found on one written line, empty when the line is clean. ContextLine is the whole file line the
# written text sits on (the written block may start or end mid-line); only the spec-pointer exemption looks at it,
# every token is judged on the written text itself.
function Get-LineViolations {
  param([string]$Line, [string]$ContextLine)
  $found = @()
  $specCandidate = $Line
  if ($ContextLine) { $specCandidate = $ContextLine }
  if (-not $script:Rx.SpecPointer.IsMatch($specCandidate)) {
    $withoutDocumentPaths = $script:Rx.DocumentPath.Replace($Line, '')
    if ($script:Rx.PhaseToken.IsMatch($withoutDocumentPaths)) { $found += 'phase token Faza-NN used as narrative' }
    if ($script:Rx.DriftToken.IsMatch($withoutDocumentPaths)) { $found += 'drift token DREYF-NN used as narrative' }
  }
  foreach ($token in $script:NarrativeRegexes) {
    if ($token.Regex.IsMatch($Line)) { $found += $token.Name }
  }
  if ($script:Rx.SectionMarked.IsMatch($Line)) {
    $found += 'history:/changelog: section'
  } else {
    $bare = $script:Rx.SectionBare.Match($Line)
    if ($bare.Success) {
      $rest = $bare.Groups[1].Value.Trim()
      $isCode = ($rest -ne '') -and ($script:Rx.CodeValue.IsMatch($rest) -or -not $script:Rx.Whitespace.IsMatch($rest))
      if (-not $isCode) { $found += 'history:/changelog: section' }
    }
  }
  return $found
}

function Format-ReportedLine {
  param([string]$Label, [string]$Line, [string[]]$Violations)
  $text = $Line.Trim()
  if ($text.Length -gt $script:MaxLineLength) { $text = $text.Substring(0, $script:MaxLineLength) + ' ...' }
  return ('  ' + $Label + ': ' + $text + '    [' + ($Violations -join ', ') + ']')
}

# The text this tool call wrote: Edit new_string, Write content, every MultiEdit edits[].new_string. old_string is
# never read - what was already there is not this edit's concern.
function Get-WrittenBlocks {
  param($ToolInput)
  $blocks = @()
  $newString = Get-Prop $ToolInput 'new_string'
  if ($null -ne $newString) { $blocks += [string]$newString }
  $content = Get-Prop $ToolInput 'content'
  if ($null -ne $content) { $blocks += [string]$content }
  $edits = Get-Prop $ToolInput 'edits'
  if ($null -ne $edits) {
    foreach ($edit in @($edits)) {
      $text = Get-Prop $edit 'new_string'
      if ($null -ne $text) { $blocks += [string]$text }
    }
  }
  return @($blocks | Where-Object { $_ -ne '' })
}

# 1-based line of the saved file where Block starts, 0 when Block is not in the file verbatim.
function Find-BlockLine {
  param([string]$Content, [string]$Block)
  try {
    $index = $Content.IndexOf($Block, [System.StringComparison]::Ordinal)
    if ($index -lt 0) {
      $normalised = $Block.Replace("`r`n", "`n")
      if ($Content.Contains("`r`n")) { $normalised = $normalised.Replace("`n", "`r`n") }
      $index = $Content.IndexOf($normalised, [System.StringComparison]::Ordinal)
      if ($index -lt 0) { return 0 }
    }
    return ($Content.Substring(0, $index).Split("`n").Length)
  } catch {
    return 0
  }
}

# @{ Count; Reported } over the written blocks - every offending written line counted, the first MaxReportedLines
# formatted with the file's line number (or "new content line N" when the block is not locatable).
function Find-WrittenNarrative {
  param([string[]]$Blocks, [string]$Content, [string[]]$FileLines)
  $count = 0
  $reported = @()
  foreach ($block in $Blocks) {
    if (-not $script:Rx.AnyToken.IsMatch($block)) { continue }
    $blockLines = @($block -split "`r?`n")
    $startLine = Find-BlockLine -Content $content -Block $block
    for ($i = 0; $i -lt $blockLines.Length; $i++) {
      $line = $blockLines[$i]
      if (-not $line) { continue }
      $context = $null
      $label = 'new content line ' + ($i + 1)
      if ($startLine -gt 0) {
        $fileIndex = $startLine - 1 + $i
        if ($fileIndex -lt $FileLines.Length) { $context = $FileLines[$fileIndex] }
        $label = [string]($fileIndex + 1)
      }
      $violations = @(Get-LineViolations -Line $line -ContextLine $context)
      if ($violations.Length -eq 0) { continue }
      $count++
      if ($reported.Length -lt $script:MaxReportedLines) { $reported += (Format-ReportedLine -Label $label -Line $line -Violations $violations) }
    }
  }
  return @{ Count = $count; Reported = $reported }
}

# Line count with awk NR semantics: a trailing newline does not start a new line.
function Get-LineCount {
  param([string]$Content, [string[]]$Lines)
  if (-not $Content) { return 0 }
  if ($Content.EndsWith("`n")) { return ($Lines.Length - 1) }
  return $Lines.Length
}

function Invoke-DoctrineGuard {
  $hookEvent = Read-HookInput
  if (-not $hookEvent) { return 0 }
  $toolInput = Get-Prop $hookEvent 'tool_input'
  $file = Get-NormalizedPath ([string](Get-Prop $toolInput 'file_path'))
  if (-not $file) { return 0 }
  if (-not [System.IO.File]::Exists($file)) { return 0 }
  $extension = Get-ExtensionLower $file
  if ($script:CodeExtensions -notcontains $extension) { return 0 }

  $root = Find-RepoRoot ([System.IO.Path]::GetDirectoryName($file))
  if (-not $root) { return 0 }
  if (-not (Test-DirectoryExists ($root + '/gateway')) -or -not (Test-DirectoryExists ($root + '/web'))) { return 0 }
  $relative = Get-RelativePath -Root $root -Full $file
  if (-not $relative) { return 0 }
  $isTest = $relative.StartsWith('gateway/tests/', [System.StringComparison]::OrdinalIgnoreCase)
  $isModule = $relative.StartsWith('gateway/app/', [System.StringComparison]::OrdinalIgnoreCase) -or
              $relative.StartsWith('web/src/', [System.StringComparison]::OrdinalIgnoreCase)
  if (-not $isTest -and -not $isModule) { return 0 }

  $content = [System.IO.File]::ReadAllText($file, $script:Utf8NoBom)
  $lines = @($content -split "`r?`n")
  $problems = @()

  $blocks = @(Get-WrittenBlocks $toolInput)
  if ($blocks.Length -gt 0) {
    $history = Find-WrittenNarrative -Blocks $blocks -Content $content -FileLines $lines
    if ($history.Count -gt 0) {
      $problems += ("Doctrine guard (logos doctrine, logos-project.md section 4 point 10): the text you just wrote to " + $relative +
        " carries phase history / narrative on " + $history.Count + " line(s)" +
        $(if ($history.Count -gt $history.Reported.Length) { " (first " + $history.Reported.Length + " shown)" } else { "" }) + ":`n" +
        ($history.Reported -join "`n") + "`n" +
        "Code carries no phase history - DELETE the narrative (do not rewrite or condense it). The only allowed reference to a " +
        "phase is the terse pointer line 'spec: <design document>'; git log and the decision journal hold the history. " +
        "Narrative that already existed in this file is not your task unless the design says to delete it; do not expand the change.")
    }
  }

  if ($isModule -and ($script:ModuleExtensions -contains $extension)) {
    $lineCount = Get-LineCount -Content $content -Lines $lines
    if ($lineCount -gt $script:ModuleLineCeiling) {
      $problems += ("Doctrine guard (logos doctrine, logos-project.md section 4 point 9): " + $relative + " has " + $lineCount +
        " lines - this module exceeds the " + $script:ModuleLineCeiling + "-line ceiling. Split it by responsibility " +
        "(one responsibility per module: domain types / ranking / repository / router / service ...) and aim far below the ceiling.")
    }
  }

  if ($problems.Length -eq 0) { return 0 }
  Write-PostToolUseBlock ($problems -join "`n`n")
  return 2
}

$exitCode = 0
try {
  . (Join-Path $PSScriptRoot 'common.ps1')
  $exitCode = Invoke-DoctrineGuard
} catch {
  $exitCode = 0
}
if ($exitCode -ne 2) { $exitCode = 0 }
exit $exitCode
