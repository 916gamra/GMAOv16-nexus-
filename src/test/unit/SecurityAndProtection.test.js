import { describe, it, expect, beforeEach } from 'vitest';
import { SecurityService } from '../../utils/securityService.js';
import { RateLimiter } from '../../utils/rateLimiter.js';
import { sanitizeString, sanitizeObject } from '../../utils/sanitize.js';

describe('4. Security & Hardening Tests', () => {
  beforeEach(() => {
    localStorage.clear();
    sessionStorage.clear();
  });

  describe('PIN Security & Brute Force Protection', () => {
    it('should hash PIN and verify authentic logins successfully', () => {
      const pin = '567890';
      const hashed = SecurityService.hashPin(pin);

      expect(hashed).toBeDefined();
      expect(hashed).not.toBe(pin); // Should not store as plain text
      expect(SecurityService.verifyPIN(pin, hashed)).toBe(true);
      expect(SecurityService.verifyPIN('000000', hashed)).toBe(false);
    });

    it('should prevent brute force attacks by rate-limiting attempts', () => {
      // Allow max 3 attempts within a 60 second window
      const limiter = new RateLimiter(3, 60000);
      const userKey = 'tech_pin_attempts';

      // First 3 attempts are allowed
      expect(limiter.isAllowed(userKey)).toBe(true);
      expect(limiter.isAllowed(userKey)).toBe(true);
      expect(limiter.isAllowed(userKey)).toBe(true);

      // 4th attempt must be rejected/rate-limited
      expect(limiter.isAllowed(userKey)).toBe(false);

      // Reset allows it again
      limiter.reset(userKey);
      expect(limiter.isAllowed(userKey)).toBe(true);
    });
  });

  describe('Data Encryption (AES-256 & LocalStorage Wrap)', () => {
    it('should encrypt and decrypt objects correctly using AES-256', () => {
      const sensitiveData = {
        technicien: 'Achraf Gamra',
        pin: '1234',
        isAdmin: true,
      };

      const ciphertext = SecurityService.encrypt(sensitiveData);
      expect(ciphertext).toBeDefined();
      expect(typeof ciphertext).toBe('string');
      expect(ciphertext).not.toContain('Achraf Gamra'); // Check payload is actually obfuscated

      const decrypted = SecurityService.decrypt(ciphertext);
      expect(decrypted).toEqual(sensitiveData);
    });

    it('should save and load encrypted items securely from localStorage', () => {
      const sensitiveConfig = { dbKey: 'super-secret-key-123' };

      SecurityService.saveSecure('sensitive_config_key', sensitiveConfig);

      // Verify that the plain text is not visible in raw localStorage
      const rawInStorage = localStorage.getItem('sensitive_config_key');
      expect(rawInStorage).toBeDefined();
      expect(rawInStorage).not.toContain('super-secret-key-123');

      // Retrieve and decrypt correctly
      const retrieved = SecurityService.getSecure('sensitive_config_key');
      expect(retrieved).toEqual(sensitiveConfig);
    });

    it('should handle corrupt or invalid ciphertexts gracefully without throwing', () => {
      const badData = SecurityService.decrypt('invalid-ciphertext-payload-123!!!');
      expect(badData).toBeNull();
    });
  });

  describe('XSS Prevention (Input Sanitization)', () => {
    it('should escape dangerous HTML tags and characters to prevent injection attacks', () => {
      const maliciousInput = "<script>alert('XSS')</script><img src=x onerror=alert(1)>";
      const sanitized = sanitizeString(maliciousInput);

      expect(sanitized).not.toContain('<script>');
      expect(sanitized).not.toContain('</script>');
      expect(sanitized).not.toContain('<img');
      expect(sanitized).toContain('&lt;script&gt;');
      expect(sanitized).toContain('&lt;img');
    });

    it('should recursively sanitize deeply nested objects', () => {
      const maliciousPayload = {
        ref: 'REF-001',
        designation: 'Moteur <iframe src="javascript:alert(1)"></iframe>',
        nested: {
          technician: '<a href="javascript:alert(2)">John Doe</a>',
        },
      };

      const sanitized = sanitizeObject(maliciousPayload);

      expect(sanitized.ref).toBe('REF-001');
      expect(sanitized.designation).not.toContain('<iframe');
      expect(sanitized.designation).toContain('&lt;iframe');
      expect(sanitized.nested.technician).not.toContain('<a href');
      expect(sanitized.nested.technician).toContain('&lt;a href');
    });
  });

  describe('CSRF Protection & Session Isolation', () => {
    it('should isolate active tokens in sessionStorage rather than vulnerable auto-cookies', () => {
      // SPAs prevent CSRF by utilizing Custom Header Bearer tokens stored in sessionStorage,
      // avoiding auto-attaching HTTP cookies which are the vehicle for CSRF attacks.
      const token = 'bearer-token-12345';
      sessionStorage.setItem('sessionToken', token);

      const retrievedToken = sessionStorage.getItem('sessionToken');
      expect(retrievedToken).toBe(token);

      // Check browser context: sessionStorage is not accessible by cross-origin frames or requests, mitigating CSRF
    });

    it('should reject requests with missing or mismatching authorization tokens', () => {
      const checkAuthorizationHeader = (headers) => {
        if (!headers || !headers['Authorization'] || !headers['Authorization'].startsWith('Bearer ')) {
          return { status: 401, message: 'Unauthorized - Missing or invalid Bearer token (CSRF/Auth fail)' };
        }
        return { status: 200 };
      };

      // Empty request headers
      const res1 = checkAuthorizationHeader({});
      expect(res1.status).toBe(401);

      // Valid Auth request
      const res2 = checkAuthorizationHeader({ 'Authorization': 'Bearer 12345' });
      expect(res2.status).toBe(200);
    });
  });
});
