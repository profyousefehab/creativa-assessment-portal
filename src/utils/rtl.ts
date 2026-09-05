/**
 * Utility functions to detect Arabic/RTL text and apply proper alignment,
 * font family, and direction while keeping the surrounding English UI LTR.
 */

// Regex covering common Arabic unicode character ranges
const ARABIC_REGEX = /[\u0600-\u06FF\u0750-\u077F\u08A0-\u08FF\uFB50-\uFDFF\uFE70-\uFEFF]/;

/**
 * Detects if a given string contains Arabic characters.
 */
export function containsArabic(text: string | null | undefined): boolean {
  if (!text) return false;
  return ARABIC_REGEX.test(text);
}

/**
 * Returns 'rtl' if the text starts with or predominantly contains Arabic characters,
 * otherwise 'ltr'.
 */
export function getTextDirection(text: string | null | undefined): 'rtl' | 'ltr' {
  if (!text) return 'ltr';
  // Trim leading whitespace and symbols to check first significant character
  const trimmed = text.trim();
  if (trimmed.length > 0) {
    const firstChar = trimmed[0];
    if (ARABIC_REGEX.test(firstChar)) {
      return 'rtl';
    }
  }
  return containsArabic(text) ? 'rtl' : 'ltr';
}

/**
 * Returns CSS classes for typography and text alignment based on content language.
 */
export function getRTLClasses(text: string | null | undefined, additionalClasses = ''): string {
  const isRtl = containsArabic(text);
  if (isRtl) {
    return `text-right font-['Thmanyah_Sans',sans-serif] [direction:rtl] leading-relaxed ${additionalClasses}`.trim();
  }
  return `text-left [direction:ltr] ${additionalClasses}`.trim();
}
