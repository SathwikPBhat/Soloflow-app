import { Feather } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import React, { useState } from 'react';
import {
    ActivityIndicator,
    KeyboardAvoidingView,
    Platform,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Toast from 'react-native-toast-message';
import { API_BASE_URL } from '../utils/config';
import { useTheme } from '../contexts/ThemeContext';

export default function Login({ navigation }) {
  const { darkMode, toggleDarkMode } = useTheme();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    if (!email || !password) {
      Toast.show({ type: 'error', text1: 'Please fill all fields' });
      return;
    }
    setLoading(true);
    try {
      const response = await fetch(`${API_BASE_URL}/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ useremail: email, password }),
      });
      const res = await response.json();
      if (!response.ok) {
        Toast.show({ type: 'error', text1: res.message || 'Login failed' });
        return;
      }
      await AsyncStorage.setItem('token', res.token);
      await AsyncStorage.setItem('user_id', res.user._id);
      Toast.show({ type: 'success', text1: res.message || 'Logged in!' });
      navigation.reset({ index: 0, routes: [{ name: 'Main' }] });
    } catch (err) {
      Toast.show({ type: 'error', text1: err.message || 'An error occurred' });
    } finally {
      setLoading(false);
    }
  };

  const bg = darkMode ? '#111827' : '#eff6ff';
  const cardBg = darkMode ? '#1f2937' : '#ffffff';
  const inputBg = darkMode ? '#374151' : '#f9fafb';
  const inputBorder = darkMode ? '#4b5563' : '#d1d5db';
  const textColor = darkMode ? '#f9fafb' : '#1f2937';
  const labelColor = darkMode ? '#d1d5db' : '#374151';

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: bg }]}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={{ flex: 1 }}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
        >
          {/* Dark mode toggle */}
          <View style={styles.topBar}>
            <TouchableOpacity onPress={toggleDarkMode} style={styles.themeBtn}>
              <Feather
                name={darkMode ? 'sun' : 'moon'}
                size={20}
                color={darkMode ? '#fde68a' : '#374151'}
              />
            </TouchableOpacity>
          </View>

          <View
            style={[
              styles.card,
              {
                backgroundColor: cardBg,
                borderColor: darkMode ? '#374151' : '#bfdbfe',
              },
            ]}
          >
            <Text
              style={[
                styles.title,
                { color: darkMode ? '#ffffff' : '#1e40af' },
              ]}
            >
              Login to SoloFlow
            </Text>

            {/* Email */}
            <View style={styles.fieldGroup}>
              <Text style={[styles.label, { color: labelColor }]}>Email</Text>
              <TextInput
                style={[
                  styles.input,
                  {
                    backgroundColor: inputBg,
                    borderColor: inputBorder,
                    color: textColor,
                  },
                ]}
                value={email}
                onChangeText={setEmail}
                keyboardType="email-address"
                autoCapitalize="none"
                placeholder="Enter your email"
                placeholderTextColor={darkMode ? '#6b7280' : '#9ca3af'}
              />
            </View>

            {/* Password */}
            <View style={styles.fieldGroup}>
              <Text style={[styles.label, { color: labelColor }]}>
                Password
              </Text>
              <View style={styles.passwordRow}>
                <TextInput
                  style={[
                    styles.input,
                    styles.passwordInput,
                    {
                      backgroundColor: inputBg,
                      borderColor: inputBorder,
                      color: textColor,
                    },
                  ]}
                  value={password}
                  onChangeText={setPassword}
                  secureTextEntry={!showPassword}
                  placeholder="Enter your password"
                  placeholderTextColor={darkMode ? '#6b7280' : '#9ca3af'}
                />
                <TouchableOpacity
                  style={styles.eyeBtn}
                  onPress={() => setShowPassword(!showPassword)}
                >
                  <Feather
                    name={showPassword ? 'eye-off' : 'eye'}
                    size={20}
                    color={darkMode ? '#9ca3af' : '#6b7280'}
                  />
                </TouchableOpacity>
              </View>
            </View>

            {/* Submit */}
            <TouchableOpacity
              style={[
                styles.submitBtn,
                { backgroundColor: darkMode ? '#2563eb' : '#3b82f6' },
              ]}
              onPress={handleSubmit}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={styles.submitBtnText}>Log In</Text>
              )}
            </TouchableOpacity>

            <View style={styles.linkRow}>
              <Text
                style={{
                  color: darkMode ? '#9ca3af' : '#6b7280',
                  fontSize: 14,
                }}
              >
                Don't have an account?{' '}
              </Text>
              <TouchableOpacity onPress={() => navigation.navigate('Register')}>
                <Text
                  style={{
                    color: '#3b82f6',
                    fontWeight: '600',
                    fontSize: 14,
                  }}
                >
                  Register
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  scrollContent: {
    flexGrow: 1,
    padding: 20,
    justifyContent: 'center',
  },
  topBar: { alignItems: 'flex-end', marginBottom: 16 },
  themeBtn: { padding: 8, borderRadius: 20 },
  card: {
    borderRadius: 20,
    padding: 24,
    borderWidth: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 6,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 24,
  },
  fieldGroup: { marginBottom: 16 },
  label: { fontSize: 14, fontWeight: '500', marginBottom: 6 },
  input: {
    borderRadius: 10,
    borderWidth: 1,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 15,
  },
  passwordRow: { position: 'relative' },
  passwordInput: { paddingRight: 46 },
  eyeBtn: { position: 'absolute', right: 12, top: 12 },
  submitBtn: {
    paddingVertical: 14,
    borderRadius: 10,
    alignItems: 'center',
    marginTop: 8,
    marginBottom: 16,
  },
  submitBtnText: { color: '#fff', fontWeight: '600', fontSize: 16 },
  linkRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    flexWrap: 'wrap',
  },
});