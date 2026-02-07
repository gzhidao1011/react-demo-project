param(
    [string]$BaseUrl = "http://localhost:8001",
    [switch]$UseAuth,
    [string]$Username = "actuator",
    [string]$Password = "change-me",
    [switch]$DoRefresh
)

$healthUrl = "$BaseUrl/actuator/health"
$refreshUrl = "$BaseUrl/actuator/refresh"

function Invoke-ActuatorRequest {
    param(
        [string]$Url,
        [string]$Method = "GET"
    )

    if ($UseAuth) {
        $secure = ConvertTo-SecureString $Password -AsPlainText -Force
        $cred = New-Object System.Management.Automation.PSCredential ($Username, $secure)
        return Invoke-WebRequest -UseBasicParsing -Uri $Url -Method $Method -Credential $cred
    }

    return Invoke-WebRequest -UseBasicParsing -Uri $Url -Method $Method
}

Write-Host "Checking: $healthUrl"
$healthResp = Invoke-ActuatorRequest -Url $healthUrl -Method "GET"
$healthContent = if ($healthResp.Content -is [byte[]]) { [System.Text.Encoding]::UTF8.GetString($healthResp.Content) } else { $healthResp.Content }
Write-Host $healthContent

if ($DoRefresh) {
    Write-Host "Refreshing: $refreshUrl"
    $refreshResp = Invoke-ActuatorRequest -Url $refreshUrl -Method "POST"
    $refreshContent = if ($refreshResp.Content -is [byte[]]) { [System.Text.Encoding]::UTF8.GetString($refreshResp.Content) } else { $refreshResp.Content }
    Write-Host $refreshContent
}
