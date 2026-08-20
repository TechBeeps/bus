import React from 'react';
import ReactDOM from 'react-dom/client';
import PassengerApp from './App';
import './index.css';
import * as serviceWorker from './serviceWorker'; 

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    <PassengerApp />
  </React.StrictMode>
);

serviceWorker.register();