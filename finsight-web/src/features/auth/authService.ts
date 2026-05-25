import api from '../../api/api';
import { User } from '../../types';

export const authService = {
  updateProfile: async (data: { name?: string; defaultCurrency?: string }): Promise<User> => {
    const response = await api.patch('/auth/profile', data);
    return response.data;
  },
};
