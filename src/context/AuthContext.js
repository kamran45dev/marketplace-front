// context/AuthContext.js
// Global auth state — wraps the entire app

import { createContext, useContext, useEffect, useState } from 'react';
import { auth, onAuthStateChanged, signOut } from '../utils/firebaseConfig';
import api from '../utils/api';

const AuthContext = createContext({});

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);       // Firebase user
  const [profile, setProfile] = useState(null); // Firestore user profile (has role)
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Listen to Firebase auth state changes
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        setUser(firebaseUser);
        try {
          // Fetch user profile from backend (includes role)
          const { data } = await api.get('/api/auth/me');
          setProfile(data);
        } catch (err) {
          // If profile fetch fails (e.g. first-time admin login before Firestore doc is created),
          // fall back to basic info so the app doesn't redirect-loop
          console.warn('Could not fetch profile from backend:', err.message);
          setProfile({
            uid: firebaseUser.uid,
            email: firebaseUser.email,
            name: firebaseUser.displayName || firebaseUser.email,
            role: firebaseUser.email === process.env.NEXT_PUBLIC_ADMIN_EMAIL ? 'admin' : 'buyer',
          });
        }
      } else {
        setUser(null);
        setProfile(null);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const logout = async () => {
    await signOut(auth);
    setUser(null);
    setProfile(null);
  };

  return (
    <AuthContext.Provider value={{ user, profile, loading, logout, setProfile }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
