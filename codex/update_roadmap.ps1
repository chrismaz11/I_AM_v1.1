# ---------------------------------------------------------
# AUTO-ROADMAP GENERATOR
# ---------------------------------------------------------

Write-Host "Updating ROADMAP.md using Codex…"

$tree = (Get-ChildItem -Recurse -File |
    Select-Object -ExpandProperty FullName |
    Sort-Object)

$agents = (Get-ChildItem agents -Filter "*.agent.md" |
    Select-Object -ExpandProperty FullName |
    Sort-Object)

$workflows = (Get-ChildItem codex/workflows -Filter "*.md" |
    Select-Object -ExpandProperty FullName |
    Sort-Object)

$treeText = $tree -join "`n"
$agentList = $agents -join "`n"
$workflowList = $workflows -join "`n"

$prompt = @"
You are the Strategist Agent for the I AM platform.

Generate a comprehensive ROADMAP.md containing:

- Phase 1 (MVP)
- Phase 2 (Platform Integration)
- Phase 3 (Scaling)
- Phase 4 (Compliance & Enterprise)
- Phase 5 (Intelligent Automation)
- Phase 6 (Ecosystem Expansion)

Use the project tree, agents, workflows, and inferred priorities.

OUTPUT JSON ONLY with the full ROADMAP.md file.

CONTEXT:
PROJECT TREE:
$treeText

AGENTS:
$agentList

WORKFLOWS:
$workflowList
"@

$temp = Join-Path $env:TEMP "codex_roadmap_prompt.txt"
Set-Content $temp $prompt -Encoding UTF8

$result = Get-Content $temp -Raw | codex exec --skip-git-repo-check

$jsonStart = $result.IndexOf("{")
$json = $result.Substring($jsonStart)

$data = $json | ConvertFrom-Json

foreach ($file in $data.files) {
    Set-Content -Path $file.path -Value $file.contents -Encoding UTF8
    Write-Host "WROTE FILE: $($file.path)"
}

Write-Host "ROADMAP updated."
