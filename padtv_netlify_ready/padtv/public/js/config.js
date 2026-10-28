/*
 * PadTV deployment configuration.
 * After deploying the Node server to Render, replace the empty value below with:
 *   wss://YOUR-SERVICE.onrender.com
 * Keep it empty for local development (same-origin WebSocket).
 */
window.PADTV_CONFIG = window.PADTV_CONFIG || {
  websocketUrl: 'wss://pad-tv-1.onrender.com',
  siteUrl: ''
};
