import { useEffect, useState, useRef } from 'react';

export function useWebSockets() {
  const [lastMessage, setLastMessage] = useState(null);
  const ws = useRef(null);

  useEffect(() => {
    // Connect to WebSocket
    ws.current = new WebSocket('ws://127.0.0.1:8000/ws');

    ws.current.onopen = () => {
      console.log('WebSocket Connected');
    };

    ws.current.onmessage = (event) => {
      const data = JSON.parse(event.data);
      setLastMessage(data);
    };

    ws.current.onclose = () => {
      console.log('WebSocket Disconnected');
    };

    return () => {
      if (ws.current) {
        ws.current.close();
      }
    };
  }, []);

  return { lastMessage };
}
