const QRCode = require('qrcode');

class QRService {
  /**
   * Generates a Data URL (base64 PNG) for a doctor's check-in link
   * @param {string} clinicId
   * @param {string} doctorId
   * @param {string} baseUrl
   * @returns {Promise<string>} Data URL
   */
  async generateCheckInQRDataUrl(clinicId, doctorId, baseUrl = 'http://localhost:5173') {
    const checkInUrl = `${baseUrl}/checkin/${clinicId}/${doctorId}`;
    const qrDataUrl = await QRCode.toDataURL(checkInUrl, {
      errorCorrectionLevel: 'H',
      type: 'image/png',
      quality: 0.95,
      margin: 2,
      color: {
        dark: '#1e1b4b', // Deep indigo
        light: '#ffffff',
      },
      width: 320,
    });
    return { qrDataUrl, checkInUrl };
  }

  /**
   * Generates an SVG string for clean scalable printing
   */
  async generateCheckInQRSvg(clinicId, doctorId, baseUrl = 'http://localhost:5173') {
    const checkInUrl = `${baseUrl}/checkin/${clinicId}/${doctorId}`;
    const svgString = await QRCode.toString(checkInUrl, {
      type: 'svg',
      errorCorrectionLevel: 'H',
      margin: 2,
      color: {
        dark: '#1e1b4b',
        light: '#ffffff',
      },
    });
    return { svgString, checkInUrl };
  }
}

module.exports = new QRService();
