// src/serviceWorker.js
export function register() {
  if ('serviceWorker' in navigator) {
    const registerSW = () => {
      const swUrl = '/service-worker.js';
      navigator.serviceWorker
        .register(swUrl)
        .then((registration) => {
          console.log('Shree Mateshwari Service Worker registered successfully:', registration.scope);
        })
        .catch((error) => {
          console.error('Service Worker registration failed:', error);
        });
    };

    if (document.readyState === 'complete') {
      registerSW();
    } else {
      window.addEventListener('load', registerSW);
    }
  }
}

export function unregister() {
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.ready
      .then((registration) => {
        registration.unregister();
      })
      .catch((error) => {
        console.error(error.message);
      });
  }
}