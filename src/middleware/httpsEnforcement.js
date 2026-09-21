/**
 * HTTPS Enforcement middleware/helper
 */
export function enforceHTTPS() {
  if (window.location.protocol === 'http:' && window.location.hostname !== 'localhost' && window.location.hostname !== '127.0.0.1') {
    window.location.protocol = 'https:';
  }
}
