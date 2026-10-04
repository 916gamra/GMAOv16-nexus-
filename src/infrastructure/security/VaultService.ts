import crypto from 'crypto';
import bcrypt from 'bcryptjs';

/**
 * Vault Service
 * ✅ تشفير وحماية البيانات
 */
export class VaultService {
  private static readonly PBKDF2_ITERATIONS = 100000;
  private static readonly ALGORITHM = 'aes-256-gcm';
  private static readonly SALT_LENGTH = 16;
  private static readonly TAG_LENGTH = 16;
  private static readonly IV_LENGTH = 12;

  /**
   * توليد Salt آمن
   */
  static generateSalt(): Buffer {
    return crypto.randomBytes(this.SALT_LENGTH);
  }

  /**
   * اشتقاق مفتاح من كلمة المرور
   */
  static deriveKey(password: string, salt: Buffer): Buffer {
    return crypto.pbkdf2Sync(
      password,
      salt,
      this.PBKDF2_ITERATIONS,
      32, // 256 bits
      'sha256'
    );
  }

  /**
   * تشفير البيانات
   */
  static encrypt(data: any, password: string): string {
    try {
      // توليد salt و IV
      const salt = this.generateSalt();
      const iv = crypto.randomBytes(this.IV_LENGTH);

      // اشتقاق المفتاح
      const key = this.deriveKey(password, salt);

      // إنشاء cipher
      const cipher = crypto.createCipheriv(this.ALGORITHM, key, iv);

      // تشفير البيانات
      let encrypted = cipher.update(JSON.stringify(data), 'utf8', 'hex');
      encrypted += cipher.final('hex');

      // الحصول على authentication tag
      const tag = cipher.getAuthTag();

      // دمج النتائج
      const result = Buffer.concat([salt, iv, tag, Buffer.from(encrypted, 'hex')]);

      return result.toString('base64');
    } catch (error) {
      console.error('Encryption failed:', error);
      throw new Error('Failed to encrypt data');
    }
  }

  /**
   * فك تشفير البيانات
   */
  static decrypt(encryptedData: string, password: string): any {
    try {
      // تحويل من base64
      const buffer = Buffer.from(encryptedData, 'base64');

      // استخراج المكونات
      const salt = buffer.slice(0, this.SALT_LENGTH);
      const iv = buffer.slice(this.SALT_LENGTH, this.SALT_LENGTH + this.IV_LENGTH);
      const tag = buffer.slice(
        this.SALT_LENGTH + this.IV_LENGTH,
        this.SALT_LENGTH + this.IV_LENGTH + this.TAG_LENGTH
      );
      const encrypted = buffer.slice(this.SALT_LENGTH + this.IV_LENGTH + this.TAG_LENGTH);

      // اشتقاق المفتاح
      const key = this.deriveKey(password, salt);

      // إنشاء decipher
      const decipher = crypto.createDecipheriv(this.ALGORITHM, key, iv);
      decipher.setAuthTag(tag);

      // فك التشفير
      let decrypted = decipher.update(encrypted, 'hex', 'utf8');
      decrypted += decipher.final('utf8');

      return JSON.parse(decrypted);
    } catch (error) {
      console.error('Decryption failed:', error);
      throw new Error('Failed to decrypt data');
    }
  }

  /**
   * تجزئة PIN
   */
  static async hashPIN(pin: string): Promise<string> {
    try {
      const salt = await bcrypt.genSalt(10);
      return await bcrypt.hash(pin, salt);
    } catch (error) {
      console.error('PIN hashing failed:', error);
      throw new Error('Failed to hash PIN');
    }
  }

  /**
   * التحقق من PIN
   */
  static async verifyPIN(pin: string, hash: string): Promise<boolean> {
    try {
      return await bcrypt.compare(pin, hash);
    } catch (error) {
      console.error('PIN verification failed:', error);
      return false;
    }
  }

  /**
   * التحقق من قوة كلمة المرور
   */
  static validatePasswordStrength(password: string): {
    isValid: boolean;
    errors: string[];
  } {
    const errors: string[] = [];

    if (password.length < 12) {
      errors.push('Password must be at least 12 characters');
    }

    if (!/[A-Z]/.test(password)) {
      errors.push('Password must contain uppercase letters');
    }

    if (!/[a-z]/.test(password)) {
      errors.push('Password must contain lowercase letters');
    }

    if (!/[0-9]/.test(password)) {
      errors.push('Password must contain numbers');
    }

    if (!/[!@#$%^&*]/.test(password)) {
      errors.push('Password must contain special characters');
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }
}

export default VaultService;
