// hooks/useAuth.js
import { useContext } from "react";
import AuthContext from "../context/AuthContext";

// Custom hook to access the authentication context
export const useAuth = () => {
  const context = useContext(AuthContext);

  // Error handling: If the hook is used outside an AuthProvider, throw an error
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }

  return context; // Return the authentication context (e.g., isAuthenticated, token, etc.)
};
