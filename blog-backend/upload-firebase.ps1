Write-Host "=== VERCEL FIREBASE UPLOAD ===" -ForegroundColor Cyan
Write-Host ""

$envFile = "c:\Users\Hp\OneDrive\Desktop\LEVEL FOUR SQI\My blog\blog-backend\.env"
$firebaseValue = (Get-Content $envFile | Where-Object { $_ -match "^FIREBASE_SERVICE_ACCOUNT=" }) -replace "^FIREBASE_SERVICE_ACCOUNT=", ""

if ($firebaseValue) {
    Write-Host "Found FIREBASE_SERVICE_ACCOUNT" -ForegroundColor Green
    Write-Host ""
    Write-Host "Uploading to Vercel..." -ForegroundColor Cyan
    
    cd "c:\Users\Hp\OneDrive\Desktop\LEVEL FOUR SQI\My blog\blog-backend"
    $firebaseValue | vercel env add FIREBASE_SERVICE_ACCOUNT production --force
    
    if ($LASTEXITCODE -eq 0) {
        Write-Host ""
        Write-Host "SUCCESS! FIREBASE_SERVICE_ACCOUNT uploaded to Vercel" -ForegroundColor Green
    } else {
        Write-Host ""
        Write-Host "FAILED to upload" -ForegroundColor Red
    }
} else {
    Write-Host "ERROR: FIREBASE_SERVICE_ACCOUNT not found in .env" -ForegroundColor Red
}
