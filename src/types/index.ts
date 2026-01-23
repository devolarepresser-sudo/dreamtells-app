export type Language = 'pt' | 'es' | 'en' | 'fr' | 'it' | 'de';
export type Plan = 'free' | 'premium' | 'master';

export interface UserPreferences {
    language: Language;
    showQuotes: boolean;
}

export interface UserUsage {
    interpretationsCount: number;
}

export interface User {
    id: string;
    name: string;
    email: string;
    preferences: UserPreferences;
    plan: Plan;
    usage: UserUsage;
    dreamsTodayCount: number;
    lastDreamDate: string;

    // Trial Premium Fields
    trialStart: string | null;
    trialEnd: string | null;
    isTrialActive: boolean;
    isPremium: boolean;
    photoURL?: string;
}

export interface SymbolDetail {
    name: string;
    meaning: string;
}

export interface DreamEntry {
    id: string;
    userId: string;
    createdAt: string;
    updatedAt: string;
    text: string;
    source: 'text' | 'audio';

    // Structured Interpretation Data
    dreamTitle: string;
    interpretationMain: string;
    symbols: SymbolDetail[];
    emotions: string[];
    lifeAreas: string[];
    advice: string;
    isPremiumAnalysis: boolean;
    tags: string[];

    // New Expert-Level Fields (Optional for backward compatibility)
    coreOfDream?: string;
    evidence?: string[];
    decodingLayers?: {
        emotional?: string;
        relational?: string;
        archetypal?: string;
        individuation?: string;
    };
    alternativeHypotheses?: string[];
    criticalPoint?: string;
    practicalDirection?: {
        minimalAction?: string;
        integrationExercise?: string;
        anchorPhrase?: string;
    };
    responsibleAlert?: string;

    // User Interaction
    isFavorite: boolean;
    feedback?: 'like' | 'dislike' | null;

    // Legacy support (optional, can be removed if we migrate all data)
    // Legacy support (optional, can be removed if we migrate all data)
    interpretation?: string;
    language: Language;

    // Deep Analysis (New Module)
    deepAnalysis?: DeepAnalysisResult;
}

export interface DeepInsight {
    title: string;
    content: string;
}

export interface DeepAnalysisResult {
    deepInsights: DeepInsight[];
    patterns: string[];
    finalIntegration: string;
    userReflections?: Record<number, string>;
    createdAt?: string;
}

export interface SymbolEntry {
    name: string;
    meaning: string;
}
export interface EmotionalAnalysis {
    id?: string;
    title: string;
    description: string;
    insights?: string[];
    emotions?: string[];
    intensity?: number;
    createdAt?: number;
}

export interface InterpretationResult {
    dreamTitle: string;

    // New Expert-Level Fields
    coreOfDream?: string;
    evidence?: string[];
    decodingLayers?: {
        emotional?: string;
        relational?: string;
        archetypal?: string;
        individuation?: string;
    };
    alternativeHypotheses?: string[];
    criticalPoint?: string;
    practicalDirection?: {
        minimalAction?: string;
        integrationExercise?: string;
        anchorPhrase?: string;
    };
    responsibleAlert?: string;

    // Legacy/Backward Compatibility
    interpretationMain: string;
    symbols: SymbolDetail[];
    emotions: string[];
    lifeAreas: string[];
    advice: string;
    tags: string[];
    language?: Language;
}
