import React, { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import axios from "axios";
import Sidebar from "../components/Sidebar";
import { message } from "antd";
import ConfirmationModal from "../components/ConfirmationModal";
import { CopyButton } from "./EsahulatQueuePage.jsx";

const API =
  process.env.REACT_APP_ESAHULAT_API_URL ||
  "http://localhost:5000/api/esahulat-officer";

const REJECTION_REASONS = [
  "Fake slip",
  "CNIC and eSahulat ID not matched",
  "Other",
];

const EsahulatRequestDetailPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [data, setData] = useState(null);
  const [localImage, setLocalImage] = useState(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [rejectReason, setRejectReason] = useState("");
  const [customReason, setCustomReason] = useState("");
  const [collapsed, setCollapsed] = useState(false);
  const token = localStorage.getItem("esahulat_token");
  const [confirmAction, setConfirmAction] = useState(null);
  const [copiedKey, setCopiedKey] = useState(null);

  const headers = useMemo(
    () => ({ Authorization: `Bearer ${token}` }),
    [token],
  );

  const loadRequest = async () => {
    setLoading(true);
    try {
      const res = await axios.get(`${API}/esahulat-officer/requests/${id}`, {
        headers,
      });

      setData(res.data.data);
    } catch (err) {
      setData(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadRequest();
  }, [id]);

  const approve = async () => {
    setSubmitting(true);
    try {
      await axios.patch(
        `${API}/esahulat-officer/requests/${id}/approve`,
        {},
        { headers },
      );
      message.success("Request approved successfully.");
      navigate("/requests");
    } catch (err) {
      message.error(
        err?.response?.data?.message || "Failed to approve request.",
      );

      return false;
    } finally {
      setSubmitting(false);
    }
  };

  const finalRejectReason =
    rejectReason === "Other" ? customReason.trim() : rejectReason;
  const canReject =
    rejectReason && (rejectReason !== "Other" || customReason.trim());

  const reject = async () => {
    // console.log(finalRejectReason);
    // return;
    if (!canReject) {
      message.error("Please enter rejection reason");
      return;
    }
    setSubmitting(true);
    try {
      await axios.patch(
        `${API}/esahulat-officer/requests/${id}/reject`,
        { reason: finalRejectReason },
        { headers },
      );

      message.success("Request rejected successfully.");
      setRejectReason("");
      setCustomReason("");

      navigate("/requests");
    } catch (err) {
      message.error(
        err?.response?.data?.message || "Failed to reject request.",
      );

      return false;
    } finally {
      setSubmitting(false);
    }
  };

  const GetImage = async (raw) => {
    if (!raw) return null;

    try {
      const response = await axios.get(`${API}/esahulat-officer/documents/`, {
        headers,
        params: {
          raw,
        },
        responseType: "blob",
      });

      const blobUrl = URL.createObjectURL(response.data);

      setLocalImage(blobUrl);
    } catch (err) {
      console.error("GetImage error:", err);
      return null;
    }
  };

  useEffect(() => {
    GetImage(data?.esahulat?.slipImage);
  }, [data?.esahulat?.slipImage]);

  const cnicMismatch =
    data?.esahulat?.cnicOnSlip &&
    data?.citizen?.cnic &&
    data.esahulat.cnicOnSlip.replace(/-/g, "") !==
      data.citizen.cnic.replace(/-/g, "");

  const closeModal = () => {
    if (submitting) return;
    setActionModal(null);
    setRejectReason("");
    setCustomReason("");
  };

  const copyToClipboard = async (value, key) => {
    if (!value) return;
    try {
      await navigator.clipboard.writeText(value);
      setCopiedKey(key);
      setTimeout(() => setCopiedKey((k) => (k === key ? null : k)), 1200);
    } catch (err) {
      // Clipboard API can fail on non-HTTPS/localhost-exempt contexts — fail silently.
    }
  };

  return (
    <div style={s.layout}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@300;400;500;600;700&display=swap');
        *, *::before, *::after { box-sizing: border-box; }
        .apd-input:focus { border-color: #374151 !important; box-shadow: 0 0 0 3px rgba(55,65,81,0.1) !important; outline: none; }
        .apd-card { transition: box-shadow 0.18s ease, transform 0.18s ease; }
      `}</style>

      <Sidebar collapsed={collapsed} onToggle={() => setCollapsed((c) => !c)} />

      <main style={s.main}>
        <div style={s.headerRow}>
          <div>
            <p style={s.eyebrow}>eSahulat Verification</p>
            <h1 style={s.pageTitle}>Review Request</h1>
          </div>
          <button onClick={() => navigate("/requests")} style={s.backBtn}>
            Back to queue
          </button>
        </div>

        {loading ? (
          <div style={s.loading}>Loading request...</div>
        ) : !data ? (
          <div style={s.errorState}>
            <div style={s.errorTitle}>Request not found</div>
            <div style={s.errorSub}>
              It may already be resolved, or you don't have access to it.
            </div>
          </div>
        ) : (
          <div style={s.grid}>
            <section style={s.card} className="apd-card">
              {data.esahulat?.slipImage && localImage && (
                <img src={localImage} alt="eSahulat slip" style={s.hero} />
              )}

              <div style={s.badgeRow}>
                <span style={{ ...s.statusPill, ...s.pending }}>
                  {data.esahulat?.status}
                </span>
                <span style={s.metaPill}>
                  Submitted{" "}
                  {data.esahulat?.submittedAt
                    ? new Date(data.esahulat.submittedAt).toLocaleString()
                    : "—"}
                </span>
                {cnicMismatch && <span style={s.warnPill}>CNIC mismatch</span>}
              </div>

              <h2 style={s.eventTitle}>{data.applicationNumber}</h2>
              <p style={s.eventMeta}>{data.applicationType} application</p>

              <div style={s.detailGrid}>
                {data.esahulat?.barcodeValue && (
                  <Detail
                    label="Barcode"
                    value={data.esahulat?.barcodeValue}
                    wide
                    copiedKey={copiedKey}
                    idKey={`esid-${data.applicationId}`}
                    copyToClipboard={copyToClipboard}
                  />
                )}
                <Detail
                  label="CNIC on slip"
                  value={data.esahulat?.cnicOnSlip}
                  copiedKey={copiedKey}
                  cnicKey={`cnic-${data.applicationId}`}
                  copyToClipboard={copyToClipboard}
                />

                <Detail label="eSahulat ID" value={data.esahulat?.eSahulatId} />

                <Detail label="District" value={data.esahulat?.district} />
                {data.esahulat?.serviceCharges > 0 && (
                  <Detail
                    label="Service charges"
                    value={
                      data.esahulat?.serviceCharges
                        ? `PKR ${data.esahulat.serviceCharges}`
                        : "—"
                    }
                  />
                )}
                <Detail
                  label="Issue date"
                  value={
                    data.esahulat?.issueDate
                      ? new Date(data.esahulat.issueDate).toLocaleDateString()
                      : "—"
                  }
                />
                <Detail
                  label="Expiry date"
                  value={
                    data.esahulat?.expiryDate
                      ? new Date(data.esahulat.expiryDate).toLocaleDateString()
                      : "—"
                  }
                />
              </div>
            </section>

            <aside style={s.sideColumn}>
              <section style={s.card} className="apd-card">
                <h3 style={s.sectionTitle}>Applicant</h3>
                <div style={s.submitter}>
                  <div style={s.avatar}>
                    {data.personalInfo?.fullName?.[0]?.toUpperCase() || "?"}
                  </div>
                  <div>
                    <div style={s.name}>
                      {data.personalInfo?.fullName || "Unknown"}
                    </div>
                    <div style={s.email}>{data.citizen?.cnic}</div>
                  </div>
                </div>
                {cnicMismatch && (
                  <p style={s.mismatchNote}>
                    The CNIC on the slip does not match the citizen's registered
                    CNIC. Verify carefully before approving.
                  </p>
                )}
              </section>

              {data.esahulat?.status === "PENDING" && (
                <section style={s.card} className="apd-card">
                  <h3 style={s.sectionTitle}>Officer actions</h3>
                  <button
                    onClick={() => setConfirmAction("approve")}
                    disabled={submitting}
                    style={s.approveBtn}
                  >
                    {submitting && !finalRejectReason
                      ? "Please wait..."
                      : "Approve request"}
                  </button>

                  <h4 style={s.sectionTitle}>Reason</h4>

                  <select
                    className="ap-input"
                    style={s.modalSelect}
                    value={rejectReason}
                    onChange={(e) => setRejectReason(e.target.value)}
                    autoFocus
                  >
                    <option value="" disabled>
                      Select a reason
                    </option>
                    {REJECTION_REASONS.map((r) => (
                      <option key={r} value={r}>
                        {r}
                      </option>
                    ))}
                  </select>
                  {rejectReason === "Other" && (
                    <textarea
                      disabled={submitting}
                      className="apd-input"
                      style={s.textarea}
                      placeholder="Rejection reason"
                      value={customReason}
                      onChange={(e) => setCustomReason(e.target.value)}
                    />
                  )}
                  <button
                    onClick={() => {
                      if (!finalRejectReason) {
                        message.error("Please enter rejection reason");
                        return;
                      }

                      setConfirmAction("reject");
                    }}
                    disabled={submitting}
                    style={s.rejectBtn}
                  >
                    {submitting && finalRejectReason
                      ? "Please wait..."
                      : "Reject request"}
                  </button>
                </section>
              )}

              <section style={s.card} className="apd-card">
                <h3 style={s.sectionTitle}>Review notes</h3>
                <p style={s.noteText}>
                  Compare the CNIC, name, and expiry date on the slip image
                  against the applicant's registered details before approving.
                  Reject with a specific reason if anything looks altered or
                  expired.
                </p>
              </section>
            </aside>
          </div>
        )}
      </main>

      <ConfirmationModal
        open={!!confirmAction}
        title={
          confirmAction === "approve"
            ? "Approve this request?"
            : "Reject this request?"
        }
        message={
          confirmAction === "approve"
            ? "This is a critical action. Please carefully verify the eSahulat slip, CNIC, applicant details, and expiry date before approving. Once approved, this request will be marked as verified."
            : "This is a critical action. Please make sure the rejection reason is accurate and justified. Once rejected, this request will be marked as rejected."
        }
        confirmText={
          confirmAction === "approve" ? "Yes, approve" : "Yes, reject"
        }
        cancelText="Cancel"
        variant={confirmAction === "approve" ? "default" : "danger"}
        loading={submitting}
        onCancel={() => {
          if (!submitting) {
            setConfirmAction(null);
          }
        }}
        onConfirm={async () => {
          if (confirmAction === "approve") {
            await approve();
          } else if (confirmAction === "reject") {
            await reject();
          }

          setConfirmAction(null);
        }}
      />
    </div>
  );
};

const Detail = ({
  label,
  value,
  wide = false,
  copiedKey,
  cnicKey,
  idKey,
  copyToClipboard,
}) => (
  <div
    style={{
      ...s.detailItem,
      gridColumn: wide ? "1 / -1" : "auto",
      display: "flex",
      alignItems: "center",
      justifyContent: "space-between",
      gap: "10px",
    }}
  >
    <div style={{ minWidth: 0 }}>
      <div style={s.detailLabel}>{label}</div>
      <div style={s.detailValue}>{value || "—"}</div>
    </div>
    {(label == "CNIC on slip" || label == "Barcode") && (
      <CopyButton
        copied={copiedKey === cnicKey}
        onClick={() => copyToClipboard(value, cnicKey)}
      />
    )}
  </div>
);

const s = {
  layout: {
    display: "flex",
    minHeight: "100vh",
    backgroundColor: "#F8F9FB",
    fontFamily: "'DM Sans', system-ui, sans-serif",
  },
  main: { flex: 1, minWidth: 0, padding: "40px 48px", overflowY: "auto" },
  headerRow: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "flex-start",
    gap: 16,
    flexWrap: "wrap",
    marginBottom: 22,
  },
  eyebrow: {
    fontSize: 11,
    fontWeight: 700,
    color: "#9CA3AF",
    letterSpacing: "0.1em",
    textTransform: "uppercase",
    margin: "0 0 6px",
  },
  pageTitle: {
    fontSize: 28,
    fontWeight: 700,
    color: "#111827",
    margin: 0,
    letterSpacing: "-0.6px",
  },
  backBtn: {
    backgroundColor: "#111827",
    color: "#fff",
    border: "none",
    borderRadius: 10,
    padding: "11px 16px",
    fontSize: 13,
    fontWeight: 700,
    cursor: "pointer",
  },
  loading: {
    backgroundColor: "#fff",
    border: "1px solid #E5E7EB",
    borderRadius: 16,
    padding: 30,
    textAlign: "center",
    color: "#6B7280",
    fontWeight: 600,
  },
  errorState: {
    backgroundColor: "#fff",
    border: "1px solid #E5E7EB",
    borderRadius: 16,
    padding: 30,
    textAlign: "center",
  },
  errorTitle: { fontSize: 16, fontWeight: 800, color: "#111827" },
  errorSub: { marginTop: 6, color: "#6B7280", fontSize: 13 },
  grid: {
    display: "grid",
    gridTemplateColumns: "minmax(0, 1.75fr) minmax(300px, 0.9fr)",
    gap: 18,
    alignItems: "start",
  },
  sideColumn: { display: "grid", gap: 18 },
  card: {
    backgroundColor: "#fff",
    border: "1px solid #E5E7EB",
    borderRadius: 16,
    overflow: "hidden",
    padding: 18,
    boxShadow: "0 1px 4px rgba(0,0,0,0.04)",
  },
  hero: {
    width: "100%",
    maxHeight: 420,
    objectFit: "contain",
    borderRadius: 14,
    marginBottom: 14,
    backgroundColor: "#F3F4F6",
  },
  badgeRow: { display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 12 },
  statusPill: {
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 999,
    padding: "6px 10px",
    fontSize: 11,
    fontWeight: 800,
    textTransform: "uppercase",
  },
  pending: { backgroundColor: "rgba(55,65,81,0.1)", color: "#374151" },
  metaPill: {
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 999,
    padding: "6px 10px",
    fontSize: 11,
    fontWeight: 700,
    backgroundColor: "#F3F4F6",
    color: "#6B7280",
  },
  warnPill: {
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 999,
    padding: "6px 10px",
    fontSize: 11,
    fontWeight: 800,
    backgroundColor: "#FEF2F2",
    color: "#B91C1C",
    textTransform: "uppercase",
  },
  eventTitle: {
    margin: "0 0 6px",
    fontSize: 24,
    lineHeight: 1.15,
    fontWeight: 800,
    color: "#111827",
    letterSpacing: "-0.5px",
  },
  eventMeta: { margin: "0 0 14px", color: "#6B7280", fontSize: 13 },
  detailGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(2, minmax(0, 1fr))",
    gap: 12,
    marginTop: 18,
  },
  detailItem: {
    backgroundColor: "#F9FAFB",
    border: "1px solid #E5E7EB",
    borderRadius: 12,
    padding: 14,
  },
  detailLabel: {
    fontSize: 11,
    fontWeight: 700,
    letterSpacing: "0.08em",
    textTransform: "uppercase",
    color: "#9CA3AF",
    marginBottom: 6,
  },
  detailValue: {
    fontSize: 13.5,
    fontWeight: 700,
    color: "#111827",
    lineHeight: 1.5,
    wordBreak: "break-word",
  },
  sectionTitle: {
    margin: 0,
    fontSize: 14,
    fontWeight: 800,
    color: "#111827",
    marginBottom: 12,
  },
  submitter: { display: "flex", alignItems: "center", gap: 12 },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: "50%",
    backgroundColor: "#111827",
    color: "#fff",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontWeight: 800,
  },
  name: { fontSize: 13.5, fontWeight: 800, color: "#111827" },
  email: { fontSize: 12, color: "#6B7280", marginTop: 2 },
  mismatchNote: {
    marginTop: 12,
    marginBottom: 0,
    fontSize: 12.5,
    color: "#B91C1C",
    lineHeight: 1.6,
  },
  approveBtn: {
    width: "100%",
    backgroundColor: "#111827",
    color: "#fff",
    border: "none",
    borderRadius: 12,
    padding: "12px 14px",
    fontSize: 13,
    fontWeight: 800,
    cursor: "pointer",
    marginBottom: 12,
  },
  rejectBtn: {
    width: "100%",
    backgroundColor: "#c72800",
    color: "#fff",
    border: "none",
    borderRadius: 12,
    padding: "12px 14px",
    fontSize: 13,
    fontWeight: 800,
    cursor: "pointer",
  },
  textarea: {
    width: "100%",
    minHeight: 110,
    borderRadius: 12,
    border: "1.5px solid #E5E7EB",
    padding: 12,
    fontSize: 13,
    color: "#111827",
    resize: "vertical",
    marginBottom: 12,
    marginTop: 12,
    fontFamily: "'DM Sans', system-ui, sans-serif",
  },
  noteText: { margin: 0, fontSize: 13, lineHeight: 1.7, color: "#6B7280" },
  modalSelect: {
    width: "100%",
    borderRadius: 10,
    border: "1.5px solid #E5E7EB",
    padding: "11px 12px",
    fontSize: 13,
    color: "#111827",
    marginBottom: 14,
    fontFamily: "'DM Sans', system-ui, sans-serif",
    backgroundColor: "#fff",
    cursor: "pointer",
  },
};

export default EsahulatRequestDetailPage;
