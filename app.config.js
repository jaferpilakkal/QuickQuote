
module.exports = {
    expo: {
        name: "QuickQuote",
        slug: "QuickQuote",
        version: "1.0.0",
        orientation: "portrait",
        icon: "./assets/icon.png",
        userInterfaceStyle: "light",
        newArchEnabled: true,
        splash: {
            image: "./assets/splash-icon.png",
            resizeMode: "contain",
            backgroundColor: "#ffffff"
        },
        ios: {
            supportsTablet: true,
            bundleIdentifier: "com.quickquote.app",
            infoPlist: {
                NSMicrophoneUsageDescription: "QuickQuote needs access to your microphone to record voice notes for invoicing.",
                NSSpeechRecognitionUsageDescription: "QuickQuote uses speech recognition to transcribe your voice notes.",
                ITSAppUsesNonExemptEncryption: false
            }
        },
        android: {
            adaptiveIcon: {
                foregroundImage: "./assets/adaptive-icon.png",
                backgroundColor: "#ffffff"
            },
            package: "com.quickquote.app",
            permissions: [
                "RECORD_AUDIO",
                "INTERNET",
                "android.permission.RECORD_AUDIO",
                "android.permission.MODIFY_AUDIO_SETTINGS"
            ],
            edgeToEdgeEnabled: true,
            predictiveBackGestureEnabled: false
        },
        web: {
            favicon: "./assets/favicon.png"
        },
        plugins: [
            "expo-sqlite",
            "expo-secure-store",
            "expo-asset",
            [
                "expo-av",
                {
                    "microphonePermission": "QuickQuote needs access to your microphone to record voice notes for invoicing."
                }
            ]
        ],
        extra: {
            googleSTTKey: process.env.GOOGLE_STT_KEY,
            geminiKey: process.env.GEMINI_KEY,
            analyticsEnabled: false,
            eas: {
                projectId: "778f6373-4683-4f42-a3db-801da3329e52"
            }
        }
    }
};
