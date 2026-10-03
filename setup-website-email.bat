@echo off
cls
echo =======================================================
echo     FreeTalk - Official Website Sender Email Setup
echo =======================================================
echo.
echo To send REAL OTP codes to your users' Gmail inboxes,
echo the website needs a Gmail account to send emails from.
echo.
echo NOTE: Google requires a free 16-character "App Password".
echo If you don't have one yet:
echo   1. Go to https://myaccount.google.com/apppasswords
echo   2. Name it "FreeTalk" and click "Create"
echo   3. Copy the 16-character code (e.g. abcd efgh ijkl mnop)
echo =======================================================
echo.

set /p SENDER_EMAIL="Enter website Gmail address: "
if "%SENDER_EMAIL%"=="" (
  echo Error: Email cannot be empty.
  pause
  exit /b 1
)

set /p APP_PASSWORD="Enter 16-character Google App Password: "
if "%APP_PASSWORD%"=="" (
  echo Error: App Password cannot be empty.
  pause
  exit /b 1
)

echo.
echo Configuring backend\.env ...

powershell -Command "$file = 'backend\.env'; $content = Get-Content $file; $filtered = $content | Where-Object { $_ -notmatch '^SMTP_' -and $_ -notmatch '^EMAIL_FROM=' }; $newLines = @('SMTP_HOST=\"smtp.gmail.com\"', 'SMTP_PORT=465', 'SMTP_SECURE=true', 'SMTP_USER=\"%SENDER_EMAIL%\"', 'SMTP_PASS=\"%APP_PASSWORD%\"', 'EMAIL_FROM=\"FreeTalk <%SENDER_EMAIL%>\"'); ($filtered + $newLines) | Set-Content $file"

echo Configuration saved to backend\.env!
echo.
echo -------------------------------------------------------
echo Testing real email delivery to %SENDER_EMAIL%...
echo -------------------------------------------------------
cd backend
node test-email.js %SENDER_EMAIL%
cd ..

echo.
echo =======================================================
echo Done! Please restart start_all.bat for changes to apply.
echo =======================================================
pause
