@echo off
REM Rust Lens Calculator - Cloudflare Pages Deployment Script

echo.
echo ========================================
echo  RUST LENS CALCULATOR DEPLOYMENT
echo ========================================
echo.

REM Step 1: Build
echo [1/5] Building application...
call npm run build
if %errorlevel% neq 0 (
    echo Build failed!
    pause
    exit /b 1
)
echo ✓ Build successful

REM Step 2: Git add
echo.
echo [2/5] Adding changes to git...
call git add .
echo ✓ Changes staged

REM Step 3: Git commit
echo.
echo [3/5] Committing changes...
call git commit -m "Deployment to Cloudflare Pages"
if %errorlevel% neq 0 (
    echo ⚠ Nothing to commit or commit failed (continuing...)
)
echo ✓ Committed

REM Step 4: Git push
echo.
echo [4/5] Pushing to remote...
call git push
if %errorlevel% neq 0 (
    echo ⚠ Push failed (continuing...)
)
echo ✓ Pushed

REM Step 5: Deploy to Cloudflare Pages
echo.
echo [5/5] Deploying to Cloudflare Pages...
call wrangler pages deploy out --project-name=rustlenscalculator
if %errorlevel% neq 0 (
    echo Deployment failed!
    pause
    exit /b 1
)

echo.
echo ========================================
echo  ✓ DEPLOYMENT COMPLETE!
echo ========================================
echo.
pause
