import axiosClient from './axiosClient';
import { API_ENDPOINTS } from '../constants/apiEndpoints';

export const authApi = {
  login: async (email, password) => {
    const url = API_ENDPOINTS.AUTH.LOGIN;
    return await axiosClient.post(url, { email, password });
  },

  register: async (userData) => {
    const url = API_ENDPOINTS.AUTH.REGISTER;
    return await axiosClient.post(url, userData);
  },

  getProfile: async () => {
    const url = API_ENDPOINTS.USER.PROFILE;
    return await axiosClient.get(url);
  }
};
