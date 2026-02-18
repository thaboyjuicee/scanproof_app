export interface VerificationResult {
  isValid: boolean;
  integrityValid: boolean;
  ownerValid: boolean;
  signatureValid: boolean;
  reasons: string[];
}
