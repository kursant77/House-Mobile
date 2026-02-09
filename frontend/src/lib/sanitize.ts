/**
 * Input sanitization utilities
 * Protects against XSS attacks
 */

// Simple HTML sanitization (for basic use cases)
// For production, consider using DOMPurify library
export const sanitizeHtml = (html: string): string => {
  const div = document.createElement('div');
  div.textContent = html;
  return div.innerHTML;
};

// Sanitize user input for display
export const sanitizeText = (text: string): string => {
  return text
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;')
    .replace(/\//g, '&#x2F;');
};

// Sanitize URL
export const sanitizeUrl = (url: string): string | null => {
  try {
    const parsed = new URL(url);
    // Only allow http, https protocols
    if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') {
      return null;
    }
    return parsed.toString();
  } catch {
    return null;
  }
};

// Sanitize filename
export const sanitizeFilename = (filename: string): string => {
  return filename
    .replace(/[^a-zA-Z0-9._-]/g, '_')
    .replace(/^\.+/, '') // Remove leading dots
    .substring(0, 255); // Limit length
};

// Sanitize phone number
export const sanitizePhone = (phone: string): string => {
  // Remove all non-digit characters except +
  const cleaned = phone.replace(/[^\d+]/g, '');
  // Ensure it starts with +998 or 998
  if (cleaned.startsWith('+998')) {
    return cleaned.substring(0, 13); // +998XXXXXXXXX
  }
  if (cleaned.startsWith('998')) {
    return '+' + cleaned.substring(0, 12); // +998XXXXXXXXX
  }
  if (cleaned.length === 9) {
    return '+998' + cleaned;
  }
  return cleaned;
};

// Sanitize email
export const sanitizeEmail = (email: string): string => {
  return email.toLowerCase().trim();
};

// Sanitize username
export const sanitizeUsername = (username: string): string => {
  return username.toLowerCase().replace(/[^a-z0-9_]/g, '');
};
