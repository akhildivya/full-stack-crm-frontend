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
    let intervalId;
    const fetchReports = async () => {
      try {
        setLoading(true);
        setError("");
        let endpoint;
        if (reportType === "weekly") endpoint = `${BASEURL}/admin/weekly-report`;
        else if (reportType === "monthly") endpoint = `${BASEURL}/admin/monthly-report`;
        else if (reportType === "daily") endpoint = `${BASEURL}/admin/daily-report`;
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
    if (auth?.token) { fetchReports(); intervalId = setInterval(fetchReports, 60 * 1000); }
    return () => {
      if (intervalId) clearInterval(intervalId);
    };
  }, [auth, reportType]);

  const handlePageChange = (page) => setCurrentPage(page);

  const filteredReports = useMemo(() => {
    const term = searchTerm.trim().toLowerCase();
    if (!term) return reports;

    return reports.filter((r) => {
      const username = r.username?.toLowerCase() || "";
      const periodStr = reportType === "weekly"
        ? (r.week || "").toLowerCase()
        : reportType === "monthly"
          ? (r.month || "").toLowerCase()
          : (r.day || "").toLowerCase();

      const assignedCountStr = String(r.assignedCount ?? "").toLowerCase();
      const completedCountStr = String(r.completedCount ?? "").toLowerCase();
      const durationStr = String(r.totalCallDurationSeconds ?? "").toLowerCase();
      const timerStr = String(r.totalTimerSeconds ?? "").toLowerCase();
      const totalPlansStr = String(r.totalPlans ?? "").toLowerCase();
      const planCountsStr = `${r.planCounts?.Starter ?? 0} ${r.planCounts?.Gold ?? 0} ${r.planCounts?.Master ?? 0}`.toLowerCase();

      return (
        username.includes(term) ||
        periodStr.includes(term) ||
        assignedCountStr.includes(term) ||
        completedCountStr.includes(term) ||
        durationStr.includes(term) ||
        timerStr.includes(term) ||
        totalPlansStr.includes(term) ||
        planCountsStr.includes(term)
      );
    });
  }, [reports, searchTerm, reportType]);

  const sortedReports = useMemo(() => {
    const { key, direction } = sortConfig;
    if (!key) return filteredReports;
    return [...filteredReports].sort((a, b) => {
      if (key === "day") {
        const dateA = new Date(a.day);
        const dateB = new Date(b.day);
        return direction === "asc"
          ? dateA - dateB
          : dateB - dateA;
      }
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

  const highestTimer = useMemo(() => {
    if (currentRows.length === 0) return null;
    return Math.max(...currentRows.map(r => r.totalTimerSeconds || 0));
  }, [currentRows]);

  // Helpers to compute date ranges
const getWeekRange = (weekValue) => {
  const [yearStr, weekStr] = `${weekValue}`.split("-W");
  const year = parseInt(yearStr, 10);
  const week = parseInt(weekStr, 10);

  const jan1 = new Date(year, 0, 1);
  const jan1Day = jan1.getDay(); // Sunday=0 ... Saturday=6

  // Find first Sunday on or before Jan 1
  const firstSunday = new Date(year, 0, 1 - jan1Day);

  // Calculate start date based on Sunday + (week-1)*7 days
  const startDate = new Date(firstSunday);
  startDate.setDate(firstSunday.getDate() + (week - 1) * 7);

  // End date is 6 days after start date (Saturday)
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
    const title = `CRM - ${reportType === "weekly"
        ? "Weekly"
        : reportType === "monthly"
          ? "Monthly"
          : "Daily"
      } Performance Report`;

    const pageWidth = doc.internal.pageSize.getWidth();

    const tableColumn = [
      "#",
      "Username",
      "Phone",
      reportType === "weekly"
        ? "Week (Range)"
        : reportType === "monthly"
          ? "Month"
          : "Date",
      "Assigned Count (Total)",
      "Completed Count (Total)",
      "Total Call Duration (sec)",
      "Timer Duration (sec)",
      "Total Plans (Starter / Gold / Master)",
      "Status"
    ];

    const exportList = sortedReports;

    const tableRows = exportList.map((r, idx) => {
      const callDurSec = r.totalCallDurationSeconds ?? 0;
      const timerSec = r.totalTimerSeconds ?? 0;

      const callDurLabel =
        callDurSec === highestDuration ? `${callDurSec} ✔` : `${callDurSec}`;
      const timerLabel =
        timerSec === highestTimer ? `${timerSec} ✔` : `${timerSec}`;

      const status =
        r.completedCount < r.assignedCount ? "Pending" : "Completed";

      const dateLabel =
        reportType === "weekly"
          ? `${r.week} (${getWeekRange(r.week).text})`
          : reportType === "monthly"
            ? `${r.month} (${getMonthRange(r.month).fullRangeText})`
            : new Date(r.day).toLocaleDateString("en-IN", {
              day: "2-digit",
              month: "short",
              year: "numeric",
            });

      return [
        idx + 1,
        r.username || "",
        r.phone || "",
        dateLabel,
        r.assignedCount ?? 0,
        r.completedCount ?? 0,
        callDurLabel,
        timerLabel,
        `${r.totalPlans ?? 0} (${r.planCounts?.Starter ?? 0} / ${r.planCounts?.Gold ?? 0
        } / ${r.planCounts?.Master ?? 0})`,
        status,
      ];
    });

    autoTable(doc, {
      head: [tableColumn],
      body: tableRows,
      startY: 25,
      styles: { fontSize: 8, cellPadding: 2, overflow: "linebreak" },
      showHead: "everyPage",
      didParseCell: (data) => {
        if (data.section === "body") {
          const status = data.row.raw[data.row.raw.length - 1];
          if (status === "Pending") {
            data.cell.styles.textColor = [200, 0, 0];
          }
        }
      },
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
                  variant={reportType === "daily" ? "primary" : "outline-primary"}
                  onClick={() => { setReportType("daily"); setCurrentPage(1); }}
                >
                  Daily
                </Button>
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
                      placeholder="Search ....."
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
                            key: "totalTimerSeconds",
                            direction:
                              sortConfig.key === "totalTimerSeconds" && sortConfig.direction === "asc"
                                ? "desc"
                                : "asc",
                          })
                        }
                      >
                        Sort Timer{" "}
                        {sortConfig.key === "totalTimerSeconds"
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
      key: reportType === "weekly"   ? "week"
           : reportType === "monthly"  ? "month"
           : "day",
      direction:
        sortConfig.key === (reportType === "weekly" ? "week"
                       : reportType === "monthly"? "month"
                       : "day")
        && sortConfig.direction === "asc"
          ? "desc"
          : "asc",
    })
  }
>
  Sort {reportType === "weekly"   ? "Week"
        : reportType === "monthly"  ? "Month"
        : "Date"}{" "}
  {sortConfig.key === (reportType === "weekly" ? "week"
                       : reportType === "monthly"? "month"
                       : "day")
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
                        <th>
                          {reportType === "weekly" ? "Week" :
                            reportType === "monthly" ? "Month" :
                              "Date"}
                        </th>
                        <th>Assigned Count(Total)</th>
                        <th>Completed Count(Total)</th>
                        <th>Total Call Duration (sec)</th>
                        <th>Timer Duration (sec)</th>   {/* <-- NEW */}
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
                              <td>{r.username}
                                <div className="text-muted" style={{ fontSize: '0.9em' }}>
                                  {r.phone}
                                </div>
                              </td>
                              <td>
                                {reportType === "daily" ? (
                                  <span>
                                    {new Date(r.day).toLocaleDateString("en-IN", {
                                      day: "2-digit",
                                      month: "short",
                                      year: "numeric"
                                    })}
                                    {pending && (
                                      <span className="badge bg-warning ms-2">
                                        Pending
                                      </span>
                                    )}
                                  </span>
                                ) : (
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
                                )}
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
                                {r.totalTimerSeconds}   {/* <-- NEW */}
                                {r.totalTimerSeconds === highestTimer && (
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
