import React, { createContext, useContext, useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

const ONBOARDING_KEY = '@has_seen_onboarding';

interface OnboardingContextProps {
    hasSeenOnboarding: boolean | null;
    isLoading: boolean;
    markOnboardingAsSeen: () => Promise<void>;
    checkOnboardingStatus: () => Promise<void>;
}

const OnboardingContext = createContext<OnboardingContextProps | undefined>(undefined);

export function OnboardingProvider({ children }: { children: React.ReactNode }) {
    const [hasSeenOnboarding, setHasSeenOnboarding] = useState<boolean | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    const checkOnboardingStatus = async () => {
        try {
            const value = await AsyncStorage.getItem(ONBOARDING_KEY);
            setHasSeenOnboarding(value === 'true');
        } catch (error) {
            console.error('Erreur lors de la vérification de l\'onboarding:', error);
            setHasSeenOnboarding(false);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        checkOnboardingStatus();
    }, []);

    const markOnboardingAsSeen = async () => {
        try {
            await AsyncStorage.setItem(ONBOARDING_KEY, 'true');
            setHasSeenOnboarding(true);
        } catch (error) {
            console.error('Erreur lors de la sauvegarde de l\'onboarding:', error);
        }
    };

    return (
        <OnboardingContext.Provider
            value={{
                hasSeenOnboarding,
                isLoading,
                markOnboardingAsSeen,
                checkOnboardingStatus
            }}
        >
            {children}
        </OnboardingContext.Provider>
    );
}

export function useOnboarding() {
    const context = useContext(OnboardingContext);
    if (context === undefined) {
        throw new Error('useOnboarding must be used within an OnboardingProvider');
    }
    return context;
}
