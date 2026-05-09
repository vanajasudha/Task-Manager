import api from '../api/axiosInstance'

export const registerUser    = (data) => api.post('/auth/register',         data)
export const loginUser       = (data) => api.post('/auth/login',             data)
export const getMe           = ()     => api.get('/auth/me')
export const forgotPassword  = (data) => api.post('/auth/forgot-password',  data)
export const resetPassword   = (data) => api.post('/auth/reset-password',   data)
export const googleAuth      = (data) => api.post('/auth/google',            data)
