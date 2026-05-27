"use client";

import { useEffect, useState } from "react";
import {
  browserLocalPersistence,
  createUserWithEmailAndPassword,
  GoogleAuthProvider,
  onAuthStateChanged,
  sendPasswordResetEmail,
  setPersistence,
  signInWithEmailAndPassword,
  signInWithPopup,
  signOut,
  type User,
} from "firebase/auth";
import { auth } from "@/lib/firebase/client";

export function useAuth() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!auth) {
      setLoading(false);
      return;
    }
    setPersistence(auth, browserLocalPersistence);
    return onAuthStateChanged(auth, (nextUser) => {
      setUser(nextUser);
      setLoading(false);
    });
  }, []);

  return {
    user,
    loading,
    login: async (email: string, password: string) => {
      if (!auth) throw new Error("Firebase config is missing.");
      return signInWithEmailAndPassword(auth, email, password);
    },
    register: async (email: string, password: string) => {
      if (!auth) throw new Error("Firebase config is missing.");
      return createUserWithEmailAndPassword(auth, email, password);
    },
    googleLogin: async () => {
      if (!auth) throw new Error("Firebase config is missing.");
      return signInWithPopup(auth, new GoogleAuthProvider());
    },
    resetPassword: async (email: string) => {
      if (!auth) throw new Error("Firebase config is missing.");
      return sendPasswordResetEmail(auth, email);
    },
    logout: async () => {
      if (!auth) return;
      return signOut(auth);
    },
  };
}
