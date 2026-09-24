$ErrorActionPreference = 'Stop'
$projectDirectory = Split-Path $PSScriptRoot -Parent
$destination = Join-Path $projectDirectory '.env.local'
$secureKey = Read-Host 'Paste your OpenRouter API key (hidden input)' -AsSecureString
$pointer = [Runtime.InteropServices.Marshal]::SecureStringToBSTR($secureKey)
try {
    $apiKeyValue = [Runtime.InteropServices.Marshal]::PtrToStringBSTR($pointer).Trim()
    if ($apiKeyValue -notmatch '^sk-or-[A-Za-z0-9_-]+$') { throw 'Invalid OpenRouter key format; no file written.' }
    $existingLines = if (Test-Path -LiteralPath $destination) { @(Get-Content -LiteralPath $destination | Where-Object { $_ -notmatch '^OPENROUTER_API_KEY=' }) } else { @() }
    $updatedLines = @($existingLines) + "OPENROUTER_API_KEY=$apiKeyValue"
    [IO.File]::WriteAllLines($destination, $updatedLines, [Text.UTF8Encoding]::new($false))
    Write-Host 'Key saved to ignored .env.local. Tell Codex it is ready for transfer to the production Secret. Do not paste the key in chat.'
} finally {
    [Runtime.InteropServices.Marshal]::ZeroFreeBSTR($pointer)
    $apiKeyValue = $null
    $updatedLines = $null
}
