/**
 * QuickQuote App Entry Point
 * Voice-to-Invoice Mobile Application
 */

import React, { useEffect, useState } from 'react';
import { StyleSheet, Text, View, ActivityIndicator } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { initDatabase } from './src/database';
import { validateEnv } from './src/config/env';
import { COLORS, TYPOGRAPHY, SPACING } from './src/constants/theme';
import { HomeScreen } from './src/screens';

/**
 * App initialization states
 */
type AppState = 'loading' | 'ready' | 'error';

export default function App() {
  const [appState, setAppState] = useState<AppState>('loading');
  const [errorMessage, setErrorMessage] = useState<string>('');

  useEffect(() => {
    initializeApp();
  }, []);

  async function initializeApp() {
    try {
      // Validate environment
      const envValidation = validateEnv();
      if (!envValidation.valid) {
        console.warn('Environment validation warnings:', envValidation.missing);
      }

      // Initialize database
      await initDatabase();

      setAppState('ready');
    } catch (error) {
      console.error('App initialization failed:', error);
      setErrorMessage(error instanceof Error ? error.message : 'Unknown error');
      setAppState('error');
    }
  }

  if (appState === 'loading') {
    return (
      <View style={styles.container}>
        <ActivityIndicator size="large" color={COLORS.primary} />
        <Text style={styles.loadingText}>Loading QuickQuote...</Text>
        <StatusBar style="auto" />
      </View>
    );
  }

  if (appState === 'error') {
    return (
      <View style={styles.container}>
        <Text style={styles.errorTitle}>⚠️ Initialization Error</Text>
        <Text style={styles.errorMessage}>{errorMessage}</Text>
        <StatusBar style="auto" />
      </View>
    );
  }

  // Ready state - render HomeScreen
  return <HomeScreen />;
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
    alignItems: 'center',
    justifyContent: 'center',
    padding: SPACING.lg,
  },
  loadingText: {
    ...TYPOGRAPHY.body,
    color: COLORS.text.secondary,
    marginTop: SPACING.md,
  },
  errorTitle: {
    ...TYPOGRAPHY.h2,
    color: COLORS.error,
    marginBottom: SPACING.md,
  },
  errorMessage: {
    ...TYPOGRAPHY.body,
    color: COLORS.text.secondary,
    textAlign: 'center',
  },
});
