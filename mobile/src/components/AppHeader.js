import { Feather } from '@expo/vector-icons';
import React from 'react';
import {
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTheme } from '../contexts/ThemeContext';

export default function AppHeader() {
  const { darkMode, toggleDarkMode } = useTheme();

  return (
    <SafeAreaView
      edges={['top']}
      style={{ backgroundColor: darkMode ? '#111827' : '#ffffff' }}
    >
      <StatusBar
        barStyle={darkMode ? 'light-content' : 'dark-content'}
        backgroundColor={darkMode ? '#111827' : '#ffffff'}
      />
      <View
        style={[
          styles.header,
          {
            backgroundColor: darkMode ? '#111827' : '#ffffff',
            borderBottomColor: darkMode ? '#374151' : '#e5e7eb',
          },
        ]}
      >
        {/* Logo */}
        <View style={styles.logo}>
          <View style={styles.logoIcon}>
            <Text style={styles.logoLetter}>S</Text>
          </View>
          <Text style={styles.logoText}>Soloflow</Text>
        </View>

        {/* Dark Mode Toggle */}
        <TouchableOpacity onPress={toggleDarkMode} style={styles.iconBtn}>
          <Feather
            name={darkMode ? 'sun' : 'moon'}
            size={20}
            color={darkMode ? '#fde68a' : '#374151'}
          />
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  logo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  logoIcon: {
    width: 32,
    height: 32,
    borderRadius: 8,
    backgroundColor: '#3b82f6',
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoLetter: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 16,
  },
  logoText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#3b82f6',
  },
  iconBtn: {
    padding: 8,
    borderRadius: 20,
  },
});