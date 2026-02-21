import React from 'react';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Feather } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';

import { useProofs } from '../hooks/use-proofs';
import { RootStackParamList } from '../types/navigation';
import { CardContainer, GradientText, VerifiedBadge } from '../components';

type NavigationProp = NativeStackNavigationProp<RootStackParamList>;

export const ProofListScreen = (): React.JSX.Element => {
  const navigation = useNavigation<NavigationProp>();
  const { proofs, questClaims, issuedEnvelopes, scanHistory } = useProofs();
  const issuedNotarize = issuedEnvelopes.filter((item) => item.type === 'notarize');
  const issuedQuestOrTicket = issuedEnvelopes.filter((item) => item.type === 'quest' || item.type === 'ticket');

  return (
    <LinearGradient colors={['#faf5ff', '#ffffff', '#eff6ff']} style={styles.gradient}>
      <ScrollView contentContainerStyle={styles.container}>
        <View style={styles.header}>
          <GradientText style={styles.title}>Proofbook</GradientText>
          <Text style={styles.subtitle}>Claims, issued credentials, notarizations, and scan history.</Text>
        </View>

        <CardContainer>
          <Text style={styles.sectionTitle}>Claims</Text>
          {questClaims.length === 0 ? (
            <Text style={styles.emptyText}>No quest claims yet.</Text>
          ) : (
            questClaims.slice(0, 8).map((item) => (
              <View key={item.id} style={styles.rowItem}>
                <Feather name="check-circle" size={16} color="#16a34a" />
                <Text style={styles.rowText}>{item.envelopeId}</Text>
                <Text style={styles.timeText}>{new Date(item.claimedAt).toLocaleDateString()}</Text>
              </View>
            ))
          )}
        </CardContainer>

        <CardContainer>
          <Text style={styles.sectionTitle}>Issued</Text>
          {issuedQuestOrTicket.length === 0 ? (
            <Text style={styles.emptyText}>No quest or ticket credentials issued.</Text>
          ) : (
            issuedQuestOrTicket.slice(0, 8).map((item) => (
              <View key={item.id} style={styles.rowItem}>
                <VerifiedBadge label={item.type.toUpperCase()} variant="info" />
                <Text style={styles.rowText}>{item.id}</Text>
              </View>
            ))
          )}
        </CardContainer>

        <CardContainer>
          <Text style={styles.sectionTitle}>Notarizations</Text>
          {proofs.length === 0 && issuedNotarize.length === 0 ? (
            <Text style={styles.emptyText}>No notarizations yet.</Text>
          ) : (
            proofs.slice(0, 8).map((item) => (
              <TouchableOpacity key={item.id} style={styles.rowItem} onPress={() => navigation.navigate('ProofDetails', { proof: item })}>
                <Feather name="file-text" size={16} color="#7c3aed" />
                <Text style={styles.rowText}>{item.title}</Text>
                <Feather name="chevron-right" size={16} color="#7c3aed" />
              </TouchableOpacity>
            ))
          )}
        </CardContainer>

        <CardContainer>
          <Text style={styles.sectionTitle}>Scan History</Text>
          {scanHistory.length === 0 ? (
            <Text style={styles.emptyText}>No scans yet.</Text>
          ) : (
            scanHistory.slice(0, 12).map((item) => (
              <View key={item.id} style={styles.rowItem}>
                <Feather name={item.status === 'ok' ? 'check-circle' : 'alert-circle'} size={16} color={item.status === 'ok' ? '#16a34a' : '#dc2626'} />
                <Text style={styles.rowText}>{item.envelopeType} · {item.envelopeId}</Text>
                <Text style={styles.timeText}>{new Date(item.scannedAt).toLocaleTimeString()}</Text>
              </View>
            ))
          )}
        </CardContainer>
      </ScrollView>
    </LinearGradient>
  );
};


const styles = StyleSheet.create({
  gradient: {
    flex: 1,
  },
  container: {
    flexGrow: 1,
    padding: 20,
    gap: 12,
  },
  header: {
    paddingBottom: 4,
    gap: 8,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
  },
  subtitle: {
    fontSize: 14,
    color: '#6b7280',
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1f2937',
    marginBottom: 8,
  },
  rowItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 6,
  },
  rowText: {
    flex: 1,
    color: '#374151',
    fontSize: 13,
  },
  emptyText: {
    fontSize: 13,
    color: '#6b7280',
  },
  timeText: {
    fontSize: 11,
    color: '#9ca3af',
  },
});

