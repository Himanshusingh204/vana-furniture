const { WebSocketServer } = require('ws');

class WebSocketHub {
  constructor() {
    this.wss = null;
    this.activeVisitors = new Set();
    this.heartbeatTimer = null;
  }

  init(server) {
    this.wss = new WebSocketServer({ server });

    // Heartbeat: 30s server PING, terminate dead clients.
    // `ws.isAlive` is set true on connect + protocol pong + app PONG.
    if (this.heartbeatTimer) clearInterval(this.heartbeatTimer);
    this.heartbeatTimer = setInterval(() => {
      if (!this.wss) return;
      this.wss.clients.forEach((ws) => {
        if (ws.isAlive === false) {
          try { ws.terminate(); } catch (e) {}
          return;
        }
        ws.isAlive = false;
        try { ws.ping(); } catch (e) {}
        this.sendTo(ws, { type: 'PING', timestamp: Date.now() });
      });
    }, 30000);
    if (this.heartbeatTimer.unref) this.heartbeatTimer.unref();

    this.wss.on('connection', (ws, req) => {
      const clientIp = req.socket.remoteAddress || 'unknown';
      const clientId = `${clientIp}-${Date.now()}`;
      ws.isAlive = true;
      this.activeVisitors.add(clientId);

      // Send initial welcome & live stats
      this.sendTo(ws, {
        type: 'CONNECTED',
        message: 'Connected to VANA Architectural Woodcraft real-time stream',
        active_visitors: this.activeVisitors.size
      });

      this.broadcast({
        type: 'LIVE_STATS',
        active_visitors: this.activeVisitors.size,
        timestamp: new Date().toISOString()
      });

      ws.on('pong', () => { ws.isAlive = true; });

      ws.on('message', (message) => {
        try {
          const data = JSON.parse(message);
          if (data.type === 'PING') {
            ws.isAlive = true;
            this.sendTo(ws, { type: 'PONG', timestamp: Date.now() });
          } else if (data.type === 'PONG') {
            ws.isAlive = true;
          }
        } catch (e) {
          // ignore malformed socket frames
        }
      });

      ws.on('close', () => {
        this.activeVisitors.delete(clientId);
        this.broadcast({
          type: 'LIVE_STATS',
          active_visitors: this.activeVisitors.size,
          timestamp: new Date().toISOString()
        });
      });

      ws.on('error', () => {
        this.activeVisitors.delete(clientId);
      });
    });

    console.log('[WebSocketHub] Initialized real-time gateway');
  }

  sendTo(ws, payload) {
    if (ws && ws.readyState === 1) { // OPEN
      ws.send(JSON.stringify(payload));
    }
  }

  broadcast(payload) {
    if (!this.wss) return;
    const str = JSON.stringify(payload);
    this.wss.clients.forEach((client) => {
      if (client.readyState === 1) { // OPEN
        client.send(str);
      }
    });
  }

  getActiveVisitorCount() {
    return this.activeVisitors.size;
  }
}

module.exports = new WebSocketHub();
