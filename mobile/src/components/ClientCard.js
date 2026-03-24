import { Feather } from '@expo/vector-icons';
import React from 'react';
import {
    Alert,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';
import { useTheme } from '../contexts/ThemeContext';

export default function ClientCard({ client, onDelete, onViewProjects }) {
  const { darkMode } = useTheme();

  const confirmDelete = () => {
    Alert.alert('Delete Client', `Remove ${client.name}?`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: () => onDelete && onDelete(client.client_id),
      },
    ]);
  };

  return (
    <View
      style={[
        styles.card,
        {
          backgroundColor: darkMode ? '#1f2937' : '#ffffff',
          borderColor: darkMode ? '#374151' : '#e5e7eb',
        },
      ]}
    >
      {/* Delete Button */}
      <TouchableOpacity style={styles.deleteBtn} onPress={confirmDelete}>
        <Feather name="trash-2" size={18} color="#ef4444" />
      </TouchableOpacity>

      {/* Header */}
      <View style={styles.header}>
        <Text
          style={[styles.name, { color: darkMode ? '#ffffff' : '#111827' }]}
        >
          {client.name}
        </Text>
        <Text
          style={[styles.company, { color: darkMode ? '#60a5fa' : '#2563eb' }]}
        >
          {client.company}
        </Text>
      </View>

      {/* Contact Info */}
      <View style={styles.contactInfo}>
        <View style={styles.contactRow}>
          <Text style={styles.contactIcon}>📧</Text>
          <Text
            style={[
              styles.contactText,
              { color: darkMode ? '#d1d5db' : '#4b5563' },
            ]}
            numberOfLines={1}
          >
            {client.email}
          </Text>
        </View>
        <View style={styles.contactRow}>
          <Text style={styles.contactIcon}>🏢</Text>
          <Text
            style={[
              styles.contactText,
              { color: darkMode ? '#d1d5db' : '#4b5563' },
            ]}
            numberOfLines={1}
          >
            {client.address}
          </Text>
        </View>
      </View>

      {/* View Projects Button */}
      <TouchableOpacity
        style={styles.projectsBtn}
        onPress={() => onViewProjects && onViewProjects(client)}
        activeOpacity={0.8}
      >
        <Text style={styles.projectsBtnText}>View Projects</Text>
        <Feather name="arrow-right" size={16} color="#fff" />
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 3,
  },
  deleteBtn: {
    position: 'absolute',
    top: 12,
    right: 12,
    padding: 6,
    zIndex: 1,
  },
  header: {
    marginBottom: 12,
    paddingRight: 32,
  },
  name: {
    fontSize: 18,
    fontWeight: '800',
    marginBottom: 2,
  },
  company: {
    fontSize: 13,
    fontWeight: '600',
  },
  contactInfo: {
    gap: 6,
    marginBottom: 14,
  },
  contactRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  contactIcon: {
    fontSize: 14,
  },
  contactText: {
    fontSize: 13,
    flex: 1,
  },
  projectsBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 12,
    borderRadius: 10,
    backgroundColor: '#4f46e5',
  },
  projectsBtnText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 14,
  },
});