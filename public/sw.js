self.addEventListener('push', (event) => {
  if (!event.data) return;

  try {
    const data = event.data.json();
    const options = {
      body: data.body || data.message || 'New admin notification',
      icon: '/assets/logo.png',
      badge: '/assets/logo.png',
      data: {
        url: data.url || data.link || '/orders',
      },
      vibrate: [200, 100, 200],
    };

    event.waitUntil(
      self.registration.showNotification(data.title || 'Sculpt & Shine Admin', options)
    );
  } catch (error) {
    console.error('Push event error:', error);
  }
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();

  const targetUrl = event.notification.data?.url || '/orders';

  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      for (const client of clientList) {
        if (client.url.includes(self.location.origin) && 'focus' in client) {
          client.navigate(targetUrl);
          return client.focus();
        }
      }
      if (clients.openWindow) {
        return clients.openWindow(targetUrl);
      }
    })
  );
});
