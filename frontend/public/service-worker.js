// Service Worker para manejar notificaciones de videollamada incluso cuando el celular está bloqueado

// Service Worker AXO v2 — Push notifications (mensajes, grupos, videollamadas)

const VIBRATE_MSG  = [200, 100, 200, 100, 200];
const VIBRATE_CALL = [500, 200, 500, 200, 500, 200, 500, 200, 500];
const ICON  = '/android-chrome-192x192.png';
const BADGE = '/android-chrome-192x192.png';

// ── Incoming push ─────────────────────────────────────────────────────────────
self.addEventListener('push', (event) => {
  if (!event.data) return;
  let data;
  try { data = event.data.json(); } catch { return; }

  event.waitUntil((async () => {
    switch (data.type) {
      case 'call_invite':   await showCallNotification(data); break;
      case 'message':       await showMessageNotification(data); break;
      case 'group_message': await showGroupMessageNotification(data); break;
      default: break;
    }
  })());
});

async function showCallNotification(data) {
  const prev = await self.registration.getNotifications({ tag: `call-${data.room}` });
  prev.forEach((n) => n.close());

  await self.registration.showNotification('Videollamada entrante', {
    body: `${data.callerName || data.caller || 'Alguien'} te esta llamando`,
    icon: ICON, badge: BADGE,
    tag: `call-${data.room}`,
    renotify: true, requireInteraction: true,
    vibrate: VIBRATE_CALL, silent: false,
    actions: [
      { action: 'accept', title: 'Aceptar' },
      { action: 'reject', title: 'Rechazar' },
    ],
    data: {
      type: 'call_invite',
      room: data.room,
      caller: data.caller || data.callerName,
      callerName: data.callerName || data.caller,
      url: '/',
    },
  });
}

async function showMessageNotification(data) {
  const prev = await self.registration.getNotifications({ tag: `msg-${data.fromNickname}` });
  prev.forEach((n) => n.close());

  const body = data.text
    ? (data.text.length > 120 ? data.text.slice(0, 117) + '...' : data.text)
    : 'Nuevo mensaje';

  await self.registration.showNotification(`${data.fromNickname || 'Mensaje nuevo'}`, {
    body,
    icon: data.senderPhoto || ICON, badge: BADGE,
    tag: `msg-${data.fromNickname}`,
    renotify: true, requireInteraction: false,
    vibrate: VIBRATE_MSG, silent: false,
    actions: [{ action: 'open', title: 'Abrir chat' }],
    data: {
      type: 'message',
      fromNickname: data.fromNickname,
      url: '/',
    },
  });
}

async function showGroupMessageNotification(data) {
  const prev = await self.registration.getNotifications({ tag: `group-${data.groupId}` });
  prev.forEach((n) => n.close());

  const body = data.text
    ? (data.text.length > 120 ? data.text.slice(0, 117) + '...' : data.text)
    : 'Nuevo mensaje en el grupo';

  await self.registration.showNotification(`${data.groupName || 'Grupo'}`, {
    body: `${data.fromNickname ? data.fromNickname + ': ' : ''}${body}`,
    icon: ICON, badge: BADGE,
    tag: `group-${data.groupId}`,
    renotify: true, requireInteraction: false,
    vibrate: VIBRATE_MSG, silent: false,
    actions: [{ action: 'open', title: 'Ver grupo' }],
    data: {
      type: 'group_message',
      groupId: data.groupId,
      groupName: data.groupName,
      url: '/',
    },
  });
}

// ── Notification click ─────────────────────────────────────────────────────────
self.addEventListener('notificationclick', (event) => {
  const { notification, action } = event;
  const data = notification.data || {};

  notification.close();

  if (action === 'reject') {
    // User explicitly rejected from notification UI
    return;
  }

  // 'accept', 'open', or direct tap — focus existing window or open new one
  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      for (const client of clientList) {
        if ('focus' in client) {
          client.focus();
          client.postMessage({ type: 'NOTIFICATION_CLICK', data });
          return;
        }
      }
      if (clients.openWindow) {
        return clients.openWindow(data.url || '/');
      }
    })
  );
});

// ── Notification dismissed ─────────────────────────────────────────────────────
self.addEventListener('notificationclose', () => {});

// ── Messages from app ──────────────────────────────────────────────────────────
self.addEventListener('message', (event) => {
  const msg = event.data || {};

  if (msg.type === 'DISMISS_MESSAGE_NOTIFICATIONS') {
    event.waitUntil(
      self.registration.getNotifications().then((notifs) => {
        notifs.forEach((n) => {
          if (n.tag && (n.tag.startsWith('msg-') || n.tag.startsWith('group-'))) n.close();
        });
      })
    );
    return;
  }

  if (msg.type === 'DISMISS_TAG' && msg.tag) {
    event.waitUntil(
      self.registration.getNotifications({ tag: msg.tag }).then((notifs) => {
        notifs.forEach((n) => n.close());
      })
    );
    return;
  }

  if (msg.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});
