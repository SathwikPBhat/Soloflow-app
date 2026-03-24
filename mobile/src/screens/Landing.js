import { Feather } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import React from 'react';
import {
    Dimensions,
    ScrollView,
    StatusBar,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTheme } from '../contexts/ThemeContext';

const { width } = Dimensions.get('window');

const FEATURES = [
  {
    icon: '💰',
    title: 'Invoicing',
    desc: 'Create and send professional invoices with ease. Track payments effortlessly.',
  },
  {
    icon: '✅',
    title: 'Task Management',
    desc: 'Organize tasks with kanban boards, deadlines, and priority levels.',
  },
  {
    icon: '👥',
    title: 'Client Tracking',
    desc: 'Keep track of clients and their projects with detailed profiles.',
  },
  {
    icon: '🎨',
    title: 'Content Showcasing',
    desc: 'Showcase your work in a beautiful portfolio that impresses clients.',
  },
];

export default function Landing({ navigation }) {
  const { darkMode, toggleDarkMode } = useTheme();

  const bg = darkMode ? '#111827' : '#eff6ff';
  const textColor = darkMode ? '#f9fafb' : '#1f2937';
  const cardBg = darkMode ? '#1f2937' : '#ffffff';

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: bg }]} edges={['top']}>
      <StatusBar
        barStyle={darkMode ? 'light-content' : 'dark-content'}
        backgroundColor={bg}
      />

      {/* Header */}
      <View style={[styles.header, { backgroundColor: bg, borderBottomColor: darkMode ? '#374151' : '#e5e7eb' }]}>
        <View style={styles.logoRow}>
          <View style={styles.logoIcon}>
            <Text style={styles.logoLetter}>S</Text>
          </View>
          <Text style={styles.logoText}>Soloflow</Text>
        </View>
        <TouchableOpacity onPress={toggleDarkMode} style={styles.themeBtn}>
          <Feather name={darkMode ? 'sun' : 'moon'} size={20} color={darkMode ? '#fde68a' : '#374151'} />
        </TouchableOpacity>
      </View>

      <ScrollView
        style={{ flex: 1 }}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 40 }}
      >
        {/* Hero Section */}
        <LinearGradient
          colors={['#1e40af', '#4f46e5', '#7c3aed']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.hero}
        >
          <Text style={styles.heroTitle}>Soloflow</Text>
          <Text style={styles.heroSubtitle}>One App. Your Entire Hustle.</Text>
          <View style={styles.heroBtns}>
            <TouchableOpacity
              style={styles.registerBtn}
              onPress={() => navigation.navigate('Register')}
            >
              <Text style={styles.registerBtnText}>Register</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.loginBtn, { backgroundColor: darkMode ? 'rgba(255,255,255,0.15)' : 'rgba(255,255,255,0.25)' }]}
              onPress={() => navigation.navigate('Login')}
            >
              <Text style={styles.loginBtnText}>Login</Text>
            </TouchableOpacity>
          </View>
        </LinearGradient>

        <View style={[styles.container, { backgroundColor: bg }]}>
          {/* About Section */}
          <View style={[styles.sectionCard, { backgroundColor: cardBg }]}>
            <Text style={[styles.sectionTitle, { color: textColor }]}>
              Your All-in-One Command Center
            </Text>
            <Text style={[styles.sectionBody, { color: darkMode ? '#d1d5db' : '#4b5563' }]}>
              Soloflow is designed for solo creators, student entrepreneurs, and
              self-starters. Simplify your workflow, manage tasks, organize
              ideas, and bring your projects to life—without the chaos.
            </Text>
          </View>

          {/* Features */}
          <Text style={[styles.sectionHeading, { color: textColor }]}>Features</Text>
          <View style={styles.featuresGrid}>
            {FEATURES.map((f, i) => (
              <View
                key={i}
                style={[styles.featureCard, { backgroundColor: cardBg }]}
              >
                <View style={[styles.featureIcon, { backgroundColor: darkMode ? '#1e3a5f' : '#dbeafe' }]}>
                  <Text style={{ fontSize: 22 }}>{f.icon}</Text>
                </View>
                <Text style={[styles.featureTitle, { color: textColor }]}>{f.title}</Text>
                <Text style={[styles.featureDesc, { color: darkMode ? '#9ca3af' : '#6b7280' }]}>
                  {f.desc}
                </Text>
              </View>
            ))}
          </View>

          {/* Contact */}
          <View style={[styles.sectionCard, { backgroundColor: cardBg }]}>
            <Text style={[styles.sectionTitle, { color: textColor }]}>Get in Touch</Text>
            <Text style={[styles.sectionBody, { color: darkMode ? '#d1d5db' : '#4b5563' }]}>
              Have questions or need support? Reach out to us!
            </Text>
            <View style={styles.contactRow}>
              <Feather name="mail" size={18} color="#3b82f6" />
              <Text style={[styles.contactText, { color: darkMode ? '#e5e7eb' : '#374151' }]}>
                soloflow@gmail.com
              </Text>
            </View>
            <View style={styles.contactRow}>
              <Feather name="phone" size={18} color="#22c55e" />
              <Text style={[styles.contactText, { color: darkMode ? '#e5e7eb' : '#374151' }]}>
                +91 96969 69696
              </Text>
            </View>
          </View>
        </View>
      </ScrollView>

      {/* Footer */}
      <View style={[styles.footer, { backgroundColor: darkMode ? '#1f2937' : '#1e3a8a' }]}>
        <Text style={styles.footerText}>© 2025 SoloFlow. All rights reserved.</Text>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: 1,
  },
  logoRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  logoIcon: {
    width: 32,
    height: 32,
    borderRadius: 8,
    backgroundColor: '#3b82f6',
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoLetter: { color: '#fff', fontWeight: 'bold', fontSize: 16 },
  logoText: { fontSize: 18, fontWeight: 'bold', color: '#3b82f6' },
  themeBtn: { padding: 8, borderRadius: 20 },
  hero: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
    paddingHorizontal: 20,
    gap: 12,
  },
  heroTitle: {
    fontSize: 52,
    fontWeight: '900',
    color: '#fff',
    letterSpacing: -1,
  },
  heroSubtitle: {
    fontSize: 18,
    color: '#c7d2fe',
    marginBottom: 16,
  },
  heroBtns: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 8,
  },
  registerBtn: {
    paddingHorizontal: 28,
    paddingVertical: 14,
    backgroundColor: '#ffffff',
    borderRadius: 14,
  },
  registerBtnText: {
    color: '#4f46e5',
    fontWeight: 'bold',
    fontSize: 16,
  },
  loginBtn: {
    paddingHorizontal: 28,
    paddingVertical: 14,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.4)',
  },
  loginBtnText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 16,
  },
  container: { paddingHorizontal: 16, paddingTop: 16 },
  sectionCard: {
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 6,
    elevation: 3,
  },
  sectionTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  sectionBody: {
    fontSize: 15,
    lineHeight: 22,
  },
  sectionHeading: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 12,
    marginTop: 4,
  },
  featuresGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginBottom: 16,
  },
  featureCard: {
    width: (width - 44) / 2,
    borderRadius: 16,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 6,
    elevation: 3,
  },
  featureIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 10,
  },
  featureTitle: { fontSize: 15, fontWeight: 'bold', marginBottom: 6 },
  featureDesc: { fontSize: 12, lineHeight: 18 },
  contactRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginTop: 10,
  },
  contactText: { fontSize: 14 },
  footer: {
    padding: 14,
    alignItems: 'center',
  },
  footerText: { color: '#e5e7eb', fontSize: 12 },
});