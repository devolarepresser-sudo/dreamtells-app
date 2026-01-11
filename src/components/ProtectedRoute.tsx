import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import { FREE_DEV_MODE } from '../config/featureFlags';

interface ProtectedRouteProps {
    children: React.ReactNode;
    requirePremium?: boolean;
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children, requirePremium = false }) => {
    const { user, canUsePremium, isLoading } = useApp();
    const navigate = useNavigate();

    useEffect(() => {
        // Wait for loading to finish before making decisions
        if (isLoading) return;

        if (FREE_DEV_MODE) return;

        // If not logged in, redirect
        if (!user) {
            navigate('/login');
            return;
        }

        // Centralized Premium Check - ONLY if required
        if (requirePremium && !canUsePremium()) {
            navigate('/premium');
        }
    }, [user, canUsePremium, navigate, isLoading, requirePremium]);

    // Show nothing (or a loader) while initializing
    if (isLoading) {
        return (
            <div style={{ height: '100vh', width: '100%', background: '#0F172A' }} />
        );
    }

    // Critical Fix: Do NOT return null here, or Router might fall back to * -> /
    // Instead return a safe placeholder while navigate takes effect in useEffect
    if (!FREE_DEV_MODE && !user) {
        return (
            <div style={{ height: '100vh', width: '100%', background: '#0F172A' }} />
        );
    }

    // Only block render if premium is strictly required and user doesn't have it
    if (!FREE_DEV_MODE && requirePremium && !canUsePremium()) {
        return (
            <div style={{ height: '100vh', width: '100%', background: '#0F172A' }} />
        );
    }

    return <>{children}</>;
};

export default ProtectedRoute;
