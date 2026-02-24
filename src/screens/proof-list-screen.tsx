import React, { useCallback, useMemo, useRef, useState } from 'react';
import { Alert, FlatList, Image, Linking, Modal, Share, StyleSheet, Text, TouchableOpacity, useWindowDimensions, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { Feather } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import QRCode from 'react-native-qrcode-svg';
import * as Clipboard from 'expo-clipboard';
import * as MediaLibrary from 'expo-media-library';
import { captureRef } from 'react-native-view-shot';

import { env } from '../config/env';
import { useProofs } from '../hooks/use-proofs';
import { useWallet } from '../hooks/use-wallet';
import { BrandedQrCard, CardContainer, GradientButton, LoadingSkeleton } from '../components';

type ProofbookFilter = 'all' | 'quest' | 'notarize' | 'ticket';
type ProofbookType = 'quest' | 'notarize' | 'ticket' | 'legacy';

interface ProofbookItem {
  id: string;
  type: ProofbookType;
  title: string;
  description: string;
  createdAt: string;
  community?: string;
  location?: string;
  eventName?: string;
  venue?: string;
  validTo?: string;
  recipientWallet?: string;
  qrValue?: string;
  badgeImageUrl?: string;
  solanaSignature?: string;
  redeemed?: boolean;
}

const TYPE_CONFIG = {
  quest:    { color: '#7C3AED', lightBg: '#F5F3FF', borderColor: '#DDD6FE', label: 'Quest' },
  notarize: { color: '#2563EB', lightBg: '#EFF6FF', borderColor: '#BFDBFE', label: 'Notarized' },
  ticket:   { color: '#059669', lightBg: '#ECFDF5', borderColor: '#A7F3D0', label: 'Ticket' },
  legacy:   { color: '#6B7280', lightBg: '#F9FAFB', borderColor: '#E5E7EB', label: 'Proof' },
} as const;

const formatDate = (iso: string): string => {
  try {
    return new Date(iso).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });
  } catch {
    return iso;
  }
};

const formatDateTime = (iso: string): string => {
  try {
    return new Date(iso).toLocaleString(undefined, {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
    });
  } catch {
    return iso;
  }
};

const getBadgeImageUrl = (rawEnvelope?: unknown): string | undefined => {
  if (!rawEnvelope || typeof rawEnvelope !== 'object') {
    return undefined;
  }

  const payload = (rawEnvelope as { payload?: Record<string, unknown> }).payload;
  const badge = payload?.badgeImageUrl ?? payload?.badgeImage;
  return typeof badge === 'string' ? badge : undefined;
};

export const ProofListScreen = (): React.JSX.Element => {
  const { width } = useWindowDimensions();
  const navigation = useNavigation();
  const { walletSession, connectWallet } = useWallet();
  const { proofs, issuedEnvelopes, ticketRedemptions, encodeEnvelopeToQr, loading } = useProofs();
  const [activeFilter, setActiveFilter] = useState<ProofbookFilter>('all');
  const [selectedItem, setSelectedItem] = useState<ProofbookItem | null>(null);
  const downloadViewRef = useRef<View>(null);
  const [itemToDownload, setItemToDownload] = useState<ProofbookItem | null>(null);
  const isCompact = width < 380;

  const proofItems = useMemo<ProofbookItem[]>(() => {
    const notarizeIds = new Set(issuedEnvelopes.filter((item) => item.type === 'notarize').map((item) => item.id));

    const issuedItems: ProofbookItem[] = issuedEnvelopes.map((item) => {
      const payload = item.payload as any;
      const redeemed = item.type === 'ticket'
        ? ticketRedemptions.some((record) => record.envelopeId === item.id)
        : undefined;
      const redemption = item.type === 'ticket'
        ? ticketRedemptions.find((record) => record.envelopeId === item.id)
        : undefined;

      const title = item.type === 'quest'
        ? payload?.title ?? 'Quest'
        : item.type === 'ticket'
          ? payload?.title ?? payload?.eventName ?? 'Ticket'
          : payload?.title ?? 'Notarized File';

      const description = item.type === 'quest'
        ? payload?.label ?? 'Quest check-in'
        : item.type === 'ticket'
          ? payload?.description ?? payload?.eventName ?? payload?.venue ?? 'Admission ticket'
          : payload?.description ?? 'Notarized file';

      return {
        id: item.id,
        type: item.type,
        title,
        description,
        createdAt: item.issuedAt,
        community: item.type === 'quest' ? payload?.community : undefined,
        location: item.type === 'quest' ? payload?.location : undefined,
        eventName: item.type === 'ticket' ? payload?.eventName : undefined,
        venue: item.type === 'ticket' ? payload?.venue : undefined,
        validTo: item.type === 'ticket' ? payload?.validTo : undefined,
        recipientWallet: item.type === 'ticket' ? payload?.recipientWallet : undefined,
        qrValue: encodeEnvelopeToQr(item),
        badgeImageUrl: getBadgeImageUrl(item),
        redeemed,
        solanaSignature: redemption?.txSignature,
      };
    });

    const legacyItems: ProofbookItem[] = proofs
      .filter((proof) => !notarizeIds.has(proof.id))
      .map((proof) => ({
        id: proof.id,
        type: 'legacy',
        title: proof.title,
        description: proof.description,
        createdAt: proof.timestampIso,
        qrValue: proof.qrCode,
      }));

    return [...issuedItems, ...legacyItems].sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  }, [encodeEnvelopeToQr, issuedEnvelopes, proofs, ticketRedemptions]);

  const filteredItems = useMemo(() => {
    if (activeFilter === 'all') {
      return proofItems;
    }

    return proofItems.filter((item) => item.type === activeFilter);
  }, [activeFilter, proofItems]);

  const counts = useMemo(() => {
    const countByType = proofItems.reduce<Record<ProofbookType, number>>(
      (acc, item) => {
        acc[item.type] += 1;
        return acc;
      },
      { quest: 0, notarize: 0, ticket: 0, legacy: 0 }
    );

    return {
      quests: countByType.quest,
      notarized: countByType.notarize,
      tickets: countByType.ticket,
    };
  }, [proofItems]);

  const getVerificationUrl = useCallback((item: ProofbookItem): string => {
    if (item.solanaSignature) {
      const clusterQuery = env.solanaCluster === 'mainnet-beta' ? '' : `?cluster=${encodeURIComponent(env.solanaCluster)}`;
      return `${env.solanaExplorerBaseUrl}/tx/${item.solanaSignature}${clusterQuery}`;
    }

    return item.qrValue ?? 'scanproof://proof';
  }, []);

  const handleDownload = useCallback(async (item: ProofbookItem) => {
    try {
      const permission = await MediaLibrary.requestPermissionsAsync();
      if (!permission.granted) {
        Alert.alert('Permission Needed', 'Please allow photo access to save QR codes.');
        return;
      }

      // Set the item to download which will render the high-quality card
      setItemToDownload(item);

      // Wait a brief moment for the view to render
      await new Promise(resolve => setTimeout(resolve, 100));

      if (!downloadViewRef.current) {
        Alert.alert('Download Failed', 'Unable to generate QR image.');
        setItemToDownload(null);
        return;
      }

      // Capture at very high quality (1024x1024)
      const uri = await captureRef(downloadViewRef, {
        format: 'png',
        quality: 1,
        width: 1024,
        height: 1024,
      });

      await MediaLibrary.saveToLibraryAsync(uri);
      Alert.alert('Saved', 'High-quality QR code saved to your photo library.');
    } catch (error) {
      console.error('Download error:', error);
      Alert.alert('Download Failed', 'An error occurred while saving the QR code.');
    } finally {
      setItemToDownload(null);
    }
  }, []);

  const handleShare = useCallback(async (item: ProofbookItem) => {
    const url = getVerificationUrl(item);
    try {
      await Share.share({ message: url });
    } catch {
      await Clipboard.setStringAsync(url);
      Alert.alert('Copied', 'Verification link copied to clipboard.');
    }
  }, [getVerificationUrl]);

  const handleView = useCallback((item: ProofbookItem) => {
    setSelectedItem(item);
  }, []);

  const renderHeader = (): React.JSX.Element => (
    <View style={styles.headerWrap}>
      <View style={[styles.headerRow, isCompact && styles.headerRowCompact]}>
        <View>
          <View style={styles.titleRow}>
            <Feather name="book-open" size={32} color="#7C3AED" />
            <Text style={styles.title}>Proofbook</Text>
          </View>
          <Text style={styles.subtitle}>{proofItems.length} proof(s) recorded</Text>
        </View>
        <TouchableOpacity onPress={() => navigation.navigate('CreateTab' as never)} activeOpacity={0.8}>
          <LinearGradient colors={['#9333ea', '#2563eb']} style={styles.createButton}>
            <Feather name="grid" size={18} color="#ffffff" />
            <Text style={styles.createButtonText}>Create Proof</Text>
          </LinearGradient>
        </TouchableOpacity>
      </View>

      <View style={styles.statsRow}>
        <View style={[styles.statCard, { backgroundColor: TYPE_CONFIG.quest.lightBg, borderColor: TYPE_CONFIG.quest.borderColor }]}>
          <Text style={[styles.statValue, { color: TYPE_CONFIG.quest.color }]}>{counts.quests}</Text>
          <Text style={[styles.statLabel, { color: TYPE_CONFIG.quest.color }]}>Quests</Text>
        </View>
        <View style={[styles.statCard, { backgroundColor: TYPE_CONFIG.notarize.lightBg, borderColor: TYPE_CONFIG.notarize.borderColor }]}>
          <Text style={[styles.statValue, { color: TYPE_CONFIG.notarize.color }]}>{counts.notarized}</Text>
          <Text style={[styles.statLabel, { color: TYPE_CONFIG.notarize.color }]}>Notarized</Text>
        </View>
        <View style={[styles.statCard, { backgroundColor: TYPE_CONFIG.ticket.lightBg, borderColor: TYPE_CONFIG.ticket.borderColor }]}>
          <Text style={[styles.statValue, { color: TYPE_CONFIG.ticket.color }]}>{counts.tickets}</Text>
          <Text style={[styles.statLabel, { color: TYPE_CONFIG.ticket.color }]}>Tickets</Text>
        </View>
      </View>

      <View style={[styles.tabsRow, isCompact && styles.tabsRowCompact]}>
        {['all', 'quest', 'notarize', 'ticket'].map((filter) => (
          <TouchableOpacity
            key={filter}
            onPress={() => setActiveFilter(filter as ProofbookFilter)}
            style={[styles.tab, activeFilter === filter && styles.tabActive]}
          >
            <Text style={[styles.tabText, activeFilter === filter && styles.tabTextActive]}>
              {filter === 'all' ? 'All' : filter === 'quest' ? 'Quests' : filter === 'notarize' ? 'Notarized' : 'Tickets'}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
      <View style={styles.tabDivider} />
    </View>
  );

  const renderEmpty = (): React.JSX.Element => (
    <CardContainer style={styles.emptyCard}>
      <Feather name="book-open" size={40} color="#9ca3af" />
      <Text style={styles.emptyTitle}>No proofs yet</Text>
      <Text style={styles.emptySubtitle}>Create your first quest, notarize a file, or issue a ticket.</Text>
      <GradientButton title="Create Your First Proof" icon="plus" onPress={() => navigation.navigate('CreateTab' as never)} />
    </CardContainer>
  );

  const renderSkeleton = (): React.JSX.Element => (
    <View style={styles.skeletonWrap}>
      {[0, 1, 2, 3].map((item) => (
        <View key={item} style={styles.skeletonCard}>
          <LoadingSkeleton height={20} width="60%" />
          <LoadingSkeleton height={14} width="80%" style={styles.skeletonSpacer} />
          <LoadingSkeleton height={140} width="100%" style={styles.skeletonSpacer} />
        </View>
      ))}
    </View>
  );

  const renderItem = ({ item }: { item: ProofbookItem }): React.JSX.Element => {
    const config = TYPE_CONFIG[item.type];
    const badgeLabel = item.type === 'ticket'
      ? item.redeemed ? 'Redeemed' : 'Ticket'
      : config.label;

    return (
      <View style={styles.card}>
        <View style={styles.cardHeader}>
          <View style={[styles.typeDotWrap, { backgroundColor: config.lightBg, borderColor: config.borderColor }]}
          >
            <View style={[styles.typeDot, { backgroundColor: config.color }]} />
          </View>
          <View style={styles.cardHeaderText}>
            <Text style={styles.cardTitle}>{item.title}</Text>
            <Text style={styles.cardDescription} numberOfLines={2}>{item.description}</Text>
          </View>
          <View style={[styles.typeBadge, { borderColor: config.borderColor, backgroundColor: config.lightBg }]}
          >
            <Text style={[styles.typeBadgeText, { color: config.color }]}>
              {item.type === 'ticket' && item.redeemed ? '🔴 Redeemed' : `✓ ${badgeLabel}`}
            </Text>
          </View>
        </View>

        {item.badgeImageUrl ? (
          <View style={styles.badgeImageWrap}>
            <Image source={{ uri: item.badgeImageUrl }} style={styles.badgeImage} />
          </View>
        ) : null}

        <View style={styles.dateRow}>
          <Feather name="clock" size={12} color="#9ca3af" />
          <Text style={styles.dateText}>{formatDate(item.createdAt)}</Text>
        </View>

        <View style={styles.actionsRow}>
          <TouchableOpacity style={styles.actionButton} onPress={() => void handleView(item)}>
            <Feather name="eye" size={16} color="#7C3AED" />
            <Text style={styles.actionText}>View</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.actionButton} onPress={() => void handleDownload(item)}>
            <Feather name="download" size={16} color="#7C3AED" />
            <Text style={styles.actionText}>Download</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.actionButton} onPress={() => void handleShare(item)}>
            <Feather name="share-2" size={16} color="#7C3AED" />
            <Text style={styles.actionText}>Share</Text>
          </TouchableOpacity>
        </View>

        {item.solanaSignature ? (
          <TouchableOpacity onPress={() => void Linking.openURL(getVerificationUrl(item))}>
            <Text style={styles.explorerLink}>View on Solana Explorer ↗</Text>
          </TouchableOpacity>
        ) : null}
      </View>
    );
  };

  if (!walletSession) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.disconnectedWrap}>
          <View style={styles.disconnectedCard}>
            <LinearGradient colors={['#9333ea', '#2563eb']} style={styles.disconnectedIcon}>
              <Feather name="book-open" size={32} color="#ffffff" />
            </LinearGradient>
            <Text style={styles.disconnectedTitle}>Your Proofbook</Text>
            <Text style={styles.disconnectedSubtitle}>Connect your wallet to see all your proofs, claims, and badges.</Text>
            <GradientButton title="Connect Wallet" icon="link-2" onPress={() => void connectWallet()} />
          </View>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <FlatList
        data={filteredItems}
        keyExtractor={(item) => item.id}
        renderItem={renderItem}
        ListHeaderComponent={renderHeader}
        ListEmptyComponent={loading ? renderSkeleton : renderEmpty}
        contentContainerStyle={[styles.listContent, { maxWidth: 920, alignSelf: 'center', width: '100%' }]}
        ItemSeparatorComponent={() => <View style={styles.cardSpacer} />}
        showsVerticalScrollIndicator={false}
      />

      {/* Hidden high-quality QR card for downloads */}
      {itemToDownload?.qrValue ? (
        <View style={styles.hiddenDownloadWrap}>
          <View ref={downloadViewRef} collapsable={false}>
            <BrandedQrCard
              value={itemToDownload.qrValue}
              size={900}
              type={itemToDownload.type === 'legacy' ? 'default' : itemToDownload.type}
              title={itemToDownload.type === 'legacy' ? 'Proof QR' : undefined}
            />
          </View>
        </View>
      ) : null}

      <Modal visible={!!selectedItem} transparent animationType="slide" onRequestClose={() => setSelectedItem(null)}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Proof Details</Text>
              <TouchableOpacity onPress={() => setSelectedItem(null)}>
                <Feather name="x" size={20} color="#6b7280" />
              </TouchableOpacity>
            </View>

            {selectedItem?.qrValue ? (
              <View style={styles.modalQrWrap}>
                <BrandedQrCard
                  value={selectedItem.qrValue}
                  size={180}
                  type={selectedItem.type === 'legacy' ? 'default' : selectedItem.type}
                  title={selectedItem.type === 'legacy' ? 'Proof QR' : undefined}
                />
              </View>
            ) : null}

            <View style={styles.modalInfoRow}>
              <Text style={styles.modalInfoLabel}>Title</Text>
              <Text style={styles.modalInfoValue}>{selectedItem?.title}</Text>
            </View>
            <View style={styles.modalInfoRow}>
              <Text style={styles.modalInfoLabel}>Description</Text>
              <Text style={styles.modalInfoValue}>{selectedItem?.description}</Text>
            </View>
            <View style={styles.modalInfoRow}>
              <Text style={styles.modalInfoLabel}>Type</Text>
              <Text style={styles.modalInfoValue}>{selectedItem?.type}</Text>
            </View>
            {selectedItem?.type === 'quest' && selectedItem.community ? (
              <View style={styles.modalInfoRow}>
                <Text style={styles.modalInfoLabel}>Community</Text>
                <Text style={styles.modalInfoValue}>{selectedItem.community}</Text>
              </View>
            ) : null}
            {selectedItem?.type === 'quest' && selectedItem.location ? (
              <View style={styles.modalInfoRow}>
                <Text style={styles.modalInfoLabel}>Location</Text>
                <Text style={styles.modalInfoValue}>{selectedItem.location}</Text>
              </View>
            ) : null}
            {selectedItem?.type === 'ticket' && selectedItem.eventName ? (
              <View style={styles.modalInfoRow}>
                <Text style={styles.modalInfoLabel}>Event Name</Text>
                <Text style={styles.modalInfoValue}>{selectedItem.eventName}</Text>
              </View>
            ) : null}
            {selectedItem?.type === 'ticket' && selectedItem.venue ? (
              <View style={styles.modalInfoRow}>
                <Text style={styles.modalInfoLabel}>Venue</Text>
                <Text style={styles.modalInfoValue}>{selectedItem.venue}</Text>
              </View>
            ) : null}
            {selectedItem?.type === 'ticket' && selectedItem.validTo ? (
              <View style={styles.modalInfoRow}>
                <Text style={styles.modalInfoLabel}>Expiration</Text>
                <Text style={styles.modalInfoValue}>{formatDateTime(selectedItem.validTo)}</Text>
              </View>
            ) : null}
            {selectedItem?.type === 'ticket' && selectedItem.recipientWallet ? (
              <View style={styles.modalInfoRow}>
                <Text style={styles.modalInfoLabel}>Recipient Wallet</Text>
                <Text style={styles.modalInfoValue}>{selectedItem.recipientWallet}</Text>
              </View>
            ) : null}
            <View style={styles.modalInfoRow}>
              <Text style={styles.modalInfoLabel}>Created</Text>
              <Text style={styles.modalInfoValue}>{selectedItem ? formatDate(selectedItem.createdAt) : ''}</Text>
            </View>

            <GradientButton title="Close" onPress={() => setSelectedItem(null)} icon="x" variant="secondary" />
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  listContent: {
    padding: 20,
    paddingBottom: 32,
  },
  headerWrap: {
    marginBottom: 16,
    gap: 16,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
  },
  headerRowCompact: {
    flexDirection: 'column',
    alignItems: 'stretch',
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: '#111827',
  },
  subtitle: {
    fontSize: 13,
    color: '#6b7280',
    marginTop: 4,
  },
  createButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 12,
  },
  createButtonText: {
    color: '#ffffff',
    fontSize: 13,
    fontWeight: '600',
  },
  statsRow: {
    flexDirection: 'row',
    gap: 12,
  },
  statCard: {
    flex: 1,
    borderWidth: 1,
    borderRadius: 14,
    paddingVertical: 14,
    alignItems: 'center',
  },
  statValue: {
    fontSize: 24,
    fontWeight: '700',
  },
  statLabel: {
    fontSize: 12,
    fontWeight: '600',
  },
  tabsRow: {
    flexDirection: 'row',
    gap: 16,
  },
  tabsRowCompact: {
    flexWrap: 'wrap',
    gap: 12,
  },
  tab: {
    paddingBottom: 8,
  },
  tabActive: {
    borderBottomWidth: 2,
    borderBottomColor: '#7C3AED',
  },
  tabText: {
    fontSize: 13,
    color: '#6b7280',
    fontWeight: '500',
  },
  tabTextActive: {
    color: '#7C3AED',
    fontWeight: '700',
  },
  tabDivider: {
    height: 1,
    backgroundColor: '#e5e7eb',
  },
  cardSpacer: {
    height: 16,
  },
  card: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    borderWidth: 2,
    borderColor: '#f3f4f6',
    padding: 16,
    shadowColor: '#000000',
    shadowOpacity: 0.05,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 6 },
    elevation: 2,
    gap: 12,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
  },
  typeDotWrap: {
    width: 28,
    height: 28,
    borderRadius: 8,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  typeDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  cardHeaderText: {
    flex: 1,
    gap: 4,
  },
  cardTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#111827',
  },
  cardDescription: {
    fontSize: 12,
    color: '#6b7280',
  },
  typeBadge: {
    borderWidth: 1,
    borderRadius: 999,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  typeBadgeText: {
    fontSize: 11,
    fontWeight: '700',
  },
  badgeImageWrap: {
    alignItems: 'center',
  },
  badgeImage: {
    width: 80,
    height: 80,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#DDD6FE',
  },
  dateRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  dateText: {
    fontSize: 12,
    color: '#9ca3af',
  },
  qrWrap: {
    alignItems: 'center',
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    backgroundColor: '#ffffff',
  },
  actionsRow: {
    flexDirection: 'row',
    gap: 12,
  },
  actionButton: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    borderRadius: 12,
    paddingVertical: 10,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: 6,
  },
  actionText: {
    color: '#7C3AED',
    fontSize: 12,
    fontWeight: '600',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.45)',
    justifyContent: 'flex-end',
  },
  modalCard: {
    backgroundColor: '#ffffff',
    borderTopLeftRadius: 18,
    borderTopRightRadius: 18,
    padding: 16,
    gap: 10,
    maxHeight: '88%',
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#111827',
  },
  modalQrWrap: {
    alignItems: 'center',
    padding: 12,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    borderRadius: 12,
  },
  modalInfoRow: {
    borderWidth: 1,
    borderColor: '#e5e7eb',
    borderRadius: 10,
    padding: 10,
    gap: 4,
  },
  modalInfoLabel: {
    fontSize: 11,
    textTransform: 'uppercase',
    color: '#9ca3af',
    fontWeight: '700',
  },
  modalInfoValue: {
    fontSize: 14,
    color: '#1f2937',
  },
  explorerLink: {
    textAlign: 'center',
    color: '#7C3AED',
    fontSize: 12,
    fontWeight: '600',
  },
  disconnectedWrap: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  disconnectedCard: {
    backgroundColor: '#ffffff',
    borderRadius: 20,
    padding: 24,
    alignItems: 'center',
    gap: 12,
    shadowColor: '#000000',
    shadowOpacity: 0.08,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 8 },
    elevation: 2,
  },
  disconnectedIcon: {
    width: 64,
    height: 64,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  disconnectedTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: '#111827',
  },
  disconnectedSubtitle: {
    fontSize: 13,
    color: '#6b7280',
    textAlign: 'center',
  },
  emptyCard: {
    alignItems: 'center',
    paddingVertical: 24,
    gap: 10,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#111827',
  },
  emptySubtitle: {
    fontSize: 13,
    color: '#6b7280',
    textAlign: 'center',
  },
  skeletonWrap: {
    gap: 16,
  },
  skeletonCard: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: '#f3f4f6',
    gap: 10,
  },
  skeletonSpacer: {
    marginTop: 8,
  },
  hiddenDownloadWrap: {
    position: 'absolute',
    left: -10000,
    top: -10000,
    opacity: 0,
  },
});

