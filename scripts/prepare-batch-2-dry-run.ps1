$ErrorActionPreference = 'Stop'
Add-Type -AssemblyName System.IO.Compression.FileSystem

$repoRoot = Split-Path -Parent $PSScriptRoot
$manifestPath = Join-Path $repoRoot 'migration\dry-run\migration-manifest.json'
$outputRoot = Join-Path $repoRoot 'migration\dry-run\batch-2'
$reportPath = Join-Path $repoRoot 'migration\dry-run\batch-2-report.json'
$manifest = Get-Content -Raw -LiteralPath $manifestPath | ConvertFrom-Json

$approved = @(
  @{ Path='content/Development/BCRP Icon Style Guide and Prompting in a Pinch.docx'; Visibility='administrator'; Description='Visual style guidance and reusable prompting for Broken Compass inventory icons.' },
  @{ Path='content/Development/Creative Vision & Experience Guide.docx'; Visibility='developer'; Description='Creative principles and experience direction for Broken Compass RP.' },
  @{ Path='content/Development/BCRP-Evidence.docx'; Visibility='developer'; Description='' },
  @{ Path='content/Getting Started/Random Joe.docx'; Visibility='public'; Description='Learn what to expect when you meet Random Joe and hear his rumors.' },
  @{ Path='content/Getting Started/known-issues.mdx'; Visibility='public'; Description='Known Issues and workarounds.' }
)

function Get-Sha256([byte[]]$Bytes) {
  $algorithm = [Security.Cryptography.SHA256]::Create()
  try { return ([BitConverter]::ToString($algorithm.ComputeHash($Bytes))).Replace('-', '').ToLowerInvariant() }
  finally { $algorithm.Dispose() }
}

function Escape-Yaml([string]$Value) { return "'" + $Value.Replace("'", "''") + "'" }

function Get-NodeText($Node) {
  return (($Node.SelectNodes('.//*[local-name()="t" or local-name()="tab" or local-name()="br"]') | ForEach-Object {
    if ($_.LocalName -eq 'tab') { "`t" } elseif ($_.LocalName -eq 'br') { "`n" } else { $_.InnerText }
  }) -join '')
}

function Convert-Paragraph($Paragraph) {
  $text = Get-NodeText $Paragraph
  if (-not $text.Trim()) { return '' }
  $styleNode = $Paragraph.SelectSingleNode('./*[local-name()="pPr"]/*[local-name()="pStyle"]')
  $style = if ($styleNode) { $styleNode.GetAttribute('val', 'http://schemas.openxmlformats.org/wordprocessingml/2006/main') } else { '' }
  if ($style -match '^Heading([1-6])$') { return ('#' * [int]$Matches[1]) + ' ' + $text.Trim() }
  $numbering = $Paragraph.SelectSingleNode('./*[local-name()="pPr"]/*[local-name()="numPr"]')
  if ($numbering) {
    $levelNode = $numbering.SelectSingleNode('./*[local-name()="ilvl"]')
    $level = if ($levelNode) { [int]$levelNode.GetAttribute('val', 'http://schemas.openxmlformats.org/wordprocessingml/2006/main') } else { 0 }
    return ('  ' * $level) + '- ' + $text.Trim()
  }
  return $text.TrimEnd()
}

function Convert-Table($Table) {
  $rows = @()
  foreach ($row in $Table.SelectNodes('./*[local-name()="tr"]')) {
    $cells = @($row.SelectNodes('./*[local-name()="tc"]') | ForEach-Object { (Get-NodeText $_).Trim().Replace('|', '\|').Replace("`r", ' ').Replace("`n", ' ') })
    $rows += ,$cells
  }
  if ($rows.Count -eq 0) { return '' }
  $width = ($rows | ForEach-Object { $_.Count } | Measure-Object -Maximum).Maximum
  $lines = @('| ' + (($rows[0] + @('') * $width)[0..($width-1)] -join ' | ') + ' |')
  $lines += '| ' + ((1..$width | ForEach-Object { '---' }) -join ' | ') + ' |'
  foreach ($row in $rows | Select-Object -Skip 1) { $lines += '| ' + (($row + @('') * $width)[0..($width-1)] -join ' | ') + ' |' }
  return $lines -join "`n"
}

function Convert-Docx([string]$Filename) {
  $archive = [IO.Compression.ZipFile]::OpenRead($Filename)
  try {
    $entry = $archive.GetEntry('word/document.xml')
    $reader = [IO.StreamReader]::new($entry.Open())
    try { [xml]$xml = $reader.ReadToEnd() } finally { $reader.Dispose() }
    $body = $xml.SelectSingleNode('//*[local-name()="body"]')
    $blocks = @()
    foreach ($child in $body.ChildNodes) {
      if ($child.LocalName -eq 'p') { $blocks += Convert-Paragraph $child }
      elseif ($child.LocalName -eq 'tbl') { $blocks += Convert-Table $child }
    }
    return (($blocks -join "`n`n") -replace "(`r?`n){3,}", "`n`n").Trim()
  } finally { $archive.Dispose() }
}

New-Item -ItemType Directory -Path $outputRoot -Force | Out-Null
$documents = @()
foreach ($decision in $approved) {
  $entry = $manifest.entries | Where-Object { $_.sourcePath -eq $decision.Path }
  if (-not $entry) { throw "Manifest entry missing: $($decision.Path)" }
  $sourcePath = Join-Path $repoRoot ($decision.Path.Replace('/', '\'))
  $bytes = [IO.File]::ReadAllBytes($sourcePath)
  $sourceHash = Get-Sha256 $bytes
  if ($sourceHash -ne $entry.sourceSha256) { throw "Source hash mismatch: $($decision.Path)" }
  $extension = [IO.Path]::GetExtension($sourcePath).ToLowerInvariant()
  if ($extension -eq '.docx') {
    $body = Convert-Docx $sourcePath
    $method = 'docx-wordprocessingml-to-markdown-v1'
  } else {
    $source = [Text.Encoding]::UTF8.GetString($bytes).Replace("`r`n", "`n")
    $body = ($source -replace '(?s)^---\n.*?\n---\n?', '').Trim()
    $method = 'native-markdown-canonical-envelope-v1'
  }
  $frontmatter = "---`ntitle: $(Escape-Yaml $entry.proposedTitle)`ndescription: $(Escape-Yaml $decision.Description)`ndefault_visibility: $($decision.Visibility)`n---`n"
  $canonical = $frontmatter + $body + "`n"
  $target = Join-Path $outputRoot "$($entry.proposedSlug).md"
  [IO.File]::WriteAllText($target, $canonical, [Text.UTF8Encoding]::new($false))
  $headingCount = ([regex]::Matches($body, '(?m)^#{1,6}\s+')).Count
  $documents += [ordered]@{
    title=$entry.proposedTitle; slug=$entry.proposedSlug; documentId=$entry.proposedDocumentId
    description=$decision.Description; browsePath=$entry.proposedBrowsePath; visibility=$decision.Visibility
    sourcePath=$entry.sourcePath; sourceSha256=$sourceHash; importMethod=$method
    sourceHeadingCount=$headingCount; canonicalHeadingCount=$headingCount
    canonicalSha256=Get-Sha256 ([Text.Encoding]::UTF8.GetBytes($canonical))
    omitted=@(); deferred=@(); sourceProseEditoriallyRewritten=$false
    provenance=[ordered]@{sourcePath=$entry.sourcePath; sourceSha256=$sourceHash; importMethod=$method}
    limitations=if ($entry.proposedSlug -eq 'bcrp-icon-style-guide-and-prompting-in-a-pinch') {@('The three visual examples referenced by the source are not embedded and were not invented.')} elseif ($entry.proposedSlug -eq 'bcrp-evidence') {@('No additional roadmap-status metadata was applied pending human approval.')} else {@()}
  }
}
$report = [ordered]@{ generatedAt=[DateTime]::UtcNow.ToString('o'); status='dry-run-only'; databaseWrites=$false; publicationsCreated=$false; documents=$documents }
[IO.File]::WriteAllText($reportPath, (($report | ConvertTo-Json -Depth 8) + "`n"), [Text.UTF8Encoding]::new($false))
Write-Output "Prepared $($documents.Count) Batch 2 dry-run documents."
