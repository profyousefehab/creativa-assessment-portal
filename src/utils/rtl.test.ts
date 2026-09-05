import { describe, it, expect } from 'vitest';
import { containsArabic, getTextDirection, getRTLClasses } from './rtl';

describe('RTL & Arabic Text Detection (Specification §1A)', () => {
  it('detects pure Arabic text', () => {
    const arabicText = 'ما هو الغرض من التقييم القبلي والبعدي؟';
    expect(containsArabic(arabicText)).toBe(true);
    expect(getTextDirection(arabicText)).toBe('rtl');
  });

  it('detects pure English text', () => {
    const englishText = 'What is the primary function of a neural network?';
    expect(containsArabic(englishText)).toBe(false);
    expect(getTextDirection(englishText)).toBe('ltr');
  });

  it('detects mixed strings containing Arabic and English acronyms', () => {
    const mixedText = 'ما هي فوائد استخدام SEO في التسويق الرقمي؟';
    expect(containsArabic(mixedText)).toBe(true);
    expect(getTextDirection(mixedText)).toBe('rtl');
  });

  it('handles null or undefined safely', () => {
    expect(containsArabic(null)).toBe(false);
    expect(containsArabic(undefined)).toBe(false);
    expect(getTextDirection(null)).toBe('ltr');
    expect(getTextDirection('')).toBe('ltr');
  });

  it('returns Thmanyah Sans and rtl direction class for Arabic content', () => {
    const classes = getRTLClasses('سؤال باللغة العربية');
    expect(classes).toContain('Thmanyah_Sans');
    expect(classes).toContain('[direction:rtl]');
    expect(classes).toContain('text-right');
  });

  it('returns ltr direction and text-left for English content', () => {
    const classes = getRTLClasses('Question in English');
    expect(classes).toContain('[direction:ltr]');
    expect(classes).toContain('text-left');
  });
});
