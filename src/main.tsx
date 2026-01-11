import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App'
import './index.css'

import { GoogleAuth } from '@codetrix-studio/capacitor-google-auth';

GoogleAuth.initialize({
    clientId: '28214150046-d8nht99v068b3j1fbbtvbtsmb1l6ji58.apps.googleusercontent.com',
    scopes: ['profile', 'email'],
    grantOfflineAccess: true,
});

ReactDOM.createRoot(document.getElementById('root') as HTMLElement).render(
    <App />
)
