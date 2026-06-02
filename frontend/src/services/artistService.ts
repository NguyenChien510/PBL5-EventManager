import { apiClient } from '../utils/axios';

export const ArtistService = {
  async getAll() {
    const res = await apiClient.get('/artists');
    return res.data;
  },
  async search(query: string, exclude: string[] = []) {
    const res = await apiClient.get('/artists/search', {
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
