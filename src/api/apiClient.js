import axios from 'axios';

// Đã cập nhật đúng link MockAPI của bạn
const MOCK_API_URL = 'https://6a296dd8f59cb8f65f1d25ea.mockapi.io'; 

const apiClient = axios.create({
  baseURL: MOCK_API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

export default apiClient;