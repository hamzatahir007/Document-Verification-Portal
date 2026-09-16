import React, { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import axios from "axios";

const API =
  process.env.REACT_APP_ESAHULAT_API_URL ||
  "http://localhost:5000/api/esahulat-officer";

const NAV = [
  {
    to: "/requests",
    label: "Pending Approvals",
    icon: (
      <svg
        width="16"
        height="16"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.7"
        viewBox="0 0 24 24"
      >
        <path d="M9 12l2 2 4-4" />
        <path d="M7 3h10l4 4v10l-4 4H7l-4-4V7z" />
      </svg>
    ),
  },
];

const Sidebar = ({ collapsed = false, onToggle }) => {
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);

  const performLogout = async () => {
    setLoggingOut(true);

    const token = localStorage.getItem("esahulat_token");
    try {
      await axios.post(
        `${API}/logout`,
        {},
        { headers: { Authorization: `Bearer ${token}` } },
      );
    } catch (err) {
      console.log(err);
      // Even if the network call fails, still clear the local session below.
    }
    localStorage.removeItem("esahulat_token");
    localStorage.removeItem("esahulat_officer");
    navigate("/login");
  };

  return (
    <>
      <style>{`
        .wb-sidebar { transition: width 0.22s cubic-bezier(0.4,0,0.2,1); }
        .wb-nav-link { transition: background 0.13s, color 0.13s; }
        .wb-nav-link:hover { background: rgba(255,255,255,0.05) !important; color: rgba(255,255,255,0.85) !important; }
        .wb-logout:hover { background: rgba(255,255,255,0.05) !important; color: rgba(255,255,255,0.7) !important; }
        .wb-toggle:hover { background: rgba(255,255,255,0.08) !important; }
      `}</style>

      <aside
        className="wb-sidebar"
        style={{ ...s.sidebar, width: collapsed ? 64 : 240 }}
      >
        {/* Brand + Toggle */}
        <div
          style={{
            ...s.brandRow,
            padding: collapsed ? "20px 0" : "20px 20px",
            justifyContent: collapsed ? "center" : "space-between",
          }}
        >
          {!collapsed && (
            <div style={s.brand}>
              <div style={s.brandMark}>
                <span style={s.brandLetter}>V</span>
              </div>
              <div>
                <div style={s.brandName}>Verification</div>
                <div style={s.brandSub}>Officer Portal</div>
              </div>
            </div>
          )}
          <button
            className="wb-toggle"
            onClick={onToggle}
            style={{ ...s.toggleBtn, margin: collapsed ? "0 auto" : "0" }}
            title={collapsed ? "Expand" : "Collapse"}
          >
            {collapsed ? (
              <svg
                width="15"
                height="15"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                viewBox="0 0 24 24"
              >
                <line x1="3" y1="6" x2="21" y2="6" />
                <line x1="3" y1="12" x2="21" y2="12" />
                <line x1="3" y1="18" x2="21" y2="18" />
              </svg>
            ) : (
              <svg
                width="15"
                height="15"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                viewBox="0 0 24 24"
              >
                <line x1="3" y1="6" x2="21" y2="6" />
                <line x1="3" y1="12" x2="21" y2="12" />
                <line x1="3" y1="18" x2="21" y2="18" />
              </svg>
            )}
          </button>
        </div>

        {collapsed && (
          <div style={s.brandMarkCollapsed}>
            <div style={s.brandMark}>
              <span style={s.brandLetter}>W</span>
            </div>
          </div>
        )}

        <div style={s.divider} />

        <nav style={{ padding: collapsed ? "12px 8px" : "12px 10px", flex: 1 }}>
          {!collapsed && <div style={s.navSection}>Menu</div>}
          {NAV.map(({ to, label, icon }) => {
            const active = pathname === to || pathname.startsWith(`${to}/`);
            return (
              <Link
                key={to}
                to={to}
                className="wb-nav-link"
                title={collapsed ? label : undefined}
                style={{
                  ...s.link,
                  ...(active ? s.linkActive : {}),
                  justifyContent: collapsed ? "center" : "flex-start",
                  padding: collapsed ? "10px" : "9px 12px",
                }}
              >
                <span style={{ ...s.icon, ...(active ? s.iconActive : {}) }}>
                  {icon}
                </span>
                {!collapsed && <span style={s.linkLabel}>{label}</span>}
                {active && !collapsed && <div style={s.activeDot} />}
              </Link>
            );
          })}
        </nav>

        <div
          style={{
            padding: collapsed ? "10px 8px 20px" : "10px 10px 20px",
            borderTop: "1px solid rgba(255,255,255,0.05)",
          }}
        >
          <button
            className="wb-logout"
            onClick={() => setConfirmOpen(true)}
            title={collapsed ? "Sign Out" : undefined}
            style={{
              ...s.logout,
              justifyContent: collapsed ? "center" : "flex-start",
              padding: collapsed ? "10px" : "9px 12px",
            }}
          >
            <svg
              width="15"
              height="15"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.8"
              viewBox="0 0 24 24"
            >
              <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
              <polyline points="16 17 21 12 16 7" />
              <line x1="21" y1="12" x2="9" y2="12" />
            </svg>
            {!collapsed && <span style={{ marginLeft: 9 }}>Sign Out</span>}
          </button>
        </div>
      </aside>

      {confirmOpen && (
        <div
          style={s.overlay}
          onClick={() => !loggingOut && setConfirmOpen(false)}
        >
          <div style={s.modal} onClick={(e) => e.stopPropagation()}>
            <div style={s.modalIconWrap}>
              <svg
                width="20"
                height="20"
                fill="none"
                stroke="#DC2626"
                strokeWidth="1.8"
                viewBox="0 0 24 24"
              >
                <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
                <polyline points="16 17 21 12 16 7" />
                <line x1="21" y1="12" x2="9" y2="12" />
              </svg>
            </div>
            <h3 style={s.modalTitle}>Sign out?</h3>
            <p style={s.modalText}>
              You'll need to sign in again to review pending eSahulat requests.
            </p>
            <div style={s.modalActions}>
              <button
                style={s.modalCancelBtn}
                onClick={() => setConfirmOpen(false)}
                disabled={loggingOut}
              >
                Cancel
              </button>
              <button
                style={{ ...s.modalConfirmBtn, opacity: loggingOut ? 0.7 : 1 }}
                onClick={performLogout}
                disabled={loggingOut}
              >
                {loggingOut ? "Signing out..." : "Sign out"}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

const s = {
  sidebar: {
    minHeight: "100vh",
    backgroundColor: "#111827",
    display: "flex",
    flexDirection: "column",
    borderRight: "1px solid rgba(255,255,255,0.04)",
    flexShrink: 0,
    position: "relative",
    zIndex: 10,
  },
  brandRow: {
    display: "flex",
    alignItems: "center",
  },
  brand: {
    display: "flex",
    alignItems: "center",
    gap: 10,
    overflow: "hidden",
  },
  brandMark: {
    width: 34,
    height: 34,
    borderRadius: 9,
    background: "linear-gradient(135deg, #1F2937 0%, #111827 100%)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
  },
  brandMarkCollapsed: {
    display: "flex",
    justifyContent: "center",
    marginTop: -8,
    marginBottom: 4,
  },
  brandLetter: {
    color: "#fff",
    fontWeight: "700",
    fontSize: 16,
    fontFamily: "'Georgia', serif",
    lineHeight: 1,
  },
  brandName: {
    color: "#F9FAFB",
    fontSize: 13,
    fontWeight: "700",
    letterSpacing: "-0.2px",
    fontFamily: "'DM Sans', system-ui, sans-serif",
    whiteSpace: "nowrap",
  },
  brandSub: {
    color: "rgba(255,255,255,0.25)",
    fontSize: 9.5,
    letterSpacing: "0.1em",
    textTransform: "uppercase",
    marginTop: 1,
    fontFamily: "'DM Sans', system-ui, sans-serif",
    whiteSpace: "nowrap",
  },
  toggleBtn: {
    background: "transparent",
    border: "1px solid rgba(255,255,255,0.08)",
    borderRadius: 7,
    color: "rgba(255,255,255,0.4)",
    cursor: "pointer",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    width: 30,
    height: 30,
    flexShrink: 0,
    transition: "background 0.13s",
  },
  divider: {
    height: 1,
    backgroundColor: "rgba(255,255,255,0.05)",
    margin: "0 16px 4px",
  },
  navSection: {
    fontSize: 9.5,
    letterSpacing: "0.12em",
    color: "rgba(255,255,255,0.18)",
    padding: "0 12px",
    marginBottom: 4,
    marginTop: 6,
    textTransform: "uppercase",
    fontFamily: "'DM Sans', system-ui, sans-serif",
    fontWeight: "600",
  },
  link: {
    display: "flex",
    alignItems: "center",
    color: "rgba(255,255,255,0.38)",
    textDecoration: "none",
    borderRadius: 8,
    marginBottom: 1,
    fontSize: 13,
    fontWeight: "500",
    position: "relative",
    fontFamily: "'DM Sans', system-ui, sans-serif",
    letterSpacing: "-0.1px",
  },
  linkActive: {
    backgroundColor: "rgba(255,255,255,0.09)",
    color: "#F3F4F6",
  },
  icon: {
    display: "flex",
    alignItems: "center",
    flexShrink: 0,
  },
  iconActive: {
    color: "#F9FAFB",
  },
  linkLabel: { marginLeft: 9 },
  activeDot: {
    width: 4,
    height: 4,
    borderRadius: "50%",
    backgroundColor: "#E5E7EB",
    marginLeft: "auto",
    flexShrink: 0,
  },
  logout: {
    display: "flex",
    alignItems: "center",
    width: "100%",
    backgroundColor: "transparent",
    color: "rgba(255,255,255,0.25)",
    border: "none",
    borderRadius: 8,
    cursor: "pointer",
    fontSize: 13,
    fontWeight: "500",
    fontFamily: "'DM Sans', system-ui, sans-serif",
    transition: "all 0.13s",
  },

  overlay: {
    position: 'fixed',
    inset: 0,
    backgroundColor: 'rgba(17,24,39,0.55)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 100,
  },
  modal: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: '28px 26px 22px',
    width: '100%',
    maxWidth: 340,
    boxShadow: '0 20px 48px rgba(0,0,0,0.25)',
    fontFamily: "'DM Sans', system-ui, sans-serif",
  },
  modalIconWrap: {
    width: 40,
    height: 40,
    borderRadius: 10,
    backgroundColor: '#FEF2F2',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 14,
  },
  modalTitle: {
    fontSize: 17,
    fontWeight: 700,
    color: '#111827',
    margin: '0 0 6px',
    letterSpacing: '-0.3px',
  },
  modalText: {
    fontSize: 13.5,
    color: '#6B7280',
    margin: '0 0 22px',
    lineHeight: 1.6,
  },
  modalActions: {
    display: 'flex',
    gap: 10,
  },
  modalCancelBtn: {
    flex: 1,
    padding: '10px 14px',
    borderRadius: 9,
    border: '1.5px solid #E5E7EB',
    backgroundColor: '#fff',
    color: '#374151',
    fontSize: 13,
    fontWeight: 700,
    cursor: 'pointer',
    fontFamily: "'DM Sans', system-ui, sans-serif",
  },
  modalConfirmBtn: {
    flex: 1,
    padding: '10px 14px',
    borderRadius: 9,
    border: 'none',
    backgroundColor: '#DC2626',
    color: '#fff',
    fontSize: 13,
    fontWeight: 700,
    cursor: 'pointer',
    fontFamily: "'DM Sans', system-ui, sans-serif",
  },
  
};

export default Sidebar;
