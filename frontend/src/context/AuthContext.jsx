import React, { createContext, useState, useEffect, useContext } from 'react';
import api from '../services/api';

const AuthContext = createContext();

export function AuthProvider({ children }) {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);

    // ------------------- SET TOKEN HEADER -------------------

    const setAuthHeader = (token) => {
        if (token) {
            api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
        } else {
            delete api.defaults.headers.common['Authorization'];
        }
    };

    // ------------------- CHECK AUTH -------------------

    useEffect(() => {
        const checkAuth = async () => {
            const token = localStorage.getItem('token');

            if (token) {
                setAuthHeader(token); // 🔥 IMPORTANT

                try {
                    const res = await api.get('/auth/me');
                    setUser(res.data);
                    localStorage.setItem('user', JSON.stringify(res.data));
                } catch (e) {
                    console.error("Auth check failed:", e);
                    logout();
                }
            }

            setLoading(false);
        };

        checkAuth();
    }, []);

    // ------------------- LOGIN -------------------

    const login = async (email, password) => {
        const params = new URLSearchParams();
        params.append('username', email);
        params.append('password', password);

        const response = await api.post('/auth/login', params, {
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded'
            }
        });

        const token = response.data.access_token;

        localStorage.setItem('token', token);

        setAuthHeader(token); // 🔥 IMPORTANT

        const userRes = await api.get('/auth/me');
        localStorage.setItem('user', JSON.stringify(userRes.data));

        setUser(userRes.data);
    };

    // ------------------- REGISTER -------------------

    const register = async (userData) => {
        await api.post('/auth/register', userData);
    };

    // ------------------- GOOGLE LOGIN -------------------

    const googleLogin = async (token) => {
        const response = await api.post('/auth/google', { token });

        const accessToken = response.data.access_token;

        localStorage.setItem('token', accessToken);

        setAuthHeader(accessToken); // 🔥 IMPORTANT

        const userRes = await api.get('/auth/me');
        localStorage.setItem('user', JSON.stringify(userRes.data));

        setUser(userRes.data);
    };

    // ------------------- LOGOUT -------------------

    const logout = () => {
        localStorage.removeItem('token');
        localStorage.removeItem('user');

        setAuthHeader(null); // 🔥 IMPORTANT

        setUser(null);
    };

    return (
        <AuthContext.Provider value={{
            user,
            loading,
            login,
            googleLogin,
            register,
            logout,
            setUser
        }}>
            {children}
        </AuthContext.Provider>
    );
}

export const useAuth = () => useContext(AuthContext);