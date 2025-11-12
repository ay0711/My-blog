"use client";

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { auth } from '@/lib/firebase';
import { signOut, onAuthStateChanged, User as FirebaseUser } from 'firebase/auth';

const API_URL = 'http://localhost:5555';

type User = {
  uid: string;
  email: string;
  name: string;
  avatar?: string;
  followingAuthors?: string[];
};

export default function AuthMenu({ mobile }: { mobile?: boolean }) {
  const [user, setUser] = useState<User | null>(null);
  const [firebaseUser, setFirebaseUser] = useState<FirebaseUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Listen to Firebase auth state
    const unsubscribe = onAuthStateChanged(auth, async (fbUser) => {
      setFirebaseUser(fbUser);
      if (fbUser) {
        // Check if user is in backend
        try {
          const res = await fetch(`${API_URL}/api/auth/me`, { credentials: 'include' });
          if (res.ok) {
            const data = await res.json();
            setUser(data.user);
          } else {
            setUser(null);
          }
        } catch (err) {
          // Silently handle - user not authenticated
          setUser(null);
        }
      } else {
        setUser(null);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const handleSignOut = async () => {
    try {
      await signOut(auth);
      await fetch(`${API_URL}/api/auth/logout`, { method: 'POST', credentials: 'include' });
      setUser(null);
    } catch (err) {
      console.error('Sign out error:', err);
    }
  };

  if (loading) return <div className="text-sm text-gray-500">Loading...</div>;

  if (!user || !firebaseUser) {
    return (
      <Link
        href="/sign-in"
        className={`px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition text-sm font-medium ${mobile ? 'w-full text-center' : ''}`}
      >
        Sign In
      </Link>
    );
  }

  return (
    <div className={`flex items-center gap-2 ${mobile ? 'flex-col items-start' : ''}`}>
      {user.avatar ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={user.avatar} alt={user.name} className="w-8 h-8 rounded-full" />
      ) : (
        <div className="w-8 h-8 rounded-full bg-gradient-to-r from-indigo-500 to-purple-500 flex items-center justify-center text-white font-bold">
          {(user.name || user.email).charAt(0).toUpperCase()}
        </div>
      )}
      <span className="text-sm font-medium">{user.name || user.email}</span>
      <button
        onClick={handleSignOut}
        className="text-sm text-gray-600 hover:text-indigo-600 dark:text-gray-400 dark:hover:text-indigo-400"
      >
        Logout
      </button>
    </div>
  );
}
