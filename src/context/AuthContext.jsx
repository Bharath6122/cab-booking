import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import api from "../api";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [ready, setReady] = useState(false);

  const signOut = useCallback(() => {
    localStorage.removeItem("cabby-token");
    setUser(null);
  }, []);

  useEffect(() => {
    const token = localStorage.getItem("cabby-token");
    if (!token) {
      setReady(true);
      return;
    }
    api.get("/auth/me")
      .then(({ data }) => setUser(data))
      .catch(signOut)
      .finally(() => setReady(true));
  }, [signOut]);

  const signIn = useCallback(async (credentials) => {
    const { data } = await api.post("/auth/login", credentials);
    localStorage.setItem("cabby-token", data.token);
    setUser(data.user);
    return data.user;
  }, []);

  const register = useCallback(async (details) => {
    const { data } = await api.post("/auth/register", details);
    localStorage.setItem("cabby-token", data.token);
    setUser(data.user);
    return data.user;
  }, []);

  const value = useMemo(() => ({ user, ready, signIn, register, signOut, setUser }), [user, ready, signIn, register, signOut]);
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  return useContext(AuthContext);
}
