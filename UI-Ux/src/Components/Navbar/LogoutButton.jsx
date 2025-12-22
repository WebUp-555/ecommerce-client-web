import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { logoutUser } from "../../Api/userApi";
import "./logoutButton.css";

const LogoutButton = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);

  const handleLogout = async () => {
    if (loading) return;
    setLoading(true);
    try {
      await logoutUser();
    } catch (err) {
      console.error("Logout error:", err?.response?.data ?? err?.message ?? err);
    } finally {
      // Clear local auth state
      localStorage.removeItem("token");
      localStorage.removeItem("user");
      // Notify app that auth was reset so components can react immediately
      window.dispatchEvent(new CustomEvent("auth-ready", { detail: { token: null } }));
      // Redirect with flag so signin page can perform any additional cleanup
      navigate("/signin?logout=true", { replace: true });
      setLoading(false);
    }
  };

  return (
    <button
      className="logout-btn"
      onClick={handleLogout}
      aria-label="Logout"
      aria-busy={loading}
      disabled={loading}
    >
      {loading ? "Logging out…" : "Logout"}
    </button>
  );
};

export default LogoutButton;