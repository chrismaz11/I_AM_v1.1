# ---------------------------------------------------------
# AUTO-CHANGELOG GENERATOR
# ---------------------------------------------------------

Write-Host "Updating CHANGELOG.md using Codex…"

# Gather git history if possible
try {
    $log = git log --pretty=format:"%h - %s" -n 50 2>$null
} catch {
    $log = "Git history unavailable."
}

$tree = (Get-ChildItem -Recurse -File |
    Select-Object -ExpandProperty FullName |
    Sort-Object)

$treeText = $tree -join "`n"

$prompt = @"
You are the Documentation/Strategist agent for the I AM platform.

Generate an updated CHANGELOG.md with the following requirements:

- Must follow Keep a Changelog format.
- Include Unreleased section.
- Summarize recent changes based on git log & project structure.
- Include meaningful change categories: Added / Changed / Fixed / Removed.
- Auto-write the full CHANGELOG.md file.

OUTPUT JSON ONLY:
{
  "summary": "",
  "files": [
    {
      "path": "CHANGELOG.md",
      "action": "write",
      "language": "md",
      "contents": "..."
    }
  ],
  "checklist": [],
  "notes": ""
}

CONTEXT:
PROJECT TREE:
$treeText

GIT LOG (recent):
$log
"@

$tempPrompt = Join-Path $env:TEMP "codex_changelog_prompt.txt"
Set-Content $tempPrompt $prompt -Encoding UTF8

$result = Get-Content $tempPrompt -Raw | codex exec --skip-git-repo-check

$jsonStart = $result.IndexOf("{")
$json = $result.Substring($jsonStart)

$data = $json | ConvertFrom-Json

foreach ($file in $data.files) {
    Set-Content -Path $file.path -Value $file.contents -Encoding UTF8
    Write-Host "WROTE FILE: $($file.path)"
}

Write-Host "CHANGELOG updated."
