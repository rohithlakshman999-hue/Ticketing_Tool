import { useEffect, useState, useRef } from 'react';

export function useWebSockets() {
  const [lastMessage, setLastMessage] = useState(null);
  const ws = useRef(null);
  const retryCount = useRef(0);

  useEffect(() => {
    let reconnectTimeout = null;
    let isMounted = true;

    // ------------------- CONSTRUCT WS URL -------------------
    
    const getWsUrl = () => {
        let url = import.meta.env.VITE_WS_URL;
        
        if (!url) {
            const apiUrl = import.meta.env.VITE_API_URL || '';
            // Handle relative URLs (like /api)
            if (apiUrl.startsWith('/')) {
                const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
                url = `${protocol}//${window.location.host}${apiUrl}`;
            } else {
                url = apiUrl.replace('https://', 'wss://').replace('http://', 'ws://');
            }
        }

        // Ensure it ends with /ws
        if (url && !url.endsWith('/ws')) {
            url = url.replace(/\/$/, '') + '/ws';
        }
        
        return url;
    };

    const WS_URL = getWsUrl();

    // ------------------- CONNECT -------------------

    const connect = () => {
      if (!WS_URL) return;
      
      try {
          ws.current = new WebSocket(WS_URL);

          ws.current.onopen = () => {
            console.log('✅ WebSocket Connected');
            retryCount.current = 0; // Reset on success
          };

          ws.current.onmessage = (event) => {
            try {
              const data = JSON.parse(event.data);
              setLastMessage(data);
            } catch (err) {
              // Silent failure for malformed messages
            }
          };

          ws.current.onclose = () => {
            if (isMounted) {
              // Exponential backoff: 3s, 6s, 12s, max 30s
              const delay = Math.min(3000 * Math.pow(2, retryCount.current), 30000);
              console.log(`⚠️ WebSocket Disconnected. Retrying in ${delay/1000}s...`);
              reconnectTimeout = setTimeout(connect, delay);
              retryCount.current++;
            }
          };

          ws.current.onerror = (err) => {
            // Only log the first few errors to avoid console spam
            if (retryCount.current < 3) {
                console.error('❌ WebSocket Error');
            }
            if (ws.current) ws.current.close();
          };
      } catch (err) {
          console.error("Failed to establish WS connection:", err);
      }
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