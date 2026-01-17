import { useState, useEffect } from 'react';
import { auth } from '../services/firebase/firebase_config';
import { onAuthStateChanged } from 'firebase/auth';
import { getUser } from '../data/user';

export function useUserData() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const loadUser = async (authUser) => {
    try {
      if (authUser) {
        // Usa getUser que aplica defaults automaticamente
        const userData = await getUser(authUser.uid);
        if (userData) {
          setUser(userData);
        } else {
          setUser({ nome: authUser.displayName || 'Usuário' });
        }
      } else {
        setUser(null);
      }
    } catch (err) {
      console.error('Erro ao buscar usuário:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, loadUser);
    return unsubscribe;
  }, []);

  const refetch = async () => {
    setLoading(true);
    const authUser = auth.currentUser;
    await loadUser(authUser);
  };

  return { user, loading, error, refetch };
}