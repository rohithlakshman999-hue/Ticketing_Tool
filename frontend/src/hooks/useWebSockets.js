import { useEffect, useState, useRef } from 'react';

export function useWebSockets() {
  const [lastMessage, setLastMessage] = useState(null);
  const ws = useRef(null);

  useEffect(() => {
    // ✅ Use dedicated WS env variable - works for both local (ws://) and production (wss://)
    const WS_URL = import.meta.env.VITE_WS_URL || import.meta.env.VITE_API_URL.replace('https://', 'wss://').replace('http://', 'ws://');

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
    };

    ws.current.onerror = (err) => {
      console.error('❌ WebSocket Error:', err);
    };

    return () => {
      if (ws.current) {
        ws.current.close();
      }
    };
  }, []);

  return { lastMessage };
}