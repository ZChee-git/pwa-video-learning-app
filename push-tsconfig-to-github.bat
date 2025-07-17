@echo off
echo Checking GitHub connection and pushing TypeScript config files...
echo.

cd /d "C:\Users\Administrator\Downloads\project-bolt-sb1-raf4VSCODE_2\project"

echo Current directory: %cd%
echo.

echo Checking git status...
git status

echo.
echo Checking git remote...
git remote -v

echo.
echo Adding TypeScript configuration files...
git add tsconfig.json
git add tsconfig.app.json 
git add tsconfig.node.json

echo.
echo Committing changes...
git commit -m "Add missing TypeScript configuration files for Netlify build"

echo.
echo Pushing to GitHub...
git push origin main

echo.
echo Done! Check your GitHub repository to verify the files were uploaded.
echo Then trigger a new Netlify deployment.
echo.
pause
