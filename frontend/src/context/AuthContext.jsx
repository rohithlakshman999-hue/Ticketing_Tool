import React, { createContext, useState, useEffect, useContext } from 'react';
import api from '../services/api';

const AuthContext = createContext();

export function AuthProvider({ children }) {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const checkAuth = async () => {
            const token = localStorage.getItem('token');
            if (token) {
                // Here we usually fetch the user profile. Since we don't have a /me endpoint, 
                // we decode the JWT token payload manually, but ideally we add a `/auth/me` to FastAPI.
                try {
                    const res = await api.get('/auth/me');
                    setUser(res.data);
                    localStorage.setItem('user', JSON.stringify(res.data));
                } catch(e) {
                    setUser(null);
                    localStorage.removeItem('token');
                }
            }
            setLoading(false);
        };
        checkAuth();
    }, []);

    const login = async (email, password) => {
        const params = new URLSearchParams();
        params.append('username', email);
        params.append('password', password);
        
        const response = await api.post('/auth/login', params, {
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded'
            }
        });
        localStorage.setItem('token', response.data.access_token);
        
        const userRes = await api.get('/auth/me');
        localStorage.setItem('user', JSON.stringify(userRes.data));
        setUser(userRes.data);
    };

    const register = async (userData) => {
        await api.post('/auth/register', userData);
    };

    const googleLogin = async (token) => {
        try {
            const response = await api.post('/auth/google', { token });
            localStorage.setItem('token', response.data.access_token);
            
            const userRes = await api.get('/auth/me');
            localStorage.setItem('user', JSON.stringify(userRes.data));
            setUser(userRes.data);
        } catch (error) {
            // Re-throw with backend error details intact
            throw error;
        }
    };

    const logout = () => {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        setUser(null);
    };

    return (
        <AuthContext.Provider value={{ user, loading, login, googleLogin, register, logout, setUser }}>
            {children}
        </AuthContext.Provider>
    );
}

export const useAuth = () => useContext(AuthContext);
