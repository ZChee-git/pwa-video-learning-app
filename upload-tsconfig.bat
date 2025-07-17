@echo off
echo Uploading TypeScript configuration files to GitHub...

REM Navigate to project directory
cd /d "C:\Users\Administrator\Downloads\project-bolt-sb1-raf4VSCODE_2\project"

REM Check git status
echo Checking git status...
git status

REM Add TypeScript configuration files
echo Adding TypeScript configuration files...
git add tsconfig.json
git add tsconfig.app.json
git add tsconfig.node.json

REM Commit changes
echo Committing changes...
git commit -m "Add missing TypeScript configuration files for Netlify build"

REM Push to GitHub
echo Pushing to GitHub...
git push origin main

echo.
echo Upload completed! Please check GitHub repository.
echo Then trigger a new Netlify deployment.
pause
