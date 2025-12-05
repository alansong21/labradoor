# Benchmarking Script for Labradoor (PowerShell)
# Compares performance before and after lazy loading

Write-Host "🚀 Labradoor Performance Benchmarking" -ForegroundColor Cyan
Write-Host "======================================" -ForegroundColor Cyan
Write-Host ""

# Check if dev server is running
Write-Host "Checking if dev server is running..." -ForegroundColor Blue
try {
    $response = Invoke-WebRequest -Uri "http://localhost:3000" -UseBasicParsing -TimeoutSec 2 -ErrorAction Stop
    Write-Host "✓ Dev server is running" -ForegroundColor Green
} catch {
    Write-Host "⚠️  Dev server not running on http://localhost:3000" -ForegroundColor Yellow
    Write-Host "Please start it with: npm run dev" -ForegroundColor Yellow
    exit 1
}
Write-Host ""

# Check if Cypress is installed
Write-Host "Running baseline tests (without lazy loading)..." -ForegroundColor Blue
Write-Host "Make sure lazy loading is DISABLED in page.tsx" -ForegroundColor Yellow
Write-Host ""
Read-Host "Press Enter when ready to run baseline tests"

npx cypress run --spec "cypress/e2e/performance-baseline.cy.ts" --browser chrome --headless

Write-Host ""
Write-Host "Baseline tests complete!" -ForegroundColor Blue
Write-Host ""
Write-Host "Now enable lazy loading in page.tsx and press Enter to run optimized tests..." -ForegroundColor Yellow
Read-Host "Press Enter when ready"

Write-Host ""
Write-Host "Running optimized tests (with lazy loading)..." -ForegroundColor Blue
npx cypress run --spec "cypress/e2e/performance.cy.ts" --browser chrome --headless

Write-Host ""
Write-Host "✅ Benchmarking complete!" -ForegroundColor Green
Write-Host "Compare the load times from both test runs above."

