import { useState, useCallback, useRef, useEffect } from 'react';
import { io } from 'socket.io-client';

export function useSocket(startDelay = 1000) {
  const [logs, setLogs] = useState([]);
  const [isComplete, setIsComplete] = useState(false);
  const [isStarted, setIsStarted] = useState(false);
  const [credentials, setCredentials] = useState(null);
  const socketRef = useRef(null);

  useEffect(() => {
    socketRef.current = io('http://localhost:3000');
    
    socketRef.current.on('terraform_log', (data) => {
        setLogs(prev => [...prev, data.log]);
    });

    socketRef.current.on('terraform_complete', (data) => {
        setIsComplete(true);
        if (data.credentials) {
            setCredentials(data.credentials);
        }
    });

    return () => {
        if (socketRef.current) socketRef.current.disconnect();
    }
  }, []);

  const startStream = useCallback(async (engine = 'aurora-postgresql', capacity = 'db.r6g.large', environment = 'production-eu-west-1') => {
    setIsStarted(true);
    setLogs([]);
    setIsComplete(false);

    try {
        const res = await fetch('http://localhost:3000/api/provision', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ engine, capacity, environment })
        });

        const data = await res.json();
        
        if (data.error) {
            setLogs([{ time: new Date().toLocaleTimeString('en-US'), message: `Error: ${data.error}`, type: 'error' }]);
            setIsStarted(false);
            return;
        }
        
        if (socketRef.current) {
            socketRef.current.emit('start_provisioning', { 
                provisionId: data.provisionId, 
                action: 'apply', 
                params: { engine, capacity, environment, region: 'eu-north-1' } 
            });
        }
    } catch(err) {
        console.error("Provisioning failed", err);
        setLogs([{ time: new Date().toLocaleTimeString('en-US'), message: "Error contacting provisioning orchestrator", type: "error" }]);
        setIsStarted(false);
    }
  }, []);

  return { logs, isComplete, isStarted, credentials, startStream };
}
