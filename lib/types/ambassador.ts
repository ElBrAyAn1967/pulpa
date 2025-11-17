/**
 * Type definitions for Ambassador system
 */

export interface Ambassador {
  id: string;
  nfcId: string;
  walletAddress: string;
  ensName?: string;
  displayName: string;
  favoriteFruit: string;
  totalDistributions: number;
  totalPulpaMinted: string;
  createdAt: string;
  updatedAt: string;
}

export interface NFCStatus {
  nfcId: string;
  isRegistered: boolean;
  ambassador?: Omit<Ambassador, 'createdAt' | 'updatedAt'>;
}

export interface AmbassadorRegistrationData {
  nfcId: string;
  walletAddress: string;
  ensName?: string;
  displayName: string;
  favoriteFruit: string;
}

export interface AmbassadorRegistrationResponse {
  success: boolean;
  ambassador?: Ambassador;
  error?: string;
}

export const FRUIT_OPTIONS = [
  '🍎', '🍊', '🍋', '🍌', '🍉', '🍇',
  '🍓', '🫐', '🍒', '🍑', '🥭', '🍍',
  '🥥', '🥝', '🍈', '🍏', '🍐'
] as const;

export type FruitEmoji = typeof FRUIT_OPTIONS[number];
