import { describe, it, expect, vi, beforeEach } from 'vitest';
import { 
  containsSessionExpiredText, 
  isSessionExpiredError,
  createSessionExpiredError,
  SESSION_EXPIRED_ERROR_CODE
} from './auth.api';

describe('Auth API Helpers', () => {
  describe('containsSessionExpiredText', () => {
    it('should identify session expired messages', () => {
      expect(containsSessionExpiredText('Your session has expired')).toBe(true);
      expect(containsSessionExpiredText('Invalid session')).toBe(true);
      expect(containsSessionExpiredText('Authentication required')).toBe(true);
      expect(containsSessionExpiredText('Access Denied')).toBe(true);
    });

    it('should return false for unrelated messages', () => {
      expect(containsSessionExpiredText('Success')).toBe(false);
      expect(containsSessionExpiredText('Invalid password')).toBe(false);
      expect(containsSessionExpiredText('')).toBe(false);
      expect(containsSessionExpiredText(null)).toBe(false);
    });
  });

  describe('isSessionExpiredError', () => {
    it('should identify session expired error from message', () => {
      const error = new Error('Session expired');
      expect(isSessionExpiredError(error)).toBe(true);
    });

    it('should identify session expired error from nested data', () => {
      const error = {
        data: {
          message: 'Your session has expired'
        }
      };
      expect(isSessionExpiredError(error)).toBe(true);
    });

    it('should identify session expired from Odoo exception name', () => {
      const error = {
        data: {
          name: 'odoo.http.SessionExpiredException'
        }
      };
      expect(isSessionExpiredError(error)).toBe(true);
    });

    it('should return false for other errors', () => {
      const error = new Error('Network error');
      expect(isSessionExpiredError(error)).toBe(false);
    });
  });

  describe('createSessionExpiredError', () => {
    it('should create error with correct code', () => {
      const message = 'Test Session Expired';
      const error = createSessionExpiredError(message);
      expect(error.message).toBe(message);
      expect(error.code).toBe(SESSION_EXPIRED_ERROR_CODE);
    });
  });
});
