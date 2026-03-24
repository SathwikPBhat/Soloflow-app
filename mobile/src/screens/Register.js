import { Feather } from '@expo/vector-icons';
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

const PASSWORD_RULES = [
  { label: 'At least 8 characters', test: (p) => p.length >= 8 },
  { label: 'At least one uppercase letter', test: (p) => /[A-Z]/.test(p) },
  { label: 'At least one lowercase letter', test: (p) => /[a-z]/.test(p) },
  { label: 'At least one number', test: (p) => /\d/.test(p) },
  { label: 'At least one special character', test: (p) => /[\W_]/.test(p) },
];

export default function Register({ navigation }) {
  const { darkMode, toggleDarkMode } = useTheme();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [company, setCompany] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [passwordFocused, setPasswordFocused] = useState(false);
  const [loading, setLoading] = useState(false);

  const allValid = PASSWORD_RULES.every((r) => r.test(password));

  const handleSubmit = async () => {
    if (!allValid) {
      Toast.show({ type: 'error', text1: 'Please fix password requirements' });
      return;
    }
    setLoading(true);
    try {
      const response = await fetch(`${API_BASE_URL}/register`, {
        method: 'POST',
        headers: { 'Content-type': 'application/json' },
        body: JSON.stringify({
          user_name: name,
          user_email: email,
          user_password: password,
          user_company: company,
        }),
      });
      const res = await response.json();
      if (response.status === 201) {
        Toast.show({ type: 'success', text1: res.message || 'Registered!' });
        navigation.navigate('Login');
      } else {
        Toast.show({ type: 'error', text1: res.message || 'Registration failed' });
      }
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
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>
        <ScrollView contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">
          <View style={styles.topBar}>
            <TouchableOpacity onPress={toggleDarkMode} style={styles.themeBtn}>
              <Feather name={darkMode ? 'sun' : 'moon'} size={20} color={darkMode ? '#fde68a' : '#374151'} />
            </TouchableOpacity>
          </View>

          <View style={[styles.card, { backgroundColor: cardBg, borderColor: darkMode ? '#374151' : '#bfdbfe' }]}>
            <Text style={[styles.title, { color: darkMode ? '#ffffff' : '#1e40af' }]}>
              Create your SoloFlow Account
            </Text>

            {/* Full Name */}
            <View style={styles.fieldGroup}>
              <Text style={[styles.label, { color: labelColor }]}>Full Name</Text>
              <TextInput
                style={[styles.input, { backgroundColor: inputBg, borderColor: inputBorder, color: textColor }]}
                value={name}
                onChangeText={setName}
                placeholder="Enter your full name"
                placeholderTextColor={darkMode ? '#6b7280' : '#9ca3af'}
              />
            </View>

            {/* Email */}
            <View style={styles.fieldGroup}>
              <Text style={[styles.label, { color: labelColor }]}>Email</Text>
              <TextInput
                style={[styles.input, { backgroundColor: inputBg, borderColor: inputBorder, color: textColor }]}
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
              <Text style={[styles.label, { color: labelColor }]}>Password</Text>
              <View style={styles.passwordRow}>
                <TextInput
                  style={[styles.input, styles.passwordInput, { backgroundColor: inputBg, borderColor: inputBorder, color: textColor }]}
                  value={password}
                  onChangeText={setPassword}
                  onFocus={() => setPasswordFocused(true)}
                  secureTextEntry={!showPassword}
                  placeholder="Create a password"
                  placeholderTextColor={darkMode ? '#6b7280' : '#9ca3af'}
                />
                <TouchableOpacity style={styles.eyeBtn} onPress={() => setShowPassword(!showPassword)}>
                  <Feather name={showPassword ? 'eye-off' : 'eye'} size={20} color={darkMode ? '#9ca3af' : '#6b7280'} />
                </TouchableOpacity>
              </View>

              {/* Password rules */}
              {passwordFocused && password.length > 0 && (
                <View style={[styles.rulesBox, { backgroundColor: darkMode ? '#374151' : '#f0fdf4' }]}>
                  {PASSWORD_RULES.map((rule) => {
                    const passed = rule.test(password);
                    return (
                      <View key={rule.label} style={styles.ruleRow}>
                        <Text style={{ color: passed ? '#22c55e' : '#ef4444', fontSize: 13 }}>
                          {passed ? '✔' : '✘'} {rule.label}
                        </Text>
                      </View>
                    );
                  })}
                </View>
              )}
            </View>

            {/* Company */}
            <View style={styles.fieldGroup}>
              <Text style={[styles.label, { color: labelColor }]}>Company Name</Text>
              <TextInput
                style={[styles.input, { backgroundColor: inputBg, borderColor: inputBorder, color: textColor }]}
                value={company}
                onChangeText={setCompany}
                placeholder="Your company or freelance name"
                placeholderTextColor={darkMode ? '#6b7280' : '#9ca3af'}
              />
            </View>

            {/* Submit */}
            <TouchableOpacity
              style={[styles.submitBtn, { backgroundColor: darkMode ? '#4f46e5' : '#3b82f6', opacity: loading ? 0.7 : 1 }]}
              onPress={handleSubmit}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={styles.submitBtnText}>Sign Up</Text>
              )}
            </TouchableOpacity>

            <View style={styles.linkRow}>
              <Text style={{ color: darkMode ? '#9ca3af' : '#6b7280', fontSize: 14 }}>
                Already have an account?{' '}
              </Text>
              <TouchableOpacity onPress={() => navigation.navigate('Login')}>
                <Text style={{ color: '#3b82f6', fontWeight: '600', fontSize: 14 }}>Login</Text>
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
  scrollContent: { flexGrow: 1, padding: 20, justifyContent: 'center' },
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
  title: { fontSize: 22, fontWeight: 'bold', textAlign: 'center', marginBottom: 24 },
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
  rulesBox: {
    marginTop: 8,
    borderRadius: 8,
    padding: 10,
    gap: 4,
  },
  ruleRow: { paddingVertical: 2 },
  submitBtn: {
    paddingVertical: 14,
    borderRadius: 10,
    alignItems: 'center',
    marginTop: 8,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 6,
    elevation: 4,
  },
  submitBtnText: { color: '#fff', fontWeight: '600', fontSize: 16 },
  linkRow: { flexDirection: 'row', justifyContent: 'center', flexWrap: 'wrap' },
});