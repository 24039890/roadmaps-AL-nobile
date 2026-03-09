import { createContext, useContext } from "react";
import { User } from "../types";

interface AuthCtx {
  user: User | null;
  loading: boolean;
  setUser: (u: User | null) => void;
}

export const AuthContext = createContext<AuthCtx>({
  user: null,
  loading: false,
  setUser: () => {},
});

export const useAuth = () => useContext(AuthContext);
