import { Feather } from '@expo/vector-icons';
import React, { useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';
import Toast from 'react-native-toast-message';
import { API_BASE_URL } from '../utils/config';
import { useTheme } from '../contexts/ThemeContext';
import { storage } from '../utils/storage';

export default function ProjectCard({ project, onDelete }) {
  const { darkMode } = useTheme();
  const [invoiceGenerated, setInvoiceGenerated] = useState(
    project.invoiceGenerated || false
  );
  const [loading, setLoading] = useState(false);

  const isCompleted =
    project.status === true || project.status === 'completed';

  const accentColor = isCompleted ? '#22c55e' : '#6b7280';
  const statusText = isCompleted ? 'Completed' : 'Incomplete';

  const formatDate = (dateString) => {
    if (!dateString) return 'No deadline';
    try {
      return new Date(dateString).toLocaleDateString(undefined, {
        month: 'short',
        day: 'numeric',
      });
    } catch {
      return 'Invalid date';
    }
  };

  const handleGenerateInvoice = async () => {
    if (!isCompleted || invoiceGenerated) return;
    setLoading(true);
    try {
      const token = await storage.getItem('token');
      const response = await fetch(
        `${API_BASE_URL}/${project.user_id}/${project.client_id}/${project.project_id}/addinvoice`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
        }
      );
      const data = await response.json();
      if (!response.ok) throw new Error(data.message || 'Failed to generate invoice');
      Toast.show({ type: 'success', text1: 'Invoice generated successfully!' });
      setInvoiceGenerated(true);
    } catch (error) {
      Toast.show({ type: 'error', text1: error.message || 'Error generating invoice' });
    } finally {
      setLoading(false);
    }
  };

  const confirmDelete = () => {
    Alert.alert('Delete Project', `Delete "${project.projectName}"?`, [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: () => onDelete && onDelete() },
    ]);
  };

  return (
    <View
      style={[
        styles.card,
        {
          backgroundColor: darkMode ? '#111827' : '#ffffff',
          borderColor: isCompleted
            ? darkMode ? '#374151' : '#bbf7d0'
            : darkMode ? '#374151' : '#d1d5db',
        },
      ]}
    >
      {/* Status Bar */}
      <View style={[styles.statusBar, { backgroundColor: accentColor }]} />

      {/* Delete Button */}
      {onDelete && (
        <TouchableOpacity style={styles.deleteBtn} onPress={confirmDelete}>
          <Feather name="trash-2" size={16} color="#ef4444" />
        </TouchableOpacity>
      )}

      {/* Project Info */}
      <View style={styles.info}>
        <Text
          style={[styles.title, { color: darkMode ? '#ffffff' : '#111827' }]}
        >
          {project.projectName || 'Untitled Project'}
        </Text>
        <Text
          style={[
            styles.description,
            { color: darkMode ? '#d1d5db' : '#4b5563' },
          ]}
          numberOfLines={2}
        >
          {project.projectDescription || 'No description'}
        </Text>
      </View>

      {/* Client Info */}
      <View style={styles.metaRow}>
        <Feather name="user" size={13} color={darkMode ? '#9ca3af' : '#6b7280'} />
        <Text style={[styles.metaText, { color: darkMode ? '#d1d5db' : '#374151' }]}>
          {project.clientName || 'Unknown Client'}
        </Text>
      </View>
      <View style={styles.metaRow}>
        <Feather name="briefcase" size={13} color={darkMode ? '#9ca3af' : '#6b7280'} />
        <Text style={[styles.metaText, { color: darkMode ? '#d1d5db' : '#374151' }]}>
          {project.clientCompany || 'No company'}
        </Text>
      </View>

      {/* Status & Deadline */}
      <View style={styles.footer}>
        <View
          style={[
            styles.statusBadge,
            {
              backgroundColor: isCompleted
                ? darkMode ? '#14532d' : '#dcfce7'
                : darkMode ? '#374151' : '#f3f4f6',
            },
          ]}
        >
          <Text
            style={[
              styles.statusText,
              { color: isCompleted ? '#22c55e' : '#6b7280' },
            ]}
          >
            {statusText}
          </Text>
        </View>
        <View style={styles.deadlineRow}>
          <Feather name="calendar" size={12} color={darkMode ? '#6b7280' : '#9ca3af'} />
          <Text style={[styles.deadlineText, { color: darkMode ? '#6b7280' : '#9ca3af' }]}>
            {formatDate(project.deadline)}
          </Text>
        </View>
      </View>

      {/* Invoice Button */}
      {isCompleted ? (
        invoiceGenerated ? (
          <TouchableOpacity
            style={[styles.invoiceBtn, { backgroundColor: '#22c55e' }]}
            onPress={project.onViewInvoice}
          >
            <Feather name="eye" size={14} color="#fff" />
            <Text style={styles.invoiceBtnText}>View Invoice</Text>
          </TouchableOpacity>
        ) : (
          <TouchableOpacity
            style={[
              styles.invoiceBtn,
              { backgroundColor: loading ? '#93c5fd' : '#3b82f6' },
            ]}
            onPress={handleGenerateInvoice}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator size="small" color="#fff" />
            ) : (
              <Feather name="file-text" size={14} color="#fff" />
            )}
            <Text style={styles.invoiceBtnText}>
              {loading ? 'Generating...' : 'Generate Invoice'}
            </Text>
          </TouchableOpacity>
        )
      ) : (
        <View style={[styles.invoiceBtn, { backgroundColor: darkMode ? '#374151' : '#e5e7eb' }]}>
          <Feather name="file-text" size={14} color={darkMode ? '#6b7280' : '#9ca3af'} />
          <Text style={[styles.invoiceBtnText, { color: darkMode ? '#6b7280' : '#9ca3af' }]}>
            Generate Invoice
          </Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: 12,
    padding: 14,
    marginBottom: 12,
    borderWidth: 1,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 3,
  },
  statusBar: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 4,
  },
  deleteBtn: {
    position: 'absolute',
    top: 14,
    right: 12,
    padding: 4,
    zIndex: 1,
  },
  info: {
    marginTop: 10,
    marginBottom: 10,
    paddingRight: 28,
  },
  title: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  description: {
    fontSize: 13,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 4,
  },
  metaText: {
    fontSize: 13,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 10,
    marginBottom: 10,
  },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 20,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
  },
  deadlineRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  deadlineText: {
    fontSize: 12,
  },
  invoiceBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 10,
    borderRadius: 8,
    marginTop: 4,
  },
  invoiceBtnText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 13,
  },
});