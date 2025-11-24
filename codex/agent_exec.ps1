param(
    [Parameter(Mandatory=$true)]
    [string]$agent,

    [Parameter(Mandatory=$true)]
    [string]$input
)

# ---------------------------------------------------------
# 1. Load agent definition
# ---------------------------------------------------------

$agentPath = "agents/$agent.agent.md"

if (-not (Test-Path $agentPath)) {
    Write-Host "Agent file not found at: $agentPath"
    exit
}

$agentContent = Get-Content $agentPath -Raw

# Escape JSON-breaking chars
$escapedInput = $input.Replace('"','\"')
$escapedAgent = $agentContent.Replace('"','\"')

# ---------------------------------------------------------
# 2. Construct final prompt in memory
# ---------------------------------------------------------

$prompt = @"
You are the '$agent' agent for the I AM platform.
Respond ONLY with valid JSON.

### AGENT DEFINITION
$agentContent

### USER INPUT
$input
"@

# ---------------------------------------------------------
# 3. Write the prompt into a temp file
# ---------------------------------------------------------

$tempPromptFile = [System.IO.Path]::GetTempFileName()
Set-Content -Path $tempPromptFile -Value $prompt -Encoding UTF8

# ---------------------------------------------------------
# 4. Execute Codex safely using stdin mode
# ---------------------------------------------------------

$codexCommand = "codex exec --skip-git-repo-check --stdin"

try {
    $result = Get-Content $tempPromptFile -Raw | codex exec --skip-git-repo-check --stdin
} catch {
    Write-Host "Codex failed to execute."
    exit
}

# ---------------------------------------------------------
# 5. Parse output for JSON
# ---------------------------------------------------------

if (-not $result) {
    Write-Host "Codex produced no output."
    exit
}

$jsonStart = $result.IndexOf("{")
if ($jsonStart -lt 0) {
    Write-Host "Could not find JSON in Codex output."
    Write-Host "Raw output:"
    Write-Host $result
    exit
}

$json = $result.Substring($jsonStart)

try {
    $data = $json | ConvertFrom-Json -ErrorAction Stop
} catch {
    Write-Host "JSON parse error. Raw JSON:"
    Write-Host $json
    exit
}

# ---------------------------------------------------------
# 6. Load codex_mode.json
# ---------------------------------------------------------

$modeConfig = Get-Content "codex_mode.json" -Raw | ConvertFrom-Json

$protected = $modeConfig.protected
$evolution = $modeConfig.evolution
$blockedFiles = $modeConfig.blockedFiles

# ---------------------------------------------------------
# 7. Logging
# ---------------------------------------------------------

$logPath = "codex/evolve_log.md"
$timestamp = Get-Date -Format "yyyy-MM-dd HH:mm:ss"
Add-Content $logPath "`n## Agent Run ($timestamp) - Agent: $agent"

# ---------------------------------------------------------
# 8. Process file writes
# ---------------------------------------------------------

if ($data.files -and $data.files.Count -gt 0) {

    foreach ($file in $data.files) {

        if ($file.action -ne "write") { continue }

        $path = $file.path
        $contents = $file.contents

        if (-not $path) { continue }

        $normalized = $path.Replace("\", "/")

        # Block traversal
        if ($normalized.Contains("..")) {
            Write-Host "BLOCKED (path traversal): $path"
            Add-Content $logPath "- BLOCKED traversal: $path"
            continue
        }

        # Block specific files
        $base = Split-Path $normalized -Leaf
        if ($blockedFiles -contains $base) {
            Write-Host "BLOCKED (blocked file): $path"
            Add-Content $logPath "- BLOCKED blocked file: $path"
            continue
        }

        # Block protected zones
        $isProtected = $false
        foreach ($p in $protected) {
            if ($normalized.StartsWith("$p/") -or $normalized -eq $p) {
                $isProtected = $true
            }
        }
        if ($isProtected) {
            Write-Host "BLOCKED (protected): $path"
            Add-Content $logPath "- BLOCKED protected: $path"
            continue
        }

        # Allow only evolution zones
        $allowed = $false
        foreach ($e in $evolution) {
            if ($normalized.StartsWith("$e/") -or $normalized -eq $e) {
                $allowed = $true
            }
        }
        if (-not $allowed) {
            Write-Host "BLOCKED (outside allowed zone): $path"
            Add-Content $logPath "- BLOCKED outside zone: $path"
            continue
        }

        # Ensure directory
        $dir = Split-Path $path
        if ($dir -and -not (Test-Path $dir)) {
            New-Item -ItemType Directory -Force -Path $dir | Out-Null
        }

        # Write file
        Set-Content -Path $path -Value $contents -Encoding UTF8
        Write-Host "WROTE: $path"
        Add-Content $logPath "- WROTE: $path"
    }

} else {
    Write-Host "No file outputs."
    Add-Content $logPath "- No file outputs."
}

# ---------------------------------------------------------
# 9. Cleanup
# ---------------------------------------------------------

Remove-Item $tempPromptFile -Force

Write-Host "Agent run complete. Log written to $logPath"
