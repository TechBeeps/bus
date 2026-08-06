import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import AdminDashboard from './AdminDashboard';
import { ToastProvider } from './contexts/ToastContext';

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    <ToastProvider>
      <AdminDashboard />
    </ToastProvider>
  </React.StrictMode>
);
