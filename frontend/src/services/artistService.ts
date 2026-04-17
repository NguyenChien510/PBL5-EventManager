import axios from 'axios';

const API_URL = 'http://localhost:8080/api/artists';

export const ArtistService = {
  async getAll() {
    const res = await axios.get(API_URL);
    return res.data;
  },
  async search(query: string, exclude: string[] = []) {
    const res = await axios.get(`${API_URL}/search`, {
      params: { 
        query, 
        exclude: exclude.length > 0 ? exclude : undefined 
      },
      paramsSerializer: {
        indexes: null // Result: exclude=Name1&exclude=Name2
      }
    });
    return res.data;
  }
};

