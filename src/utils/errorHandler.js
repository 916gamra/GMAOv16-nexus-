/**
 * Custom Error Class for GMAO Application
 */
import { Logger } from '../core/logger/LoggerService.js';

export class AppError extends Error {
  constructor(message, code = 'GENERIC_ERROR', details = {}) {
    super(message);
    this.name = 'AppError';
    this.code = code;
    this.details = details;
    this.timestamp = new Date();
  }
}

/**
 * Global Error Handler Utility
 */
export class ErrorHandler {
  /**
   * Log and report runtime errors gracefully.
   * @param {Error|AppError|any} error - Exception object
   * @param {string} [customUserMessage] - Optional user-friendly message
   * @returns {AppError}
   */
  static handle(error, customUserMessage = null) {
    Logger.error('❌ [GMAO App Error]:', error);
    
    const userMsg = customUserMessage || error?.message || 'Une erreur inattendue est survenue.';
    
    // Log to error console for user visibility without crashing UI
    if (typeof window !== 'undefined' && window.alert && error?.code === 'CRITICAL') {
      try {
        window.alert(`Erreur: ${userMsg}`);
      } catch {
        // Fallback gracefully
      }
    }

    return new AppError(userMsg, error?.code || 'RUNTIME_ERROR', { originalError: error });
  }
}

export default ErrorHandler;
