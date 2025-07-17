import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App.tsx';
import { AuthGuard } from './components/AuthGuard.tsx';
import './index.css';

// 导入应用初始化脚本
import './utils/appInitializer.js';
import './utils/videoRecovery.js';
import './utils/apkDataManager.js';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <AuthGuard>
      <App />
    </AuthGuard>
  </StrictMode>
);
