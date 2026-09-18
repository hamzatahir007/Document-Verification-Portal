import React from "react";

const ConfirmationModal = ({
  open,
  title,
  message,
  confirmText = "Confirm",
  cancelText = "Cancel",
  onConfirm,
  onCancel,
  loading = false,
  variant = "danger",
}) => {
  if (!open) return null;

  const isDanger = variant === "danger";

  return (
    <div style={s.overlay} onClick={() => !loading && onCancel()}>
      <div style={s.modal} onClick={(e) => e.stopPropagation()}>
        <div
          style={{
            ...s.iconWrap,
            backgroundColor: isDanger ? "#FEF2F2" : "#F3F4F6",
          }}
        >
          {isDanger ? (
            <svg
              width="20"
              height="20"
              fill="none"
              stroke="#DC2626"
              strokeWidth="1.8"
              viewBox="0 0 24 24"
            >
              <path d="M12 9v4" />
              <path d="M12 17h.01" />
              <path d="M10.3 3.5L2.8 17a2 2 0 001.75 3h14.9a2 2 0 001.75-3l-7.5-13.5a2 2 0 00-3.4 0z" />
            </svg>
          ) : (
            <svg
              width="20"
              height="20"
              fill="none"
              stroke="#374151"
              strokeWidth="1.8"
              viewBox="0 0 24 24"
            >
              <path d="M5 12l4 4L19 6" />
            </svg>
          )}
        </div>

        <h3 style={s.title}>{title}</h3>

        <p style={s.text}>{message}</p>

        <div style={s.actions}>
          <button
            style={s.cancelBtn}
            onClick={onCancel}
            disabled={loading}
          >
            {cancelText}
          </button>

          <button
            style={{
              ...s.confirmBtn,
              backgroundColor: isDanger ? "#DC2626" : "#111827",
              opacity: loading ? 0.7 : 1,
            }}
            onClick={onConfirm}
            disabled={loading}
          >
            {loading ? "Please wait..." : confirmText}
          </button>
        </div>
      </div>
    </div>
  );
};

const s = {
  overlay: {
    position: "fixed",
    inset: 0,
    backgroundColor: "rgba(17,24,39,0.55)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    zIndex: 1000,
    padding: 20,
  },

  modal: {
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: "28px 26px 22px",
    width: "100%",
    maxWidth: 380,
    boxShadow: "0 20px 48px rgba(0,0,0,0.25)",
    fontFamily: "'DM Sans', system-ui, sans-serif",
  },

  iconWrap: {
    width: 40,
    height: 40,
    borderRadius: 10,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 14,
  },

  title: {
    fontSize: 17,
    fontWeight: 700,
    color: "#111827",
    margin: "0 0 7px",
    letterSpacing: "-0.3px",
  },

  text: {
    fontSize: 13.5,
    color: "#6B7280",
    margin: "0 0 22px",
    lineHeight: 1.6,
  },

  actions: {
    display: "flex",
    gap: 10,
  },

  cancelBtn: {
    flex: 1,
    padding: "10px 14px",
    borderRadius: 9,
    border: "1.5px solid #E5E7EB",
    backgroundColor: "#fff",
    color: "#374151",
    fontSize: 13,
    fontWeight: 700,
    cursor: "pointer",
    fontFamily: "'DM Sans', system-ui, sans-serif",
  },

  confirmBtn: {
    flex: 1,
    padding: "10px 14px",
    borderRadius: 9,
    border: "none",
    color: "#fff",
    fontSize: 13,
    fontWeight: 700,
    cursor: "pointer",
    fontFamily: "'DM Sans', system-ui, sans-serif",
  },
};

export default ConfirmationModal;