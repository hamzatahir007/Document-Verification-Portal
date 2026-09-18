import React, { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import axios from "axios";
import Sidebar from "../components/Sidebar";

const API =
  process.env.REACT_APP_ESAHULAT_API_URL ||
  "http://localhost:5000/api/esahulat-officer";

const PAGE_SIZE = 10;

const EsahulatQueuePage = () => {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [collapsed, setCollapsed] = useState(false);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
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
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((req) => (
                    <tr key={req._id} className="ap-row" style={s.row}>
                      <td style={s.td}>
                        <div style={s.appCell}>
                          <div style={s.appTitle}>{req.applicationNumber}</div>
                          <div style={s.appMeta}>{req.applicationType}</div>
                        </div>
                      </td>
                      <td style={s.td}>
                        <div style={s.appTitle}>
                          {req.personalInfo?.fullName || "Unknown"}
                        </div>
                        <div style={s.appMeta}>{req.personalInfo?.cnic}</div>
                      </td>
                      <td style={s.td}>{req.esahulat?.eSahulatId || "—"}</td>
                      <td style={s.td}>{req.esahulat?.district || "—"}</td>
                      <td style={s.td}>
                        {req.esahulat?.submittedAt
                          ? new Date(req.esahulat.submittedAt).toLocaleString()
                          : "—"}
                      </td>
                      <td style={s.td}>
                        <Link to={`/requests/${req._id}`} style={s.reviewBtn}>
                          Review
                        </Link>
                      </td>
                    </tr>
                  ))}
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
    </div>
  );
};

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
};

export default EsahulatQueuePage;
