// Service Worker para manejar notificaciones de videollamada incluso cuando el celular está bloqueado

const NOTIFICATION_ICON = '/copmec-favicon.svg';
const VIBRATION_PATTERN = [200, 100, 200, 100, 200]; // Patrón de vibración de llamada

self.addEventListener('push', (event) => {
  console.log('[SW] Push event received:', event);
  
  if (event.data) {
    try {
      const data = event.data.json();
      
      if (data.type === 'call_invite') {
        // Vibración intensa para llamada entrante
        if (navigator.vibrate) {
          navigator.vibrate(VIBRATION_PATTERN);
        }
        
        const options = {
          body: `${data.callerName || 'Usuario'} te está llamando`,
          icon: NOTIFICATION_ICON,
          badge: NOTIFICATION_ICON,
          tag: `call-${data.room}`,
          requireInteraction: true, // No se cierra automáticamente
          actions: [
            {
              action: 'accept',
              title: 'Aceptar',
              icon: NOTIFICATION_ICON
            },
            {
              action: 'reject',
              title: 'Rechazar',
              icon: NOTIFICATION_ICON
            }
          ],
          data: {
            type: 'call_invite',
            room: data.room,
            caller: data.caller,
            callerName: data.callerName,
            url: '/'
          }
        };
        
        event.waitUntil(
          self.registration.showNotification('Videollamada entrante', options)
        );
      }
    } catch (err) {
      console.error('[SW] Error procesando push:', err);
    }
  }
});

// Manejar clic en notificación
self.addEventListener('notificationclick', (event) => {
  console.log('[SW] Notification clicked:', event.notification.tag);
  
  event.notification.close();
  
  if (event.action === 'reject') {
    // Enviar señal de rechazo al servidor
    if (event.notification.data) {
      fetch('/api/chat/calls/signal', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'reject',
          room: event.notification.data.room,
          toNicknames: [event.notification.data.caller],
          nickname: 'Usuario'
        })
      }).catch(() => {});
    }
    return;
  }
  
  // Abrir app en ventana existente o crear una nueva
  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      // Buscar ventana abierta
      for (let i = 0; i < clientList.length; i++) {
        const client = clientList[i];
        if (client.url === '/' && 'focus' in client) {
          return client.focus();
        }
      }
      // Si no hay ventana abierta, crear una nueva
      if (clients.openWindow) {
        return clients.openWindow('/');
      }
    })
  );
});

// Manejar cierre de notificación (swipe away en Android)
self.addEventListener('notificationclose', (event) => {
  console.log('[SW] Notification dismissed:', event.notification.tag);
});

// Mantener el Service Worker activo
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});
