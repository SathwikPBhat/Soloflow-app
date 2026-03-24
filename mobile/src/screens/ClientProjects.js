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
import { SafeAreaView } from 'react-native-safe-area-context';
import Toast from 'react-native-toast-message';
import ProjectCard from '../components/ProjectCard';
import { API_BASE_URL } from '../utils/config';
import { useTheme } from '../contexts/ThemeContext';
import { storage } from '../utils/storage';

export default function ClientProjects({ route, navigation }) {
  const { user_id, client_id, clientName } = route.params;
  const { darkMode } = useTheme();
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [search, setSearch] = useState('');
  const [sortByDeadline, setSortByDeadline] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [token, setToken] = useState(null);

  const [projectName, setProjectName] = useState('');
  const [projectDescription, setProjectDescription] = useState('');
  const [projectDeadline, setProjectDeadline] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    storage.getItem('token').then(setToken);
  }, []);

  const fetchProjects = useCallback(async () => {
    if (!token) return;
    try {
      const res = await fetch(`${API_BASE_URL}/${user_id}/${client_id}/projects`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error('Failed to fetch projects');
      const data = await res.json();
      setProjects(Array.isArray(data) ? data : data.projects || []);
    } catch (err) {
      Toast.show({ type: 'error', text1: err.message });
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [user_id, client_id, token]);

  useEffect(() => {
    if (token) fetchProjects();
  }, [token, fetchProjects]);

  const handleAddProject = async () => {
    if (!projectName || !projectDeadline) {
      Toast.show({ type: 'error', text1: 'Name and deadline are required' });
      return;
    }
    setSubmitting(true);
    try {
      const res = await fetch(`${API_BASE_URL}/${user_id}/${client_id}/addproject`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ project_name: projectName, deadline: projectDeadline, project_description: projectDescription }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Failed to add project');
      Toast.show({ type: 'success', text1: data.message || 'Project added!' });
      setShowForm(false);
      setProjectName(''); setProjectDescription(''); setProjectDeadline('');
      fetchProjects();
    } catch (err) {
      Toast.show({ type: 'error', text1: err.message });
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteProject = async (projectId) => {
    try {
      const res = await fetch(`${API_BASE_URL}/${user_id}/${client_id}/${projectId}/deleteproject`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (res.ok) {
        Toast.show({ type: 'success', text1: data.message || 'Project deleted' });
        setProjects((prev) => prev.filter((p) => p.id !== projectId && p._id !== projectId));
      } else {
        Toast.show({ type: 'error', text1: data.message || 'Failed to delete' });
      }
    } catch (err) {
      Toast.show({ type: 'error', text1: err.message });
    }
  };

  let filtered = projects.filter((p) =>
    !search.trim() || p.projectName?.toLowerCase().includes(search.toLowerCase())
  );
  if (sortByDeadline) {
    filtered = [...filtered].sort((a, b) => new Date(a.deadline) - new Date(b.deadline));
  }

  const bg = darkMode ? '#111827' : '#f0f9ff';
  const textColor = darkMode ? '#f9fafb' : '#111827';
  const inputBg = darkMode ? '#374151' : '#ffffff';
  const inputBorder = darkMode ? '#4b5563' : '#d1d5db';
  const cardBg = darkMode ? '#1f2937' : '#ffffff';

  return (
    <SafeAreaView style={[styles.screen, { backgroundColor: bg }]} edges={['top']}>
      {/* Header */}
      <View style={[styles.header, { backgroundColor: bg, borderBottomColor: darkMode ? '#374151' : '#e5e7eb' }]}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Feather name="arrow-left" size={22} color={darkMode ? '#f9fafb' : '#111827'} />
        </TouchableOpacity>
        <View style={{ flex: 1 }}>
          <Text style={[styles.headerTitle, { color: textColor }]}>Projects</Text>
          <Text style={[styles.headerSubtitle, { color: darkMode ? '#9ca3af' : '#6b7280' }]}>{clientName}</Text>
        </View>
        <TouchableOpacity style={styles.addBtn} onPress={() => setShowForm(true)}>
          <Feather name="plus" size={16} color="#fff" />
          <Text style={styles.addBtnText}>Add</Text>
        </TouchableOpacity>
      </View>

      {/* Controls */}
      <View style={styles.controls}>
        <View style={[styles.searchRow, { backgroundColor: inputBg, borderColor: inputBorder, flex: 1 }]}>
          <Feather name="search" size={14} color={darkMode ? '#9ca3af' : '#6b7280'} />
          <TextInput
            style={[styles.searchInput, { color: textColor }]}
            placeholder="Search projects"
            placeholderTextColor={darkMode ? '#6b7280' : '#9ca3af'}
            value={search}
            onChangeText={setSearch}
          />
        </View>
        <TouchableOpacity
          onPress={() => setSortByDeadline(!sortByDeadline)}
          style={[styles.sortBtn, { backgroundColor: sortByDeadline ? '#3b82f6' : (darkMode ? '#374151' : '#e5e7eb') }]}
        >
          <Feather name="clock" size={14} color={sortByDeadline ? '#fff' : (darkMode ? '#d1d5db' : '#374151')} />
          <Text style={[styles.sortBtnText, { color: sortByDeadline ? '#fff' : (darkMode ? '#d1d5db' : '#374151') }]}>
            Deadline
          </Text>
        </TouchableOpacity>
      </View>

      {loading ? (
        <ActivityIndicator size="large" color="#3b82f6" style={{ marginTop: 40 }} />
      ) : (
        <FlatList
          data={filtered}
          keyExtractor={(item) => String(item.id || item._id)}
          contentContainerStyle={styles.listContent}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); fetchProjects(); }} />}
          ListEmptyComponent={
            <View style={styles.empty}>
              <Feather name="folder" size={40} color={darkMode ? '#4b5563' : '#d1d5db'} />
              <Text style={{ color: darkMode ? '#6b7280' : '#9ca3af', marginTop: 10 }}>No projects found</Text>
            </View>
          }
          renderItem={({ item }) => (
            <ProjectCard
              project={{
                projectName: item.projectName,
                user_id,
                client_id,
                project_id: item.id || item._id,
                clientName: item.clientName,
                clientCompany: item.clientCompany,
                projectDescription: item.projectDescription,
                status: item.status || 'incomplete',
                deadline: item.deadline,
                invoiceGenerated: item.invoiceGenerated || false,
                onViewInvoice: () =>
                  navigation.navigate('InvoicePage', { user_id, client_id, project_id: item.id || item._id }),
              }}
              onDelete={() => handleDeleteProject(item.id || item._id)}
            />
          )}
        />
      )}

      {/* Add Project Modal */}
      <Modal visible={showForm} transparent animationType="slide">
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>
          <View style={styles.modalOverlay}>
            <ScrollView>
              <View style={[styles.modalCard, { backgroundColor: cardBg }]}>
                <View style={styles.modalHeader}>
                  <Text style={[styles.modalTitle, { color: textColor }]}>Add Project</Text>
                  <TouchableOpacity onPress={() => setShowForm(false)}>
                    <Feather name="x" size={22} color={darkMode ? '#9ca3af' : '#6b7280'} />
                  </TouchableOpacity>
                </View>

                <Text style={[styles.fieldLabel, { color: darkMode ? '#d1d5db' : '#374151' }]}>Project Name *</Text>
                <TextInput
                  style={[styles.fieldInput, { backgroundColor: darkMode ? '#374151' : '#f9fafb', borderColor: inputBorder, color: textColor }]}
                  value={projectName}
                  onChangeText={setProjectName}
                  placeholder="Project name"
                  placeholderTextColor={darkMode ? '#6b7280' : '#9ca3af'}
                />

                <Text style={[styles.fieldLabel, { color: darkMode ? '#d1d5db' : '#374151' }]}>Description</Text>
                <TextInput
                  style={[styles.fieldInput, { backgroundColor: darkMode ? '#374151' : '#f9fafb', borderColor: inputBorder, color: textColor, height: 80 }]}
                  value={projectDescription}
                  onChangeText={setProjectDescription}
                  placeholder="Project description"
                  placeholderTextColor={darkMode ? '#6b7280' : '#9ca3af'}
                  multiline
                />

                <Text style={[styles.fieldLabel, { color: darkMode ? '#d1d5db' : '#374151' }]}>Deadline * (YYYY-MM-DD)</Text>
                <TextInput
                  style={[styles.fieldInput, { backgroundColor: darkMode ? '#374151' : '#f9fafb', borderColor: inputBorder, color: textColor }]}
                  value={projectDeadline}
                  onChangeText={setProjectDeadline}
                  placeholder="2025-12-31"
                  placeholderTextColor={darkMode ? '#6b7280' : '#9ca3af'}
                />

                <View style={styles.modalBtns}>
                  <TouchableOpacity onPress={() => setShowForm(false)} style={[styles.cancelBtn, { backgroundColor: darkMode ? '#374151' : '#f3f4f6' }]}>
                    <Text style={{ color: darkMode ? '#d1d5db' : '#374151' }}>Cancel</Text>
                  </TouchableOpacity>
                  <TouchableOpacity onPress={handleAddProject} style={styles.submitBtn} disabled={submitting}>
                    {submitting ? <ActivityIndicator color="#fff" size="small" /> : <Text style={{ color: '#fff', fontWeight: '600' }}>Add</Text>}
                  </TouchableOpacity>
                </View>
              </View>
            </ScrollView>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  header: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 14, borderBottomWidth: 1, gap: 12 },
  backBtn: { padding: 4 },
  headerTitle: { fontSize: 18, fontWeight: 'bold' },
  headerSubtitle: { fontSize: 13, marginTop: 2 },
  addBtn: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 12, paddingVertical: 8, backgroundColor: '#4f46e5', borderRadius: 8 },
  addBtnText: { color: '#fff', fontWeight: '600', fontSize: 13 },
  controls: { flexDirection: 'row', gap: 8, paddingHorizontal: 16, paddingVertical: 10, alignItems: 'center' },
  searchRow: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 10, paddingVertical: 8, borderRadius: 8, borderWidth: 1 },
  searchInput: { flex: 1, fontSize: 13 },
  sortBtn: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 10, paddingVertical: 8, borderRadius: 8 },
  sortBtnText: { fontSize: 13, fontWeight: '500' },
  listContent: { paddingHorizontal: 16, paddingBottom: 20, paddingTop: 4 },
  empty: { alignItems: 'center', paddingTop: 60 },
  modalOverlay: { flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(0,0,0,0.4)' },
  modalCard: { borderTopLeftRadius: 20, borderTopRightRadius: 20, padding: 20, paddingBottom: 40 },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
  modalTitle: { fontSize: 20, fontWeight: 'bold' },
  fieldLabel: { fontSize: 13, fontWeight: '500', marginBottom: 6 },
  fieldInput: { borderRadius: 8, borderWidth: 1, paddingHorizontal: 12, paddingVertical: 10, fontSize: 14, marginBottom: 14 },
  modalBtns: { flexDirection: 'row', gap: 10, marginTop: 4 },
  cancelBtn: { flex: 1, paddingVertical: 12, borderRadius: 8, alignItems: 'center' },
  submitBtn: { flex: 1, paddingVertical: 12, borderRadius: 8, alignItems: 'center', backgroundColor: '#3b82f6' },
});