import React, { useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";

const API = process.env.REACT_APP_ESAHULAT_API_URL;

const LoginPage = () => {
  const [cnic, setCnic] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    console.log(`${API}/esahulat-officer/login`);
    try {
      const res = await axios.post(`${API}/esahulat-officer/login`, {
        cnic,
        password,
      });
      const token = res.data.data.token;

      localStorage.setItem("esahulat_token", token);

      const profileRes = await axios.get(`${API}/esahulat-officer/me`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      // 4. Make sure profile was successfully returned
      if (!profileRes.data.success || !profileRes.data.data?.officer) {
        throw new Error("Unable to verify officer profile.");
      }

      const officer = profileRes.data.data.officer;
      // console.log(officer , 'officer');

      localStorage.setItem("esahulat_officer", JSON.stringify(officer));
    
      navigate("/requests", { replace: true });
    } catch (err) {
      setError(
        err?.response?.data?.message ||
          "Invalid credentials. Please try again.",
      );
      setLoading(false);
    }
  };

  return (
    <div style={s.page}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@300;400;500;600;700&family=DM+Mono:wght@400;500&display=swap');
        *, *::before, *::after { box-sizing: border-box; }
        .wb-input:focus { border-color: #374151 !important; box-shadow: 0 0 0 3px rgba(55,65,81,0.12) !important; outline: none; }
        .wb-btn:hover:not(:disabled) { background: #1F2937 !important; }
        .wb-btn:active:not(:disabled) { transform: scale(0.99); }
        .wb-btn { transition: background 0.15s, transform 0.1s; }
        @keyframes spin { to { transform: rotate(360deg); } }
      `}</style>

      <div style={s.left}>
        <div style={s.leftContent}>
          <div style={s.logoRow}>
            <div style={s.logoMark}>
              <span style={s.logoLetter}>V</span>
            </div>
            <span style={s.logoText}>verification</span>
          </div>
          <h1 style={s.leftHeading}>
            Officer
            <br />
            Portal
          </h1>
          <p style={s.leftSub}>
            Review and verify citizen eSahulat slips for Domicile and PRC
            applications. Restricted to authorized Commissioner Officers.
          </p>
          <div style={s.pillRow}>
            {["Domicile", "PRC-C", "PRC-D", "Verification"].map((t) => (
              <span key={t} style={s.pill}>
                {t}
              </span>
            ))}
          </div>
        </div>
        <div style={s.leftFooter}>
          <span style={s.footerText}>
            Sindh Government · Officer Access Only
          </span>
        </div>
      </div>

      <div style={s.right}>
        <div style={s.card}>
          <div style={s.cardTop}>
            <p style={s.cardEyebrow}>Administrator Login</p>
            <h2 style={s.cardTitle}>Sign in</h2>
            <p style={s.cardSub}>Enter your admin credentials to continue</p>
          </div>

          {error && (
            <div style={s.errorBox}>
              <svg
                width="13"
                height="13"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                viewBox="0 0 24 24"
                style={{ flexShrink: 0 }}
              >
                <circle cx="12" cy="12" r="10" />
                <line x1="12" y1="8" x2="12" y2="12" />
                <line x1="12" y1="16" x2="12.01" y2="16" />
              </svg>
              {error}
            </div>
          )}

          <form onSubmit={handleLogin} style={s.form}>
            <div style={s.field}>
              <label style={s.label}>Employee ID</label>
              <input
                className="wb-input"
                style={s.input}
                type="text"
                inputMode="numeric"
                placeholder="42000-0000000-0"
                value={cnic}
                onChange={(e) => {
                  // Allow only digits
                  const value = e.target.value.replace(/\D/g, "");

                  // Maximum 13 digits
                  if (value.length <= 13) {
                    setCnic(value);
                  }
                }}
                required
              />
            </div>
            <div style={s.field}>
              <label style={s.label}>Password</label>

              <div style={{ position: "relative" }}>
                <input
                  className="wb-input"
                  style={{
                    ...s.input,
                    paddingRight: 42,
                  }}
                  type={showPassword ? "text" : "password"}
                  placeholder="••••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />

                <button
                  type="button"
                  onClick={() => setShowPassword((prev) => !prev)}
                  style={{
                    position: "absolute",
                    right: 10,
                    top: "50%",
                    transform: "translateY(-50%)",
                    border: "none",
                    background: "transparent",
                    cursor: "pointer",
                    padding: 4,
                    color: "#6B7280",
                    display: "flex",
                    alignItems: "center",
                  }}
                  aria-label={showPassword ? "Hide password" : "Show password"}
                >
                  {!showPassword ? (
                    // Eye off
                    <svg
                      width="18"
                      height="18"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                    >
                      <path d="M3 3l18 18" />
                      <path d="M10.6 10.6a2 2 0 0 0 2.8 2.8" />
                      <path d="M9.9 4.2A10.8 10.8 0 0 1 12 4c5 0 8.5 4 10 8-0.6 1.5-1.6 2.9-2.9 4" />
                      <path d="M6.6 6.6C4.8 7.8 3.6 9.6 2 12c1.5 4 5 8 10 8 1 0 2-.2 2.9-.5" />
                    </svg>
                  ) : (
                    // Eye
                    <svg
                      width="18"
                      height="18"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                    >
                      <path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12z" />
                      <circle cx="12" cy="12" r="3" />
                    </svg>
                  )}
                </button>
              </div>
            </div>
            <button
              type="submit"
              className="wb-btn"
              style={{
                ...s.btn,
                opacity: loading ? 0.7 : 1,
                cursor: loading ? "not-allowed" : "pointer",
              }}
              disabled={loading}
            >
              {loading ? (
                <span
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: 8,
                  }}
                >
                  <span style={s.spinner} />
                  Signing in...
                </span>
              ) : (
                "Sign in"
              )}
            </button>
          </form>

          <p style={s.hint}>
            <svg
              width="11"
              height="11"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              viewBox="0 0 24 24"
              style={{ marginRight: 5, verticalAlign: "middle" }}
            >
              <rect x="3" y="11" width="18" height="11" rx="2" />
              <path d="M7 11V7a5 5 0 0 1 10 0v4" />
            </svg>
            Restricted access — authorized personnel only
          </p>
        </div>
      </div>
    </div>
  );
};

const s = {
  page: {
    minHeight: "100vh",
    display: "flex",
    fontFamily: "'DM Sans', system-ui, sans-serif",
    backgroundColor: "#F8F9FB",
  },
  left: {
    width: "40%",
    minWidth: 320,
    backgroundColor: "#111827",
    display: "flex",
    flexDirection: "column",
    justifyContent: "space-between",
    padding: "52px 52px 36px",
  },
  leftContent: {
    flex: 1,
    display: "flex",
    flexDirection: "column",
    justifyContent: "center",
    paddingBottom: 40,
  },
  logoRow: { display: "flex", alignItems: "center", gap: 10, marginBottom: 52 },
  logoMark: {
    width: 32,
    height: 32,
    borderRadius: 8,
    background: "linear-gradient(135deg, #1F2937 0%, #111827 100%)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
  },
  logoLetter: {
    color: "#fff",
    fontWeight: "700",
    fontSize: 15,
    fontFamily: "'Georgia', serif",
  },
  logoText: {
    color: "#F9FAFB",
    fontSize: 15,
    fontWeight: "600",
    letterSpacing: "-0.2px",
  },
  leftHeading: {
    fontSize: 48,
    fontWeight: "700",
    color: "#F9FAFB",
    margin: "0 0 18px",
    lineHeight: 1.05,
    letterSpacing: "-1.5px",
  },
  leftSub: {
    fontSize: 14,
    color: "rgba(255,255,255,0.35)",
    lineHeight: 1.8,
    margin: "0 0 36px",
    fontWeight: "400",
    maxWidth: 300,
  },
  pillRow: { display: "flex", flexWrap: "wrap", gap: 7 },
  pill: {
    fontSize: 11,
    fontWeight: "500",
    color: "rgba(255,255,255,0.3)",
    border: "1px solid rgba(255,255,255,0.1)",
    borderRadius: 20,
    padding: "4px 12px",
    letterSpacing: "0.02em",
  },
  leftFooter: { borderTop: "1px solid rgba(255,255,255,0.07)", paddingTop: 20 },
  footerText: {
    fontSize: 11,
    color: "rgba(255,255,255,0.18)",
    fontWeight: "400",
    fontFamily: "'DM Mono', monospace",
  },
  right: {
    flex: 1,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    padding: "40px 48px",
    backgroundColor: "#F8F9FB",
  },
  card: {
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: "40px 36px",
    width: "100%",
    maxWidth: 400,
    border: "1px solid #EAECF0",
    boxShadow: "0 2px 20px rgba(0,0,0,0.05)",
  },
  cardTop: { marginBottom: 28 },
  cardEyebrow: {
    fontSize: 11,
    fontWeight: "600",
    color: "#4B5563",
    letterSpacing: "0.1em",
    textTransform: "uppercase",
    margin: "0 0 10px",
  },
  cardTitle: {
    fontSize: 26,
    fontWeight: "700",
    color: "#111827",
    margin: "0 0 6px",
    letterSpacing: "-0.6px",
  },
  cardSub: { fontSize: 13.5, color: "#9CA3AF", margin: 0, fontWeight: "400" },
  errorBox: {
    display: "flex",
    alignItems: "center",
    gap: 8,
    backgroundColor: "#FEF2F2",
    border: "1px solid #FECACA",
    color: "#B91C1C",
    padding: "10px 14px",
    borderRadius: 9,
    fontSize: 12.5,
    marginBottom: 20,
    fontWeight: "500",
  },
  form: { display: "flex", flexDirection: "column", gap: 16 },
  field: { display: "flex", flexDirection: "column", gap: 6 },
  label: {
    fontSize: 12,
    fontWeight: "600",
    color: "#374151",
    letterSpacing: "0.01em",
  },
  input: {
    padding: "11px 13px",
    borderRadius: 9,
    border: "1.5px solid #E5E7EB",
    fontSize: 13.5,
    color: "#111827",
    outline: "none",
    transition: "border-color 0.15s, box-shadow 0.15s",
    backgroundColor: "#FAFAFA",
    fontFamily: "'DM Sans', system-ui, sans-serif",
    fontWeight: "400",
    width: "100%",
  },
  btn: {
    marginTop: 4,
    padding: "12px",
    backgroundColor: "#111827",
    color: "#fff",
    border: "none",
    borderRadius: 9,
    fontSize: 14,
    fontWeight: "600",
    cursor: "pointer",
    letterSpacing: "-0.1px",
    fontFamily: "'DM Sans', system-ui, sans-serif",
  },
  spinner: {
    width: 13,
    height: 13,
    border: "2px solid rgba(255,255,255,0.3)",
    borderTop: "2px solid #fff",
    borderRadius: "50%",
    display: "inline-block",
    animation: "spin 0.7s linear infinite",
  },
  hint: {
    textAlign: "center",
    fontSize: 11.5,
    color: "#D1D5DB",
    marginTop: 20,
    marginBottom: 0,
    fontWeight: "500",
  },
};

export default LoginPage;
