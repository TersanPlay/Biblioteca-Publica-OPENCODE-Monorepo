import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import './index.css';
import { AppRoutes } from './app/router/routes';
import { AuthProvider } from './features/auth/auth-provider';
import { ReaderSessionProvider } from './features/readers/reader-session';
import { ToastProvider } from './features/toast/toast-provider';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <BrowserRouter>
      <ToastProvider>
        <AuthProvider>
          <ReaderSessionProvider>
            <AppRoutes />
          </ReaderSessionProvider>
        </AuthProvider>
      </ToastProvider>
    </BrowserRouter>
  </StrictMode>,
);
