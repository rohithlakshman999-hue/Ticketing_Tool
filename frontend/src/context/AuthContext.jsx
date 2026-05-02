import React, { createContext, useState, useEffect, useContext, useMemo } from 'react';
import api from '../services/api';

const AuthContext = createContext();

export function AuthProvider({ children }) {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);

    // ------------------- HELPERS -------------------

    const setAuthSession = (token, userData) => {
        // Tab isolation (fixes refresh bug)
        sessionStorage.setItem('token', token);
        sessionStorage.setItem('user', JSON.stringify(userData));
        
        // Persistence across tabs
        localStorage.setItem('token', token);
        localStorage.setItem('user', JSON.stringify(userData));
        
        setUser(userData);
        api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
    };

    const clearAuthSession = () => {
        sessionStorage.removeItem('token');
        sessionStorage.removeItem('user');
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        delete api.defaults.headers.common['Authorization'];
        setUser(null);
    };

    // ------------------- CHECK AUTH -------------------

    useEffect(() => {
        const initAuth = async () => {
            // 1. Try sessionStorage first (Tab isolation)
            let token = sessionStorage.getItem('token');
            let userStr = sessionStorage.getItem('user');

            // 2. Fallback to localStorage (New tab / Persistence)
            if (!token) {
                token = localStorage.getItem('token');
                userStr = localStorage.getItem('user');
                
                if (token && userStr) {
                    sessionStorage.setItem('token', token);
                    sessionStorage.setItem('user', userStr);
                }
            }

            if (token && userStr) {
                try {
                    const parsedUser = JSON.parse(userStr);
                    setUser(parsedUser);
                    api.defaults.headers.common['Authorization'] = `Bearer ${token}`;

                    // Verify in background
                    const res = await api.get('/auth/me');
                    setAuthSession(token, res.data);
                } catch (e) {
                    console.error("Auth init failed:", e);
                    if (e.response?.status === 401) clearAuthSession();
                }
            }
            
            setLoading(false);
        };

        initAuth();
    }, []);

    // ------------------- ACTIONS -------------------

    const login = async (email, password) => {
        const params = new URLSearchParams();
        params.append('username', email);
        params.append('password', password);

        const response = await api.post('/auth/login', params, {
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' }
        });

        const token = response.data.access_token;
        const userRes = await api.get('/auth/me', {
            headers: { 'Authorization': `Bearer ${token}` }
        });

        setAuthSession(token, userRes.data);
    };

    const googleLogin = async (googleToken) => {
        const response = await api.post('/auth/google', { token: googleToken });
        const accessToken = response.data.access_token;
        
        const userRes = await api.get('/auth/me', {
            headers: { 'Authorization': `Bearer ${accessToken}` }
        });

        setAuthSession(accessToken, userRes.data);
    };

    const logout = () => {
        clearAuthSession();
    };

    const register = async (userData) => {
        await api.post('/auth/register', userData);
    };

    const value = useMemo(() => ({
        user,
        loading,
        login,
        googleLogin,
        logout,
        register,
        setUser
    }), [user, loading]);

    return (
        <AuthContext.Provider value={value}>
            {children}
        </AuthContext.Provider>
    );
}

export const useAuth = () => useContext(AuthContext);