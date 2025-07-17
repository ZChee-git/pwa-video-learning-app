## Netlify Build Fix - Upload Missing TypeScript Configuration Files

### Problem
Netlify build is failing because `tsconfig.app.json` is missing from the GitHub repository.

### Solution
Manually upload these three files to your GitHub repository:

### 1. tsconfig.json
```json
{
  "files": [],
  "references": [
    { "path": "./tsconfig.app.json" },
    { "path": "./tsconfig.node.json" }
  ]
}
```

### 2. tsconfig.app.json
```json
{
  "compilerOptions": {
    "target": "ES2020",
    "useDefineForClassFields": true,
    "lib": ["ES2020", "DOM", "DOM.Iterable"],
    "module": "ESNext",
    "skipLibCheck": true,

    /* Bundler mode */
    "moduleResolution": "bundler",
    "allowImportingTsExtensions": true,
    "isolatedModules": true,
    "moduleDetection": "force",
    "noEmit": true,
    "jsx": "react-jsx",

    /* Linting */
    "strict": true,
    "noUnusedLocals": true,
    "noUnusedParameters": true,
    "noFallthroughCasesInSwitch": true
  },
  "include": ["src"]
}
```

### 3. tsconfig.node.json
```json
{
  "compilerOptions": {
    "target": "ES2022",
    "lib": ["ES2023"],
    "module": "ESNext",
    "skipLibCheck": true,

    /* Bundler mode */
    "moduleResolution": "bundler",
    "allowImportingTsExtensions": true,
    "isolatedModules": true,
    "moduleDetection": "force",
    "noEmit": true,

    /* Linting */
    "strict": true,
    "noUnusedLocals": true,
    "noUnusedParameters": true,
    "noFallthroughCasesInSwitch": true
  },
  "include": ["vite.config.ts"]
}
```

### Steps to Upload:
1. Go to: https://github.com/ZChee-git/pwa-video-learning-app
2. Click "Add file" -> "Create new file"
3. Create each file with the exact content above
4. Commit with message: "Add missing TypeScript configuration files"
5. After all files are uploaded, go to Netlify and trigger a new deployment

### Alternative: Direct Upload
1. Download/copy the three files from your local project
2. Go to GitHub repository
3. Click "Add file" -> "Upload files"
4. Upload the three tsconfig files
5. Commit and push

After uploading, the Netlify build should work correctly!
