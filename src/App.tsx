import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AppProvider } from './context/AppContext';
import ErrorBoundary from './components/ErrorBoundary';
import SplashScreen from './pages/SplashScreen';
import LanguageSelect from './pages/LanguageSelect';
import Login from './pages/Login';
import Home from './pages/Home';
import WriteDream from './pages/WriteDream';
import RecordDream from './pages/RecordDream';
import Interpretation from './pages/Interpretation';
import History from './pages/History';
import Profile from './pages/Profile';
import Stats from './pages/Stats';
import Symbols from './pages/Symbols';
import Menu from './pages/Menu';
// import LifeContext from './pages/LifeContext';
import DailyMessage from './pages/DailyMessage';
import AboutTerms from './pages/AboutTerms';
import Paywall from './components/Paywall';
import Welcome from './pages/Welcome';
import HowItWorks from './pages/HowItWorks';
import DeepDreamAnalysis from './pages/DeepDreamAnalysis';
import UnconsciousMap from './pages/UnconsciousMap';

import ProtectedRoute from './components/ProtectedRoute';

const App: React.FC = () => {
    return (
        <AppProvider>
            <ErrorBoundary>
                <Router>
                    <Routes>
                        <Route path="/" element={<SplashScreen />} />
                        <Route path="/language" element={<LanguageSelect />} />
                        <Route path="/login" element={<Login />} />
                        <Route path="/welcome" element={<Welcome />} />
                        <Route path="/how-it-works" element={<HowItWorks />} />
                        <Route path="/about" element={<AboutTerms />} />
                        <Route path="/premium" element={<Paywall />} />

                        {/* Protected Routes */}
                        {/* Protected Routes */}
                        <Route path="/home" element={<ProtectedRoute><Home /></ProtectedRoute>} />
                        <Route path="/menu" element={<ProtectedRoute><Menu /></ProtectedRoute>} />
                        <Route path="/write" element={<ProtectedRoute><WriteDream /></ProtectedRoute>} />
                        <Route path="/record" element={<ProtectedRoute><RecordDream /></ProtectedRoute>} />
                        <Route path="/interpretation" element={<Interpretation />} />
                        <Route path="/history" element={<ProtectedRoute><History /></ProtectedRoute>} />
                        <Route path="/profile" element={<ProtectedRoute><Profile /></ProtectedRoute>} />

                        {/* Premium Routes */}
                        <Route path="/stats" element={<ProtectedRoute><Stats /></ProtectedRoute>} />
                        <Route path="/symbols" element={<ProtectedRoute><Symbols /></ProtectedRoute>} />
                        <Route path="/deep-analysis/:id" element={<ProtectedRoute><DeepDreamAnalysis /></ProtectedRoute>} />
                        {/* Fallback para deep-analysis sem ID */}
                        <Route path="/deep-analysis" element={<Navigate to="/history" replace />} />
                        <Route path="/unconscious-map" element={<ProtectedRoute><UnconsciousMap /></ProtectedRoute>} />
                        {/* <Route path="/life-context" element={<ProtectedRoute><LifeContext /></ProtectedRoute>} /> */}
                        <Route path="/daily-message" element={<ProtectedRoute><DailyMessage /></ProtectedRoute>} />

                        <Route path="*" element={<Navigate to="/" replace />} />
                    </Routes>
                </Router>
            </ErrorBoundary>
        </AppProvider>
    );
};

export default App;
