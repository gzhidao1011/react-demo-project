---
name: websocket-management
description: Manage WebSocket connections including connection pooling, reconnection strategies, and message queuing. Use when managing WebSocket infrastructure.
---

# WebSocket Management

Manage WebSocket connections effectively.

## Quick Checklist

When managing WebSockets:

- [ ] **Connection pooling** implemented
- [ ] **Reconnection** strategy defined
- [ ] **Message queuing** configured
- [ ] **Heartbeat** implemented
- [ ] **Error handling** added

## Connection Management

### 1. WebSocket Pool

```typescript
class WebSocketPool {
  private connections = new Map<string, WebSocket>();
  private maxConnections = 10;

  getConnection(url: string): WebSocket {
    if (this.connections.has(url)) {
      return this.connections.get(url)!;
    }

    if (this.connections.size >= this.maxConnections) {
      // Close oldest connection
      const oldest = this.connections.keys().next().value;
      this.connections.get(oldest)?.close();
      this.connections.delete(oldest);
    }

    const ws = new WebSocket(url);
    this.connections.set(url, ws);
    return ws;
  }
}
```

## Best Practices

### ✅ Good Practices

- Implement connection pooling
- Handle reconnections
- Queue messages
- Use heartbeats
- Monitor connections

### ❌ Anti-Patterns

- Don't create too many connections
- Don't skip reconnection logic
- Don't ignore errors

## Related Rules

- Real-time Communication: `.cursor/skills/realtime-communication/SKILL.md`
