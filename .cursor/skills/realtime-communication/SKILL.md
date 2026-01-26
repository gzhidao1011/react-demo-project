---
name: realtime-communication
description: Implement real-time communication including WebSocket connections, Socket.IO integration, and real-time updates. Use when implementing real-time features or live data updates.
---

# Real-Time Communication

Implement real-time communication using WebSocket or Socket.IO.

## Quick Checklist

When implementing real-time features:

- [ ] **WebSocket connection** established
- [ ] **Connection management** implemented
- [ ] **Event handlers** configured
- [ ] **Reconnection logic** added
- [ ] **Error handling** implemented
- [ ] **Connection status** displayed

## WebSocket Hook

### 1. useWebSocket Hook

```tsx
// packages/hooks/src/useWebSocket.ts
import { useEffect, useRef, useState, useCallback } from "react";

interface UseWebSocketOptions {
  url: string;
  protocols?: string | string[];
  onOpen?: (event: Event) => void;
  onMessage?: (event: MessageEvent) => void;
  onError?: (event: Event) => void;
  onClose?: (event: CloseEvent) => void;
  reconnect?: boolean;
  reconnectInterval?: number;
  reconnectAttempts?: number;
}

export function useWebSocket(options: UseWebSocketOptions) {
  const {
    url,
    protocols,
    onOpen,
    onMessage,
    onError,
    onClose,
    reconnect = true,
    reconnectInterval = 3000,
    reconnectAttempts = 5,
  } = options;

  const [socket, setSocket] = useState<WebSocket | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [reconnectCount, setReconnectCount] = useState(0);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout>();

  const connect = useCallback(() => {
    try {
      const ws = new WebSocket(url, protocols);
      
      ws.onopen = (event) => {
        setIsConnected(true);
        setReconnectCount(0);
        onOpen?.(event);
      };

      ws.onmessage = (event) => {
        onMessage?.(event);
      };

      ws.onerror = (event) => {
        onError?.(event);
      };

      ws.onclose = (event) => {
        setIsConnected(false);
        onClose?.(event);

        // Reconnect logic
        if (reconnect && reconnectCount < reconnectAttempts) {
          reconnectTimeoutRef.current = setTimeout(() => {
            setReconnectCount((prev) => prev + 1);
            connect();
          }, reconnectInterval);
        }
      };

      setSocket(ws);
    } catch (error) {
      console.error("WebSocket connection failed:", error);
    }
  }, [url, protocols, onOpen, onMessage, onError, onClose, reconnect, reconnectInterval, reconnectAttempts, reconnectCount]);

  useEffect(() => {
    connect();

    return () => {
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
      }
      socket?.close();
    };
  }, []);

  const sendMessage = useCallback(
    (message: string | object) => {
      if (socket && isConnected) {
        const data = typeof message === "string" ? message : JSON.stringify(message);
        socket.send(data);
      }
    },
    [socket, isConnected]
  );

  const disconnect = useCallback(() => {
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
    }
    socket?.close();
  }, [socket]);

  return {
    socket,
    isConnected,
    sendMessage,
    disconnect,
    reconnectCount,
  };
}
```

### 2. Usage Example

```tsx
// apps/web/app/components/Chat.tsx
import { useWebSocket } from "@repo/hooks";
import { useState } from "react";

export function Chat() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");

  const { isConnected, sendMessage } = useWebSocket({
    url: "ws://localhost:8080/chat",
    onMessage: (event) => {
      const message = JSON.parse(event.data);
      setMessages((prev) => [...prev, message]);
    },
    onError: () => {
      console.error("WebSocket error");
    },
  });

  const handleSend = () => {
    if (input.trim()) {
      sendMessage({ type: "message", content: input });
      setInput("");
    }
  };

  return (
    <div>
      <div className="connection-status">
        {isConnected ? "已连接" : "未连接"}
      </div>
      
      <div className="messages">
        {messages.map((msg, index) => (
          <div key={index}>{msg.content}</div>
        ))}
      </div>
      
      <input
        value={input}
        onChange={(e) => setInput(e.target.value)}
        onKeyPress={(e) => e.key === "Enter" && handleSend()}
      />
      <button onClick={handleSend} disabled={!isConnected}>
        发送
      </button>
    </div>
  );
}
```

## Socket.IO Integration

### 1. Install Socket.IO Client

```bash
pnpm add socket.io-client
```

### 2. Socket.IO Hook

```tsx
// packages/hooks/src/useSocketIO.ts
import { useEffect, useState, useCallback } from "react";
import { io, Socket } from "socket.io-client";

interface UseSocketIOOptions {
  url: string;
  options?: Parameters<typeof io>[1];
  onConnect?: () => void;
  onDisconnect?: () => void;
  onError?: (error: Error) => void;
}

export function useSocketIO(options: UseSocketIOOptions) {
  const { url, options: socketOptions, onConnect, onDisconnect, onError } = options;
  const [socket, setSocket] = useState<Socket | null>(null);
  const [isConnected, setIsConnected] = useState(false);

  useEffect(() => {
    const socketInstance = io(url, socketOptions);

    socketInstance.on("connect", () => {
      setIsConnected(true);
      onConnect?.();
    });

    socketInstance.on("disconnect", () => {
      setIsConnected(false);
      onDisconnect?.();
    });

    socketInstance.on("error", (error) => {
      onError?.(error);
    });

    setSocket(socketInstance);

    return () => {
      socketInstance.close();
    };
  }, [url]);

  const emit = useCallback(
    (event: string, data?: unknown) => {
      socket?.emit(event, data);
    },
    [socket]
  );

  const on = useCallback(
    (event: string, callback: (data: unknown) => void) => {
      socket?.on(event, callback);
    },
    [socket]
  );

  const off = useCallback(
    (event: string, callback?: (data: unknown) => void) => {
      socket?.off(event, callback);
    },
    [socket]
  );

  return {
    socket,
    isConnected,
    emit,
    on,
    off,
  };
}
```

### 3. Usage

```tsx
import { useSocketIO } from "@repo/hooks";

export function NotificationCenter() {
  const { isConnected, emit, on, off } = useSocketIO({
    url: "http://localhost:8080",
    onConnect: () => {
      console.log("Connected to server");
    },
  });

  useEffect(() => {
    const handleNotification = (data: unknown) => {
      console.log("New notification:", data);
    };

    on("notification", handleNotification);

    return () => {
      off("notification", handleNotification);
    };
  }, [on, off]);

  return <div>Status: {isConnected ? "Connected" : "Disconnected"}</div>;
}
```

## Best Practices

### ✅ Good Practices

- Handle connection errors
- Implement reconnection logic
- Clean up event listeners
- Show connection status
- Handle message parsing errors
- Use TypeScript for type safety
- Implement heartbeat/ping-pong

### ❌ Anti-Patterns

- Don't ignore connection errors
- Don't forget to clean up
- Don't skip reconnection logic
- Don't send messages when disconnected
- Don't parse messages without validation

## Related Rules

- Error Handling: `.cursor/skills/error-handling/SKILL.md`
- Performance Optimization: `.cursor/skills/performance-optimization/SKILL.md`
