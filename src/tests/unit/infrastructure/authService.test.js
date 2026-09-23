import { describe, it, expect } from 'vitest';
import { vaultService } from '@/utils/vaultService.js';
import * as bcrypt from 'bcryptjs';

describe('Auth & Vault Infrastructure Unit Tests', () => {
  it('يجب تشفير وفك تشفير البيانات عبر VaultService بنجاح', () => {
    const rawData = { user: 'technicien_1', role: 'TECHNICIAN' };
    const password = 'SecretPassword123!';

    const encrypted = vaultService.encrypt(JSON.stringify(rawData), password);
    expect(encrypted).toBeDefined();
    expect(typeof encrypted).toBe('string');
    expect(encrypted).not.toEqual(JSON.stringify(rawData));

    const decrypted = vaultService.decrypt(encrypted, password);
    const parsed = JSON.parse(decrypted);
    expect(parsed.user).toBe('technicien_1');
    expect(parsed.role).toBe('TECHNICIAN');
  });

  it('يجب رفض وتشفير كلمات المرور باستخدام bcrypt', async () => {
    const pin = '123456';
    const hash = await bcrypt.hash(pin, 6);
    
    expect(hash).toBeDefined();
    const isValid = await bcrypt.compare(pin, hash);
    const isInvalid = await bcrypt.compare('000000', hash);

    expect(isValid).toBe(true);
    expect(isInvalid).toBe(false);
  });
});
