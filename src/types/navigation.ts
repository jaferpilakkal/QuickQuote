/**
 * Navigation Types
 * Type-safe navigation for QuickQuote
 */

/**
 * Root stack navigation parameters
 */
export type RootStackParamList = {
    /** Onboarding screens for first-time users */
    Onboarding: undefined;
    /** Main tab navigator */
    Main: undefined;
    /** Processing screen after recording */
    Processing: { draftId: string };
    /** Invoice editor screen */
    Editor: { draftId: string };
    /** Share action screen */
    Share: { draftId: string };
    /** Settings screen */
    Settings: undefined;
};

/**
 * Main tab navigation parameters
 */
export type MainTabParamList = {
    /** Home screen with recording */
    Home: undefined;
    /** Drafts list screen */
    Drafts: undefined;
};

/**
 * Screen names for type-safe navigation
 */
export const SCREENS = {
    Onboarding: 'Onboarding',
    Main: 'Main',
    Home: 'Home',
    Drafts: 'Drafts',
    Processing: 'Processing',
    Editor: 'Editor',
    Share: 'Share',
    Settings: 'Settings',
} as const;

/**
 * Navigation helper types
 */
export type ScreenName = keyof RootStackParamList | keyof MainTabParamList;
