import axios from 'axios';

// cambiar url a esto
// la cambio a esto para que se comunique con el backend y luego este se comunique con la api
const API_URL = 'http://192.168.18.8:8001';

export const analyzeVideo = async (formData: FormData) => {
  return axios.post(`${API_URL}/video/analyze`, formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
    timeout: 120000,
  });
};
