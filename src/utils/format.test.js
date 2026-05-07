import { describe, it, expect } from 'vitest';
import { 
  splitLeaveLabel, 
  getLeaveTypeEnglishName, 
  getLeaveTypeKhmerName 
} from './format';

describe('Format Utilities', () => {
  const fullLabel = 'Annual Leave - ច្បាប់ឈប់សម្រាកប្រចាំឆ្នាំ';
  const simpleLabel = 'Sick Leave';

  describe('splitLeaveLabel', () => {
    it('should split dual-language label', () => {
      const result = splitLeaveLabel(fullLabel);
      expect(result.english).toBe('Annual Leave');
      expect(result.khmer).toBe('ច្បាប់ឈប់សម្រាកប្រចាំឆ្នាំ');
    });

    it('should handle single-language label', () => {
      const result = splitLeaveLabel(simpleLabel);
      expect(result.english).toBe('Sick Leave');
      expect(result.khmer).toBe('');
    });
  });

  describe('getLeaveTypeEnglishName', () => {
    it('should return English part', () => {
      expect(getLeaveTypeEnglishName(fullLabel)).toBe('Annual Leave');
    });
  });

  describe('getLeaveTypeKhmerName', () => {
    it('should return Khmer part', () => {
      expect(getLeaveTypeKhmerName(fullLabel)).toBe('ច្បាប់ឈប់សម្រាកប្រចាំឆ្នាំ');
    });
  });
});
