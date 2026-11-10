
import React, {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";
import { useNavigate, useParams } from "react-router-dom";
import axios from "axios";
import { message, Select } from "antd";

import Sidebar from "../components/Sidebar.jsx";
import ConfirmationModal from "../components/ConfirmationModal.jsx";

// API base URL should end at /api, not /api/complaints/officer
const API = (
  process.env.REACT_APP_ESAHULAT_API_URL ||
  "http://localhost:5000/api"
).replace(/\/+$/, "");

const formatDate = (value) => {
  if (!value) return "—";

  const date = new Date(value);

  return Number.isNaN(date.getTime())
    ? "—"
    : date.toLocaleString();
};

const ComplaintDetailPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [collapsed, setCollapsed] = useState(false);

  // Officer action fields
  const [officerRemarks, setOfficerRemarks] = useState("");
  const [district, setDistrict] = useState("");

  // resolve | dc | tech
  const [confirmAction, setConfirmAction] = useState(null);

  const [loadError, setLoadError] = useState("");

  const token =
    localStorage.getItem("token") ||
    localStorage.getItem("esahulat_token");

  const headers = useMemo(
    () => ({
      ...(token
        ? { Authorization: `Bearer ${token}` }
        : {}),
    }),
    [token],
  );

  // GET complaint details
  const loadComplaint = useCallback(
    async (showLoader = true) => {
      if (showLoader) {
        setLoading(true);
        setLoadError("");
      }

      try {
        const res = await axios.get(
          `${API}/complaints/officer/${id}`,
          { headers },
        );

        const responseData = res?.data?.data ?? res?.data;

        // Supports either { data: complaint } or
        // { data: { complaint: complaint } }
        const complaint =
          responseData?.complaint ||
          responseData?.data?.complaint ||
          responseData;

        setData(complaint);
        setLoadError("");
      } catch (err) {
        console.error("Load complaint error:", err);

        const errorMessage =
          err?.response?.data?.message ||
          "Failed to load complaint details.";

        setLoadError(errorMessage);

        if (showLoader) {
          setData(null);
        } else {
          message.warning(
            "Action completed, but complaint details could not be refreshed.",
          );
        }
      } finally {
        if (showLoader) {
          setLoading(false);
        }
      }
    },
    [id, headers],
  );

  useEffect(() => {
    loadComplaint();
  }, [loadComplaint]);

  // Only New complaints can be processed
  const isNew =
    String(data?.status || "").toLowerCase() === "new";

  // Open confirmation modal after validating input
  const requestAction = (action) => {
    if (!isNew) {
      message.warning("Only New complaints can be updated.");
      return;
    }

    if (action === "resolve" && !officerRemarks.trim()) {
      message.error("Please enter officer remarks.");
      return;
    }

    if (action === "dc" && !district.trim()) {
      message.error("Please enter the destination district.");
      return;
    }

    setConfirmAction(action);
  };

  // Execute the selected officer action
  const submitAction = async () => {
    if (!data || !isNew) {
      message.warning("This complaint is no longer available for action.");
      return false;
    }

    let body = {};

    if (confirmAction === "resolve") {
      body = {
        officerRemarks: officerRemarks.trim(),
      };
    } else if (confirmAction === "dc") {
      body = {
        status: "Transfer",
        district: district.trim(),
      };
    } else if (confirmAction === "tech") {
      body = {
        status: "Transfer",
        subStatus: "techteam",
      };
    } else {
      return false;
    }

    setSubmitting(true);

    try {
      await axios.patch(
        `${API}/complaints/officer/${id}`,
        body,
        { headers },
      );

      const successMessages = {
        resolve: "Complaint resolved successfully.",
        dc: "Complaint transferred to DC successfully.",
        tech: "Complaint transferred to technical team successfully.",
      };

      message.success(successMessages[confirmAction]);

      setConfirmAction(null);
      setOfficerRemarks("");
      setDistrict("");

      // Refresh complaint details to get the updated status
      await loadComplaint(false);

      return true;
    } catch (err) {
      console.error("Complaint action error:", err);

      message.error(
        err?.response?.data?.message ||
        "Failed to process complaint.",
      );

      return false;
    } finally {
      setSubmitting(false);
    }
  };

  const citizenName =
    data?.citizen?.cnicData?.fullName ||
    data?.personalInfo?.fullName ||
    "Unknown";

  const applicationNumber =
    data?.application?.applicationNumber || "—";

  const applicationType =
    data?.application?.applicationType || "—";
  const permanentDistrict =
    data?.citizen?.cnicData?.PerminantDistric || "—";
  const temporaryDistrict =
    data?.citizen?.cnicData?.TempDistric || "—";
  const selectedDistrict =
    data?.application?.addressInfo?.selectedDistrict || "—";

  const confirmTitle = {
    resolve: "Resolve this complaint?",
    dc: "Transfer complaint to DC?",
    tech: "Transfer complaint to technical team?",
  };

  const confirmMessage = {
    resolve: `You are about to resolve complaint ${data?.ticketId}. Please verify your remarks before proceeding.`,
    dc: `You are about to transfer complaint ${data?.ticketId} to ${district}.`,
    tech: `You are about to transfer complaint ${data?.ticketId} to the technical team.`,
  };

  const confirmText = {
    resolve: "Yes, resolve",
    dc: "Yes, transfer to DC",
    tech: "Yes, transfer",
  };

  return (
    <div style={s.layout}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@300;400;500;600;700;800&display=swap');

        *, *::before, *::after {
          box-sizing: border-box;
        }

        .complaint-input:focus,
        .complaint-textarea:focus {
          border-color: #374151 !important;
          box-shadow: 0 0 0 3px rgba(55,65,81,0.1) !important;
          outline: none;
        }

        .complaint-action {
          transition: all 0.18s ease;
        }

        .complaint-action:hover {
          transform: translateY(-1px);
          box-shadow: 0 4px 12px rgba(0,0,0,0.07);
        }

        @media (max-width: 1000px) {
          .complaint-grid {
            grid-template-columns: 1fr !important;
          }
        }

        @media (max-width: 600px) {
          .complaint-main {
            padding: 20px 14px !important;
          }

          .complaint-details {
            grid-template-columns: 1fr !important;
          }
        }
      `}</style>

      <Sidebar
        collapsed={collapsed}
        onToggle={() => setCollapsed((value) => !value)}
      />

      <main className="complaint-main" style={s.main}>
        {/* Header */}
        <div style={s.headerRow}>
          <div>
            <p style={s.eyebrow}>Complaint Management</p>
            <h1 style={s.pageTitle}>Complaint Details</h1>
          </div>

          <button
            onClick={() => navigate("/complain")}
            style={s.backBtn}
          >
            Back to complaints
          </button>
        </div>

        {/* Loading */}
        {loading ? (
          <div style={s.loading}>
            Loading complaint details...
          </div>
        ) : !data ? (
          <div style={s.errorState}>
            <div style={s.errorTitle}>
              Complaint not found
            </div>
            <div style={s.errorSub}>
              {loadError ||
                "The complaint may have been removed or you do not have access."}
            </div>

            <button
              onClick={() => loadComplaint()}
              style={s.retryBtn}
            >
              Try again
            </button>
          </div>
        ) : (
          <div className="complaint-grid" style={s.grid}>
            {/* LEFT COLUMN */}
            <div style={s.primaryColumn}>
              {/* Complaint overview */}
              <section style={s.card}>
                <div style={s.badgeRow}>
                  <span style={s.ticketPill}>
                    {data.ticketId || "No ticket ID"}
                  </span>

                  <span
                    style={{
                      ...s.statusPill,
                      ...(isNew ? s.newStatus : s.otherStatus),
                    }}
                  >
                    {data.status || "Unknown"}
                  </span>

                  <span
                    style={{
                      ...s.statusPill,
                      ...s.priorityPill,
                    }}
                  >
                    {data.priority || "Normal"} Priority
                  </span>

                  <span
                    style={{
                      ...s.statusPill,
                      ...(data.isSlaBreached
                        ? s.breachedPill
                        : s.slaPill),
                    }}
                  >
                    {data.isSlaBreached
                      ? "SLA Breached"
                      : "Within SLA"}
                  </span>
                </div>

                <h2 style={s.eventTitle}>
                  {data.ticketId || "Complaint"}
                </h2>

                <p style={s.eventMeta}>
                  Submitted on {formatDate(data.createdAt)}
                </p>

                <div
                  className="complaint-details"
                  style={s.detailGrid}
                >
                  <Detail
                    label="Category"
                    value={data.category}
                  />

                  <Detail
                    label="Priority"
                    value={data.priority}
                  />

                  <Detail
                    label="Assigned District"
                    value={data.assignedDistrict}
                  />

                  <Detail
                    label="Current Status"
                    value={data.status}
                  />

                  <Detail
                    label="Ticket ID"
                    value={data.ticketId}
                  />

                  <Detail
                    label="Created At"
                    value={formatDate(data.createdAt)}
                  />

                  <Detail
                    label="SLA Deadline"
                    value={formatDate(data.slaDeadline)}
                    wide
                  />
                </div>
              </section>

              {/* Complaint description */}
              <section style={s.card}>
                <h3 style={s.sectionTitle}>
                  Complaint Description
                </h3>

                <div style={s.descriptionBox}>
                  {data.description || "No description provided."}
                </div>
              </section>

              {/* Application information */}
              <section style={s.card}>
                <h3 style={s.sectionTitle}>
                  Related Application
                </h3>

                <div
                  className="complaint-details"
                  style={s.detailGrid}
                >
                  <Detail
                    label="Application Number"
                    value={applicationNumber}
                    wide
                  />

                  <Detail
                    label="Application Type"
                    value={applicationType}
                  />
                  <Detail
                    label="Permanent District"
                    value={permanentDistrict}
                  />
                  <Detail
                    label="Temporary District"
                    value={temporaryDistrict}
                  />
                  <Detail
                    label="Application Selected District"
                    value={selectedDistrict}
                  />

                  {/* <Detail
                    label="Application ID"
                    value={data.application?._id}
                  /> */}
                </div>
              </section>
            </div>

            {/* RIGHT COLUMN */}
            <aside style={s.sideColumn}>
              {/* Citizen details */}
              <section style={s.card}>
                <h3 style={s.sectionTitle}>Citizen Information</h3>

                <div style={s.submitter}>
                  <div style={s.avatar}>
                    {citizenName?.[0]?.toUpperCase() || "?"}
                  </div>

                  <div style={{ minWidth: 0 }}>
                    <div style={s.name}>
                      {citizenName}
                    </div>

                    <div style={s.email}>
                      {data.citizen?.cnic || "CNIC not available"}
                    </div>
                  </div>
                </div>

                <div style={s.separator} />

                <div style={s.detailGrid}>
                  <Detail
                    label="CNIC"
                    value={data.citizen?.cnic}
                    wide
                  />

                  <Detail
                    label="Phone Number"
                    value={data.citizen?.phoneNumber}
                    wide
                  />

                  {/* <Detail
                    label="Citizen ID"
                    value={data.citizen?._id}
                    wide
                  /> */}
                </div>
              </section>

              {/* SLA information */}
              <section style={s.card}>
                <h3 style={s.sectionTitle}>SLA Information</h3>

                <div
                  style={{
                    ...s.slaBox,
                    ...(data.isSlaBreached
                      ? s.slaBoxDanger
                      : s.slaBoxNormal),
                  }}
                >
                  <div style={s.slaLabel}>
                    {data.isSlaBreached
                      ? "SLA deadline breached"
                      : "SLA deadline"}
                  </div>

                  <div style={s.slaDate}>
                    {formatDate(data.slaDeadline)}
                  </div>
                </div>
              </section>

              {/* Officer actions: ONLY FOR NEW STATUS */}
              {isNew ? (
                <section style={s.card}>
                  <h3 style={s.sectionTitle}>
                    Officer Actions
                  </h3>

                  <p style={s.actionIntro}>
                    Select the appropriate action for this complaint.
                  </p>

                  {/* 1. RESOLVE */}
                  <div
                    className="complaint-action"
                    style={s.actionCard}
                  >
                    <div style={s.actionHeading}>
                      <span style={s.actionNumber}>01</span>

                      <div>
                        <h4 style={s.actionTitle}>
                          Resolve Complaint
                        </h4>

                        <p style={s.actionDescription}>
                          Enter your remarks before resolving.
                        </p>
                      </div>
                    </div>

                    <textarea
                      className="complaint-textarea"
                      style={s.textarea}
                      placeholder="Enter officer remarks..."
                      value={officerRemarks}
                      disabled={submitting}
                      onChange={(e) =>
                        setOfficerRemarks(e.target.value)
                      }
                    />

                    <button
                      style={s.resolveBtn}
                      disabled={submitting || !officerRemarks.trim()}
                      onClick={() => requestAction("resolve")}
                    >
                      Resolve complaint
                    </button>
                  </div>

                  {/* 2. TRANSFER TO DC */}
                  <div
                    className="complaint-action"
                    style={s.actionCard}
                  >
                    <div style={s.actionHeading}>
                      <span style={s.actionNumber}>02</span>

                      <div>
                        <h4 style={s.actionTitle}>
                          Transfer to DC
                        </h4>

                        <p style={s.actionDescription}>
                          Select the destination district.
                        </p>
                      </div>
                    </div>

                    <Select
                      className="complaint-input"
                      style={s.input}
                      // type="text"
                      placeholder="Enter district name"
                      value={district}
                      disabled={submitting}
                      options={data?.linkedDistric?.map((e)=>({label:e,value:e}))}
                      onChange={(e) =>
                        setDistrict(e)
                      }
                    />

                    <button
                      style={s.dcBtn}
                      disabled={submitting || !district.trim()}
                      onClick={() => requestAction("dc")}
                    >
                      Transfer to DC
                    </button>
                  </div>

                  {/* 3. TRANSFER TO TECHNICAL TEAM */}
                  <div
                    className="complaint-action"
                    style={s.actionCard}
                  >
                    <div style={s.actionHeading}>
                      <span style={s.actionNumber}>03</span>

                      <div>
                        <h4 style={s.actionTitle}>
                          Transfer to Technical Team
                        </h4>

                        <p style={s.actionDescription}>
                          Forward this complaint to the technical team
                          for further investigation.
                        </p>
                      </div>
                    </div>

                    <button
                      style={s.techBtn}
                      disabled={submitting}
                      onClick={() => requestAction("tech")}
                    >
                      Transfer to Technical Team
                    </button>
                  </div>
                </section>
              ) : (
                /* No actions for other statuses */
                <section style={s.card}>
                  <h3 style={s.sectionTitle}>
                    Officer Actions
                  </h3>

                  <div style={s.readOnlyBox}>
                    <div style={s.readOnlyTitle}>
                      Complaint is not pending
                    </div>

                    <p style={s.readOnlyText}>
                      Current status is{" "}
                      <strong>{data.status}</strong>.
                      Officer actions are available only for
                      complaints with New status.
                    </p>
                  </div>
                </section>
              )}
            </aside>
          </div>
        )}
      </main>

      {/* Confirmation modal */}
      <ConfirmationModal
        open={!!confirmAction}
        title={
          confirmTitle[confirmAction] ||
          "Confirm action?"
        }
        message={
          confirmMessage[confirmAction] ||
          "Are you sure you want to continue?"
        }
        confirmText={
          confirmText[confirmAction] ||
          "Confirm"
        }
        cancelText="Cancel"
        variant="default"
        loading={submitting}
        onCancel={() => {
          if (!submitting) {
            setConfirmAction(null);
          }
        }}
        onConfirm={async () => {
          const success = await submitAction();

          if (success) {
            setConfirmAction(null);
          }
        }}
      />
    </div>
  );
};

// Reusable detail component
const Detail = ({ label, value, wide = false }) => {
  const displayValue =
    value === null || value === undefined || value === ""
      ? "—"
      : String(value);

  return (
    <div
      style={{
        ...s.detailItem,
        gridColumn: wide ? "1 / -1" : "auto",
      }}
    >
      <div style={s.detailLabel}>{label}</div>
      <div style={s.detailValue}>{displayValue}</div>
    </div>
  );
};

const s = {
  layout: {
    display: "flex",
    minHeight: "100vh",
    backgroundColor: "#F8F9FB",
    fontFamily: "'DM Sans', system-ui, sans-serif",
  },

  main: {
    flex: 1,
    minWidth: 0,
    padding: "36px 42px",
    overflowY: "auto",
  },

  headerRow: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "flex-start",
    gap: 16,
    flexWrap: "wrap",
    marginBottom: 24,
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

  grid: {
    display: "grid",
    gridTemplateColumns: "minmax(0, 1.65fr) minmax(300px, 0.9fr)",
    gap: 18,
    alignItems: "start",
  },

  primaryColumn: {
    display: "grid",
    gap: 18,
    minWidth: 0,
  },

  sideColumn: {
    display: "grid",
    gap: 18,
    minWidth: 0,
  },

  card: {
    backgroundColor: "#fff",
    border: "1px solid #E5E7EB",
    borderRadius: 16,
    padding: 18,
    boxShadow: "0 1px 4px rgba(0,0,0,0.04)",
    minWidth: 0,
  },

  badgeRow: {
    display: "flex",
    gap: 8,
    flexWrap: "wrap",
    marginBottom: 14,
  },

  ticketPill: {
    backgroundColor: "#111827",
    color: "#fff",
    padding: "6px 11px",
    borderRadius: 999,
    fontSize: 11,
    fontWeight: 800,
  },

  statusPill: {
    display: "inline-flex",
    alignItems: "center",
    borderRadius: 999,
    padding: "6px 10px",
    fontSize: 11,
    fontWeight: 800,
    textTransform: "uppercase",
  },

  newStatus: {
    backgroundColor: "#FEF3C7",
    color: "#92400E",
  },

  otherStatus: {
    backgroundColor: "#E5E7EB",
    color: "#374151",
  },

  priorityPill: {
    backgroundColor: "#F3F4F6",
    color: "#4B5563",
  },

  breachedPill: {
    backgroundColor: "#FEE2E2",
    color: "#B91C1C",
  },

  slaPill: {
    backgroundColor: "#DCFCE7",
    color: "#166534",
  },

  eventTitle: {
    margin: "0 0 6px",
    fontSize: 24,
    lineHeight: 1.2,
    fontWeight: 800,
    color: "#111827",
    letterSpacing: "-0.5px",
  },

  eventMeta: {
    margin: "0 0 14px",
    color: "#6B7280",
    fontSize: 12,
  },

  detailGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(2, minmax(0, 1fr))",
    gap: 12,
    marginTop: 16,
  },

  detailItem: {
    backgroundColor: "#F9FAFB",
    border: "1px solid #E5E7EB",
    borderRadius: 12,
    padding: 13,
    minWidth: 0,
  },

  detailLabel: {
    fontSize: 10,
    fontWeight: 700,
    letterSpacing: "0.08em",
    textTransform: "uppercase",
    color: "#9CA3AF",
    marginBottom: 6,
  },

  detailValue: {
    fontSize: 13,
    fontWeight: 700,
    color: "#111827",
    lineHeight: 1.5,
    wordBreak: "break-word",
  },

  sectionTitle: {
    margin: "0 0 14px",
    fontSize: 14,
    fontWeight: 800,
    color: "#111827",
  },

  descriptionBox: {
    backgroundColor: "#F9FAFB",
    border: "1px solid #E5E7EB",
    borderRadius: 12,
    padding: 16,
    color: "#374151",
    fontSize: 13,
    lineHeight: 1.8,
    whiteSpace: "pre-wrap",
    wordBreak: "break-word",
    minHeight: 90,
  },

  submitter: {
    display: "flex",
    alignItems: "center",
    gap: 12,
  },

  avatar: {
    width: 44,
    height: 44,
    flexShrink: 0,
    borderRadius: "50%",
    backgroundColor: "#111827",
    color: "#fff",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontWeight: 800,
    fontSize: 17,
  },

  name: {
    fontSize: 13.5,
    fontWeight: 800,
    color: "#111827",
    wordBreak: "break-word",
  },

  email: {
    fontSize: 12,
    color: "#6B7280",
    marginTop: 3,
  },

  separator: {
    height: 1,
    backgroundColor: "#E5E7EB",
    marginTop: 16,
  },

  slaBox: {
    padding: 14,
    borderRadius: 12,
    border: "1px solid",
  },

  slaBoxNormal: {
    backgroundColor: "#F0FDF4",
    borderColor: "#BBF7D0",
  },

  slaBoxDanger: {
    backgroundColor: "#FEF2F2",
    borderColor: "#FECACA",
  },

  slaLabel: {
    fontSize: 11,
    fontWeight: 700,
    color: "#6B7280",
    marginBottom: 7,
  },

  slaDate: {
    fontSize: 13,
    fontWeight: 800,
    color: "#111827",
    wordBreak: "break-word",
  },

  actionIntro: {
    margin: "-4px 0 14px",
    fontSize: 12,
    color: "#6B7280",
    lineHeight: 1.6,
  },

  actionCard: {
    border: "1px solid #E5E7EB",
    backgroundColor: "#FAFAFA",
    borderRadius: 13,
    padding: 14,
    marginBottom: 12,
  },

  actionHeading: {
    display: "flex",
    alignItems: "flex-start",
    gap: 10,
    marginBottom: 12,
  },

  actionNumber: {
    width: 30,
    height: 30,
    flexShrink: 0,
    borderRadius: 9,
    backgroundColor: "#E5E7EB",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: 11,
    fontWeight: 800,
    color: "#374151",
  },

  actionTitle: {
    margin: "0 0 4px",
    fontSize: 13,
    fontWeight: 800,
    color: "#111827",
  },

  actionDescription: {
    margin: 0,
    fontSize: 11,
    color: "#6B7280",
    lineHeight: 1.5,
  },

  textarea: {
    width: "100%",
    minHeight: 90,
    borderRadius: 10,
    border: "1.5px solid #E5E7EB",
    padding: 11,
    fontSize: 12,
    color: "#111827",
    resize: "vertical",
    marginBottom: 10,
    fontFamily: "'DM Sans', system-ui, sans-serif",
    backgroundColor: "#fff",
  },

  input: {
    width: "100%",
    height: 42,
    borderRadius: 10,
    border: "1.5px solid #E5E7EB",
    padding: "0 11px",
    fontSize: 12,
    color: "#111827",
    marginBottom: 10,
    fontFamily: "'DM Sans', system-ui, sans-serif",
    backgroundColor: "#fff",
  },

  resolveBtn: {
    width: "100%",
    backgroundColor: "#15803D",
    color: "#fff",
    border: "none",
    borderRadius: 10,
    padding: "11px 14px",
    fontSize: 12,
    fontWeight: 800,
    cursor: "pointer",
  },

  dcBtn: {
    width: "100%",
    backgroundColor: "#1D4ED8",
    color: "#fff",
    border: "none",
    borderRadius: 10,
    padding: "11px 14px",
    fontSize: 12,
    fontWeight: 800,
    cursor: "pointer",
  },

  techBtn: {
    width: "100%",
    backgroundColor: "#111827",
    color: "#fff",
    border: "none",
    borderRadius: 10,
    padding: "11px 14px",
    fontSize: 12,
    fontWeight: 800,
    cursor: "pointer",
  },

  readOnlyBox: {
    backgroundColor: "#F9FAFB",
    border: "1px solid #E5E7EB",
    borderRadius: 12,
    padding: 14,
  },

  readOnlyTitle: {
    fontSize: 13,
    fontWeight: 800,
    color: "#374151",
  },

  readOnlyText: {
    fontSize: 12,
    color: "#6B7280",
    lineHeight: 1.7,
    margin: "7px 0 0",
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

  errorTitle: {
    fontSize: 16,
    fontWeight: 800,
    color: "#111827",
  },

  errorSub: {
    marginTop: 8,
    color: "#6B7280",
    fontSize: 13,
  },

  retryBtn: {
    marginTop: 16,
    backgroundColor: "#111827",
    border: "none",
    borderRadius: 9,
    color: "#fff",
    padding: "10px 16px",
    cursor: "pointer",
    fontWeight: 700,
  },
};

export default ComplaintDetailPage;
