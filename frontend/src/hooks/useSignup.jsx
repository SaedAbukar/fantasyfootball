import { useState } from "react";
import { useAuth } from "./useAuth";

export default function useSignup(url) {
  const [error, setError] = useState(null);
  const { setUser, isLoading } = useAuth();

  const signup = async (object) => {
    setError(null);

    try {
      const response = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(object),
      });
      const data = await response.json();

      if (response.ok) {
        setUser({ email: data.email, token: data.token });
        return data;
      }
    } catch (err) {
      setError("An error occurred while logging in."); // Handle unexpected errors
      return null; // Return null on exception
    }
  };

  return { signup, isLoading, error };
}
