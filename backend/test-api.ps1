# =======================================================
#  IMPROVED API Test Script for Menti Quiz Backend
# =======================================================

# --- Configuration ---
$BaseUri = "http://localhost:3000"
$Username = "admin1"
$Password = "password123"

# --- Step 1: Sign In and Get Token ---
Write-Host "Attempting to sign in as '$Username'..." -ForegroundColor Yellow

try {
    $TOKEN = (Invoke-RestMethod -Uri "$BaseUri/signin" `
      -Method POST `
      -Body '{"username": "' + $Username + '", "password": "' + $Password + '"}' `
      -ContentType "application/json").token
    
    if ($TOKEN) {
        Write-Host "✅ Sign-in successful!" -ForegroundColor Green
        #Write-Host "Your token is: $TOKEN" # You can uncomment this to see the token
    } else {
        Write-Host "❌ Sign-in failed. Response did not contain a token." -ForegroundColor Red
        return
    }
}
catch {
    Write-Host "❌ An error occurred during sign-in:" -ForegroundColor Red
    # First, check if there was an HTTP response at all.
    if ($_.Exception.Response) {
        # If yes, read the response body from the server.
        $streamReader = New-Object System.IO.StreamReader($_.Exception.Response.GetResponseStream())
        $errorResponse = $streamReader.ReadToEnd()
        Write-Host $errorResponse
    } else {
        # If no, it was a connection error. Print the basic exception message.
        Write-Host $_.Exception.Message
    }
    return
}


# --- Step 2: Use the Token to Access a Protected Route ---
Write-Host "`nAttempting to access a protected route (/quiz/generate)..." -ForegroundColor Yellow

try {
    $headers = @{"Content-Type" = "application/json"; "Authorization" = "Bearer $TOKEN"}
    $body = '{"prompt": "Create a short 2-question quiz about the sun"}'
    $quizResponse = Invoke-RestMethod -Uri "$BaseUri/quiz/generate" -Method POST -Headers $headers -Body $body
      
    Write-Host "✅ Successfully generated quiz questions!" -ForegroundColor Green
    Write-Host ($quizResponse | ConvertTo-Json -Depth 5)
}
catch {
    Write-Host "❌ An error occurred while accessing the protected route:" -ForegroundColor Red
    if ($_.Exception.Response) {
        $streamReader = New-Object System.IO.StreamReader($_.Exception.Response.GetResponseStream())
        $errorResponse = $streamReader.ReadToEnd()
        Write-Host $errorResponse
    } else {
        Write-Host $_.Exception.Message
    }
}