import axios from 'axios';

const BASE_URL = "http://localhost:8081/api"; // adjust if needed

export const login = (data) => axios.post(`${BASE_URL}/auth/login`, data);
export const register = (data) => axios.post(`${BASE_URL}/auth/register`, data);