// Open/closed logic for group order pages, kept separate so it can be tested.

export function storeStatus(store, now = new Date()) {
  const closes = new Date(store.closes);
  if (Number.isNaN(closes.getTime())) throw new Error(`Bad "closes" date: ${store.closes}`);
  const ms = closes - now;
  const isOpen = store.open !== false && ms > 0;
  return {
    isOpen,
    timeLeft: isOpen ? formatLeft(ms) : '',
    // Show campus time no matter where the viewer's device thinks it is.
    closesLabel: closes.toLocaleString('en-US', {
      weekday: 'short', month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit',
      timeZone: store.timeZone || 'America/New_York', timeZoneName: 'short',
    }),
  };
}

export function formatLeft(ms) {
  const hours = Math.floor(ms / 3_600_000);
  const days = Math.floor(hours / 24);
  if (days >= 2) return `${days} days`;
  if (hours >= 1) return `${hours} hour${hours === 1 ? '' : 's'}`;
  const minutes = Math.max(1, Math.ceil(ms / 60_000));
  return `${minutes} min`;
}
