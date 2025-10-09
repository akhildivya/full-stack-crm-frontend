import Layout from '../../components/layout/Layout';
import Usermenu from '../../components/layout/Usermenu';
import React, { useEffect, useState, useMemo } from 'react';
import axios from 'axios';
import { Table, Form, Dropdown, Spinner, Button } from 'react-bootstrap';
import { BASEURL } from '../../service/baseUrl';
import '../../css/taskcompleted.css';
import { jsPDF } from 'jspdf';
import { autoTable } from 'jspdf-autotable';
import { FaFilePdf } from 'react-icons/fa';
function Taskcompleted() {
  const [students, setStudents] = useState([]);
  const [summary, setSummary] = useState({});
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [sortKey, setSortKey] = useState('assignedAt');
  const [sortOrder, setSortOrder] = useState('desc');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);

  useEffect(() => {
    document.title = 'CRM - Opera Omnia';
    let intervalId;
    const fetchStudents = async () => {
      try {
        const { data } = await axios.get(`${BASEURL}/assigned-summary`);
        if (data.success) {
          setStudents(data.students || []);
          setSummary(data.summary || {});
        } else {
          setStudents([]);
          setSummary({});
        }
      } catch (err) {
        console.error(err);
        setStudents([]);
        setSummary({});
      } finally {
        setLoading(false);
      }
    };
    fetchStudents();
    intervalId = setInterval(fetchStudents, 10 * 1000); // 10,000 ms = 10 sec


    return () => {
      clearInterval(intervalId);
    };
  }, []);

  const normalized = searchTerm.trim().toLowerCase();

  const filtered = useMemo(() => {
    return (students || []).filter(s => {
      if (!normalized) return true;

      const callStatus = s.callInfo?.callStatus || '';
      const callDuration = s.callInfo?.callDuration ?? '';
      const interested = s.callInfo?.interested === true ? 'Yes' : s.callInfo?.interested === false ? 'No' : '';
      const planType = s.callInfo?.planType || '';
      const assignedAt = s.assignedAt ? new Date(s.assignedAt).toLocaleString('en-GB') : '';
      const completedAt = s.callInfo?.completedAt ? new Date(s.callInfo.completedAt).toLocaleString('en-GB') : '';

      return (
        s.name.toLowerCase().includes(normalized) ||
        s.phone.toLowerCase().includes(normalized) ||
        s.course.toLowerCase().includes(normalized) ||
        callStatus.toLowerCase().includes(normalized) ||
        callDuration.toString().includes(normalized) ||
        interested.toLowerCase().includes(normalized) ||
        planType.toLowerCase().includes(normalized) ||
        assignedAt.toLowerCase().includes(normalized) ||
        completedAt.toLowerCase().includes(normalized)
      );
    });
  }, [students, normalized]);

  const sorted = useMemo(() => {
    return [...filtered].sort((a, b) => {
      let aVal = a[sortKey] ?? '';
      let bVal = b[sortKey] ?? '';

      // Handle nested fields
      if (sortKey === 'callStatus') {
        aVal = a.callInfo?.callStatus ?? '';
        bVal = b.callInfo?.callStatus ?? '';
      } else if (sortKey === 'callDuration') {
        aVal = a.callInfo?.callDuration ?? '';
        bVal = b.callInfo?.callDuration ?? '';
      } else if (sortKey === 'interested') {
        aVal = a.callInfo?.interested === true ? 'Yes' : a.callInfo?.interested === false ? 'No' : '';
        bVal = b.callInfo?.interested === true ? 'Yes' : b.callInfo?.interested === false ? 'No' : '';
      } else if (sortKey === 'planType') {
        aVal = a.callInfo?.planType ?? '';
        bVal = b.callInfo?.planType ?? '';
      } else if (sortKey === 'assignedAt' || sortKey === 'completedAt') {
        aVal = aVal ? new Date(aVal) : new Date(0);
        bVal = bVal ? new Date(bVal) : new Date(0);
      }

      // Compare values
      if (aVal < bVal) return sortOrder === 'asc' ? -1 : 1;
      if (aVal > bVal) return sortOrder === 'asc' ? 1 : -1;
      return 0;
    });
  }, [filtered, sortKey, sortOrder]);

  const currentItems = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return sorted.slice(start, start + itemsPerPage);
  }, [sorted, currentPage, itemsPerPage]);

  const totalPages = Math.ceil(sorted.length / itemsPerPage);
  const [updatedStudents, setUpdatedStudents] = useState([]);
  const exportToPDF = () => {
    const doc = new jsPDF({
      unit: 'pt',
      format: 'a4',
    });

    const margin = { top: 80, bottom: 60, left: 10, right: 10 };
    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();

    // Compute summary details
    const totalAssigned = students.length;
    const marked = updatedStudents.length;
    const notMarked = totalAssigned - marked;

    // Build summary line
    const summaryLine = [
      `Total Assigned: ${totalAssigned}`,
      `Completed: ${marked}`,
      `Pending: ${notMarked}`,
      `Total Call Duration: ${summary.totalCallDuration} sec`,
      `Total Interested: ${summary.totalInterested}`,
      `Missing Interest: ${summary.missingInterest}`,
    ].join(' | ');

    // Plan counts & course-wise
    const planCounts = summary.planCounts || {};
    const courseCounts = summary.courseCounts || {};

    // Draw heading
    doc.setFontSize(14);
    doc.setTextColor(40);
    doc.text('CRM - Body of Works', pageWidth / 2, 40, { align: 'center' });

    // Summary under heading
    doc.setFontSize(10);
    doc.setTextColor(60);
    doc.text(summaryLine, margin.left, 60);

    // Plan counts block
    let yCursor = 80;
    const planKeys = ['starter', 'gold', 'master'];
    let planX = margin.left;
    planKeys.forEach((pl) => {
      const count = planCounts[pl] || 0;
      const label = `${pl.charAt(0).toUpperCase() + pl.slice(1)} Plan: ${count}`;
      const labelWidth = doc.getTextWidth(label);
      if (planX + labelWidth > pageWidth - margin.right) {
        planX = margin.left;
        yCursor += 15;
      }
      doc.text(label, planX, yCursor);
      planX += labelWidth + 10; // Add 10 for spacing between labels
    });

    yCursor += 15;

    // Course-wise counts block
    let courseX = margin.left;
    const spaceX = 100;
    Object.entries(courseCounts).forEach(([course, cnt]) => {
      const label = `${course}: ${cnt}`;
      const labelWidth = doc.getTextWidth(label);
      if (courseX + labelWidth > pageWidth - margin.right) {
        courseX = margin.left;
        yCursor += 15;
      }
      doc.text(label, courseX, yCursor);
      courseX += labelWidth + 10; // Add 10 for spacing between labels
    });

    // Then draw table starting below that
    const startTableY = yCursor + 20;

    // Prepare table data
    const tableColumns = [
      '#', 'Name', 'Phone', 'Course', 'Call Status', 'Call Duration',
      'Interested', 'Plan Type', 'Assigned At', 'Completed At'
    ];
    const tableRows = currentItems.map((s, idx) => [
      idx + 1 + (currentPage - 1) * itemsPerPage,
      s.name,
      s.phone,
      s.course,
      s.callInfo?.callStatus || 'Pending',
      s.callInfo?.callDuration ?? '-',
      s.callInfo?.interested === true ? 'Yes' : s.callInfo?.interested === false ? 'No' : '-',
      s.callInfo?.planType || '-',
      s.assignedAt ? new Date(s.assignedAt).toLocaleString('en-GB', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hour12: true,
      }) : '-',
      s.callInfo?.completedAt ? new Date(s.callInfo.completedAt).toLocaleString('en-GB', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hour12: true,
      }) : '-',
    ]);

    autoTable(doc, {
      head: [tableColumns],
      body: tableRows,
      startY: startTableY,
      theme: 'striped',
      headStyles: { fillColor: [22, 160, 133] },
      margin: margin,
      didDrawPage: (data) => {
        const pageCount = doc.internal.getNumberOfPages();
        const currentPageNum = doc.internal.getCurrentPageInfo().pageNumber;
        doc.setFontSize(10);
        doc.text(
          `Page ${currentPageNum} of ${pageCount}`,
          pageWidth - margin.right,
          pageHeight - margin.bottom,
          { align: 'right' }
        );
      },
    });

    doc.save('concluded_work_report.pdf');
  };


  if (loading)
    return (
      <div className="loading-container">
        <Spinner animation="border" variant="primary" />
        <div>Loading students...</div>
      </div>
    );

  return (
    <Layout title="CRM - Opera Omnia">
      <div className="container-fluid m-3 p-3 admin-root">
        <div className="row">
          <aside className="col-md-3">
            <Usermenu />
          </aside>
          <main className="col-md-9">
            <div className="card admin-card p-4">
              <div className="row mb-3 g-3">
                <div className="col-md-4 mb-2">
                  <div className="summary-card bg-primary text-white p-3 rounded shadow-sm">
                    <h6>Total Assigned</h6>
                    <h3>{summary.totalAssigned}</h3>
                  </div>
                </div>
                <div className="col-md-4 mb-2">
                  <div className="summary-card bg-success text-white p-3 rounded shadow-sm">
                    <h6>Completed</h6>
                    <h3>{summary.completed}</h3>
                  </div>
                </div>
                <div className="col-md-4 mb-2">
                  <div className="summary-card bg-warning text-dark p-3 rounded shadow-sm">
                    <h6>Pending</h6>
                    <h3>{summary.pending}</h3>
                  </div>
                </div>
                <div className="col-md-4 mb-2">
                  <div className="summary-card bg-info text-white p-3 rounded shadow-sm">
                    <h6>Total Call Duration (sec)</h6>
                    <h3>{summary.totalCallDuration}</h3>
                  </div>
                </div>
                <div className="col-md-4 mb-2">
                  <div className="summary-card bg-danger text-white p-3 rounded shadow-sm">
                    <h6>Total Interestes</h6>
                    <h3>{summary.totalInterested}</h3>
                  </div>
                </div>
                <div className="col-md-4 mb-2">
                  <div className="summary-card bg-secondary text-white p-3 rounded shadow-sm">
                    <h6>Missing Interest</h6>
                    <h3>{summary.missingInterest}</h3>
                  </div>
                </div>
              </div>

              {/* Plan Counts */}
              <div className="row mb-3">
                {['starter', 'gold', 'master'].map(plan => (
                  <div className="col-md-4 mb-2" key={plan}>
                    <div className={`summary-card plan-${plan} text-white p-3 rounded shadow-sm`}>
                      <h6>{plan.charAt(0).toUpperCase() + plan.slice(1)} Plan</h6>
                      <h3>{summary.planCounts?.[plan] || 0}</h3>
                    </div>
                  </div>
                ))}
              </div>

              {/* Course-wise Counts */}
              <div className="mb-3">
                <h6>Course-wise-count:</h6>
                <div className="d-flex flex-wrap gap-2">
                  {summary.courseCounts &&
                    Object.entries(summary.courseCounts).map(([course, count]) => (
                      <span key={course} className="badge bg-secondary p-2">
                        {course}: {count}
                      </span>
                    ))
                  }
                </div>
              </div>
              {/* Search & Sort */}
              <div className="d-flex flex-wrap align-items-center mb-3 gap-2">
                <Form.Control
                  type="text"
                  placeholder="Search students..."
                  value={searchTerm}
                  onChange={e => setSearchTerm(e.target.value)}
                  style={{ maxWidth: '300px' }}
                />
                <Dropdown>
                  <Dropdown.Toggle variant="outline-secondary">
                    Sort by: {sortKey}
                  </Dropdown.Toggle>
                  <Dropdown.Menu>
                    {['name', 'phone', 'course', 'callStatus', 'callDuration', 'interested', 'planType', 'assignedAt', 'completedAt'].map(col => (
                      <Dropdown.Item
                        key={col}
                        onClick={() => {
                          if (sortKey === col) setSortOrder(prev => (prev === 'asc' ? 'desc' : 'asc'));
                          else { setSortKey(col); setSortOrder('asc'); }
                        }}
                      >
                        {col}
                      </Dropdown.Item>
                    ))}
                  </Dropdown.Menu>
                </Dropdown>
              </div>

              {/* Table */}
              <div className="table-responsive">
                <Table className="custom-table table-hover align-middle">
                  <thead className="table-dark">
                    <tr>
                      <th>#</th>
                      <th>Name</th>
                      <th>Phone</th>
                      <th>Course</th>
                      <th>Call Status</th>
                      <th>Call Duration</th>
                      <th>Interested</th>
                      <th>Plan Type</th>
                      <th>Assigned At</th>
                      <th>Completed At</th> {/* New Column */}
                    </tr>
                  </thead>
                  <tbody>
                    {currentItems.map((s, idx) => (
                      <tr key={s._id}>
                        <td>{idx + 1 + (currentPage - 1) * itemsPerPage}</td>
                        <td>{s.name}</td>
                        <td>{s.phone}</td>
                        <td>{s.course}</td>
                        <td>{s.callInfo?.callStatus || 'Pending'}</td>
                        <td>{s.callInfo?.callDuration ?? '-'}</td>
                        <td>{s.callInfo?.interested === true ? 'Yes' : s.callInfo?.interested === false ? 'No' : '-'}</td>
                        <td>{s.callInfo?.planType || '-'}</td>
                        <td>{s.assignedAt ? new Date(s.assignedAt).toLocaleString('en-GB', {
                          day: '2-digit',
                          month: 'short',
                          year: 'numeric',
                          hour: 'numeric',
                          minute: '2-digit',
                          second: '2-digit',
                          hour12: true
                        }) : '-'}</td>
                        <td>
                          {s.callInfo?.completedAt
                            ? new Date(s.callInfo.completedAt).toLocaleString('en-GB', {
                              day: '2-digit',
                              month: 'short',
                              year: 'numeric',
                              hour: 'numeric',
                              minute: '2-digit',
                              second: '2-digit',
                              hour12: true
                            })
                            : '-'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </Table>

                {/* Pagination */}
                <div className="d-flex justify-content-between align-items-center mt-3">
                  <div>
                    <button className="btn btn-outline-primary me-2" onClick={() => setCurrentPage(p => Math.max(p - 1, 1))} disabled={currentPage === 1}>&laquo;</button>
                    <button className="btn btn-outline-primary" onClick={() => setCurrentPage(p => Math.min(p + 1, totalPages))} disabled={currentPage === totalPages}>&raquo;</button>
                  </div>
                  <div>
                    <select className="form-select form-select-sm" value={itemsPerPage} onChange={e => { setItemsPerPage(Number(e.target.value)); setCurrentPage(1); }}>
                      {[2,5, 10, 15, 20, 25, 30, 35, 40, 50, 100].map(size => <option key={size} value={size}>{size}</option>)}
                    </select>
                  </div>
                </div>
                <div className="me-2 mt-2">
                  <Button
                    variant="outline-primary"
                    className="icon-only-btn p-0"
                    onClick={exportToPDF}
                    aria-label="Download PDF"
                    title="Download PDF"
                  >
                    <FaFilePdf size={14} />
                  </Button>
                </div>
              </div>
            </div>
          </main>
        </div>
      </div>
    </Layout>
  );
}

export default Taskcompleted;
