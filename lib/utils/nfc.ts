/**
 * NFC Utilities
 * Validation and storage functions for NFC IDs
 */

export interface NFCValidationResult {
  valid: boolean;
  error?: string;
}

/**
 * Validates NFC ID format
 * Accepts UUID format or alphanumeric (6-20 chars)
 */
export function validateNFCId(nfcId: string): NFCValidationResult {
  if (!nfcId || typeof nfcId !== 'string') {
    return { valid: false, error: 'NFC ID requerido' };
  }

  // UUID format: 123e4567-e89b-12d3-a456-426614174000
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

  // Alphanumeric format (6-20 chars)
  const alphanumericRegex = /^[A-Za-z0-9]{6,20}$/;

  if (uuidRegex.test(nfcId) || alphanumericRegex.test(nfcId)) {
    return { valid: true };
  }

  return { valid: false, error: 'Formato de NFC ID inválido' };
}

/**
 * Store NFC ID in localStorage
 */
export function storeNFCId(nfcId: string): void {
  if (typeof window !== 'undefined') {
    localStorage.setItem('pulpa_nfc_id', nfcId);
  }
}

/**
 * Retrieve NFC ID from localStorage
 */
export function retrieveNFCId(): string | null {
  if (typeof window !== 'undefined') {
    return localStorage.getItem('pulpa_nfc_id');
  }
  return null;
}

/**
 * Clear NFC ID from localStorage
 */
export function clearNFCId(): void {
  if (typeof window !== 'undefined') {
    localStorage.removeItem('pulpa_nfc_id');
  }
}
