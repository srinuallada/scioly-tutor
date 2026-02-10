@echo off
setlocal enabledelayedexpansion

echo ========================================
echo  SciOly Tutor - Deploy to Google Cloud
echo ========================================
echo.

:: Read config from backend\.env
for /f "usebackq tokens=1,* delims==" %%a in ("backend\.env") do (
    set "line=%%a"
    if not "!line:~0,1!"=="#" (
        if not "%%b"=="" set "%%a=%%b"
    )
)

:: Use semicolons for ALLOWED_EMAILS (gcloud uses commas for key-value pairs)
set "ALLOWED_EMAILS_SAFE=%ALLOWED_EMAILS:,=;%"

echo Project:        scioly-tutor
echo Region:         us-east1
echo Client ID:      %GOOGLE_CLIENT_ID%
echo Allowed emails: %ALLOWED_EMAILS%
echo.

:: Confirm
set /p CONFIRM="Deploy now? (y/n): "
if /i not "%CONFIRM%"=="y" (
    echo Cancelled.
    exit /b 0
)

echo.
echo Building and deploying...
echo.

gcloud builds submit --config=cloudbuild.yaml --substitutions=_VITE_GOOGLE_CLIENT_ID=%GOOGLE_CLIENT_ID%,_GEMINI_API_KEY=%GEMINI_API_KEY%,_ALLOWED_EMAILS=%ALLOWED_EMAILS_SAFE%

if %errorlevel% neq 0 (
    echo.
    echo DEPLOY FAILED. Check the logs above.
    exit /b 1
)

echo.
echo ========================================
echo  Deploy complete!
echo  URL: https://scioly-tutor-756920394301.us-east1.run.app
echo ========================================
