import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import QRCode from 'react-native-qrcode-svg';
import { FileText, QrCode, Ticket, Users } from 'lucide-react-native';

type QrCardType = 'quest' | 'ticket' | 'event' | 'notarize' | 'default';

interface BrandedQrCardProps {
  value: string;
  size?: number;
  type?: QrCardType;
  title?: string;
  subtitle?: string;
}

const STYLE_BY_TYPE: Record<QrCardType, { colors: [string, string, ...string[]]; chipColor: string; label: string; Icon: React.ComponentType<any> }> = {
  quest: { colors: ['#F58529', '#DD2A7B', '#8134AF', '#515BD4'], chipColor: '#7C3AED', label: 'Quest Proof', Icon: Users },
  ticket: { colors: ['#F58529', '#EF4444', '#059669', '#14B8A6'], chipColor: '#059669', label: 'Gate Pass', Icon: Ticket },
  event: { colors: ['#F58529', '#EF4444', '#059669', '#14B8A6'], chipColor: '#059669', label: 'Event Portal', Icon: Ticket },
  notarize: { colors: ['#F58529', '#DD2A7B', '#2563EB', '#06B6D4'], chipColor: '#2563EB', label: 'Notarized File', Icon: FileText },
  default: { colors: ['#F58529', '#DD2A7B', '#8134AF', '#515BD4'], chipColor: '#6D28D9', label: 'ScanProof', Icon: QrCode },
};

export const BrandedQrCard = ({ value, size = 220, type = 'default', title, subtitle }: BrandedQrCardProps): React.JSX.Element => {
  const theme = STYLE_BY_TYPE[type];

  return (
    <LinearGradient colors={theme.colors} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.frame}>
      <View style={styles.innerPanel}>
        <View style={styles.brandRow}>
          <View style={[styles.brandChip, { backgroundColor: theme.chipColor }]}>
            <theme.Icon size={14} color="#ffffff" strokeWidth={2.25} />
          </View>
          <Text style={styles.brandText}>ScanProof</Text>
        </View>

        <View style={styles.qrContainer}>
          <QRCode value={value} size={size} color="#111827" backgroundColor="#ffffff" />
        </View>

        <View style={styles.metaWrap}>
          <Text style={styles.headerText}>{title ?? theme.label}</Text>
          <Text style={styles.footerText}>{subtitle ?? 'Verified with ScanProof on Solana'}</Text>
        </View>
      </View>
    </LinearGradient>
  );
};

const styles = StyleSheet.create({
  frame: {
    borderRadius: 24,
    padding: 3,
  },
  innerPanel: {
    borderRadius: 21,
    backgroundColor: '#ffffff',
    alignItems: 'center',
    padding: 14,
  },
  brandRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 10,
    gap: 8,
  },
  brandChip: {
    width: 24,
    height: 24,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  brandText: {
    fontSize: 13,
    fontWeight: '800',
    color: '#111827',
  },
  headerText: {
    color: '#111827',
    fontSize: 14,
    fontWeight: '700',
    textAlign: 'center',
  },
  qrContainer: {
    padding: 10,
    backgroundColor: '#ffffff',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  metaWrap: {
    width: '100%',
    marginTop: 10,
    gap: 3,
  },
  footerText: {
    color: '#6b7280',
    fontSize: 11,
    textAlign: 'center',
    fontWeight: '600',
  },
});
