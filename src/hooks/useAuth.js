import { useAuth as useAuthContext } from "../components/context/AuthContext";

export function useAuth() {
  return useAuthContext();
}

