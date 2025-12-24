import { useState, useEffect } from 'react';
import { auth } from '../Firebase/config';
import { onAuthStateChanged } from 'firebase/auth';
import { getUser } from './User';

export function useUserData() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (authUser) => {
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
    });

    return unsubscribe;
  }, []);

  return { user, loading, error };
}