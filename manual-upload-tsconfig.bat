@echo off
echo Manual GitHub Upload Instructions for TypeScript Configuration Files
echo ================================================================

echo.
echo The Netlify build is failing because tsconfig.app.json is missing from GitHub.
echo Please manually upload these files to your GitHub repository:

echo.
echo REQUIRED FILES TO UPLOAD:
echo ========================
echo 1. tsconfig.json
echo 2. tsconfig.app.json  
echo 3. tsconfig.node.json

echo.
echo STEPS:
echo ======
echo 1. Go to: https://github.com/ZChee-git/pwa-video-learning-app
echo 2. Click "Add file" -> "Upload files"
echo 3. Upload the three tsconfig files from this project folder
echo 4. Commit with message: "Add missing TypeScript configuration files"
echo 5. After upload, go to Netlify and trigger a new deployment

echo.
echo ALTERNATIVE: Use GitHub CLI if installed
echo =======================================
echo gh repo view ZChee-git/pwa-video-learning-app
echo gh api repos/ZChee-git/pwa-video-learning-app/contents/tsconfig.json -X PUT -f message="Add tsconfig.json" -f content=@tsconfig.json --base64
echo gh api repos/ZChee-git/pwa-video-learning-app/contents/tsconfig.app.json -X PUT -f message="Add tsconfig.app.json" -f content=@tsconfig.app.json --base64
echo gh api repos/ZChee-git/pwa-video-learning-app/contents/tsconfig.node.json -X PUT -f message="Add tsconfig.node.json" -f content=@tsconfig.node.json --base64

echo.
echo Current project folder: %cd%
echo.
pause
