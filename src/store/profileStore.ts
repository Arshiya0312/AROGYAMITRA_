import { create } from 'zustand';
import axios from 'axios';
import { useAuthStore } from './authStore';

interface Profile {
  age?: number;
  gender?: string;
  weight?: number;
  height?: number;
  goal?: string;
  activity_level?: string;
  dietary_preferences?: string;
  medications?: string;
  health_conditions?: string;
  allergies?: string;
}

interface ProfileState {
  profile: Profile | null;
  loading: boolean;
  fetchProfile: () => Promise<void>;
  updateProfile: (profile: Profile) => Promise<void>;
}

export const useProfileStore = create<ProfileState>((set) => ({
  profile: null,
  loading: false,
  fetchProfile: async () => {
    const token = useAuthStore.getState().token;
    if (!token) return;
    set({ loading: true });
    try {
      const res = await axios.get('/api/profile', {
        headers: { Authorization: `Bearer ${token}` }
      });
      set({ profile: res.data, loading: false });
    } catch (e) {
      set({ loading: false });
    }
  },
  updateProfile: async (profile) => {
    const token = useAuthStore.getState().token;
    if (!token) return;
    try {
      await axios.post('/api/profile', profile, {
        headers: { Authorization: `Bearer ${token}` }
      });
      set({ profile });
    } catch (e) {
      console.error(e);
    }
  }
}));
