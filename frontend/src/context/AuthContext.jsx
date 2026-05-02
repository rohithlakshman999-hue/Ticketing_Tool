import React, { createContext, useState, useEffect, useContext, useMemo } from 'react';
import api from '../services/api';

const AuthContext = createContext();

export function AuthProvider({ children }) {
    const [user, setUser] = useState(null);
    const [accounts, setAccounts] = useState([]);
    const [loading, setLoading] = useState(true);

    // ------------------- HELPERS -------------------

    const getStoredAccounts = () => {
        try {
            return JSON.parse(localStorage.getItem('it_support_accounts')) || [];
        } catch (e) {
            return [];
        }
    };

    const saveAccounts = (newAccounts) => {
        localStorage.setItem('it_support_accounts', JSON.stringify(newAccounts));
        setAccounts(newAccounts);
    };

    const setAuthSession = (token, userData) => {
        sessionStorage.setItem('token', token);
        sessionStorage.setItem('user', JSON.stringify(userData));
        setUser(userData);
        // Backup for non-interceptor requests
        api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
    };

    const clearAuthSession = () => {
        sessionStorage.removeItem('token');
        sessionStorage.removeItem('user');
        delete api.defaults.headers.common['Authorization'];
        setUser(null);
    };

    // ------------------- CHECK AUTH -------------------

    useEffect(() => {
        const initAuth = async () => {
            const allAccounts = getStoredAccounts();
            setAccounts(allAccounts);

            // 1. Try sessionStorage first (prevents account switching on refresh)
            const sessionToken = sessionStorage.getItem('token');
            const sessionUser = sessionStorage.getItem('user');

            if (sessionToken && sessionUser) {
                const parsedUser = JSON.parse(sessionUser);
                setAuthSession(sessionToken, parsedUser);
                setLoading(false);

                // Verify in background
                try {
                    const res = await api.get('/auth/me');
                    setAuthSession(sessionToken, res.data);
                    // Sync list
                    const updated = allAccounts.map(acc => 
                        acc.user.email === res.data.email ? { ...acc, user: res.data } : acc
                    );
                    saveAccounts(updated);
                } catch (e) {
                    if (e.response?.status === 401) logout();
                }
                return;
            }

            // 2. Fallback to localStorage (auto-login if single account)
            if (allAccounts.length > 0) {
                const primary = allAccounts[0];
                setAuthSession(primary.token, primary.user);
            }

            setLoading(false);
        };

        initAuth();
    }, []);

    // ------------------- AUTH ACTIONS -------------------

    const updateAccountsList = (token, userData) => {
        const currentAccounts = getStoredAccounts();
        const otherAccounts = currentAccounts.filter(acc => acc.user.email !== userData.email);
        const newAccounts = [{ token, user: userData }, ...otherAccounts];
        saveAccounts(newAccounts);
        setAuthSession(token, userData);
    };

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

        updateAccountsList(token, userRes.data);
    };

    const googleLogin = async (googleToken) => {
        const response = await api.post('/auth/google', { token: googleToken });
        const accessToken = response.data.access_token;
        
        const userRes = await api.get('/auth/me', {
            headers: { 'Authorization': `Bearer ${accessToken}` }
        });

        updateAccountsList(accessToken, userRes.data);
    };

    const switchAccount = (email) => {
        const target = accounts.find(acc => acc.user.email === email);
        if (target) {
            setAuthSession(target.token, target.user);
            // Move to top of list for "recency"
            const otherAccounts = accounts.filter(acc => acc.user.email !== email);
            saveAccounts([target, ...otherAccounts]);
        }
    };

    const logout = () => {
        const currentEmail = user?.email;
        if (currentEmail) {
            const remaining = accounts.filter(acc => acc.user.email !== currentEmail);
            saveAccounts(remaining);
        }
        clearAuthSession();
    };

    const logoutAll = () => {
        saveAccounts([]);
        clearAuthSession();
    };

    const register = async (userData) => {
        await api.post('/auth/register', userData);
    };

    const value = useMemo(() => ({
        user,
        accounts,
        loading,
        login,
        googleLogin,
        logout,
        logoutAll,
        switchAccount,
        register,
        setUser
    }), [user, accounts, loading]);

    return (
        <AuthContext.Provider value={value}>
            {children}
        </AuthContext.Provider>
    );
}

export const useAuth = () => useContext(AuthContext);