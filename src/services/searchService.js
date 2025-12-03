import api from './api';

class SearchService {
  async globalSearch(query) {
    try {
      const response = await api.get(`/search?query=${encodeURIComponent(query)}`);
      return response.data;
    } catch (error) {
      console.error('خطا در جستجو:', error);
      throw error;
    }
  }
}

export default new SearchService(); 