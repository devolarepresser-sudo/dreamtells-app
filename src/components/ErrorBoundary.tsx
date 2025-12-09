import React, { Component, ReactNode } from 'react';

interface Props {
    children: ReactNode;
    fallback?: ReactNode;
}

interface State {
    hasError: boolean;
    error?: Error;
}

class ErrorBoundary extends Component<Props, State> {
    constructor(props: Props) {
        super(props);
        this.state = { hasError: false };
    }

    static getDerivedStateFromError(error: Error): State {
        return { hasError: true, error };
    }

    componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
        console.error('ErrorBoundary caught an error:', error, errorInfo);
    }

    render() {
        if (this.state.hasError) {
            if (this.props.fallback) {
                return this.props.fallback;
            }

            return (
                <div className="container" style={{ padding: '24px', textAlign: 'center' }}>
                    <h2 style={{ color: 'var(--color-text-primary)', marginBottom: '16px' }}>
                        Algo deu errado
                    </h2>
                    <p style={{ color: 'var(--color-text-secondary)', marginBottom: '24px' }}>
                        Ocorreu um erro inesperado. Por favor, tente novamente.
                    </p>
                    <button
                        onClick={() => window.location.href = '/home'}
                        className="btn-primary"
                        style={{
                            padding: '12px 24px',
                            borderRadius: '8px',
                            backgroundColor: 'var(--color-primary)',
                            color: 'white',
                            border: 'none',
                            cursor: 'pointer'
                        }}
                    >
                        Voltar para Home
                    </button>
                </div>
            );
        }

        return this.props.children;
    }
}

export default ErrorBoundary;
