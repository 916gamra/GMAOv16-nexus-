import { describe, it, expect, vi } from 'vitest';
import { AppError } from '../../core/errors/AppError';
import { retry } from '../../utils/retry';

describe('Phase 1: AppError & Retry Utility', () => {
  describe('AppError', () => {
    it('should create an AppError with code, message, and serialized structure', () => {
      const err = new AppError('Stock item missing', 'NOT_FOUND', { ref: 'ROUL-6204' });
      expect(err.name).toBe('AppError');
      expect(err.code).toBe('NOT_FOUND');
      expect(err.message).toBe('Stock item missing');
      expect(err.details).toEqual({ ref: 'ROUL-6204' });

      const json = err.toJSON();
      expect(json.code).toBe('NOT_FOUND');
      expect(json.statusCode).toBe(400);
      expect(json.timestamp).toBeDefined();
    });
  });

  describe('retry utility', () => {
    it('should resolve immediately if operation succeeds', async () => {
      const fn = vi.fn().mockResolvedValue('success');
      const result = await retry(fn, { retries: 3, delay: 10 });
      expect(result).toBe('success');
      expect(fn).toHaveBeenCalledTimes(1);
    });

    it('should retry on failure and resolve if subsequent attempt succeeds', async () => {
      let attempts = 0;
      const fn = vi.fn().mockImplementation(async () => {
        attempts++;
        if (attempts < 2) {
          throw new Error('Temporary failure');
        }
        return 'recovered';
      });

      const result = await retry(fn, { retries: 3, delay: 10, backoff: 1 });
      expect(result).toBe('recovered');
      expect(fn).toHaveBeenCalledTimes(2);
    });

    it('should throw last error if max retries exceeded', async () => {
      const fn = vi.fn().mockRejectedValue(new Error('Persistent error'));
      await expect(retry(fn, { retries: 2, delay: 10, backoff: 1 })).rejects.toThrow('Persistent error');
      expect(fn).toHaveBeenCalledTimes(2);
    });
  });
});
