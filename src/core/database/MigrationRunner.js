import { Logger } from '../logger/LoggerService.js';
import { Migration001_CreateTables } from './migrations/Migration001_CreateTables.js';
import { Migration002_AddIndexes } from './migrations/Migration002_AddIndexes.js';

export class MigrationRunner {
  static async run(db) {
    try {
      Logger.info('🔄 Starting migration runner...');

      // إنشاء جدول إصدارات قاعدة البيانات إذا لم يكن موجوداً
      db.execute(`
        CREATE TABLE IF NOT EXISTS schema_versions (
          version INTEGER PRIMARY KEY,
          name TEXT NOT NULL,
          executed_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )
      `);

      // الحصول على الإصدار الحالي
      const currentVersion = this.getCurrentVersion(db);
      Logger.info('📊 Current schema version', { version: currentVersion });

      // جميع الـ Migrations
      const migrations = [
        new Migration001_CreateTables(),
        new Migration002_AddIndexes()
      ];

      // تشغيل الـ Migrations الجديدة
      for (const migration of migrations) {
        if (migration.version > currentVersion) {
          Logger.info(`🔄 Running migration ${migration.version}: ${migration.name}`);
          
          try {
            await migration.up(db);
            
            // تسجيل الـ Migration
            db.execute(
              'INSERT INTO schema_versions (version, name) VALUES (?, ?)',
              [migration.version, migration.name]
            );
            
            Logger.info(`✅ Migration ${migration.version} completed successfully`);
          } catch (error) {
            Logger.error(`❌ Migration ${migration.version} failed`, error);
            throw error;
          }
        }
      }

      Logger.info('✅ All migrations completed successfully');
      return true;
    } catch (error) {
      Logger.fatal('❌ Migration runner failed', error);
      throw error;
    }
  }

  static async rollback(db, toVersion) {
    try {
      const currentVersion = this.getCurrentVersion(db);
      Logger.info(`🔄 Rolling back from version ${currentVersion} to ${toVersion}`);

      const migrations = [
        new Migration001_CreateTables(),
        new Migration002_AddIndexes()
      ];

      for (let i = currentVersion; i > toVersion; i--) {
        const migration = migrations.find(m => m.version === i);
        if (migration) {
          Logger.info(`🔄 Rolling back migration ${i}: ${migration.name}`);
          
          try {
            await migration.down(db);
            
            // حذف تسجيل الـ Migration
            db.execute('DELETE FROM schema_versions WHERE version = ?', [i]);
            
            Logger.info(`✅ Migration ${i} rolled back successfully`);
          } catch (error) {
            Logger.error(`❌ Migration ${i} rollback failed`, error);
            throw error;
          }
        }
      }

      Logger.info('✅ Rollback completed successfully');
      return true;
    } catch (error) {
      Logger.fatal('❌ Rollback failed', error);
      throw error;
    }
  }

  static getCurrentVersion(db) {
    try {
      const result = db.queryOne(
        'SELECT MAX(version) as version FROM schema_versions'
      );
      return result?.version || 0;
    } catch {
      return 0;
    }
  }
}
