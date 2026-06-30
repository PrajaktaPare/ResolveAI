@echo off
REM ─────────────────────────────────────────────────────────
REM  ResolveAI — Deploy to Google Cloud Run (Windows)
REM  Run this script from the project root directory.
REM ─────────────────────────────────────────────────────────

echo ========================================
echo  ResolveAI - Google Cloud Run Deployer
echo ========================================
echo.

REM ── Configuration ──
SET PROJECT_ID=resolveai-project
SET REGION=asia-south1
SET BACKEND_SERVICE=resolveai-backend
SET FRONTEND_SERVICE=resolveai-frontend

echo [1/7] Setting active GCP project: %PROJECT_ID%
call gcloud config set project %PROJECT_ID%

echo.
echo [2/7] Enabling required GCP APIs...
call gcloud services enable run.googleapis.com
call gcloud services enable cloudbuild.googleapis.com
call gcloud services enable containerregistry.googleapis.com

echo.
echo [3/7] Building backend Docker image...
call gcloud builds submit ./backend --tag gcr.io/%PROJECT_ID%/%BACKEND_SERVICE%:latest

echo.
echo [4/7] Deploying backend to Cloud Run...
call gcloud run deploy %BACKEND_SERVICE% ^
  --image gcr.io/%PROJECT_ID%/%BACKEND_SERVICE%:latest ^
  --region %REGION% ^
  --platform managed ^
  --allow-unauthenticated ^
  --port 8080 ^
  --memory 512Mi ^
  --cpu 1 ^
  --min-instances 0 ^
  --max-instances 3 ^
  --set-env-vars "NODE_ENV=production,PORT=8080"

echo.
echo [5/7] Getting backend URL...
for /f "tokens=*" %%a in ('gcloud run services describe %BACKEND_SERVICE% --region %REGION% --format "value(status.url)"') do set BACKEND_URL=%%a
echo    Backend URL: %BACKEND_URL%

echo.
echo [6/7] Building and deploying frontend to Cloud Run...
call gcloud builds submit ./frontend ^
  --tag gcr.io/%PROJECT_ID%/%FRONTEND_SERVICE%:latest ^
  --substitutions "_VITE_API_BASE_URL=%BACKEND_URL%/api"

call gcloud run deploy %FRONTEND_SERVICE% ^
  --image gcr.io/%PROJECT_ID%/%FRONTEND_SERVICE%:latest ^
  --region %REGION% ^
  --platform managed ^
  --allow-unauthenticated ^
  --port 8080 ^
  --memory 256Mi ^
  --cpu 1 ^
  --min-instances 0 ^
  --max-instances 3

echo.
echo [7/7] Getting frontend URL...
for /f "tokens=*" %%a in ('gcloud run services describe %FRONTEND_SERVICE% --region %REGION% --format "value(status.url)"') do set FRONTEND_URL=%%a

echo.
echo ========================================
echo  DEPLOYMENT COMPLETE!
echo ========================================
echo  Frontend: %FRONTEND_URL%
echo  Backend:  %BACKEND_URL%
echo ========================================
echo.
echo IMPORTANT: Update the backend CLIENT_URL env var to:
echo   %FRONTEND_URL%
echo.
echo Run this command:
echo   gcloud run services update %BACKEND_SERVICE% --region %REGION% --set-env-vars "CLIENT_URL=%FRONTEND_URL%,NODE_ENV=production"
echo.

pause
