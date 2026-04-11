export function getHealthController(_req, res) {
  res.json({ ok: true, timestamp: new Date().toISOString() });
}
