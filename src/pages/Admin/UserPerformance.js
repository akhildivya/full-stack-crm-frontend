import React, { useEffect, useState, useMemo } from "react";
import Adminmenu from "../../components/layout/Adminmenu";
import Layout from "../../components/layout/Layout";
import axios from "axios";
import {
  OverlayTrigger,
  Tooltip,
  Spinner,
  Alert,
  Button,
} from "react-bootstrap";
import { useAuth } from "../../context/auth";
import { BASEURL } from "../../service/baseUrl";
import { FaFileDownload } from "react-icons/fa";
import { jsPDF } from "jspdf";
import { autoTable } from "jspdf-autotable";

import "../../css/performance.css";

function UserPerformance() {
  const [auth] = useAuth();
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [reportType, setReportType] = useState("weekly");
  const [currentPage, setCurrentPage] = useState(1);
  const rowsPerPage = 10;

  const [searchTerm, setSearchTerm] = useState("");
  const [sortConfig, setSortConfig] = useState({ key: null, direction: "asc" });

  const indexOfLastRow = currentPage * rowsPerPage;
  const indexOfFirstRow = indexOfLastRow - rowsPerPage;

  useEffect(() => {
    const fetchReports = async () => {
      try {
        setLoading(true);
        setError("");
        const endpoint =
          reportType === "weekly"
            ? `${BASEURL}/admin/weekly-report`
            : `${BASEURL}/admin/monthly-report`;
        const res = await axios.get(endpoint, {
          headers: { Authorization: auth?.token },
        });
        setReports(res.data || []);
        
      } catch (err) {
        console.error(err);
        setError(err.response?.data?.message || "Failed to fetch reports");
      } finally {
        setLoading(false);
      }
    };
    if (auth?.token) fetchReports();
  }, [auth, reportType]);

  const handlePageChange = (page) => setCurrentPage(page);

  const filteredReports = useMemo(() => {
    const term = searchTerm.toLowerCase();
    return reports.filter((r) => {
      const nameMatch = r.username?.toLowerCase().includes(term);
      const weekOrMonth =
        reportType === "weekly"
          ? (r.week || "").toLowerCase()
          : (r.month || "").toLowerCase();
      const weekMonthMatch = weekOrMonth.includes(term);
      const durationMatch = String(r.totalCallDurationSeconds || "").includes(term);
      const plansMatch = String(r.totalPlans || "").includes(term);
      return nameMatch || weekMonthMatch || durationMatch || plansMatch;
    });
  }, [reports, searchTerm, reportType]);

  const sortedReports = useMemo(() => {
    const { key, direction } = sortConfig;
    if (!key) return filteredReports;
    return [...filteredReports].sort((a, b) => {
      const aVal = a[key] ?? "";
      const bVal = b[key] ?? "";
      if (typeof aVal === "number" && typeof bVal === "number") {
        return direction === "asc" ? aVal - bVal : bVal - aVal;
      }
      const aStr = String(aVal).toLowerCase();
      const bStr = String(bVal).toLowerCase();
      if (aStr < bStr) return direction === "asc" ? -1 : 1;
      if (aStr > bStr) return direction === "asc" ? 1 : -1;
      return 0;
    });
  }, [filteredReports, sortConfig]);

  const totalPages = Math.ceil(sortedReports.length / rowsPerPage);
  const currentRows = sortedReports.slice(indexOfFirstRow, indexOfLastRow);

  const highestDuration = useMemo(() => {
    if (currentRows.length === 0) return null;
    return Math.max(...currentRows.map((r) => r.totalCallDurationSeconds || 0));
  }, [currentRows]);

  // Helpers to compute date ranges
  const getWeekRange = (weekValue) => {
    const [yearStr, weekStr] = `${weekValue}`.split("-W");
    const year = parseInt(yearStr, 10);
    const week = parseInt(weekStr, 10);
    const daysOffset = (week - 1) * 7;
    const startDate = new Date(year, 0, 1 + daysOffset);
    const endDate = new Date(startDate);
    endDate.setDate(startDate.getDate() + 6);
    const opts = { day: "2-digit", month: "short", year: "numeric" };
    return { 
      text: `${startDate.toLocaleDateString("en-IN", opts)} to ${endDate.toLocaleDateString("en-IN", opts)}`,
      start: startDate,
      end: endDate,
    };
  };

  const getMonthRange = (monthValue) => {
    const [yearStr, monthNumStr] = `${monthValue}`.split("-");
    const year = parseInt(yearStr, 10);
    const monthNum = parseInt(monthNumStr, 10) - 1;
    const start = new Date(year, monthNum, 1);
    const end = new Date(year, monthNum + 1, 0);
     const opts = { day: "2-digit", month: "short", year: "numeric" };
    return {
      text: `${start.toLocaleDateString("en-IN", opts)}`,
      fullRangeText: `${start.toLocaleDateString("en-IN", opts)} to ${end.toLocaleDateString("en-IN", opts)}`,
      start,
      end,
    };
  };

  const isPeriodPending = (r) => {
    const now = new Date();
    if (reportType === "weekly" && r.week) {
      const { end } = getWeekRange(r.week);
      // if current date is before end of that week, it’s pending
      return now <= end;
    }
    if (reportType === "monthly" && r.month) {
      const { end } = getMonthRange(r.month);
      return now <= end;
    }
    return false;
  };

  const exportToPDF = () => {
    const doc = new jsPDF();
    const title = `${reportType === "weekly" ? "Weekly" : "Monthly"} Performance Report`;
    const pageWidth = doc.internal.pageSize.getWidth();

    const tableColumn = [
      "#",
      "Username",
      reportType === "weekly" ? "Week (Range)" : "Month",
      "Assigned Count",
      "Completed Count",
      "Total Call Duration (sec)",
      "Total Plans (Starter / Gold / Master)",
      "Assigned Dates",
      "Completed Dates",
    ];

    const formatDate = (date) => {
      const d = new Date(date);
      const options = { day: "2-digit", month: "short", year: "numeric" };
      return d.toLocaleDateString("en-IN", options).replace(/\s/g, "-");
    };

    const tableRows = reports.map((r, idx) => [
      idx + 1,
      r.username,
      reportType === "weekly"
        ? `${r.week}\n(${getWeekRange(r.week).text})`
        : `${r.month} (${getMonthRange(r.month).fullRangeText})`,
      r.assignedCount,
      r.completedCount,
      r.totalCallDurationSeconds === highestDuration
        ? `${r.totalCallDurationSeconds} ✅`
        : `${r.totalCallDurationSeconds}`,
      `${r.totalPlans ?? 0} (${r.planCounts?.Starter ?? 0} / ${r.planCounts?.Gold ?? 0} / ${r.planCounts?.Master ?? 0})`,
      r.assignedDates?.map((d) => formatDate(d)).join(", "),
      r.completedDates?.map((d) => d && formatDate(d)).join(", "),
    ]);

    autoTable(doc, {
      head: [tableColumn],
      body: tableRows,
      startY: 25,
      styles: { fontSize: 8, cellPadding: 2, overflow: "linebreak" },
      showHead: "everyPage",
      didDrawPage: () => {
        doc.setFontSize(14);
        doc.setFont("helvetica", "bold");
        const titleWidth = doc.getTextWidth(title);
        const xTitle = (pageWidth - titleWidth) / 2;
        doc.text(title, xTitle, 15);

        doc.setFontSize(8);
        doc.setFont("helvetica", "normal");
        const pageCount = doc.internal.getNumberOfPages();
        const pageCurrent = doc.internal.getCurrentPageInfo().pageNumber;
        const footerText = `Page ${pageCurrent} of ${pageCount}`;
        const xFooter = (pageWidth - doc.getTextWidth(footerText)) / 2;
        const yFooter = doc.internal.pageSize.getHeight() - 10;
        doc.text(footerText, xFooter, yFooter);
      },
    });

    doc.save(`CRM-${reportType}-Performance-report.pdf`);
  };

  return (
    <Layout title={"CRM - Performance Analysis"}>
      <div className="container-fluid m-3 p-3 admin-root">
        <div className="row">
          <aside className="col-md-3">
            <Adminmenu />
          </aside>
          <main className="col-md-9">
            <div className="card admin-card p-4 shadow-sm">
              <h4 className="mb-3 text-center">Performance Reports</h4>

              <div className="d-flex justify-content-center gap-2 mb-4">
                <Button
                  variant={reportType === "weekly" ? "primary" : "outline-primary"}
                  onClick={() => { setReportType("weekly"); setCurrentPage(1); }}
                >
                  Weekly
                </Button>
                <Button
                  variant={reportType === "monthly" ? "primary" : "outline-primary"}
                  onClick={() => { setReportType("monthly"); setCurrentPage(1); }}
                >
                  Monthly
                </Button>
              </div>

              <div className="mb-3">
                <div className="row g-2 align-items-stretch">
                  <div className="col-12 col-md-6 d-flex">
                    <input
                      type="text"
                      className="form-control flex-grow-1"
                      placeholder="Search by name, week/month, duration or total plans…"
                      value={searchTerm}
                      onChange={(e) => {
                        setSearchTerm(e.target.value);
                        setCurrentPage(1);
                      }}
                      style={{ height: "100%" }}
                    />
                  </div>
                  <div className="col-12 col-md-6 d-flex">
                    <div className="btn-group w-100 d-flex">
                      <Button
                        variant="outline-secondary"
                        size="sm"
                        className="flex-fill"
                        onClick={() =>
                          setSortConfig({
                            key: "username",
                            direction:
                              sortConfig.key === "username" && sortConfig.direction === "asc"
                                ? "desc"
                                : "asc",
                          })
                        }
                      >
                        Sort Name{" "}
                        {sortConfig.key === "username"
                          ? sortConfig.direction === "asc"
                            ? "▲"
                            : "▼"
                          : ""}
                      </Button>
                      <Button
                        variant="outline-secondary"
                        size="sm"
                        className="flex-fill"
                        onClick={() =>
                          setSortConfig({
                            key: "totalCallDurationSeconds",
                            direction:
                              sortConfig.key === "totalCallDurationSeconds" && sortConfig.direction === "asc"
                                ? "desc"
                                : "asc",
                          })
                        }
                      >
                        Sort Duration{" "}
                        {sortConfig.key === "totalCallDurationSeconds"
                          ? sortConfig.direction === "asc"
                            ? "▲"
                            : "▼"
                          : ""}
                      </Button>
                      <Button
                        variant="outline-secondary"
                        size="sm"
                        className="flex-fill"
                        onClick={() =>
                          setSortConfig({
                            key: "totalPlans",
                            direction:
                              sortConfig.key === "totalPlans" && sortConfig.direction === "asc"
                                ? "desc"
                                : "asc",
                          })
                        }
                      >
                        Sort Plans{" "}
                        {sortConfig.key === "totalPlans"
                          ? sortConfig.direction === "asc"
                            ? "▲"
                            : "▼"
                          : ""}
                      </Button>
                      <Button
                        variant="outline-secondary"
                        size="sm"
                        className="flex-fill"
                        onClick={() =>
                          setSortConfig({
                            key: reportType === "weekly" ? "week" : "month",
                            direction:
                              sortConfig.key === (reportType === "weekly" ? "week" : "month") &&
                              sortConfig.direction === "asc"
                                ? "desc"
                                : "asc",
                          })
                        }
                      >
                        Sort {reportType === "weekly" ? "Week" : "Month"}{" "}
                        {sortConfig.key === (reportType === "weekly" ? "week" : "month")
                          ? sortConfig.direction === "asc"
                            ? "▲"
                            : "▼"
                          : ""}
                      </Button>
                    </div>
                  </div>
                </div>
              </div>

              {loading && (
                <div className="text-center py-5">
                  <Spinner animation="border" role="status">
                    <span className="visually-hidden">Loading...</span>
                  </Spinner>
                </div>
              )}

              {error && (
                <Alert variant="danger" className="mt-3 text-center">
                  {error}
                </Alert>
              )}

              {!loading && !error && (
                <div className="performance-table-responsive shadow-sm rounded-3">
                  <table className="performance-table mb-0">
                    <thead className="table-light">
                      <tr>
                        <th>#</th>
                        <th>Username</th>
                        <th>{reportType === "weekly" ? "Week" : "Month"}</th>
                        <th>Assigned Count(Total)</th>
                        <th>Completed Count(Total)</th>
                        <th>Total Call Duration (sec)</th>
                        <th>Total Plans</th>
                      </tr>
                    </thead>
                    <tbody>
                      {currentRows.length > 0 ? (
                        currentRows.map((r, i) => {
                          const pending = isPeriodPending(r);
                          return (
                            <tr key={i}>
                              <td>{indexOfFirstRow + i + 1}</td>
                              <td>{r.username}</td>
                              <td>
                                <OverlayTrigger
                                  placement="top"
                                  overlay={
                                    <Tooltip id={`tooltip-period-${i}`}>
                                      {reportType === "weekly"
                                        ? getWeekRange(r.week).text
                                        : getMonthRange(r.month).fullRangeText}
                                    </Tooltip>
                                  }
                                >
                                  <span>
                                    {reportType === "weekly" ? r.week : r.month}
                                    {pending && (
                                      <span className="badge bg-warning ms-2">
                                        Pending
                                      </span>
                                    )}
                                  </span>
                                </OverlayTrigger>
                              </td>
                              <td>{r.assignedCount}</td>
                              <td>{r.completedCount}</td>
                              <td>
                                {r.totalCallDurationSeconds}
                                {r.totalCallDurationSeconds === highestDuration && (
                                  <span style={{ marginLeft: 6 }}>🏆</span>
                                )}
                              </td>
                              <td>
                                <OverlayTrigger
                                  placement="top"
                                  overlay={
                                    <Tooltip id={`tooltip-plans-${i}`}>
                                      {`Starter: ${r.planCounts?.Starter ?? 0}
Gold: ${r.planCounts?.Gold ?? 0}
Master: ${r.planCounts?.Master ?? 0}`}
                                    </Tooltip>
                                  }
                                >
                                  <span
                                    style={{
                                      cursor: "pointer",
                                      textDecoration: "underline",
                                    }}
                                  >
                                    {r.totalPlans ?? 0}
                                  </span>
                                </OverlayTrigger>
                              </td>
                            </tr>
                          );
                        })
                      ) : (
                        <tr>
                          <td colSpan="7" className="text-center text-muted py-4">
                            No {reportType} reports available.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              )}

              <div className="d-flex justify-content-between align-items-center mt-3">
                <div>
                  <Button
                    variant="outline-secondary"
                    size="sm"
                    disabled={currentPage === 1}
                    onClick={() => handlePageChange(currentPage - 1)}
                  >
                    Prev
                  </Button>
                  <span className="mx-2">
                    Page {currentPage} of {totalPages || 1}
                  </span>
                  <Button
                    variant="outline-secondary"
                    size="sm"
                    disabled={currentPage === totalPages}
                    onClick={() => handlePageChange(currentPage + 1)}
                  >
                    Next
                  </Button>
                </div>

                <Button variant="success" size="sm" onClick={exportToPDF}>
                  <FaFileDownload style={{ justifyContent: "center" }} />
                </Button>
              </div>
            </div>
          </main>
        </div>
      </div>
    </Layout>
  );
}

export default UserPerformance;
