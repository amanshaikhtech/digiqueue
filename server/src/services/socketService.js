const { getIO } = require('../config/socket');

class SocketService {
  /**
   * Broadcasts an event strictly to a doctor's dedicated room
   * @param {string} doctorId - Doctor UUID
   * @param {string} event - Event name
   * @param {object} payload - Data payload
   */
  emitToDoctorRoom(doctorId, event, payload) {
    try {
      const io = getIO();
      const roomName = `doctor:${doctorId}`;
      io.to(roomName).emit(event, payload);
      console.log(`[SocketService] Emitted '${event}' to ${roomName}`);
    } catch (err) {
      console.error(`[SocketService] Error emitting event '${event}':`, err.message);
    }
  }

  notifyTokenIssued(doctorId, payload) {
    this.emitToDoctorRoom(doctorId, 'token-issued', payload);
  }

  notifyQueueUpdated(doctorId, payload) {
    this.emitToDoctorRoom(doctorId, 'queue-updated', payload);
  }

  notifyTokenStatusChanged(doctorId, payload) {
    this.emitToDoctorRoom(doctorId, 'token-status-changed', payload);
  }

  notifySessionReset(doctorId, payload) {
    this.emitToDoctorRoom(doctorId, 'session-reset', payload);
  }
}

module.exports = new SocketService();
