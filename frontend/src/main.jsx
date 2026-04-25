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
  (async () => {
    try {
      if (import.meta.env.DEV) {
        const registrations = await navigator.serviceWorker.getRegistrations();
        await Promise.all(registrations.map((registration) => registration.unregister()));
        return;
      }

      const registration = await navigator.serviceWorker.register('/service-worker.js');
      console.log('✓ Service Worker registrado:', registration);
      // Solicitar permisos de notificación
      if ('Notification' in globalThis && Notification.permission === 'default') {
        const permission = await Notification.requestPermission();
        console.log('Notificaciones:', permission);
      }
    } catch (err) {
      console.error('Error en ciclo de Service Worker:', err);
    }
  })();
}

