import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  SafeAreaView,
  KeyboardAvoidingView,
  ScrollView,
  Platform,
  StyleSheet,
  StatusBar,
  Alert,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import colors from '../theme/colors';

const PRIMARY_API = 'http://192.168.1.8:8000/api/v1/conductor/login';
const LOCAL_API = Platform.OS === 'android'
  ? 'http://192.168.1.8:8000/api/v1/conductor/login'
  : 'http://localhost:8000/api/v1/conductor/login';

export default function LoginScreen({ navigation }) {
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const handleLogin = async () => {
    const cleanIdentifier = identifier.trim();
    const cleanPassword = password.trim();

    if (!cleanIdentifier) {
      setErrorMsg('Please enter your Mobile Number or Email');
      return;
    }
    if (!cleanPassword) {
      setErrorMsg('Please enter your password');
      return;
    }

    setLoading(true);
    setErrorMsg('');

    try {
      let response;
      const payload = { email: cleanIdentifier, password: cleanPassword };

      try {
        response = await fetch(PRIMARY_API, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });

      } catch (err) {
        // Fallback to local dev server if online domain is unreachable
        setErrorMsg('Connection failed. Please check internet connectivity and try again.');
      }

      const data = await response.json();
      console.log(data)

      if (!response.ok || !data.success) {
        const message = data.detail || data.message || 'Invalid mobile/email or password';
        setErrorMsg(message);
        return;
      }

      // Save session to AsyncStorage
      await AsyncStorage.setItem('@conductor_session', JSON.stringify(data.conductor));
      if (data.assigned_bus) {
        await AsyncStorage.setItem('@conductor_assigned_bus', JSON.stringify(data.assigned_bus));
      } else {
        await AsyncStorage.removeItem('@conductor_assigned_bus');
      }

      // Navigate to Shift Selection / Assigned Bus screen
      navigation.replace('ShiftSelect', {
        conductor: data.conductor,
        assignedBus: data.assigned_bus,
      });
    } catch (error) {
      setErrorMsg('Connection failed. Please check internet connectivity and try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="light-content" backgroundColor={colors.primary} />
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={styles.container}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContainer}
          keyboardShouldPersistTaps="handled"
        >
          {/* Top Brand Header */}
          <View style={styles.brandHeader}>
            <View style={styles.logoBadge}>
              <Text style={styles.logoText}>🚌</Text>
            </View>
            <Text style={styles.brandTitle}>SHREE MATESHWARI</Text>
            <Text style={styles.brandSubtitle}>BUS SERVICE • CONDUCTOR APP</Text>
            <View style={styles.roleTag}>
              <View style={styles.roleDot} />
              <Text style={styles.roleTagText}>AUTHORIZED CONDUCTOR LOGIN</Text>
            </View>
          </View>

          {/* Login Card */}
          <View style={styles.card}>
            <Text style={styles.cardHeading}>Sign In to Your Account</Text>
            <Text style={styles.cardDescription}>
              Enter your registered Mobile Number or Email to access your assigned bus shift.
            </Text>

            {errorMsg ? (
              <View style={styles.errorBox}>
                <Text style={styles.errorIcon}>⚠️</Text>
                <Text style={styles.errorText}>{errorMsg}</Text>
              </View>
            ) : null}

            {/* Identifier Input (Mobile or Email) */}
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>MOBILE NUMBER OR EMAIL</Text>
              <TextInput
                style={styles.input}
                placeholder="e.g. 9876543210 or conductor@bus.com"
                placeholderTextColor={colors.textSubtle}
                value={identifier}
                onChangeText={(val) => {
                  setIdentifier(val);
                  if (errorMsg) setErrorMsg('');
                }}
                autoCapitalize="none"
                autoCorrect={false}
                keyboardType="email-address"
                editable={!loading}
              />
            </View>

            {/* Password Input */}
            <View style={styles.inputGroup}>
              <View style={styles.labelRow}>
                <Text style={styles.inputLabel}>PASSWORD</Text>
                <TouchableOpacity
                  onPress={() => setShowPassword(!showPassword)}
                  hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                >
                  <Text style={styles.showPassText}>
                    {showPassword ? 'Hide' : 'Show'}
                  </Text>
                </TouchableOpacity>
              </View>
              <TextInput
                style={styles.input}
                placeholder="Enter your password"
                placeholderTextColor={colors.textSubtle}
                value={password}
                onChangeText={(val) => {
                  setPassword(val);
                  if (errorMsg) setErrorMsg('');
                }}
                secureTextEntry={!showPassword}
                autoCapitalize="none"
                autoCorrect={false}
                editable={!loading}
              />
            </View>

            {/* Submit Button */}
            <TouchableOpacity
              style={[styles.loginButton, loading && styles.loginButtonDisabled]}
              onPress={handleLogin}
              disabled={loading}
              activeOpacity={0.85}
            >
              {loading ? (
                <View style={styles.loadingRow}>
                  <ActivityIndicator size="small" color="#ffffff" />
                  <Text style={styles.loginButtonText}>Authenticating...</Text>
                </View>
              ) : (
                <Text style={styles.loginButtonText}>LOGIN AS CONDUCTOR ›</Text>
              )}
            </TouchableOpacity>

            <View style={styles.helpBox}>
              <Text style={styles.helpText}>
                🔐 Only assigned buses for your profile will be accessible after login. For credentials, contact dispatch/admin.
              </Text>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.primary,
  },
  container: {
    flex: 1,
  },
  scrollContainer: {
    flexGrow: 1,
    justifyContent: 'center',
    padding: 20,
  },
  brandHeader: {
    alignItems: 'center',
    marginBottom: 26,
    paddingTop: 10,
  },
  logoBadge: {
    width: 68,
    height: 68,
    borderRadius: 22,
    backgroundColor: colors.primarySurface,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 14,
    borderWidth: 1,
    borderColor: 'rgba(99, 102, 241, 0.4)',
    shadowColor: colors.shadow,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  logoText: {
    fontSize: 34,
  },
  brandTitle: {
    fontSize: 22,
    fontWeight: '900',
    color: '#ffffff',
    letterSpacing: 1.5,
  },
  brandSubtitle: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.primaryMuted,
    letterSpacing: 1.2,
    marginTop: 4,
  },
  roleTag: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(16, 185, 129, 0.15)',
    borderWidth: 1,
    borderColor: 'rgba(16, 185, 129, 0.35)',
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 20,
    marginTop: 12,
  },
  roleDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: colors.success,
    marginRight: 6,
  },
  roleTagText: {
    color: colors.successBright,
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.8,
  },
  card: {
    backgroundColor: colors.surface,
    borderRadius: 24,
    padding: 24,
    shadowColor: colors.shadow,
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.25,
    shadowRadius: 16,
    elevation: 8,
  },
  cardHeading: {
    fontSize: 19,
    fontWeight: '800',
    color: colors.textStrong,
    marginBottom: 6,
  },
  cardDescription: {
    fontSize: 12,
    color: colors.textMuted,
    lineHeight: 18,
    marginBottom: 20,
  },
  errorBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fee2e2',
    borderWidth: 1,
    borderColor: '#fca5a5',
    padding: 12,
    borderRadius: 12,
    marginBottom: 16,
  },
  errorIcon: {
    fontSize: 16,
    marginRight: 8,
  },
  errorText: {
    flex: 1,
    color: '#b91c1c',
    fontSize: 12,
    fontWeight: '600',
  },
  inputGroup: {
    marginBottom: 18,
  },
  labelRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  inputLabel: {
    fontSize: 11,
    fontWeight: '800',
    color: colors.textBody,
    letterSpacing: 0.6,
    marginBottom: 8,
  },
  showPassText: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.primaryText,
    marginBottom: 8,
  },
  input: {
    backgroundColor: colors.background,
    borderWidth: 1.5,
    borderColor: colors.border,
    borderRadius: 14,
    paddingHorizontal: 16,
    paddingVertical: 13,
    fontSize: 14,
    color: colors.text,
    fontWeight: '600',
  },
  loginButton: {
    backgroundColor: colors.primarySurface,
    paddingVertical: 15,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 8,
    shadowColor: colors.primaryText,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 8,
    elevation: 4,
  },
  loginButtonDisabled: {
    opacity: 0.7,
  },
  loadingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  loginButtonText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '800',
    letterSpacing: 0.8,
    marginLeft: 6,
  },
  helpBox: {
    marginTop: 20,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  helpText: {
    fontSize: 11,
    color: colors.textSubtle,
    lineHeight: 16,
    textAlign: 'center',
  },
});
