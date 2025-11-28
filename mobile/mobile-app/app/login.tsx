/**
 * Écran de connexion - Design moderne et élégant
 */

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  Animated,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import { Image } from 'react-native';
import { useRouter } from 'expo-router';
import { useAuth } from '@/contexts/AuthContext';
import { authApiService } from '@/services/authApi';

export default function LoginScreen() {
  const router = useRouter();
  const { login } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [backendStatus, setBackendStatus] = useState<'checking' | 'online' | 'offline'>('checking');
  const [error, setError] = useState<string | null>(null);
  const [emailError, setEmailError] = useState<string | null>(null);
  const fadeAnim = React.useRef(new Animated.Value(0)).current;
  const scaleAnim = React.useRef(new Animated.Value(0.95)).current;

  useEffect(() => {
    const checkBackend = async () => {
      try {
        const isOnline = await authApiService.healthCheck();
        setBackendStatus(isOnline ? 'online' : 'offline');
      } catch {
        setBackendStatus('offline');
      }
    };
    checkBackend();

    Animated.spring(scaleAnim, {
      toValue: 1,
      useNativeDriver: true,
      tension: 50,
      friction: 7,
    }).start();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (error || emailError) {
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }).start();
    } else {
      Animated.timing(fadeAnim, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true,
      }).start();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [error, emailError]);

  const handleEmailChange = (text: string) => {
    setEmail(text);
    if (emailError) setEmailError(null);
    if (error) setError(null);
  };

  const handlePasswordChange = (text: string) => {
    setPassword(text);
    if (error) setError(null);
  };

  const handleLogin = async () => {
    setError(null);
    setEmailError(null);

    if (!email.trim() || !password.trim()) {
      setError('Veuillez remplir tous les champs');
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email.trim())) {
      setEmailError('Veuillez entrer une adresse email valide');
      return;
    }

    setLoading(true);
    try {
      const response = await authApiService.login({
        email: email.trim(),
        password: password,
      });

      await login(response.token, response.user);
      await new Promise(resolve => setTimeout(resolve, 300));
      router.replace('/(tabs)');
    } catch (error: any) {
      const errorMessage = error.message || 'Une erreur est survenue lors de la connexion';
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      <StatusBar style="auto" />
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardView}
      >
        <Animated.View 
          style={[
            styles.content,
            { transform: [{ scale: scaleAnim }] }
          ]}
        >
          <View style={styles.header}>
            <View style={styles.logoContainer}>
              <Image 
                source={require('@/assets/images/logo-kadducare.png')} 
                style={styles.logo}
                resizeMode="contain"
              />
            </View>
            <Text style={styles.title}>KadduCare</Text>
            <Text style={styles.subtitle}>Accédez à votre espace infirmier</Text>
          </View>

          <View style={styles.form}>
            <View style={styles.inputWrapper}>
              <View style={[
                styles.inputContainer,
                emailError && styles.inputContainerError
              ]}>
                <Ionicons 
                  name="mail-outline" 
                  size={20} 
                  color={emailError ? '#FF3B30' : '#8E8E93'} 
                  style={styles.inputIcon} 
                />
                <TextInput
                  style={styles.input}
                  placeholder="Email"
                  placeholderTextColor="#8E8E93"
                  value={email}
                  onChangeText={handleEmailChange}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  autoComplete="email"
                  editable={!loading}
                />
              </View>
              {emailError && (
                <Animated.View style={[styles.errorContainer, { opacity: fadeAnim }]}>
                  <Ionicons name="alert-circle" size={14} color="#FF3B30" />
                  <Text style={styles.errorText}>{emailError}</Text>
                </Animated.View>
              )}
            </View>

            <View style={styles.inputWrapper}>
              <View style={[
                styles.inputContainer,
                error && !emailError && styles.inputContainerError
              ]}>
                <Ionicons 
                  name="lock-closed-outline" 
                  size={20} 
                  color={error && !emailError ? '#FF3B30' : '#8E8E93'} 
                  style={styles.inputIcon} 
                />
                <TextInput
                  style={styles.input}
                  placeholder="Mot de passe"
                  placeholderTextColor="#8E8E93"
                  value={password}
                  onChangeText={handlePasswordChange}
                  secureTextEntry={!showPassword}
                  autoCapitalize="none"
                  autoComplete="password"
                  editable={!loading}
                />
                <TouchableOpacity
                  onPress={() => setShowPassword(!showPassword)}
                  style={styles.eyeIcon}
                  hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                >
                  <Ionicons
                    name={showPassword ? 'eye-outline' : 'eye-off-outline'}
                    size={20}
                    color="#8E8E93"
                  />
                </TouchableOpacity>
              </View>
            </View>

            {error && !emailError && (
              <Animated.View style={[styles.errorMessageContainer, { opacity: fadeAnim }]}>
                <Ionicons name="alert-circle" size={18} color="#FF3B30" />
                <Text style={styles.errorMessageText}>{error}</Text>
              </Animated.View>
            )}

            <TouchableOpacity
              style={[styles.loginButton, loading && styles.loginButtonDisabled]}
              onPress={handleLogin}
              disabled={loading}
              activeOpacity={0.8}
            >
              {loading ? (
                <ActivityIndicator color="#FFFFFF" />
              ) : (
                <Text style={styles.loginButtonText}>Se connecter</Text>
              )}
            </TouchableOpacity>

            {backendStatus === 'offline' && (
              <View style={styles.warningContainer}>
                <Ionicons name="warning-outline" size={16} color="#FF9500" />
                <Text style={styles.warningText}>
                  Backend non accessible.{'\n'}
                  Vérifiez que le backend est démarré et que l&apos;IP dans app.json est correcte.
                </Text>
              </View>
            )}
          </View>
        </Animated.View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FAFAFA',
  },
  keyboardView: {
    flex: 1,
  },
  content: {
    flex: 1,
    paddingHorizontal: 28,
    justifyContent: 'center',
  },
  header: {
    alignItems: 'center',
    marginBottom: 48,
  },
  logoContainer: {
    width: 120,
    height: 120,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
  },
  logo: {
    width: '100%',
    height: '100%',
  },
  title: {
    fontSize: 34,
    fontWeight: '700',
    color: '#1A1A1A',
    marginBottom: 8,
    letterSpacing: -0.5,
  },
  subtitle: {
    fontSize: 16,
    color: '#6E6E73',
    textAlign: 'center',
    lineHeight: 22,
  },
  form: {
    width: '100%',
  },
  inputWrapper: {
    marginBottom: 20,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    marginBottom: 4,
    paddingHorizontal: 18,
    height: 58,
    borderWidth: 1.5,
    borderColor: '#E5E5EA',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 2,
  },
  inputContainerError: {
    backgroundColor: '#FFF5F5',
    borderColor: '#FF3B30',
  },
  inputIcon: {
    marginRight: 12,
  },
  input: {
    flex: 1,
    fontSize: 16,
    color: '#1A1A1A',
    fontWeight: '400',
  },
  eyeIcon: {
    padding: 4,
  },
  loginButton: {
    backgroundColor: '#007AFF',
    borderRadius: 16,
    height: 58,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 8,
    shadowColor: '#007AFF',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  loginButtonDisabled: {
    opacity: 0.6,
  },
  loginButtonText: {
    color: '#FFFFFF',
    fontSize: 17,
    fontWeight: '600',
    letterSpacing: 0.3,
  },
  warningContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFF8E1',
    padding: 14,
    borderRadius: 12,
    marginTop: 20,
    gap: 10,
    borderLeftWidth: 3,
    borderLeftColor: '#FF9500',
  },
  warningText: {
    fontSize: 13,
    color: '#FF9500',
    flex: 1,
    lineHeight: 18,
    fontWeight: '500',
  },
  errorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 6,
    marginLeft: 4,
    gap: 6,
  },
  errorText: {
    fontSize: 13,
    color: '#FF3B30',
    flex: 1,
    lineHeight: 18,
  },
  errorMessageContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF5F5',
    padding: 14,
    borderRadius: 12,
    marginTop: 8,
    marginBottom: 8,
    gap: 10,
    borderLeftWidth: 3,
    borderLeftColor: '#FF3B30',
  },
  errorMessageText: {
    fontSize: 14,
    color: '#FF3B30',
    flex: 1,
    lineHeight: 20,
    fontWeight: '500',
  },
});
