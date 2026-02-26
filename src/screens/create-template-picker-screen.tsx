import React from 'react';
import { ScrollView, StyleSheet, Text, TouchableOpacity, useWindowDimensions, View } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { LinearGradient } from 'expo-linear-gradient';
import { FileText, Ticket, Users } from 'lucide-react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { GradientText } from '../components';
import { RootStackParamList } from '../types/navigation';

type NavigationProp = NativeStackNavigationProp<RootStackParamList>;

const cardShadow = {
  shadowColor: '#000000',
  shadowOpacity: 0.06,
  shadowRadius: 8,
  shadowOffset: { width: 0, height: 2 } as const,
  elevation: 2,
};

export const CreateTemplatePickerScreen = (): React.JSX.Element => {
  const { width } = useWindowDimensions();
  const navigation = useNavigation<NavigationProp>();
  const isCompact = width < 380;

  const templates = [
    {
      key: 'quest',
      title: 'Quest Check-in',
      description: 'IRL events & community check-ins with badge claiming',
      colors: ['#7C3AED', '#8B5CF6'] as const,
      Icon: Users,
      onPress: () => navigation.navigate('QuestCreate'),
    },
    {
      key: 'notarize',
      title: 'Notarize File',
      description: 'Certify any file with SHA-256 hash + wallet signature',
      colors: ['#2563EB', '#06B6D4'] as const,
      Icon: FileText,
      onPress: () => navigation.navigate('NotarizeCreate'),
    },
    {
      key: 'ticket',
      title: 'Gate Pass',
      description: 'Issue multi-use passes with organizer signature verification',
      colors: ['#059669', '#14B8A6'] as const,
      Icon: Ticket,
      onPress: () => navigation.navigate('TicketCreate'),
    },
  ];

  return (
    <SafeAreaView style={styles.safeArea}>
      <LinearGradient colors={['#faf5ff', '#ffffff', '#eff6ff']} style={styles.gradient}>
        <ScrollView contentContainerStyle={styles.container}>
          <View style={styles.header}>
            <GradientText style={[styles.title, isCompact && styles.titleCompact]}>Create</GradientText>
            <Text style={styles.subtitle}>Choose a template to generate a verifiable QR credential.</Text>
          </View>

          <View style={styles.cardsWrap}>
            {templates.map((template) => (
              <TouchableOpacity key={template.key} onPress={template.onPress} activeOpacity={0.9} style={[styles.card, isCompact && styles.cardCompact]}>
                <LinearGradient colors={template.colors} style={styles.iconWrap}>
                  <template.Icon size={20} color="#ffffff" strokeWidth={2.25} />
                </LinearGradient>
                <Text style={styles.cardTitle}>{template.title}</Text>
                <Text style={styles.cardDescription}>{template.description}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </ScrollView>
      </LinearGradient>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#faf5ff',
  },
  gradient: {
    flex: 1,
  },
  container: {
    padding: 20,
    paddingBottom: 32,
    width: '100%',
    maxWidth: 760,
    alignSelf: 'center',
  },
  header: {
    gap: 8,
    marginBottom: 18,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
  },
  titleCompact: {
    fontSize: 24,
  },
  subtitle: {
    fontSize: 14,
    color: '#6b7280',
  },
  cardsWrap: {
    gap: 12,
  },
  card: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 16,
    ...cardShadow,
  },
  cardCompact: {
    padding: 14,
  },
  iconWrap: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardTitle: {
    marginTop: 10,
    fontSize: 15,
    fontWeight: '700',
    color: '#111827',
  },
  cardDescription: {
    marginTop: 4,
    fontSize: 13,
    color: '#6b7280',
    lineHeight: 18,
  },
});
