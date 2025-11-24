param(
    [Parameter(Mandatory=$true)]
    [string]$workflow,

    [Parameter(Mandatory=$false)]
    [string]$input = ""
)

$workflowPath = "codex/workflows/$workflow.md"

if (-not (Test-Path $workflowPath)) {
    Write-Host "Workflow '$workflow' not found at: $workflowPath"
    exit
}

$workflowContent = Get-Content $workflowPath -Raw

$finalPrompt = @"
### WORKFLOW START
$workflowContent
### RESOLVED INPUT
feature: \"$input\"
### WORKFLOW END
"@

$result = codex exec --skip-git-repo-check -- "$finalPrompt"

if (-not $result) {
    Write-Host "Codex produced no output."
    exit
}

$jsonStart = $result.IndexOf("{")
if ($jsonStart -lt 0) {
    Write-Host "Could not find JSON in Codex output. Raw output:"
    Write-Host $result
    exit
}

$json = $result.Substring($jsonStart)

try {
    $data = $json | ConvertFrom-Json -ErrorAction Stop
} catch {
    Write-Host "JSON parsing error. Raw JSON:"
    Write-Host $json
    exit
}

$modeConfigPath = "codex_mode.json"
if (-not (Test-Path $modeConfigPath)) {
    Write-Host "Missing codex_mode.json"
    exit
}

$modeConfig = Get-Content $modeConfigPath -Raw | ConvertFrom-Json
$protected = $modeConfig.protected
$evolution = $modeConfig.evolution
$blockedFiles = $modeConfig.blockedFiles

$logPath = "codex/evolve_log.md"
$timestamp = Get-Date -Format "yyyy-MM-dd HH:mm:ss"
Add-Content $logPath "`n## Evolution Run ($timestamp) - Workflow: $workflow"

if ($data.files -and $data.files.Count -gt 0) {

    foreach ($file in $data.files) {

        if ($file.action -ne "write") {
            continue
        }

        $path = $file.path
        $contents = $file.contents

        if (-not $path) {
            continue
        }

        $normalized = $path.Replace("\", "/")

        if ($normalized.Contains("..")) {
            Write-Host "BLOCKED (path traversal): $path"
            Add-Content $logPath "- BLOCKED (path traversal): $path"
            continue
        }

        $baseName = Split-Path $normalized -Leaf
        if ($blockedFiles -contains $baseName) {
            Write-Host "BLOCKED (blocked file): $path"
            Add-Content $logPath "- BLOCKED (blocked file): $path"
            continue
        }

        $isProtected = $false
        foreach ($p in $protected) {
            if ($normalized.StartsWith("$p/") -or $normalized -eq $p) {
                $isProtected = $true
            }
        }

        if ($isProtected) {
            Write-Host "BLOCKED (protected path): $path"
            Add-Content $logPath "- BLOCKED (protected path): $path"
            continue
        }

        $allowed = $false
        foreach ($e in $evolution) {
            if ($normalized.StartsWith("$e/") -or $normalized -eq $e) {
                $allowed = $true
            }
        }

        if (-not $allowed) {
            Write-Host "BLOCKED (outside evolution zones): $path"
            Add-Content $logPath "- BLOCKED (outside evolution zones): $path"
            continue
        }

        $dir = Split-Path $path
        if ($dir -and -not (Test-Path $dir)) {
            New-Item -ItemType Directory -Force -Path $dir | Out-Null
        }

        Set-Content -Path $path -Value $contents -Encoding UTF8
        Write-Host "WROTE FILE: $path"
        Add-Content $logPath "- WROTE: $path"
    }

} else {
    Write-Host "No file operations requested."
    Add-Content $logPath "- No file operations requested."
}

Write-Host ""
Write-Host "Workflow complete. Log written to $logPath"
