import React from 'react';
import ReactDOM from 'react-dom/client';
import PassengerApp from './App';
import './index.css';
import * as serviceWorker from './serviceWorker';

// Capture PWA install prompt globally immediately at startup
window.pwaInstallPrompt = null;
window.addEventListener('beforeinstallprompt', (e) => {
  e.preventDefault();
  window.pwaInstallPrompt = e;
  window.dispatchEvent(new Event('pwa-prompt-ready'));
  console.log('PWA beforeinstallprompt captured successfully!');
});

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    <PassengerApp />
  </React.StrictMode>
);

serviceWorker.register();