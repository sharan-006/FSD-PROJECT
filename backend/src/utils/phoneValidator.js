/**
 * Phone Number Validator & Normalizer for Indian Numbers
 * 
 * Requirements:
 * - Phone number must contain exactly 10 digits for Indian numbers.
 * - Reject letters, special characters, spaces-only input, and invalid-length numbers.
 * - Normalize the phone number before checking duplicates.
 */

function validateAndNormalizePhone(phone) {
  if (phone === null || phone === undefined) {
    return {
      isValid: false,
      error: 'Please enter a valid 10-digit phone number.',
      normalized: ''
    };
  }

  const str = String(phone).trim();
  if (!str) {
    return {
      isValid: false,
      error: 'Please enter a valid 10-digit phone number.',
      normalized: ''
    };
  }

  // Reject any letters (a-z, A-Z)
  if (/[a-zA-Z]/.test(str)) {
    return {
      isValid: false,
      error: 'Please enter a valid 10-digit phone number.',
      normalized: ''
    };
  }

  // Reject invalid special characters (anything other than digits, whitespace, +, -, (, ))
  if (/[^0-9\s\-()+]/.test(str)) {
    return {
      isValid: false,
      error: 'Please enter a valid 10-digit phone number.',
      normalized: ''
    };
  }

  // Extract all digit characters
  const digits = str.replace(/\D/g, '');

  let normalized = digits;
  // If Indian country code prefix (+91 or 91) with 12 digits:
  if (digits.length === 12 && digits.startsWith('91')) {
    normalized = digits.slice(2);
  } else if (digits.length === 11 && digits.startsWith('0')) {
    // If trunk prefix (0) with 11 digits:
    normalized = digits.slice(1);
  }

  // Must contain exactly 10 digits
  if (normalized.length !== 10) {
    return {
      isValid: false,
      error: 'Please enter a valid 10-digit phone number.',
      normalized: ''
    };
  }

  return {
    isValid: true,
    normalized,
    error: null
  };
}

module.exports = {
  validateAndNormalizePhone
};
