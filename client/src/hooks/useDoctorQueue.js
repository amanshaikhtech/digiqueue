import { useState, useEffect, useCallback } from 'react';
import { api } from '../services/api';
import { useSocket } from '../context/SocketContext';

export function useDoctorQueue(doctorId) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [actionLoading, setActionLoading] = useState(false);

  const { socket, joinDoctorRoom, leaveDoctorRoom } = useSocket();

  const fetchSession = useCallback(async () => {
    if (!doctorId) return;
    try {
      setLoading(true);
      setError(null);
      const res = await api.doctors.getCurrentSession(doctorId);
      if (res.success) {
        setData(res.data);
      }
    } catch (err) {
      setError(err.message || 'Failed to fetch doctor session queue.');
    } finally {
      setLoading(false);
    }
  }, [doctorId]);

  useEffect(() => {
    fetchSession();
  }, [fetchSession]);

  useEffect(() => {
    if (!doctorId) return;

    joinDoctorRoom(doctorId);

    function handleQueueChange() {
      // Re-fetch accurate database state smoothly
      api.doctors.getCurrentSession(doctorId).then((res) => {
        if (res.success) {
          setData(res.data);
        }
      }).catch((err) => console.error('Socket resync failed:', err));
    }

    function handleSessionReset(payload) {
      console.log('[Supervisor] Doctor queue received session-reset:', payload);
      api.doctors.getCurrentSession(doctorId).then((res) => {
        if (res.success) {
          setData(res.data);
        }
      }).catch((err) => console.error('Socket resync failed:', err));
    }

    socket.on('token-issued', handleQueueChange);
    socket.on('queue-updated', handleQueueChange);
    socket.on('token-called', handleQueueChange);
    socket.on('token-no-show', handleQueueChange);
    socket.on('token-status-changed', handleQueueChange);
    socket.on('session-reset', handleSessionReset);

    return () => {
      leaveDoctorRoom(doctorId);
      socket.off('token-issued', handleQueueChange);
      socket.off('queue-updated', handleQueueChange);
      socket.off('token-called', handleQueueChange);
      socket.off('token-no-show', handleQueueChange);
      socket.off('token-status-changed', handleQueueChange);
      socket.off('session-reset', handleSessionReset);
    };
  }, [doctorId, joinDoctorRoom, leaveDoctorRoom, socket]);

  const callNext = async () => {
    if (!doctorId) return;
    try {
      setActionLoading(true);
      const res = await api.doctors.callNext(doctorId);
      if (res.success && res.data) {
        // Trigger local update immediately
        await fetchSession();
        return res.data;
      }
    } catch (err) {
      throw err;
    } finally {
      setActionLoading(false);
    }
  };

  const completeCurrent = async () => {
    if (!doctorId) return;
    try {
      setActionLoading(true);
      const res = await api.doctors.completeCurrent(doctorId);
      if (res.success) {
        await fetchSession();
        return res.data;
      }
    } catch (err) {
      throw err;
    } finally {
      setActionLoading(false);
    }
  };

  const markNoShow = async (tokenId) => {
    try {
      setActionLoading(true);
      const res = await api.tokens.markNoShow(tokenId);
      if (res.success) {
        await fetchSession();
        return res.data;
      }
    } catch (err) {
      throw err;
    } finally {
      setActionLoading(false);
    }
  };

  const resetSession = async () => {
    if (!doctorId) return;
    try {
      setActionLoading(true);
      const res = await api.doctors.resetSession(doctorId);
      if (res.success) {
        await fetchSession();
        return res.data;
      }
    } catch (err) {
      throw err;
    } finally {
      setActionLoading(false);
    }
  };

  return {
    data,
    loading,
    error,
    actionLoading,
    refresh: fetchSession,
    callNext,
    completeCurrent,
    markNoShow,
    resetSession,
  };
}
