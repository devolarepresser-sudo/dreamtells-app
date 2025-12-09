import React from 'react';
import { useApp } from '../context/AppContext';
import { Language } from '../types';

interface LanguageSwitcherProps {
    variant?: 'inline' | 'compact';
}

const LanguageSwitcher: React.FC<LanguageSwitcherProps> = ({ variant = 'inline' }) => {
    const { language, setLanguage } = useApp();

    const languages: { code: Language; label: string }[] = [
        { code: 'pt', label: 'PT' },
        { code: 'es', label: 'ES' },
        { code: 'en', label: 'EN' },
    ];

    return (
        <div
            style={{
                display: 'flex',
                gap: variant === 'compact' ? 4 : 8,
                alignItems: 'center',
                padding: variant === 'compact' ? '4px 6px' : '6px 10px',
                borderRadius: 999,
                background: 'rgba(15,23,42,0.7)',
                border: '1px solid rgba(148,163,184,0.4)',
                backdropFilter: 'blur(8px)',
            }}
        >
            {languages.map((lang) => (
                <button
                    key={lang.code}
                    onClick={() => {
                        console.log('Clicking language:', lang.code, lang.label);
                        setLanguage(lang.code);
                    }}
                    style={{
                        padding: variant === 'compact' ? '4px 8px' : '6px 12px',
                        borderRadius: 999,
                        border: 'none',
                        background:
                            language === lang.code
                                ? 'linear-gradient(135deg, #5A3EF2, #46E4E1)'
                                : 'transparent',
                        color:
                            language === lang.code
                                ? '#FFFFFF'
                                : 'rgba(226,232,240,0.7)',
                        fontSize: variant === 'compact' ? '0.75rem' : '0.85rem',
                        fontWeight: 600,
                        cursor: 'pointer',
                        transition: 'all 0.2s ease',
                        boxShadow:
                            language === lang.code
                                ? '0 4px 12px rgba(90,62,242,0.4)'
                                : 'none',
                    }}
                >
                    {lang.label}
                </button>
            ))}
        </div>
    );
};

export default LanguageSwitcher;
