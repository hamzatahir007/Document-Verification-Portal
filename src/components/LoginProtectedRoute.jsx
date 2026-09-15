import React, { useEffect, useState } from "react";
import { Navigate } from "react-router-dom";
import axios from "axios";

const API = process.env.REACT_APP_ESAHULAT_API_URL;

const LoginProtectedRoute = ({ children }) => {
  const [checking, setChecking] = useState(true);
  const [authenticated, setAuthenticated] = useState(false);

  useEffect(() => {
    const verifyOfficer = async () => {
      const token = localStorage.getItem("esahulat_token");

      if (!token) {
        setChecking(false);
        return;
      }

      try {
        const res = await axios.get(
          `${API}/esahulat-officer/me`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );

        if (
          res.data.success &&
          res.data.data?.officer
        ) {
          localStorage.setItem(
            "esahulat_officer",
            JSON.stringify(res.data.data.officer)
          );

          setAuthenticated(true);
        } else {
          throw new Error("Invalid session");
        }
      } catch (error) {
        localStorage.removeItem("esahulat_token");
        localStorage.removeItem("esahulat_officer");

        setAuthenticated(false);
      } finally {
        setChecking(false);
      }
    };

    verifyOfficer();
  }, []);

  if (checking) {
    return (
      <div
        style={{
          minHeight: "100vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontFamily: "Arial, sans-serif",
          color: "#6B7280",
        }}
      >
        Checking authentication...
      </div>
    );
  }

  return authenticated ? (
    <Navigate to="/requests" replace />
  ) : (
    children
  );
};

export default LoginProtectedRoute;