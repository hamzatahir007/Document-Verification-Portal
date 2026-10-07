import React, { useEffect, useState } from "react";
import { Navigate } from "react-router-dom";
import axios from "axios";

const API = process.env.REACT_APP_ESAHULAT_API_URL;

const LoginProtectedRoute = ({ children }) => {
  const [checking, setChecking] = useState(true);
  const [officer, setOfficer] = useState(null);

  useEffect(() => {
    let cancelled = false;

    const verifyOfficer = async () => {
      const token = localStorage.getItem("esahulat_token");

      if (!token) {
        if (!cancelled) setChecking(false);
        return;
      }

      try {
        const res = await axios.get(`${API}/esahulat-officer/me`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        const profile = res.data?.data?.officer;

        if (
          !res.data?.success ||
          !profile ||
          profile.isActive !== true ||
          typeof profile.isAssign !== "boolean"
        ) {
          throw new Error("Invalid officer profile.");
        }

        if (!cancelled) {
          localStorage.setItem(
            "esahulat_officer",
            JSON.stringify(profile)
          );
          setOfficer(profile);
        }
      } catch (error) {
        if (!cancelled) {
          localStorage.removeItem("esahulat_token");
          localStorage.removeItem("esahulat_officer");
          setOfficer(null);
        }
      } finally {
        if (!cancelled) setChecking(false);
      }
    };

    verifyOfficer();

    return () => {
      cancelled = true;
    };
  }, []);

  if (checking) {
    return <div style={{ padding: 24 }}>Checking authentication...</div>;
  }

  return officer ? (
    <Navigate
      to={officer.isAssign ? "/requests" : "/history"}
      replace
    />
  ) : (
    children
  );
};

export default LoginProtectedRoute;