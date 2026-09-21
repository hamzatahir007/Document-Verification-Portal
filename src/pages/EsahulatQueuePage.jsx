import React, { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import axios from "axios";
import Sidebar from "../components/Sidebar";

const API =
  process.env.REACT_APP_ESAHULAT_API_URL ||
  "http://localhost:5000/api/esahulat-officer";

const PAGE_SIZE = 10;

const REJECTION_REASONS = [
  "Fake slip",
  "CNIC and eSahulat ID not matched",
  "Other",
];

const EsahulatQueuePage = () => {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [collapsed, setCollapsed] = useState(false);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [actionModal, setActionModal] = useState(null); // { type: 'approve'|'reject', request }
  const [rejectReason, setRejectReason] = useState("");
  const [customReason, setCustomReason] = useState("");

  const [submitting, setSubmitting] = useState(false);
  const [copiedKey, setCopiedKey] = useState(null);

  const token = localStorage.getItem("esahulat_token");
  const officer = useMemo(() => {
    try {
      return JSON.parse(localStorage.getItem("esahulat_officer") || "null");
    } catch {
      return null;
    }
  }, []);

  const headers = useMemo(
    () => ({ Authorization: `Bearer ${token}` }),
    [token],
  );

  const loadRequests = async (targetPage = page) => {
    setLoading(true);
    try {
      const res = await axios.get(`${API}/esahulat-officer/requests`, {
        headers,
        params: { page: targetPage, limit: PAGE_SIZE },
      });
      setRequests(res.data.data.requests || []);
      setTotal(res.data.data.total || 0);
      setTotalPages(res.data.data.totalPages || 1);
      setPage(targetPage);
    } catch (err) {
      setRequests([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadRequests(1);
  }, []);

  const goToPage = (targetPage) => {
    if (targetPage < 1 || targetPage > totalPages || targetPage === page)
      return;
    loadRequests(targetPage);
  };

  const filtered = requests.filter((req) => {
    const query = search.trim().toLowerCase();
    if (!query) return true;
    return [
      req.applicationNumber,
      req.applicationType,
      req.personalInfo?.fullName,
      req.personalInfo?.cnic,
      req.esahulat?.eSahulatId,
      req.esahulat?.district,
    ]
      .filter(Boolean)
      .some((value) => String(value).toLowerCase().includes(query));
  });

  const rangeStart = total === 0 ? 0 : (page - 1) * PAGE_SIZE + 1;
  const rangeEnd = Math.min(page * PAGE_SIZE, total);

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

  const closeModal = () => {
    if (submitting) return;
    setActionModal(null);
    setRejectReason("");
    setCustomReason("");
  };

  const confirmApprove = async () => {
    if (!actionModal) return;
    setSubmitting(true);
    try {
      await axios.patch(
        `${API}/esahulat-officer/requests/${actionModal.request._id}/approve`,
        {},
        { headers },
      );
      setActionModal(null);
      loadRequests(page);
    } finally {
      setSubmitting(false);
    }
  };

  const finalRejectReason =
    rejectReason === "Other" ? customReason.trim() : rejectReason;
  const canReject =
    rejectReason && (rejectReason !== "Other" || customReason.trim());

  const confirmReject = async () => {
    if (!actionModal || !canReject) return;
    // console.log(finalRejectReason);
    // return;

    setSubmitting(true);
    try {
      await axios.patch(
        `${API}/esahulat-officer/requests/${actionModal.request._id}/reject`,
        { reason: finalRejectReason },
        { headers },
      );
      setActionModal(null);
      setRejectReason("");
      setCustomReason("");
      loadRequests(page);
    } finally {
      setSubmitting(false);
    }
  };

  // const cnicMismatch =
  // data?.esahulat?.cnicOnSlip &&
  // data?.citizen?.cnic &&
  // data.esahulat.cnicOnSlip.replace(/-/g, '') !== data.citizen.cnic.replace(/-/g, '');

  return (
    <div style={s.layout}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@300;400;500;600;700&display=swap');
        *, *::before, *::after { box-sizing: border-box; }
        .ap-row:hover { background: #FAFBFC !important; }
        .ap-card:hover { box-shadow: 0 10px 28px rgba(0,0,0,0.08) !important; transform: translateY(-2px); }
        .ap-card { transition: all 0.18s ease; }
        .ap-input:focus { border-color: #374151 !important; box-shadow: 0 0 0 3px rgba(55,65,81,0.1) !important; outline: none; }
      `}</style>

      <Sidebar collapsed={collapsed} onToggle={() => setCollapsed((c) => !c)} />

      <main style={s.main}>
        <div style={s.topBar}>
          <div>
            <p style={s.eyebrow}>eSahulat Verification</p>
            <h1 style={s.pageTitle}>Pending Approvals</h1>
            <p style={s.subTitle}>
              {officer
                ? `Assigned to ${officer.fullName} (${officer.cnic || officer.employeeId})`
                : "Requests assigned to you for review."}
            </p>
          </div>
          <button onClick={() => loadRequests(1)} style={s.refreshBtn}>
            Refresh
          </button>
        </div>

        <div style={s.toolbar}>
          <div style={s.searchWrap}>
            <input
              className="ap-input"
              style={s.searchInput}
              placeholder="Search by application number, CNIC, name, eSahulat ID..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
        </div>

        <div style={s.summaryRow}>
          <SummaryCard
            label="Pending in my queue"
            value={requests.length}
            color="#374151"
          />
        </div>

        <div style={s.card} className="ap-card">
          {loading ? (
            <div style={s.loading}>Loading requests...</div>
          ) : filtered.length === 0 ? (
            <div style={s.empty}>
              <div style={s.emptyTitle}>No pending requests</div>
              <div style={s.emptySub}>
                You're all caught up. New requests will appear here as citizens
                submit slips.
              </div>
            </div>
          ) : (
            <div style={s.tableWrap}>
              <table style={s.table}>
                <thead>
                  <tr>
                    <th style={s.th}>Application</th>
                    <th style={s.th}>Applicant</th>
                    <th style={s.th}>eSahulat ID</th>
                    <th style={s.th}>District</th>
                    <th style={s.th}>Submitted</th>
                    <th style={s.th}>Actions</th>
                    <th style={s.th}>View</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((req) => {
                    const cnicKey = `cnic-${req._id}`;
                    const idKey = `esid-${req._id}`;
                    return (
                      <tr key={req._id} className="ap-row" style={s.row}>
                        <td style={s.td}>
                          <div style={s.appCell}>
                            <div style={s.appTitle}>
                              {req.applicationNumber}
                            </div>
                            <div style={s.appMeta}>{req.applicationType}</div>
                          </div>
                        </td>
                        <td style={s.td}>
                          <div style={s.appTitle}>
                            {req.personalInfo?.fullName || "Unknown"}
                          </div>
                          <div style={s.copyRow}>
                            <span style={s.appMeta}>
                              {req.esahulat?.cnicOnSlip || "—"}
                            </span>
                            {req.esahulat?.cnicOnSlip && (
                              <CopyButton
                                copied={copiedKey === cnicKey}
                                onClick={() =>
                                  copyToClipboard(
                                    req.esahulat?.cnicOnSlip,
                                    cnicKey,
                                  )
                                }
                              />
                            )}
                          </div>
                          {/* <div style={s.appMeta}>{req.personalInfo?.cnic}</div> */}
                        </td>
                        <td style={s.td}>
                          {/* {req.esahulat?.eSahulatId || "—"} */}
                          <div style={s.copyRow}>
                            <span>{req.esahulat?.barcodeValue || "—"}</span>
                            {req.esahulat?.barcodeValue && (
                              <CopyButton
                                copied={copiedKey === idKey}
                                onClick={() =>
                                  copyToClipboard(
                                    req.esahulat.barcodeValue,
                                    idKey,
                                  )
                                }
                              />
                            )}
                          </div>
                        </td>
                        <td style={s.td}>{req.esahulat?.district || "—"}</td>
                        <td style={s.td}>
                          {req.esahulat?.submittedAt
                            ? new Date(
                                req.esahulat.submittedAt,
                              ).toLocaleString()
                            : "—"}
                        </td>
                        <td style={s.td}>
                          <div style={s.actionsRow}>
                            <button
                              className="ap-approve-btn"
                              style={s.iconBtn}
                              title="Approve"
                              onClick={() =>
                                setActionModal({
                                  type: "approve",
                                  request: req,
                                })
                              }
                            >
                              <svg
                                width="15"
                                height="15"
                                fill="none"
                                stroke="#15803D"
                                strokeWidth="2.4"
                                viewBox="0 0 24 24"
                              >
                                <polyline points="20 6 9 17 4 12" />
                              </svg>
                            </button>
                            <button
                              className="ap-reject-btn"
                              style={s.iconBtn}
                              title="Reject"
                              onClick={() =>
                                setActionModal({ type: "reject", request: req })
                              }
                            >
                              <svg
                                width="14"
                                height="14"
                                fill="none"
                                stroke="#B91C1C"
                                strokeWidth="2.4"
                                viewBox="0 0 24 24"
                              >
                                <line x1="18" y1="6" x2="6" y2="18" />
                                <line x1="6" y1="6" x2="18" y2="18" />
                              </svg>
                            </button>
                            {/* <Link
                              to={`/requests/${req._id}`}
                              style={s.reviewBtn}
                            >
                              Review
                            </Link> */}
                          </div>
                        </td>
                        <td style={s.td}>
                          <Link to={`/requests/${req._id}`} style={s.reviewBtn}>
                            Review
                          </Link>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}

          {!loading && total > 0 && (
            <div style={s.paginationBar}>
              <span style={s.rangeText}>
                Showing {rangeStart}–{rangeEnd} of {total}
              </span>
              <div style={s.pagerControls}>
                <button
                  className="ap-page-btn"
                  style={s.pageBtn}
                  onClick={() => goToPage(page - 1)}
                  disabled={page <= 1}
                >
                  Previous
                </button>
                <span style={s.pageIndicator}>
                  Page {page} of {totalPages}
                </span>
                <button
                  className="ap-page-btn"
                  style={s.pageBtn}
                  onClick={() => goToPage(page + 1)}
                  disabled={page >= totalPages}
                >
                  Next
                </button>
              </div>
            </div>
          )}
        </div>
      </main>

      {actionModal && (
        <div style={s.overlay} onClick={closeModal}>
          <div style={s.modal} onClick={(e) => e.stopPropagation()}>
            {actionModal.type === "approve" ? (
              <>
                <div style={{ ...s.modalIconWrap, backgroundColor: "#DCFCE7" }}>
                  <svg
                    width="20"
                    height="20"
                    fill="none"
                    stroke="#15803D"
                    strokeWidth="2.2"
                    viewBox="0 0 24 24"
                  >
                    <polyline points="20 6 9 17 4 12" />
                  </svg>
                </div>
                <h3 style={s.modalTitle}>Approve this request?</h3>
                <p style={s.modalText}>
                  {actionModal.request.applicationNumber} —{" "}
                  {actionModal.request.personalInfo?.fullName ||
                    "Unknown applicant"}{" "}
                  will be notified and allowed to continue their application.
                </p>
                <div style={s.modalActions}>
                  <button
                    style={s.modalCancelBtn}
                    onClick={closeModal}
                    disabled={submitting}
                  >
                    Cancel
                  </button>
                  <button
                    style={{
                      ...s.modalApproveBtn,
                      opacity: submitting ? 0.7 : 1,
                    }}
                    onClick={confirmApprove}
                    disabled={submitting}
                  >
                    {submitting ? "Approving..." : "Approve"}
                  </button>
                </div>
              </>
            ) : (
              <>
                <div style={{ ...s.modalIconWrap, backgroundColor: "#FEF2F2" }}>
                  <svg
                    width="20"
                    height="20"
                    fill="none"
                    stroke="#B91C1C"
                    strokeWidth="2.2"
                    viewBox="0 0 24 24"
                  >
                    <line x1="18" y1="6" x2="6" y2="18" />
                    <line x1="6" y1="6" x2="18" y2="18" />
                  </svg>
                </div>
                <h3 style={s.modalTitle}>Reject this request?</h3>
                <p style={s.modalText}>
                  {actionModal.request.applicationNumber} —{" "}
                  {actionModal.request.personalInfo?.fullName ||
                    "Unknown applicant"}
                </p>
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
                    className="ap-input"
                    style={s.modalTextarea}
                    placeholder="Enter the reason"
                    value={customReason}
                    onChange={(e) => setCustomReason(e.target.value)}
                    autoFocus
                  />
                )}
                <div style={s.modalActions}>
                  <button
                    style={s.modalCancelBtn}
                    onClick={closeModal}
                    disabled={submitting}
                  >
                    Cancel
                  </button>
                  <button
                    style={{
                      ...s.modalRejectBtn,
                      opacity: submitting || !canReject ? 0.6 : 1,
                      cursor:
                        submitting || !canReject ? "not-allowed" : "pointer",
                    }}
                    onClick={confirmReject}
                    disabled={submitting || !canReject}
                  >
                    {submitting ? "Rejecting..." : "Reject"}
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export const CopyButton = ({ copied, onClick }) => (
  <button
    type="button"
    className="ap-copy-btn"
    onClick={onClick}
    title={copied ? "Copied!" : "Copy"}
    style={s.copyBtn}
  >
    {copied ? (
      <svg
        width="12"
        height="12"
        fill="none"
        stroke="#15803D"
        strokeWidth="2.4"
        viewBox="0 0 24 24"
      >
        <polyline points="20 6 9 17 4 12" />
      </svg>
    ) : (
      <svg
        width="12"
        height="12"
        fill="none"
        stroke="#9CA3AF"
        strokeWidth="2"
        viewBox="0 0 24 24"
      >
        <rect x="9" y="9" width="13" height="13" rx="2" />
        <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
      </svg>
    )}
  </button>
);

const SummaryCard = ({ label, value, color }) => (
  <div style={{ ...s.summaryCard, borderTopColor: color }}>
    <div style={s.summaryLabel}>{label}</div>
    <div style={{ ...s.summaryValue, color }}>{value}</div>
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
  topBar: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "flex-start",
    gap: 16,
    marginBottom: 24,
    flexWrap: "wrap",
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
  subTitle: { margin: "8px 0 0", color: "#6B7280", fontSize: 13 },
  refreshBtn: {
    backgroundColor: "#111827",
    color: "#fff",
    border: "none",
    borderRadius: 10,
    padding: "11px 16px",
    fontSize: 13,
    fontWeight: 700,
    cursor: "pointer",
  },
  toolbar: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    gap: 12,
    flexWrap: "wrap",
    marginBottom: 18,
  },
  searchWrap: { minWidth: 260, flex: 1, maxWidth: 480 },
  searchInput: {
    width: "100%",
    backgroundColor: "#fff",
    border: "1.5px solid #E5E7EB",
    borderRadius: 10,
    padding: "11px 13px",
    fontSize: 13,
    color: "#111827",
  },
  summaryRow: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
    gap: 12,
    marginBottom: 18,
  },
  summaryCard: {
    backgroundColor: "#fff",
    border: "1px solid #E5E7EB",
    borderTopWidth: 4,
    borderRadius: 14,
    padding: "16px 18px",
  },
  summaryLabel: {
    fontSize: 12,
    color: "#9CA3AF",
    fontWeight: 700,
    marginBottom: 6,
  },
  summaryValue: { fontSize: 26, fontWeight: 800, letterSpacing: "-0.8px" },
  card: {
    backgroundColor: "#fff",
    border: "1px solid #E5E7EB",
    borderRadius: 16,
    boxShadow: "0 1px 4px rgba(0,0,0,0.04)",
    overflow: "hidden",
  },
  tableWrap: { width: "100%", overflowX: "auto" },
  table: { width: "100%", borderCollapse: "collapse" },
  th: {
    textAlign: "left",
    padding: "13px 16px",
    fontSize: 10.5,
    color: "#9CA3AF",
    fontWeight: 700,
    textTransform: "uppercase",
    letterSpacing: "0.08em",
    borderBottom: "1px solid #F3F4F6",
    whiteSpace: "nowrap",
  },
  row: { borderBottom: "1px solid #F9FAFB" },
  td: {
    padding: "14px 16px",
    fontSize: 13,
    color: "#374151",
    verticalAlign: "middle",
  },
  appCell: { display: "flex", flexDirection: "column" },
  appTitle: {
    fontSize: 13.5,
    fontWeight: 800,
    color: "#111827",
    marginBottom: 2,
  },
  appMeta: { fontSize: 12, color: "#6B7280" },
  copyRow: { display: "flex", alignItems: "center", gap: 6 },
  copyBtn: {
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    width: 20,
    height: 20,
    borderRadius: 6,
    border: "1px solid #E5E7EB",
    backgroundColor: "#fff",
    cursor: "pointer",
    flexShrink: 0,
    padding: 0,
  },
  actionsRow: { display: "flex", alignItems: "center", gap: 6 },
  iconBtn: {
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    width: 30,
    height: 30,
    borderRadius: 8,
    border: "1.5px solid #E5E7EB",
    backgroundColor: "#fff",
    cursor: "pointer",
    flexShrink: 0,
    transition: "background 0.13s, border-color 0.13s",
  },
  reviewBtn: {
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#111827",
    color: "#fff",
    textDecoration: "none",
    borderRadius: 10,
    padding: "9px 14px",
    fontSize: 12,
    fontWeight: 700,
    whiteSpace: "nowrap",
  },
  loading: {
    padding: "34px 20px",
    textAlign: "center",
    color: "#6B7280",
    fontWeight: 600,
  },
  empty: { padding: "42px 20px", textAlign: "center" },
  emptyTitle: { fontSize: 15, fontWeight: 800, color: "#111827" },
  emptySub: { fontSize: 13, color: "#6B7280", marginTop: 4 },
  paginationBar: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    padding: "14px 16px",
    borderTop: "1px solid #F3F4F6",
    flexWrap: "wrap",
    gap: 10,
  },
  rangeText: { fontSize: 12.5, color: "#6B7280", fontWeight: 600 },
  pagerControls: { display: "flex", alignItems: "center", gap: 10 },
  pageBtn: {
    backgroundColor: "#fff",
    border: "1.5px solid #E5E7EB",
    borderRadius: 8,
    padding: "7px 14px",
    fontSize: 12.5,
    fontWeight: 700,
    color: "#111827",
    cursor: "pointer",
  },
  pageIndicator: { fontSize: 12.5, fontWeight: 700, color: "#374151" },
  overlay: {
    position: "fixed",
    inset: 0,
    backgroundColor: "rgba(17,24,39,0.55)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    zIndex: 100,
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
  modalIconWrap: {
    width: 40,
    height: 40,
    borderRadius: 10,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 14,
  },
  modalTitle: {
    fontSize: 17,
    fontWeight: 700,
    color: "#111827",
    margin: "0 0 6px",
    letterSpacing: "-0.3px",
  },
  modalText: {
    fontSize: 13.5,
    color: "#6B7280",
    margin: "0 0 16px",
    lineHeight: 1.6,
  },
  modalTextarea: {
    width: "100%",
    minHeight: 90,
    borderRadius: 10,
    border: "1.5px solid #E5E7EB",
    padding: 12,
    fontSize: 13,
    color: "#111827",
    resize: "vertical",
    marginBottom: 18,
    fontFamily: "'DM Sans', system-ui, sans-serif",
  },
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
  modalActions: { display: "flex", gap: 10 },
  modalCancelBtn: {
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
  modalApproveBtn: {
    flex: 1,
    padding: "10px 14px",
    borderRadius: 9,
    border: "none",
    backgroundColor: "#15803D",
    color: "#fff",
    fontSize: 13,
    fontWeight: 700,
    cursor: "pointer",
    fontFamily: "'DM Sans', system-ui, sans-serif",
  },
  modalRejectBtn: {
    flex: 1,
    padding: "10px 14px",
    borderRadius: 9,
    border: "none",
    backgroundColor: "#B91C1C",
    color: "#fff",
    fontSize: 13,
    fontWeight: 700,
    fontFamily: "'DM Sans', system-ui, sans-serif",
  },
};

export default EsahulatQueuePage;
