import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import { ErrorBoundary } from './components/ErrorBoundary';
import './index.css';

if (typeof window !== 'undefined') {
  const isIgnorableDbError = (err: any) => {
    const reasonStr = String(err?.message || err?.reason?.message || err?.reason || err || '').toLowerCase();
    const nameStr = String(err?.name || '').toLowerCase();
    return (
      reasonStr.includes('database is closing') ||
      reasonStr.includes('closing/hidden') ||
      reasonStr.includes('database is hidden') ||
      reasonStr.includes('the database is closing') ||
      reasonStr.includes('indexeddb') ||
      reasonStr.includes('database is closed') ||
      nameStr.includes('indexeddb')
    );
  };

  window.addEventListener('unhandledrejection', (event) => {
    if (isIgnorableDbError(event.reason)) {
      event.preventDefault();
      event.stopImmediatePropagation();
    }
  });

  window.addEventListener('error', (event) => {
    if (isIgnorableDbError(event.error) || isIgnorableDbError(event.message)) {
      event.preventDefault();
      event.stopImmediatePropagation();
    }
  });
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ErrorBoundary fallbackName="Application Root">
      <App />
    </ErrorBoundary>
  </StrictMode>,
);

