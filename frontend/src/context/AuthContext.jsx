import { createContext, useContext, useState, useEffect } from "react";

const AuthContext = createContext(null);

const API = "https://mpj-backend-java.onrender.com/api";

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(localStorage.getItem("token"));
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (token) {
      setUser({ loggedIn: true });
    } else {
      setUser(null);
    }

    setLoading(false);
  }, [token]);

  const login = async ({ email, password }) => {
    const res = await fetch("https://mpj-backend-java.onrender.com/api/auth/login", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        email: email.trim(),
        password: password
      })
    });

    if (!res.ok) {
      const err = await res.text();
      throw new Error(err);
    }

    const data = await res.json();

    console.log("TOKEN RECEIVED:", data.token);

    // ✅ STORE PURE TOKEN
    localStorage.setItem("token", data.token);

    setToken(data.token);

    // ✅ DO NOT DECODE TOKEN
    setUser({ email });

    return { email };
  };

  const register = async ({ email, password, name }) => {
    const res = await fetch(`${API}/auth/register`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({ email, password, name })
    });

    if (!res.ok) {
      throw new Error("Registration failed");
    }
  };

  const logout = () => {
    localStorage.removeItem("token");
    setToken(null);
    setUser(null);
  };

  // const getAuthHeader = () => ({
  //   Authorization: `Bearer ${token}`
  // });

  const getAuthHeader = () => ({
    headers: {
      Authorization: `Bearer ${token}`
    }
  });

  return (
    <AuthContext.Provider
      value={{ user, token, loading, login, register, logout, getAuthHeader }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};