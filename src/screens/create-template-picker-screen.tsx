import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Feather } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';

import { CardContainer, GradientText } from '../components';
import { RootStackParamList } from '../types/navigation';

type NavigationProp = NativeStackNavigationProp<RootStackParamList>;

export const CreateTemplatePickerScreen = (): React.JSX.Element => {
  const navigation = useNavigation<NavigationProp>();

  return (
    <LinearGradient colors={['#faf5ff', '#ffffff', '#eff6ff']} style={styles.gradient}>
      <View style={styles.container}>
        <View style={styles.header}>
          <GradientText style={styles.title}>Create</GradientText>
          <Text style={styles.subtitle}>Choose a template to generate a verifiable QR credential.</Text>
        </View>

        <TouchableOpacity onPress={() => navigation.navigate('QuestCreate')}>
          <CardContainer>
            <View style={styles.cardRow}>
              <Feather name="map-pin" size={24} color="#9333ea" />
              <View style={styles.cardText}>
                <Text style={styles.cardTitle}>Quest Check-in</Text>
                <Text style={styles.cardDescription}>Community organizer QR for quest attendance claims.</Text>
              </View>
              <Feather name="chevron-right" size={20} color="#9333ea" />
            </View>
          </CardContainer>
        </TouchableOpacity>

        <TouchableOpacity onPress={() => navigation.navigate('NotarizeCreate')}>
          <CardContainer>
            <View style={styles.cardRow}>
              <Feather name="file-text" size={24} color="#9333ea" />
              <View style={styles.cardText}>
                <Text style={styles.cardTitle}>Notarize File</Text>
                <Text style={styles.cardDescription}>Create file certificate proof with existing notarize flow.</Text>
              </View>
              <Feather name="chevron-right" size={20} color="#9333ea" />
            </View>
          </CardContainer>
        </TouchableOpacity>

        <TouchableOpacity onPress={() => navigation.navigate('TicketCreate')}>
          <CardContainer>
            <View style={styles.cardRow}>
              <Feather name="tag" size={24} color="#9333ea" />
              <View style={styles.cardText}>
                <Text style={styles.cardTitle}>Redeemable Gate Pass</Text>
                <Text style={styles.cardDescription}>Issue tickets that verifiers can redeem on-chain.</Text>
              </View>
              <Feather name="chevron-right" size={20} color="#9333ea" />
            </View>
          </CardContainer>
        </TouchableOpacity>
      </View>
    </LinearGradient>
  );
};

const styles = StyleSheet.create({
  gradient: {
    flex: 1,
  },
  container: {
    flex: 1,
    padding: 20,
    gap: 14,
  },
  header: {
    gap: 8,
    marginBottom: 4,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
  },
  subtitle: {
    fontSize: 14,
    color: '#6b7280',
  },
  cardRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  cardText: {
    flex: 1,
    gap: 4,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1f2937',
  },
  cardDescription: {
    fontSize: 13,
    color: '#6b7280',
  },
});
