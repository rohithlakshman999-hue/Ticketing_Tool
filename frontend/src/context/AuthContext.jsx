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
        // Backup for axios
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

            // 1. Try sessionStorage first (Absolute source of truth for this tab)
            const sessionToken = sessionStorage.getItem('token');
            const sessionUser = sessionStorage.getItem('user');

            if (sessionToken && sessionUser) {
                const parsedUser = JSON.parse(sessionUser);
                setAuthSession(sessionToken, parsedUser);
                setLoading(false);

                // Verify in background WITHOUT changing the order of accounts
                try {
                    const res = await api.get('/auth/me');
                    setAuthSession(sessionToken, res.data);
                    
                    // Sync user data in the list but PRESERVE order
                    const currentAll = getStoredAccounts();
                    const updated = currentAll.map(acc => 
                        acc.user.email === res.data.email ? { ...acc, user: res.data } : acc
                    );
                    localStorage.setItem('it_support_accounts', JSON.stringify(updated));
                    setAccounts(updated);
                } catch (e) {
                    if (e.response?.status === 401) logout();
                }
                return;
            }

            // 2. Fallback to localStorage ONLY for fresh tabs
            if (allAccounts.length > 0) {
                const primary = allAccounts[0];
                setAuthSession(primary.token, primary.user);
            }

            setLoading(false);
        };

        initAuth();

        // 3. Listen for changes in other tabs (Add/Remove accounts)
        const handleStorageChange = (e) => {
            if (e.key === 'it_support_accounts') {
                const newAccounts = JSON.parse(e.newValue || '[]');
                setAccounts(newAccounts);
                
                // If our current user was removed in another tab, log out here too
                const sessionUser = sessionStorage.getItem('user');
                if (sessionUser) {
                    const email = JSON.parse(sessionUser).email;
                    const stillExists = newAccounts.some(acc => acc.user.email === email);
                    if (!stillExists) {
                        clearAuthSession();
                    }
                }
            }
        };

        window.addEventListener('storage', handleStorageChange);
        return () => window.removeEventListener('storage', handleStorageChange);
    }, []);

    // ------------------- AUTH ACTIONS -------------------

    const updateAccountsList = (token, userData, shouldReorder = true) => {
        const currentAccounts = getStoredAccounts();
        const otherAccounts = currentAccounts.filter(acc => acc.user.email !== userData.email);
        
        let newAccounts;
        if (shouldReorder) {
            newAccounts = [{ token, user: userData }, ...otherAccounts];
        } else {
            // Find index of existing or just append
            const existingIndex = currentAccounts.findIndex(acc => acc.user.email === userData.email);
            if (existingIndex > -1) {
                newAccounts = [...currentAccounts];
                newAccounts[existingIndex] = { token, user: userData };
            } else {
                newAccounts = [...currentAccounts, { token, user: userData }];
            }
        }
        
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

        // Explicit login always moves to top
        updateAccountsList(token, userRes.data, true);
    };

    const googleLogin = async (googleToken) => {
        const response = await api.post('/auth/google', { token: googleToken });
        const accessToken = response.data.access_token;
        
        const userRes = await api.get('/auth/me', {
            headers: { 'Authorization': `Bearer ${accessToken}` }
        });

        // Explicit login always moves to top
        updateAccountsList(accessToken, userRes.data, true);
    };

    const switchAccount = (email) => {
        const target = accounts.find(acc => acc.user.email === email);
        if (target) {
            setAuthSession(target.token, target.user);
            // Re-order so this becomes the default for NEW tabs
            const otherAccounts = accounts.filter(acc => acc.user.email !== email);
            saveAccounts([target, ...otherAccounts]);
        }
    };

    const logout = () => {
        const sessionUser = sessionStorage.getItem('user');
        if (sessionUser) {
            const currentEmail = JSON.parse(sessionUser).email;
            const currentAccounts = getStoredAccounts();
            const remaining = currentAccounts.filter(acc => acc.user.email !== currentEmail);
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