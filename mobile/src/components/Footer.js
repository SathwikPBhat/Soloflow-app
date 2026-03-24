import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { useTheme } from '../contexts/ThemeContext';

export default function Footer() {
  const { darkMode } = useTheme();
  return (
    <View
      style={[
        styles.footer,
        { backgroundColor: darkMode ? '#1f2937' : '#1e3a8a' },
      ]}
    >
      <Text style={styles.text}>© 2025 SoloFlow. All rights reserved.</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  footer: {
    padding: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 8,
  },
  text: {
    color: '#e5e7eb',
    fontSize: 12,
  },
});