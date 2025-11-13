import { useEffect, useState } from 'react';
import { fetchJSON } from '@/lib/api';

type User = {
  uid: string;
  email: string;
  name: string;
  avatar?: string;
  followingAuthors?: string[];
};

export function useAuth() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    try {
      const data = await fetchJSON<{ user: User | null }>('/api/auth/me');
      setUser(data.user);
    } catch {
      setUser(null);
    } finally {
      setLoading(false);
    }
  };

  return { user, loading, isAuthenticated: !!user, checkAuth };
}
