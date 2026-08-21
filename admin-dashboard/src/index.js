import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import './index.css';
import AdminDashboard from './AdminDashboard';
import { ToastProvider } from './contexts/ToastContext';

// Filter out and suppress crashes from third-party Chrome extensions (e.g. autofill scripts)
if (typeof window !== 'undefined') {
  window.addEventListener('error', (event) => {
    if (
      (event.filename && event.filename.includes('chrome-extension:')) ||
      (event.message && (event.message.includes('M_ID') || event.message.includes('chrome-extension:')))
    ) {
      event.stopImmediatePropagation();
      event.preventDefault();
      return true;
    }
  }, true);

  window.addEventListener('unhandledrejection', (event) => {
    if (
      event.reason &&
      (event.reason.stack?.includes('chrome-extension:') ||
       event.reason.message?.includes('M_ID'))
    ) {
      event.stopImmediatePropagation();
      event.preventDefault();
    }
  }, true);
}

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    <BrowserRouter>
      <ToastProvider>
        <AdminDashboard />
      </ToastProvider>
    </BrowserRouter>
  </React.StrictMode>
);
