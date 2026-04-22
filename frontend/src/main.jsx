import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import './components/modals.css'
import App from './App.jsx'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
)

// ─── Registrar Service Worker para notificaciones push ─────────────────────
if ('serviceWorker' in navigator) {
  navigator.serviceWorker.register('/service-worker.js')
    .then((registration) => {
      console.log('✓ Service Worker registrado:', registration);
      // Solicitar permisos de notificación
      if ('Notification' in window && Notification.permission === 'default') {
        Notification.requestPermission().then((permission) => {
          console.log('Notificaciones:', permission);
        });
      }
    })
    .catch((err) => console.error('Error registrando SW:', err));
}

