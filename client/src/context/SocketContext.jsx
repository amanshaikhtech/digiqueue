import React, { createContext, useContext, useEffect, useState } from 'react';
import { socket } from '../services/socket';

const SocketContext = createContext(null);

export function SocketProvider({ children }) {
  const [isConnected, setIsConnected] = useState(socket.connected);
  const [connectionStatus, setConnectionStatus] = useState(socket.connected ? 'connected' : 'connecting');
  const [currentDoctorRoom, setCurrentDoctorRoom] = useState(null);

  useEffect(() => {
    function onConnect() {
      setIsConnected(true);
      setConnectionStatus('connected');
      // Re-join active room on reconnection if needed
      if (currentDoctorRoom) {
        socket.emit('join-doctor', currentDoctorRoom);
      }
    }

    function onDisconnect() {
      setIsConnected(false);
      setConnectionStatus('connecting');
    }

    function onReconnectAttempt() {
      setConnectionStatus('connecting');
    }

    socket.on('connect', onConnect);
    socket.on('disconnect', onDisconnect);
    socket.on('reconnect_attempt', onReconnectAttempt);

    return () => {
      socket.off('connect', onConnect);
      socket.off('disconnect', onDisconnect);
      socket.off('reconnect_attempt', onReconnectAttempt);
    };
  }, [currentDoctorRoom]);

  const joinDoctorRoom = (doctorId) => {
    if (doctorId) {
      if (currentDoctorRoom && currentDoctorRoom !== doctorId) {
        socket.emit('leave-doctor', currentDoctorRoom);
      }
      socket.emit('join-doctor', doctorId);
      setCurrentDoctorRoom(doctorId);
    }
  };

  const leaveDoctorRoom = (doctorId) => {
    if (doctorId) {
      socket.emit('leave-doctor', doctorId);
      if (currentDoctorRoom === doctorId) {
        setCurrentDoctorRoom(null);
      }
    }
  };

  return (
    <SocketContext.Provider
      value={{
        socket,
        isConnected,
        connectionStatus,
        joinDoctorRoom,
        leaveDoctorRoom,
        currentDoctorRoom,
      }}
    >
      {children}
    </SocketContext.Provider>
  );
}

export function useSocket() {
  const context = useContext(SocketContext);
  if (!context) {
    throw new Error('useSocket must be used within a SocketProvider');
  }
  return context;
}
