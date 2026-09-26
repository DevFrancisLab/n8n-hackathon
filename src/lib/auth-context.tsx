"use client";

import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import * as authApi from "@/lib/api/auth";
import { onAuthFailure } from "@/lib/api/client";
import { removeKey, STORAGE_KEYS } from "@/lib/storage";
import type { LoginInput, SessionUser, SignupInput } from "@/types";

type AuthContextValue = {
  user: SessionUser | null;
  ready: boolean;
  signup: (input: SignupInput) => Promise<SessionUser>;
  login: (input: LoginInput) => Promise<SessionUser>;
  logout: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<SessionUser | null>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let active = true;
    const unsubscribe = onAuthFailure(() => {
      removeKey(STORAGE_KEYS.session);
      if (active) setUser(null);
    });
    authApi
      .getMe()
      .then((session) => {
        if (active) setUser(session);
      })
      .finally(() => {
        if (active) setReady(true);
      });
    return () => {
      active = false;
      unsubscribe();
    };
  }, []);

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      ready,
      signup: async (input) => {
        const session = await authApi.signup(input);
        setUser(session);
        return session;
      },
      login: async (input) => {
        const session = await authApi.login(input);
        setUser(session);
        return session;
      },
      logout: async () => {
        setUser(null);
        await authApi.logout();
      },
    }),
    [ready, user],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used within AuthProvider");
  return context;
}
