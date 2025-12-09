import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import { FREE_DEV_MODE } from '../config/featureFlags';

interface ProtectedRouteProps {
    children: React.ReactNode;
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children }) => {
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

        // Centralized Premium Check
        if (!canUsePremium()) {
            navigate('/premium');
        }
    }, [user, canUsePremium, navigate, isLoading]);

    // Show nothing (or a loader) while initializing
    if (isLoading) {
        return (
            <div style={{ height: '100vh', width: '100%', background: '#0F172A' }} />
        );
    }

    if (!FREE_DEV_MODE && (!user || !canUsePremium())) {
        return null;
    }

    return <>{children}</>;
};

export default ProtectedRoute;
