import React from 'react'
import ReactDOM from 'react-dom/client'
import App from '@/App.jsx'
import '@/index.css'
import '@/globals.css'

window.onerror = (msg, src, line, col, err) => {
  const el = document.getElementById('root');
  if (el) el.innerHTML = `<div style="color:red;padding:20px;font-family:monospace;direction:ltr">ERROR: ${msg}<br>${src}:${line}:${col}</div>`;
};

window.onunhandledrejection = (e) => {
  const el = document.getElementById('root');
  if (el && !el.innerHTML.includes('ERROR')) el.innerHTML += `<div style="color:orange;padding:20px;font-family:monospace;direction:ltr">UNHANDLED: ${e.reason}</div>`;
};

try {
  ReactDOM.createRoot(document.getElementById('root')).render(<App />);
} catch(e) {
  document.getElementById('root').innerHTML = `<div style="color:red;padding:20px;font-family:monospace;direction:ltr">RENDER ERROR: ${e.message}<br>${e.stack}</div>`;
}

// Unregister any existing service workers to clear stale caches
if ('serviceWorker' in navigator) {
  navigator.serviceWorker.getRegistrations().then(regs => {
    regs.forEach(r => r.unregister());
  });
}
