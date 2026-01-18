/**
 * Design System Theme
 * QuickQuote Design Constants
 * Updated for UI Redesign - Premium, Trustworthy Aesthetic
 */

/**
 * Color palette - WCAG AA compliant
 */
export const COLORS = {
    // Brand Colors - Updated for better contrast
    primary: '#2563EB',      // Blue - Trust, Professional (WCAG AA)
    primaryDark: '#1D4ED8',  // Darker blue for gradients
    accent: '#F97316',       // Orange - AI/automation actions

    // Semantic Colors
    success: '#10B981',      // Green - confirmations
    warning: '#F59E0B',      // Amber
    error: '#DC2626',        // Red - Clear danger/warning (WCAG AA)

    // Neutral Colors - Softer backgrounds
    background: '#F8FAFC',        // Soft background
    backgroundWhite: '#FFFFFF',   // Pure white for cards
    surface: '#F8FAFC',
    surfaceSecondary: '#F1F5F9',

    // Text Colors - Improved hierarchy
    text: {
        primary: '#0F172A',    // Deep slate - AAA on white
        secondary: '#64748B',  // Slate gray - AA
        tertiary: '#94A3B8',
        disabled: '#CBD5E1',
        inverse: '#FFFFFF',    // White on dark
    },

    // Border Colors
    border: {
        default: '#E2E8F0',
        light: '#F1F5F9',
        medium: '#CBD5E1',     // For outlined buttons
        focus: '#2563EB',
    },

    // Button States
    button: {
        primary: '#2563EB',         // Blue
        primaryHover: '#1D4ED8',
        primaryPressed: '#1E40AF',
        secondary: '#2563EB',       // Blue outline
        secondaryBorder: '#CBD5E1',
        ghost: 'transparent',
        destructive: '#DC2626',     // Red for re-record
    },

    // Confidence Indicators
    confidence: {
        high: '#10B981',
        medium: '#F59E0B',
        low: '#DC2626',
    },

    // Recording States
    recording: {
        active: '#DC2626', // Red for recording state (improved contrast)
        idle: '#2563EB',
        waveform: '#2563EB',
    },

    // Transparency
    overlay: 'rgba(0, 0, 0, 0.5)',
    backdrop: 'rgba(0, 0, 0, 0.3)',
} as const;

/**
 * Typography styles - Inter-inspired specifications
 */
export const TYPOGRAPHY = {
    // Headings
    h1: {
        fontSize: 28,
        fontWeight: '700' as const,
        lineHeight: 34,
        letterSpacing: 0.36,
    },
    h2: {
        fontSize: 20,
        fontWeight: '600' as const,
        lineHeight: 28,
        letterSpacing: 0.35,
    },
    h3: {
        fontSize: 17,
        fontWeight: '600' as const,
        lineHeight: 22,
        letterSpacing: -0.41,
    },

    // Body
    bodyLarge: {
        fontSize: 17,
        fontWeight: '400' as const,
        lineHeight: 22,
        letterSpacing: -0.41,
    },
    body: {
        fontSize: 15,
        fontWeight: '400' as const,
        lineHeight: 20,
        letterSpacing: -0.24,
    },
    bodySmall: {
        fontSize: 13,
        fontWeight: '400' as const,
        lineHeight: 18,
        letterSpacing: -0.08,
    },

    // Labels
    label: {
        fontSize: 17,
        fontWeight: '600' as const,
        lineHeight: 22,
        letterSpacing: -0.41,
    },
    labelSmall: {
        fontSize: 15,
        fontWeight: '600' as const,
        lineHeight: 20,
        letterSpacing: -0.24,
    },

    // Caption
    caption: {
        fontSize: 13,
        fontWeight: '400' as const,
        lineHeight: 18,
        letterSpacing: -0.08,
    },
    captionBold: {
        fontSize: 13,
        fontWeight: '600' as const,
        lineHeight: 18,
        letterSpacing: -0.08,
    },

    // Button
    button: {
        fontSize: 16,
        fontWeight: '600' as const,
        lineHeight: 22,
        letterSpacing: -0.41,
    },
    buttonLarge: {
        fontSize: 17,
        fontWeight: '700' as const,
        lineHeight: 22,
        letterSpacing: -0.41,
    },
    buttonSmall: {
        fontSize: 15,
        fontWeight: '600' as const,
        lineHeight: 20,
        letterSpacing: -0.24,
    },

    // Numbers (for prices/totals)
    number: {
        fontSize: 20,
        fontWeight: '600' as const,
        lineHeight: 24,
        letterSpacing: 0.38,
    },
    numberLarge: {
        fontSize: 28,
        fontWeight: '700' as const,
        lineHeight: 34,
        letterSpacing: 0.36,
    },
};

/**
 * Spacing scale (based on 4px/8px grid)
 */
export const SPACING = {
    xxs: 2,
    xs: 4,
    sm: 8,
    md: 12,
    lg: 16,
    xl: 24,
    xxl: 32,
    xxxl: 48,
} as const;

/**
 * Border radius - Updated for modern look
 */
export const RADIUS = {
    xs: 4,
    sm: 8,
    md: 12,
    lg: 14,        // For buttons
    xl: 16,        // For cards
    xxl: 24,
    full: 9999,
} as const;

/**
 * Shadow styles - Soft, layered for premium feel
 */
export const SHADOWS = {
    none: {
        shadowColor: 'transparent',
        shadowOffset: { width: 0, height: 0 },
        shadowOpacity: 0,
        shadowRadius: 0,
        elevation: 0,
    },
    sm: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.04,
        shadowRadius: 2,
        elevation: 1,
    },
    md: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.06,
        shadowRadius: 4,
        elevation: 2,
    },
    lg: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.08,
        shadowRadius: 8,
        elevation: 4,
    },
    // Card shadow - soft, premium
    card: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.06,
        shadowRadius: 16,
        elevation: 4,
    },
    // Elevated shadow for primary CTA
    elevated: {
        shadowColor: '#2563EB',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.25,
        shadowRadius: 12,
        elevation: 6,
    },
    xl: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.12,
        shadowRadius: 16,
        elevation: 8,
    },
} as const;

/**
 * Animation durations - Fast, responsive feel
 */
export const ANIMATION = {
    fast: 150,      // Micro-interactions, hover
    normal: 250,    // State transitions
    slow: 300,      // Important transitions
    spring: 400,    // Bounce effects
} as const;

/**
 * Easing curves
 */
export const EASING = {
    default: 'cubic-bezier(0.4, 0, 0.2, 1)',
    easeOut: 'cubic-bezier(0, 0, 0.2, 1)',
    easeIn: 'cubic-bezier(0.4, 0, 1, 1)',
    bounce: 'cubic-bezier(0.68, -0.55, 0.265, 1.55)',
} as const;

/**
 * Touch target minimum size (accessibility)
 */
export const TOUCH_TARGET = {
    min: 44,
    recommended: 48,
} as const;

/**
 * Button sizes
 */
export const BUTTON_SIZES = {
    primary: {
        height: 56,
        paddingHorizontal: 24,
    },
    secondary: {
        height: 48,
        paddingHorizontal: 20,
    },
    tertiary: {
        height: 48,
        paddingHorizontal: 16,
    },
} as const;

/**
 * Z-index layers
 */
export const Z_INDEX = {
    base: 0,
    dropdown: 10,
    sticky: 20,
    fixed: 30,
    modalBackdrop: 40,
    modal: 50,
    popover: 60,
    toast: 70,
} as const;
