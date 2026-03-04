// src/api/Auth.jsx
import api from './axios';

const ensureCsrfCookie = async () => {
    await api.get('/sanctum/csrf-cookie');
};

export const login = async (credentials) => {
    await ensureCsrfCookie();
    return api.post('/api/auth/login', credentials);
};

export const register = async (data) => {
    await ensureCsrfCookie();
    return api.post('/api/auth/register', data);
}   

export const logout = async () => {
    await ensureCsrfCookie();
    return api.post('/api/auth/logout');
}

export const getUser = async () => {
    // Keep auth verification responsive across role dashboards.
    return api.get('/api/auth/user', { timeout: 10000 });
}

export const forgotPassword = async (email) => {
    return api.post('/api/auth/forgot-password', { email });
}

export const resetPassword = async (data) => {
    await ensureCsrfCookie();
    return api.post('/api/auth/reset-password', data);
}

export const updateProfile = async (data) => {
    return api.put('/api/auth/user', data);
}

export const changePassword = async (data) => {
    await ensureCsrfCookie();
    return api.post('/api/auth/user/change-password', data);
}