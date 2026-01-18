/**
 * QuickQuote App Entry Point
 * Voice-to-Invoice Mobile Application
 * With screen navigation
 */

import React, { useEffect, useState } from 'react';
import { StyleSheet, Text, View, ActivityIndicator } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { initDatabase } from './src/database';
import { validateEnv } from './src/config/env';
import { COLORS, TYPOGRAPHY, SPACING } from './src/constants/theme';
import { HomeScreen, ProcessingScreen, EditorScreen, SettingsScreen, DraftsScreen, FeedbackScreen } from './src/screens';
import type { ParsedInvoice } from './src/types/invoice';
import type { DraftRecord } from './src/types/database';

/**
 * App initialization states
 */
type AppState = 'loading' | 'ready' | 'error';

/**
 * Screen types
 */
type Screen = 'home' | 'processing' | 'editor' | 'settings' | 'drafts' | 'feedback';

/**
 * Screen params
 */
interface ScreenParams {
  audioUri?: string;
  duration?: string;
  invoice?: ParsedInvoice;
  draftId?: string;
}

export default function App() {
  const [appState, setAppState] = useState<AppState>('loading');
  const [errorMessage, setErrorMessage] = useState<string>('');
  const [currentScreen, setCurrentScreen] = useState<Screen>('home');
  const [screenParams, setScreenParams] = useState<ScreenParams>({});

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

  /**
   * Navigate to processing screen
   */
  function navigateToProcessing(audioUri: string, duration: string) {
    setScreenParams({ audioUri, duration });
    setCurrentScreen('processing');
  }

  /**
   * Navigate back to home
   */
  function navigateToHome() {
    setScreenParams({});
    setCurrentScreen('home');
  }

  /**
   * Navigate to settings
   */
  function navigateToSettings() {
    setCurrentScreen('settings');
  }

  /**
   * Navigate to drafts
   */
  function navigateToDrafts() {
    setCurrentScreen('drafts');
  }

  /**
   * Navigate to feedback
   */
  function navigateToFeedback() {
    setCurrentScreen('feedback');
  }

  /**
   * Handle draft selection - navigate to home with draft for replay
   */
  function handleDraftSelect(draft: DraftRecord) {
    if (draft.audioPath) {
      const durationStr = formatDuration(draft.audioDuration || 0);
      setScreenParams({
        audioUri: draft.audioPath,
        duration: durationStr,
        draftId: draft.id
      });
      // Navigate to home with draft loaded for replay
      setCurrentScreen('home');
    }
  }

  /**
   * Format duration ms to MM:SS
   */
  function formatDuration(ms: number): string {
    const totalSeconds = Math.floor(ms / 1000);
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  }

  /**
   * Handle processing success
   */
  function handleProcessingSuccess(invoice: ParsedInvoice) {
    console.log('[App] Processing success:', invoice);
    setScreenParams({ ...screenParams, invoice });
    setCurrentScreen('editor');
  }

  /**
   * Handle save invoice
   */
  function handleSaveInvoice(invoice: ParsedInvoice) {
    console.log('[App] Invoice saved:', invoice);
    // TODO: Navigate to history/dashboard
    setScreenParams({});
    setCurrentScreen('home');
  }

  /**
   * Handle retry processing
   */
  function handleRetry() {
    // Keep params and restart processing
    const { audioUri, duration } = screenParams;
    if (audioUri && duration) {
      navigateToProcessing(audioUri, duration);
    }
  }

  if (appState === 'loading') {
    return (
      <SafeAreaProvider>
        <View style={styles.container}>
          <ActivityIndicator size="large" color={COLORS.primary} />
          <Text style={styles.loadingText}>Loading QuickQuote...</Text>
          <StatusBar style="auto" />
        </View>
      </SafeAreaProvider>
    );
  }

  if (appState === 'error') {
    return (
      <SafeAreaProvider>
        <View style={styles.container}>
          <Text style={styles.errorTitle}>⚠️ Initialization Error</Text>
          <Text style={styles.errorMessage}>{errorMessage}</Text>
          <StatusBar style="auto" />
        </View>
      </SafeAreaProvider>
    );
  }

  // Ready state - render screens
  return (
    <SafeAreaProvider>
      {currentScreen === 'home' && (
        <HomeScreen
          onNavigateToProcessing={navigateToProcessing}
          onNavigateToSettings={navigateToSettings}
          onNavigateToDrafts={navigateToDrafts}
          preloadedDraft={screenParams.draftId ? {
            audioUri: screenParams.audioUri!,
            duration: screenParams.duration!,
            draftId: screenParams.draftId,
          } : undefined}
          onClearPreloadedDraft={() => setScreenParams({})}
        />
      )}
      {currentScreen === 'processing' && screenParams.audioUri && (
        <ProcessingScreen
          audioUri={screenParams.audioUri}
          duration={screenParams.duration || '00:00'}
          onBack={navigateToHome}
          onSuccess={handleProcessingSuccess}
          onRetry={handleRetry}
        />
      )}
      {currentScreen === 'editor' && screenParams.invoice && (
        <EditorScreen
          initialInvoice={screenParams.invoice}
          onBack={navigateToHome}
          onSave={handleSaveInvoice}
        />
      )}
      {currentScreen === 'settings' && (
        <SettingsScreen
          onNavigateBack={navigateToHome}
          onNavigateToFeedback={navigateToFeedback}
        />
      )}
      {currentScreen === 'drafts' && (
        <DraftsScreen
          onNavigateBack={navigateToHome}
          onNavigateToProcessing={handleDraftSelect}
        />
      )}
      {currentScreen === 'feedback' && (
        <FeedbackScreen
          onBack={navigateToSettings}
        />
      )}
    </SafeAreaProvider>
  );
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
