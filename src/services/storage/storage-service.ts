import AsyncStorage from '@react-native-async-storage/async-storage';

import { Proof } from '../../models/proof';
import { WalletSession } from '../../models/wallet-session';
import { logger } from '../../utils/logger';
import { STORAGE_KEYS } from './storage-keys';

export class StorageService {
  async saveProofs(proofs: Proof[]): Promise<void> {
    await AsyncStorage.setItem(STORAGE_KEYS.proofs, JSON.stringify(proofs));
  }

  async getProofs(): Promise<Proof[]> {
    const raw = await AsyncStorage.getItem(STORAGE_KEYS.proofs);
    if (!raw) {
      return [];
    }

    try {
      const parsed = JSON.parse(raw) as Proof[];
      return Array.isArray(parsed) ? parsed : [];
    } catch (error) {
      logger.error('Failed to parse proofs from storage', error);
      return [];
    }
  }

  async saveWalletSession(session: WalletSession): Promise<void> {
    await AsyncStorage.setItem(STORAGE_KEYS.walletSession, JSON.stringify(session));
  }

  async getWalletSession(): Promise<WalletSession | null> {
    const raw = await AsyncStorage.getItem(STORAGE_KEYS.walletSession);
    if (!raw) {
      return null;
    }

    try {
      return JSON.parse(raw) as WalletSession;
    } catch (error) {
      logger.error('Failed to parse wallet session from storage', error);
      return null;
    }
  }

  async clearWalletSession(): Promise<void> {
    await AsyncStorage.removeItem(STORAGE_KEYS.walletSession);
  }
}
