import { Feather } from '@expo/vector-icons';
import React, { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  KeyboardAvoidingView,
  Modal,
  Platform,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import Toast from 'react-native-toast-message';
import AppHeader from '../components/AppHeader';
import ClientCard from '../components/ClientCard';
import { API_BASE_URL } from '../utils/config';
import { useTheme } from '../contexts/ThemeContext';
import { storage } from '../utils/storage';

export default function Clients({ navigation }) {
  const { darkMode } = useTheme();
  const [clients, setClients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [search, setSearch] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [userId, setUserId] = useState(null);
  const [token, setToken] = useState(null);

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [company, setCompany] = useState('');
  const [address, setAddress] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    const init = async () => {
      const uid = await storage.getItem('user_id');
      const tok = await storage.getItem('token');
      setUserId(uid);
      setToken(tok);
    };
    init();
  }, []);

  const fetchClients = useCallback(async () => {
    if (!userId || !token) return;
    try {
      const res = await fetch(`${API_BASE_URL}/${userId}/clients`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error('Failed to fetch clients');
      const data = await res.json();
      setClients(data.clients || []);
    } catch (err) {
      Toast.show({ type: 'error', text1: err.message });
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [userId, token]);

  useEffect(() => {
    if (userId && token) fetchClients();
  }, [userId, token, fetchClients]);

  const handleAddClient = async () => {
    if (!name || !email || !company || !address) {
      Toast.show({ type: 'error', text1: 'Please fill all fields' });
      return;
    }
    setSubmitting(true);
    try {
      const res = await fetch(`${API_BASE_URL}/${userId}/addclient`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          client_name: name,
          client_email: email,
          client_company: company,
          client_address: address,
          client_user: userId,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Failed to add client');
      Toast.show({ type: 'success', text1: data.message || 'Client added!' });
      setShowForm(false);
      setName('');
      setEmail('');
      setCompany('');
      setAddress('');
      fetchClients();
    } catch (err) {
      Toast.show({ type: 'error', text1: err.message });
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (clientId) => {
    try {
      const res = await fetch(
        `${API_BASE_URL}/${userId}/${clientId}/deleteclient`,
        {
          method: 'DELETE',
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      const data = await res.json();
      if (res.ok) {
        Toast.show({ type: 'success', text1: data.message || 'Client deleted' });
        setClients((prev) => prev.filter((c) => c._id !== clientId));
      } else {
        Toast.show({ type: 'error', text1: data.message || 'Failed to delete' });
      }
    } catch (err) {
      Toast.show({ type: 'error', text1: err.message });
    }
  };

  const filteredClients = clients.filter(
    (c) =>
      !search.trim() ||
      c.client_name?.toLowerCase().includes(search.toLowerCase())
  );

  const bg = darkMode ? '#111827' : '#f0f9ff';
  const textColor = darkMode ? '#f9fafb' : '#111827';
  const inputBg = darkMode ? '#374151' : '#ffffff';
  const inputBorder = darkMode ? '#4b5563' : '#d1d5db';
  const cardBg = darkMode ? '#1f2937' : '#ffffff';

  return (
    <View style={[styles.screen, { backgroundColor: bg }]}>
      <AppHeader />

      <View style={styles.topBar}>
        <Text style={[styles.pageTitle, { color: textColor }]}>My Clients</Text>
        <TouchableOpacity style={styles.addBtn} onPress={() => setShowForm(true)}>
          <Feather name="plus" size={16} color="#fff" />
          <Text style={styles.addBtnText}>Add Client</Text>
        </TouchableOpacity>
      </View>

      <View
        style={[
          styles.searchRow,
          { backgroundColor: inputBg, borderColor: inputBorder },
        ]}
      >
        <Feather
          name="search"
          size={16}
          color={darkMode ? '#9ca3af' : '#6b7280'}
        />
        <TextInput
          style={[styles.searchInput, { color: textColor }]}
          placeholder="Search by client name"
          placeholderTextColor={darkMode ? '#6b7280' : '#9ca3af'}
          value={search}
          onChangeText={setSearch}
        />
      </View>

      {loading ? (
        <ActivityIndicator size="large" color="#3b82f6" style={{ marginTop: 40 }} />
      ) : (
        <FlatList
          data={filteredClients}
          keyExtractor={(item) => item._id}
          contentContainerStyle={styles.listContent}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={() => {
                setRefreshing(true);
                fetchClients();
              }}
            />
          }
          ListEmptyComponent={
            <View style={styles.empty}>
              <Feather
                name="users"
                size={40}
                color={darkMode ? '#4b5563' : '#d1d5db'}
              />
              <Text
                style={{ color: darkMode ? '#6b7280' : '#9ca3af', marginTop: 10 }}
              >
                No clients found
              </Text>
            </View>
          }
          renderItem={({ item }) => (
            <ClientCard
              client={{
                user_id: userId,
                client_id: item._id,
                name: item.client_name,
                email: item.client_email,
                company: item.client_company,
                address: item.client_address,
              }}
              onDelete={handleDelete}
              onViewProjects={(client) =>
                navigation.navigate('ClientProjects', {
                  user_id: userId,
                  client_id: client.client_id,
                  clientName: client.name,
                })
              }
            />
          )}
        />
      )}

      {/* Add Client Modal */}
      <Modal visible={showForm} transparent animationType="slide">
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={{ flex: 1 }}
        >
          <View style={styles.modalOverlay}>
            <ScrollView>
              <View style={[styles.modalCard, { backgroundColor: cardBg }]}>
                <View style={styles.modalHeader}>
                  <Text style={[styles.modalTitle, { color: textColor }]}>
                    Add Client
                  </Text>
                  <TouchableOpacity onPress={() => setShowForm(false)}>
                    <Feather
                      name="x"
                      size={22}
                      color={darkMode ? '#9ca3af' : '#6b7280'}
                    />
                  </TouchableOpacity>
                </View>

                {[
                  { label: 'Client Name', value: name, setter: setName, placeholder: 'Full name' },
                  { label: 'Client Email', value: email, setter: setEmail, placeholder: 'Email address', keyboard: 'email-address' },
                  { label: 'Client Address', value: address, setter: setAddress, placeholder: 'Address' },
                  { label: 'Client Company', value: company, setter: setCompany, placeholder: 'Company name' },
                ].map((f) => (
                  <View key={f.label} style={styles.fieldGroup}>
                    <Text
                      style={[
                        styles.fieldLabel,
                        { color: darkMode ? '#d1d5db' : '#374151' },
                      ]}
                    >
                      {f.label}
                    </Text>
                    <TextInput
                      style={[
                        styles.fieldInput,
                        {
                          backgroundColor: darkMode ? '#374151' : '#f9fafb',
                          borderColor: inputBorder,
                          color: textColor,
                        },
                      ]}
                      value={f.value}
                      onChangeText={f.setter}
                      placeholder={f.placeholder}
                      placeholderTextColor={darkMode ? '#6b7280' : '#9ca3af'}
                      keyboardType={f.keyboard || 'default'}
                      autoCapitalize="none"
                    />
                  </View>
                ))}

                <View style={styles.modalBtns}>
                  <TouchableOpacity
                    onPress={() => setShowForm(false)}
                    style={[
                      styles.cancelBtn,
                      { backgroundColor: darkMode ? '#374151' : '#f3f4f6' },
                    ]}
                  >
                    <Text style={{ color: darkMode ? '#d1d5db' : '#374151' }}>
                      Cancel
                    </Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    onPress={handleAddClient}
                    style={styles.submitBtn}
                    disabled={submitting}
                  >
                    {submitting ? (
                      <ActivityIndicator color="#fff" size="small" />
                    ) : (
                      <Text style={{ color: '#fff', fontWeight: '600' }}>Add</Text>
                    )}
                  </TouchableOpacity>
                </View>
              </View>
            </ScrollView>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  topBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  pageTitle: { fontSize: 22, fontWeight: 'bold' },
  addBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 9,
    backgroundColor: '#4f46e5',
    borderRadius: 10,
  },
  addBtnText: { color: '#fff', fontWeight: '600', fontSize: 14 },
  searchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginHorizontal: 16,
    marginBottom: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 10,
    borderWidth: 1,
  },
  searchInput: { flex: 1, fontSize: 14 },
  listContent: { paddingHorizontal: 16, paddingBottom: 20 },
  empty: { alignItems: 'center', paddingTop: 60 },
  modalOverlay: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0,0,0,0.4)',
  },
  modalCard: {
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 20,
    paddingBottom: 40,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  modalTitle: { fontSize: 20, fontWeight: 'bold' },
  fieldGroup: { marginBottom: 14 },
  fieldLabel: { fontSize: 13, fontWeight: '500', marginBottom: 6 },
  fieldInput: {
    borderRadius: 8,
    borderWidth: 1,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
  },
  modalBtns: { flexDirection: 'row', gap: 10, marginTop: 8 },
  cancelBtn: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  submitBtn: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
    backgroundColor: '#3b82f6',
  },
});