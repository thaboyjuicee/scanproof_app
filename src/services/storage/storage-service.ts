import AsyncStorage from '@react-native-async-storage/async-storage';

import { AnyProofEnvelope } from '../../models/proof-envelope';
import { Proof } from '../../models/proof';
import { QuestClaimRecord, ScanHistoryRecord, TicketRedemptionRecord } from '../../models/proofbook';
import { WalletSession } from '../../models/wallet-session';
import { logger } from '../../utils/logger';
import { STORAGE_KEYS } from './storage-keys';

const parseArrayOrEmpty = <T>(raw: string | null): T[] => {
  if (!raw) {
    return [];
  }

  try {
    const parsed = JSON.parse(raw) as T[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
};

export class StorageService {
  async saveProofs(proofs: Proof[]): Promise<void> {
    await AsyncStorage.setItem(STORAGE_KEYS.proofs, JSON.stringify(proofs));
  }

  async getProofs(): Promise<Proof[]> {
    const raw = await AsyncStorage.getItem(STORAGE_KEYS.proofs);
    const parsed = parseArrayOrEmpty<Proof>(raw);
    if (!raw && parsed.length === 0) {
      return [];
    }
    if (raw && parsed.length === 0) {
      logger.error('Failed to parse proofs from storage');
    }
    return parsed;
  }

  async saveIssuedEnvelopes(envelopes: AnyProofEnvelope[]): Promise<void> {
    await AsyncStorage.setItem(STORAGE_KEYS.issuedEnvelopes, JSON.stringify(envelopes));
  }

  async getIssuedEnvelopes(): Promise<AnyProofEnvelope[]> {
    const raw = await AsyncStorage.getItem(STORAGE_KEYS.issuedEnvelopes);
    return parseArrayOrEmpty<AnyProofEnvelope>(raw);
  }

  async saveQuestClaims(claims: QuestClaimRecord[]): Promise<void> {
    await AsyncStorage.setItem(STORAGE_KEYS.questClaims, JSON.stringify(claims));
  }

  async getQuestClaims(): Promise<QuestClaimRecord[]> {
    const raw = await AsyncStorage.getItem(STORAGE_KEYS.questClaims);
    return parseArrayOrEmpty<QuestClaimRecord>(raw);
  }

  async saveScanHistory(entries: ScanHistoryRecord[]): Promise<void> {
    await AsyncStorage.setItem(STORAGE_KEYS.scanHistory, JSON.stringify(entries));
  }

  async getScanHistory(): Promise<ScanHistoryRecord[]> {
    const raw = await AsyncStorage.getItem(STORAGE_KEYS.scanHistory);
    return parseArrayOrEmpty<ScanHistoryRecord>(raw);
  }

  async saveTicketRedemptions(entries: TicketRedemptionRecord[]): Promise<void> {
    await AsyncStorage.setItem(STORAGE_KEYS.ticketRedemptions, JSON.stringify(entries));
  }

  async getTicketRedemptions(): Promise<TicketRedemptionRecord[]> {
    const raw = await AsyncStorage.getItem(STORAGE_KEYS.ticketRedemptions);
    return parseArrayOrEmpty<TicketRedemptionRecord>(raw);
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
