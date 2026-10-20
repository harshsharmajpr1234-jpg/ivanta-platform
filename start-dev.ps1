# iVanta - Start Backend & Frontend together in single terminal
Write-Host "Starting iVanta Backend (Port 8080) & Frontend (Port 3000)..." -ForegroundColor Green
Set-Location $PSScriptRoot
npx concurrently -k -p "[{name}]" -n "backend,frontend" -c "yellow,cyan" "npm run start:backend" "npm run start:frontend"
