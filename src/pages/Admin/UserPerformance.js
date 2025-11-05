import React, { useEffect, useState } from "react";
import Adminmenu from "../../components/layout/Adminmenu";
import Layout from "../../components/layout/Layout";
import axios from "axios";
import { Spinner, Alert, Button } from "react-bootstrap";
import { useAuth } from "../../context/auth";
import { BASEURL } from "../../service/baseUrl";
import { FaFileDownload } from 'react-icons/fa';
import { jsPDF } from "jspdf";
import { autoTable } from "jspdf-autotable";

import '../../css/performance.css'
function UserPerformance() {
  const [auth] = useAuth();
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [reportType, setReportType] = useState("weekly"); // ✅ toggle weekly/monthly
  const [currentPage, setCurrentPage] = useState(1);
  const rowsPerPage = 10;

  const indexOfLastRow = currentPage * rowsPerPage;
  const indexOfFirstRow = indexOfLastRow - rowsPerPage;
  const currentRows = reports.slice(indexOfFirstRow, indexOfLastRow);

  const totalPages = Math.ceil(reports.length / rowsPerPage);

  const handlePageChange = (page) => setCurrentPage(page);
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

  const exportToPDF = () => {
    const doc = new jsPDF();

    const title = `${reportType === "weekly" ? "Weekly" : "Monthly"} Performance Report`;
    const pageWidth = doc.internal.pageSize.getWidth();

    // prepare columns & rows
    const tableColumn = [
      "SL. No",
      "Username",
      reportType === "weekly" ? "Week" : "Month",
      "Assigned Count",
      "Completed Count",
      "Total Call Duration (sec)",
      "Assigned Dates",
      "Completed Dates",
    ];

    const tableRows = reports.map((r, idx) => [
      idx + 1,
      r.username,
      reportType === "weekly" ? r.week : r.month,
      r.assignedCount,
      r.completedCount,
      r.totalCallDurationSeconds,
      r.assignedDates?.map((d) => new Date(d).toLocaleDateString()).join(", "),
      r.completedDates?.map((d) => d && new Date(d).toLocaleDateString()).join(", "),
    ]);

    autoTable(doc, {
      head: [tableColumn],
      body: tableRows,
      startY: 25,
      styles: { fontSize: 8, cellPadding: 2 },
      showHead: "everyPage",
      didDrawPage: (data) => {
        // Header: centered title
        doc.setFontSize(14);
        doc.setFont("helvetica", "bold");
        const titleWidth = doc.getTextWidth(title);
        const xTitle = (pageWidth - titleWidth) / 2;
        doc.text(title, xTitle, 15);

        // Footer: page number
        const pageCount = doc.internal.getNumberOfPages();
        const pageCurrent = doc.internal.getCurrentPageInfo().pageNumber;
        const footerText = `Page ${pageCurrent} of ${pageCount}`;
        doc.setFontSize(8);
        doc.setFont("helvetica", "normal");
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

              {/* Toggle Weekly / Monthly */}
              <div className="d-flex justify-content-center gap-2 mb-4">
                <Button
                  variant={reportType === "weekly" ? "primary" : "outline-primary"}
                  onClick={() => setReportType("weekly")}
                >
                  Weekly
                </Button>
                <Button
                  variant={reportType === "monthly" ? "primary" : "outline-primary"}
                  onClick={() => setReportType("monthly")}
                >
                  Monthly
                </Button>
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
                        <th>Assigned Count</th>
                        <th>Completed Count</th>
                        <th>Total Call Duration (sec)</th>
                        <th>Assigned Dates</th>
                        <th>Completed Dates</th>
                      </tr>
                    </thead>
                    <tbody>
                      {currentRows.length > 0 ? (
                        currentRows.map((r, i) => (
                          <tr key={i}>
                            <td>{indexOfFirstRow + i + 1}</td>
                            <td>{r.username}</td>
                            <td>{reportType === "weekly" ? r.week : r.month}</td>
                            <td>{r.assignedCount}</td>
                            <td>{r.completedCount}</td>
                            <td>{r.totalCallDurationSeconds}</td>
                            <td>
                              {r.assignedDates
                                ?.map((d) => new Date(d).toLocaleDateString('en‑IN', {
                                  day: '2-digit',
                                  month: '2-digit',
                                  year: 'numeric',
                                  hour: '2-digit',
                                  minute: '2-digit',
                                  second: '2-digit',
                                  hour12: false
                                }))
                                .join(", ")}
                            </td>
                            <td>
                              {r.completedDates
                                ?.map((d) => d && new Date(d).toLocaleDateString('en‑IN', {
                                  day: '2-digit',
                                  month: '2-digit',
                                  year: 'numeric',
                                  hour: '2-digit',
                                  minute: '2-digit',
                                  second: '2-digit',
                                  hour12: false
                                }))
                                .join(", ")}
                            </td>
                          </tr>
                        ))
                      ) : (
                        <tr>
                          <td colSpan="8" className="text-center text-muted py-4">
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
                  <FaFileDownload style={{ justifyContent: 'center' }} />

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
