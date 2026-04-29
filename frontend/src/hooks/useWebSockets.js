import { useEffect, useState, useRef } from 'react';

export function useWebSockets() {
  const [lastMessage, setLastMessage] = useState(null);
  const ws = useRef(null);

  useEffect(() => {
    let reconnectTimeout = null;
    let isMounted = true;

    const WS_URL = import.meta.env.VITE_WS_URL || import.meta.env.VITE_API_URL.replace('https://', 'wss://').replace('http://', 'ws://');

    const connect = () => {
      ws.current = new WebSocket(WS_URL);

      ws.current.onopen = () => {
        console.log('✅ WebSocket Connected');
      };

      ws.current.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          setLastMessage(data);
        } catch (err) {
          console.error("Invalid WS message:", err);
        }
      };

      ws.current.onclose = () => {
        console.log('⚠️ WebSocket Disconnected');
        // Auto-reconnect if not intentionally unmounted
        if (isMounted) {
          reconnectTimeout = setTimeout(connect, 3000);
        }
      };

      ws.current.onerror = (err) => {
        console.error('❌ WebSocket Error:', err);
        ws.current.close(); // Triggers onclose and subsequent reconnect
      };
    };

    connect();

    return () => {
      isMounted = false;
      if (reconnectTimeout) clearTimeout(reconnectTimeout);
      if (ws.current) {
        ws.current.close();
      }
    };
  }, []);

  return { lastMessage };
}