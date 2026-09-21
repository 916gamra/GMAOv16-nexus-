export const sanitizeString = (str) => {
  if (typeof str !== 'string') return str;
  // Basic XSS prevention by escaping HTML chars
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;')
    .replace(/\//g, '&#x2F;');
};

export const sanitizeObject = (obj) => {
  if (Array.isArray(obj)) {
    return obj.map(sanitizeObject);
  } else if (obj !== null && typeof obj === 'object') {
    const sanitized = {};
    for (const key in obj) {
      if (Object.prototype.hasOwnProperty.call(obj, key)) {
        sanitized[sanitizeString(key)] = sanitizeObject(obj[key]);
      }
    }
    return sanitized;
  }
  return typeof obj === 'string' ? sanitizeString(obj) : obj;
};
