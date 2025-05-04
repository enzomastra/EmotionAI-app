import axios from 'axios';

const API_URL = 'http://192.168.18.8:8000/api';

export const analyzeVideo = async (formData: FormData) => {
  return axios.post(`${API_URL}/video/analyze`, formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
};
