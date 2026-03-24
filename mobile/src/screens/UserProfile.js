import { Feather } from '@expo/vector-icons';
import React, { useEffect, useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    Image,
    KeyboardAvoidingView,
    Platform,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from 'react-native';
import Toast from 'react-native-toast-message';
import AppHeader from '../components/AppHeader';
import { API_BASE_URL } from '../utils/config';
import { useTheme } from '../contexts/ThemeContext';
import { storage } from '../utils/storage';

export default function UserProfile({ navigation }) {
  const { darkMode } = useTheme();
  const [loading, setLoading] = useState(true);
  const [editMode, setEditMode] = useState(false);
  const [userId, setUserId] = useState(null);
  const [token, setToken] = useState(null);

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [company, setCompany] = useState('');
  const [bio, setBio] = useState('');
  const [joined, setJoined] = useState('');

  useEffect(() => {
    const init = async () => {
      const uid = await storage.getItem('user_id');
      const tok = await storage.getItem('token');
      setUserId(uid);
      setToken(tok);
      return { uid, tok };
    };
    init().then(({ uid, tok }) => {
      if (uid && tok) fetchProfile(uid, tok);
    });
  }, []);

  const fetchProfile = async (uid, tok) => {
    try {
      const res = await fetch(`${API_BASE_URL}/user/${uid}`, {
        headers: { Authorization: `Bearer ${tok}` },
      });
      const data = await res.json();
      setName(data.user?.user_name || '');
      setEmail(data.user?.user_email || '');
      setCompany(data.user?.user_company || '');
      setBio(data.user?.user_bio || '');
      setJoined(data.user?.createdAt || '');
    } catch {
      Toast.show({ type: 'error', text1: 'Failed to load profile' });
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/user/${userId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          user_name: name,
          user_email: email,
          user_company: company,
          user_bio: bio,
        }),
      });
      const data = await res.json();
      if (data.user) {
        setName(data.user.user_name || '');
        setEmail(data.user.user_email || '');
        setCompany(data.user.user_company || '');
        setBio(data.user.user_bio || '');
        Toast.show({ type: 'success', text1: 'Profile updated!' });
        setEditMode(false);
      } else {
        Toast.show({ type: 'error', text1: 'Update failed' });
      }
    } catch {
      Toast.show({ type: 'error', text1: 'Error updating profile' });
    }
  };

  const handleLogout = () => {
    Alert.alert('Logout', 'Are you sure you want to logout?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Logout',
        style: 'destructive',
        onPress: async () => {
          await storage.removeItem('token');
          await storage.removeItem('user_id');
          Toast.show({ type: 'success', text1: 'Logged out successfully' });
          navigation.reset({ index: 0, routes: [{ name: 'Auth' }] });
        },
      },
    ]);
  };

  const bg = darkMode ? '#111827' : '#eff6ff';
  const cardBg = darkMode ? '#1f2937' : '#ffffff';
  const textColor = darkMode ? '#f9fafb' : '#111827';
  const labelColor = darkMode ? '#d1d5db' : '#374151';
  const inputBg = darkMode ? '#374151' : '#f9fafb';
  const inputBorder = darkMode ? '#4b5563' : '#dbeafe';
  const subText = darkMode ? '#93c5fd' : '#2563eb';

  if (loading) {
    return (
      <View style={[styles.screen, { backgroundColor: bg }]}>
        <AppHeader />
        <ActivityIndicator size="large" color="#3b82f6" style={{ marginTop: 60 }} />
      </View>
    );
  }

  const avatarUri = `https://ui-avatars.com/api/?background=3b82f6&color=fff&name=${encodeURIComponent(
    name || 'User'
  )}&size=128`;

  return (
    <View style={[styles.screen, { backgroundColor: bg }]}>
      <AppHeader />
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={{ flex: 1 }}
      >
        <ScrollView
          contentContainerStyle={styles.content}
          showsVerticalScrollIndicator={false}
        >
          <View
            style={[
              styles.card,
              {
                backgroundColor: cardBg,
                borderColor: darkMode ? '#374151' : '#dbeafe',
              },
            ]}
          >
            {/* Avatar */}
            <View style={styles.avatarSection}>
              <Image source={{ uri: avatarUri }} style={styles.avatar} />
              <Text style={[styles.profileName, { color: textColor }]}>
                {name}
              </Text>
              <Text style={[styles.profileCompany, { color: subText }]}>
                {company}
              </Text>
              <View style={styles.emailRow}>
                <Feather name="mail" size={14} color={subText} />
                <Text
                  style={[
                    styles.emailText,
                    { color: darkMode ? '#d1d5db' : '#374151' },
                  ]}
                >
                  {email}
                </Text>
              </View>
              {joined && (
                <View style={styles.joinedRow}>
                  <Feather
                    name="lock"
                    size={12}
                    color={darkMode ? '#6b7280' : '#9ca3af'}
                  />
                  <Text
                    style={[
                      styles.joinedText,
                      { color: darkMode ? '#6b7280' : '#9ca3af' },
                    ]}
                  >
                    Joined{' '}
                    {new Date(joined).toLocaleDateString(undefined, {
                      year: 'numeric',
                      month: 'short',
                    })}
                  </Text>
                </View>
              )}
            </View>

            {/* Form Fields */}
            <View style={styles.form}>
              {[
                { label: 'Full Name', value: name, setter: setName, editable: true },
                { label: 'Email', value: email, setter: setEmail, editable: false },
                { label: 'Company', value: company, setter: setCompany, editable: true },
              ].map((f) => (
                <View key={f.label} style={styles.fieldGroup}>
                  <Text style={[styles.fieldLabel, { color: labelColor }]}>
                    {f.label}
                  </Text>
                  <TextInput
                    style={[
                      styles.fieldInput,
                      {
                        backgroundColor: inputBg,
                        borderColor: inputBorder,
                        color: textColor,
                        opacity: editMode && f.editable ? 1 : 0.6,
                      },
                    ]}
                    value={f.value}
                    onChangeText={f.setter}
                    editable={editMode && f.editable}
                  />
                </View>
              ))}

              <View style={styles.fieldGroup}>
                <Text style={[styles.fieldLabel, { color: labelColor }]}>Bio</Text>
                <TextInput
                  style={[
                    styles.fieldInput,
                    {
                      backgroundColor: inputBg,
                      borderColor: inputBorder,
                      color: textColor,
                      height: 80,
                      opacity: editMode ? 1 : 0.6,
                    },
                  ]}
                  value={bio}
                  onChangeText={setBio}
                  multiline
                  editable={editMode}
                  placeholder="Write something about yourself..."
                  placeholderTextColor={darkMode ? '#6b7280' : '#9ca3af'}
                />
              </View>
            </View>

            {/* Buttons */}
            <View
              style={[
                styles.actions,
                { borderTopColor: darkMode ? '#374151' : '#e5e7eb' },
              ]}
            >
              <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout}>
                <Feather name="log-out" size={16} color="#fff" />
                <Text style={styles.logoutBtnText}>Logout</Text>
              </TouchableOpacity>

              {editMode ? (
                <TouchableOpacity style={styles.saveBtn} onPress={handleSave}>
                  <Feather name="save" size={16} color="#fff" />
                  <Text style={styles.saveBtnText}>Save Changes</Text>
                </TouchableOpacity>
              ) : (
                <TouchableOpacity
                  style={styles.editBtn}
                  onPress={() => setEditMode(true)}
                >
                  <Feather name="edit-2" size={16} color="#fff" />
                  <Text style={styles.editBtnText}>Edit Profile</Text>
                </TouchableOpacity>
              )}
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  content: { padding: 16, paddingBottom: 40 },
  card: {
    borderRadius: 24,
    borderWidth: 1,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 16,
    elevation: 8,
  },
  avatarSection: {
    alignItems: 'center',
    paddingTop: 30,
    paddingBottom: 20,
    paddingHorizontal: 20,
  },
  avatar: {
    width: 100,
    height: 100,
    borderRadius: 50,
    borderWidth: 3,
    borderColor: '#3b82f6',
    marginBottom: 12,
  },
  profileName: { fontSize: 26, fontWeight: '800', marginBottom: 4 },
  profileCompany: { fontSize: 14, fontWeight: '600', marginBottom: 8 },
  emailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 6,
  },
  emailText: { fontSize: 14 },
  joinedRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  joinedText: { fontSize: 12 },
  form: { paddingHorizontal: 20, paddingBottom: 16 },
  fieldGroup: { marginBottom: 14 },
  fieldLabel: { fontSize: 13, fontWeight: '600', marginBottom: 6 },
  fieldInput: {
    borderRadius: 10,
    borderWidth: 1,
    paddingHorizontal: 14,
    paddingVertical: 10,
    fontSize: 14,
  },
  actions: {
    flexDirection: 'row',
    gap: 10,
    padding: 20,
    borderTopWidth: 1,
  },
  logoutBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 12,
    backgroundColor: '#ef4444',
    borderRadius: 10,
  },
  logoutBtnText: { color: '#fff', fontWeight: '600' },
  editBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 12,
    backgroundColor: '#3b82f6',
    borderRadius: 10,
  },
  editBtnText: { color: '#fff', fontWeight: '600' },
  saveBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 12,
    backgroundColor: '#22c55e',
    borderRadius: 10,
  },
  saveBtnText: { color: '#fff', fontWeight: '600' },
});