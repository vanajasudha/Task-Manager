import api from '../api/axiosInstance'

export const getUsers    = ()       => api.get('/admin/users')
export const getStats    = ()       => api.get('/admin/stats')
export const promoteUser = (userId) => api.post(`/admin/promote/${userId}`)
export const demoteUser  = (userId) => api.post(`/admin/demote/${userId}`)
export const deleteUser  = (userId) => api.delete(`/admin/user/${userId}`)
export const getAllTasks = (params)  => api.get('/tasks', { params })

// Allowed-email allowlist
export const getAllowedEmails   = ()       => api.get('/admin/allowed-emails')
export const addAllowedEmail    = (email)  => api.post('/admin/allowed-emails', { email })
export const removeAllowedEmail = (email)  => api.delete('/admin/allowed-emails', { params: { email } })
