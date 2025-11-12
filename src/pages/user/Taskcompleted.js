import Layout from '../../components/layout/Layout';
import Usermenu from '../../components/layout/Usermenu';
import React, { useEffect, useState, useMemo } from 'react';
import axios from 'axios';
import { Table, Form, Dropdown, Spinner, Button, OverlayTrigger, Tooltip, Accordion } from 'react-bootstrap';
import { BASEURL } from '../../service/baseUrl';
import '../../css/taskcompleted.css';
import { jsPDF } from 'jspdf';
import { autoTable } from 'jspdf-autotable';
import { FaFilePdf, FaCheckCircle } from 'react-icons/fa';
import { Alert } from 'react-bootstrap';
function Taskcompleted() {
  const [students, setStudents] = useState([]);
  const [summary, setSummary] = useState({});
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [sortKey, setSortKey] = useState('assignedAt');
  const [sortOrder, setSortOrder] = useState('desc');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [isExpanded, setIsExpanded] = useState(false);
  const [showVerified, setShowVerified] = useState(true);
  const [showInfo, setShowInfo] = useState(true);
  const columns = [
    { label: 'Name', key: 'name' },
    { label: 'Phone', key: 'phone' },
    { label: 'Course', key: 'course' },
    { label: 'Call Status', key: 'callStatus' },
    { label: 'Call Duration', key: 'callDuration' },
    { label: 'Interested', key: 'interested' },
    { label: 'Plan Type', key: 'planType' },
    { label: 'Assigned At', key: 'assignedAt' },
    { label: 'Completed At', key: 'completedAt' },
  ];
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
       if (showVerified === false && s.callInfo?.verified) return false;

      if (!normalized) return true;

      const callStatus = s.callInfo?.callStatus || '';
      const callDuration =  s.callInfo?.callDuration != null
    ? `${Math.round(s.callInfo.callDuration * 60)} sec`
    : '';
      const interested = s.callInfo?.interested || 'Inform Later';
      const planType = s.callInfo?.planType || '';
      const assignedAtIso = s.assignedAt
  ? new Date(s.assignedAt).toISOString()
  : '';
  const completedAtIso = s.callInfo?.completedAt
  ? new Date(s.callInfo.completedAt).toISOString()
  : '';
      const assignedAt = s.assignedAt ? new Date(s.assignedAt).toLocaleString('en-GB', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hour12: true,
      }) : '';
      const completedAt = s.callInfo?.completedAt ? new Date(s.callInfo.completedAt).toLocaleString('en-GB', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hour12: true,
      }) : '';

      return (
        s.name.toLowerCase().includes(normalized) ||
        s.phone.toLowerCase().includes(normalized) ||
        s.course.toLowerCase().includes(normalized) ||
        callStatus.toLowerCase().includes(normalized) ||
        callDuration.toString().includes(normalized) ||
        interested.toLowerCase().includes(normalized) ||
        planType.toLowerCase().includes(normalized) ||
        assignedAt.toLowerCase().includes(normalized) ||
        completedAt.toLowerCase().includes(normalized) ||
        assignedAtIso.toLowerCase().includes(normalized) ||
        completedAtIso.toLowerCase().includes(normalized)
      );
    });
  }, [students, normalized, showVerified]);

const sorted = useMemo(() => {
  return [...filtered].sort((a, b) => {
    let aVal, bVal;

    // Determine values based on sortKey
    if (sortKey === 'callStatus') {
      aVal = a.callInfo?.callStatus ?? '';
      bVal = b.callInfo?.callStatus ?? '';
    } else if (sortKey === 'callDuration') {
      // numeric compare: assume callDuration is in minutes (or some numeric)
      aVal = a.callInfo?.callDuration ?? 0;
      bVal = b.callInfo?.callDuration ?? 0;
    } else if (sortKey === 'interested') {
      aVal = a.callInfo?.interested || 'Inform Later';
      bVal = b.callInfo?.interested || 'Inform Later';
    } else if (sortKey === 'planType') {
      aVal = a.callInfo?.planType ?? '';
      bVal = b.callInfo?.planType ?? '';
    } else if (sortKey === 'assignedAt') {
      aVal = a.assignedAt ? new Date(a.assignedAt).getTime() : 0;
      bVal = b.assignedAt ? new Date(b.assignedAt).getTime() : 0;
    } else if (sortKey === 'completedAt') {
      aVal = a.callInfo?.completedAt ? new Date(a.callInfo.completedAt).getTime() : 0;
      bVal = b.callInfo?.completedAt ? new Date(b.callInfo.completedAt).getTime() : 0;
    } else {
      // fallback for simple keys
      aVal = a[sortKey] ?? '';
      bVal = b[sortKey] ?? '';
    }

    // Perform compare
    if (typeof aVal === 'string' && typeof bVal === 'string') {
      // localeCompare for strings
      const cmp = aVal.localeCompare(bVal);
      return sortOrder === 'asc' ? cmp : -cmp;
    } else {
      // numeric compare (dates or numbers)
      if (aVal < bVal) return sortOrder === 'asc' ? -1 : 1;
      if (aVal > bVal) return sortOrder === 'asc' ? 1 : -1;
      return 0;
    }
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
      `Total Interested (yes): ${summary.totalInterested}`,
      `Missing Interest(--): ${summary.missingInterest}`,
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

    // Define columns based on current collapsed/expanded state (uses isExpanded from component scope)
    const fullColumns = [
      { label: '#', key: null },
      { label: 'Name', key: 'name' },
      { label: 'Phone', key: 'phone' },
      { label: 'Course', key: 'course' },
      { label: 'Call Status', key: 'callStatus' },
      { label: 'Call Duration', key: 'callDuration' },
      { label: 'Interested', key: 'interested' },
      { label: 'Plan Type', key: 'planType' },
      { label: 'Assigned At', key: 'assignedAt' },
      { label: 'Completed At', key: 'completedAt' },
    ];

    const collapsedColumns = [
      { label: '#', key: null },
      { label: 'Name', key: 'name' },
      { label: 'Phone', key: 'phone' },
      { label: 'Call Status', key: 'callStatus' },
      { label: 'Call Duration', key: 'callDuration' },
      { label: 'Interested', key: 'interested' },
      { label: 'Plan Type', key: 'planType' },
    ];

    const visibleColumns = isExpanded ? fullColumns : collapsedColumns;

    // Prepare table data using visibleColumns so PDF matches the UI state
    const tableColumns = visibleColumns.map(c => c.label);

    const tableRows = currentItems.map((s, idx) => {
      return visibleColumns.map(col => {
        if (col.key === null) {
          // index column
          return idx + 1 + (currentPage - 1) * itemsPerPage;
        }

        switch (col.key) {
          case 'name':
            return s.name ?? '-';
          case 'phone':
            return s.phone ?? '-';
          case 'course':
            return s.course ?? '-';
          case 'callStatus':
            return s.callInfo?.callStatus ?? 'Pending';
          case 'callDuration':
            // keep same display logic as UI: multiply by 60 and show seconds if present
            if (s.callInfo?.callDuration !== null && s.callInfo?.callDuration !== undefined) {
              return `${Math.round(s.callInfo.callDuration * 60)} sec`;
            }
            return '-';
          case 'interested':
            // backend now stores interested as String enum: 'Yes' | 'No' | 'Inform Later' or null
            return s.callInfo?.interested ?? '-';
          case 'planType':
            return s.callInfo?.planType ?? '-';
          case 'assignedAt':
            return s.assignedAt ? new Date(s.assignedAt).toLocaleString('en-GB', {
              day: '2-digit',
              month: 'short',
              year: 'numeric',
              hour: '2-digit',
              minute: '2-digit',
              second: '2-digit',
              hour12: true,
            }) : '-';
          case 'completedAt':
            return s.callInfo?.completedAt ? new Date(s.callInfo.completedAt).toLocaleString('en-GB', {
              day: '2-digit',
              month: 'short',
              year: 'numeric',
              hour: '2-digit',
              minute: '2-digit',
              second: '2-digit',
              hour12: true,
            }) : '-';
          default:
            return s[col.key] ?? '-';
        }
      });
    });

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
      // small column width tweaks so 'Interested' and date columns fit better
      willDrawCell: (data) => {
        // noop for now — kept for future tweaks if needed
      },
    });

    doc.save('CRM-Users-Work-Report.pdf');
  };



  if (loading)
    return (
      <div className="loading-container">
        <Spinner animation="border" variant="primary" />
        <div>Loading contacts...</div>
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
              <div className="accordion" id="summaryAccordion">
                <div className="accordion-item">
                  <h2 className="accordion-header" id="headingSummary">
                    <button className="accordion-button" type="button" data-bs-toggle="collapse" data-bs-target="#collapseSummary" aria-expanded="true" aria-controls="collapseSummary">
                      Summary
                    </button>
                  </h2>
                  <div id="collapseSummary" className="accordion-collapse collapse show" aria-labelledby="headingSummary" data-bs-parent="#summaryAccordion">
                    <div className="accordion-body">
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
                            <h6>Interested (Yes)</h6>
                            <h3>{summary.totalInterested}</h3>
                          </div>
                        </div>
                        <div className="col-md-4 mb-2">
                          <div className="summary-card bg-secondary text-white p-3 rounded shadow-sm">
                            <h6>Not Interested (No)</h6>
                            <h3>{summary.totalNotInterested}</h3>
                          </div>
                        </div>
                        <div className="col-md-4 mb-2">
                          <div className="summary-card bg-success text-dark p-3 rounded shadow-sm">
                            <h6>Inform Later</h6>
                            <h3>{summary.informLaterCount || 0}</h3>
                          </div>
                        </div>
                        <div className="col-md-4 mb-2">
                          <div className="summary-card bg-info text-dark p-3 rounded shadow-sm">
                            <h6>Missing Interests</h6>
                            <h3>{summary.missingInterest || 0}</h3>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="accordion-item">
                  <h2 className="accordion-header" id="headingDetails">
                    <button className="accordion-button collapsed" type="button" data-bs-toggle="collapse" data-bs-target="#collapseDetails" aria-expanded="false" aria-controls="collapseDetails">
                      Plan & Course-wise Details
                    </button>
                  </h2>
                  <div id="collapseDetails" className="accordion-collapse collapse" aria-labelledby="headingDetails" data-bs-parent="#summaryAccordion">
                    <div className="accordion-body">
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
                        <h6>Course-wise count:</h6>
                        <div className="d-flex flex-wrap gap-2">
                          {summary.courseCounts && (() => {
                            const normalizedCourseCounts = {};
                            Object.entries(summary.courseCounts).forEach(([course, count]) => {
                              const normalized = course.trim().toLowerCase();
                              let displayCourse;

                              if (normalized.includes('btech')) {
                                displayCourse = 'BTech';
                              } else if (normalized.includes('plus one') || normalized === 'plusone') {
                                displayCourse = 'Plus One';
                              } else if (normalized.includes('plus two') || normalized === 'plustwo') {
                                displayCourse = 'Plus Two';
                              } else {
                                // title-case as fallback
                                displayCourse = course
                                  .trim()
                                  .split(/\s+/)
                                  .map(w => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
                                  .join(' ');
                              }

                              normalizedCourseCounts[displayCourse] = (normalizedCourseCounts[displayCourse] || 0) + count;
                            });

                            return Object.entries(normalizedCourseCounts).map(([course, count]) => (
                              <span key={course} className="badge bg-secondary p-2">
                                {course}: {count}
                              </span>
                            ));
                          })()}
                        </div>
                      </div>

                    </div>
                  </div>
                </div>
              </div>
              {/* Search & Sort */}
              <div className="d-flex flex-wrap align-items-center mt-3 mb-3 gap-2">
                <Form.Control
                  type="text"
                  placeholder="Search students..."
                  value={searchTerm}
                  onChange={e => setSearchTerm(e.target.value)}
                  style={{ maxWidth: '300px' }}
                />
                <Dropdown>
                  <Dropdown.Toggle variant="outline-secondary">
                    Sort by: {columns.find(c => c.key === sortKey)?.label || sortKey}
                  </Dropdown.Toggle>
                  <Dropdown.Menu>
                    {columns.map(col => (
                      <Dropdown.Item
                        key={col.key}
                        onClick={() => {
                          if (sortKey === col.key) setSortOrder(prev => (prev === 'asc' ? 'desc' : 'asc'));
                          else {
                            setSortKey(col.key);
                            setSortOrder('asc');
                          }
                        }}
                      >
                        {col.label}
                      </Dropdown.Item>
                    ))}
                  </Dropdown.Menu>
                </Dropdown>
              </div>


              <div className="mb-2 d-flex justify-content-between align-items-center">
                <div className="d-flex gap-2">
                  <button
                    type="button"
                    className="btn btn-sm btn-outline-secondary"
                    onClick={() => setIsExpanded(prev => !prev)}
                  >
                    {isExpanded ? 'Shrink' : 'Expand'}
                  </button>

                   <button
      type="button"
      className={`btn btn-sm ${showVerified ? 'btn-outline-success' : 'btn-outline-danger'}`}
      onClick={() => setShowVerified(prev => !prev)}
      title={showVerified ? 'Click to hide verified rows' : 'Click to show verified rows'}
    >
      {showVerified ? 'Hide Verified' : 'Show Verified'}
    </button>
                </div>
                <div className="text-muted small">{isExpanded ? 'Expanded view' : 'Compact view'}</div>
              </div>
              {/* Table */}
              {showInfo && (
                <Alert variant="info" dismissible onClose={() => setShowInfo(false)}>
                  📄 Download the PDF for future reference. <br />
                  ⚠️ If the admin deletes your record, the table content will be removed.
                </Alert>
              )}

              <div className="table-responsive">
                <Table className="custom-table table-hover align-middle">
                  <thead className="table-dark">
                    <tr>
                      {(
                        isExpanded
                          ? [
                            { label: '#', key: null },
                            { label: 'Name', key: 'name' },
                            { label: 'Phone', key: 'phone' },
                            { label: 'Course', key: 'course' },
                            { label: 'Call Status', key: 'callStatus' },
                            { label: 'Call Duration', key: 'callDuration' },
                            { label: 'Interested', key: 'interested' },
                            { label: 'Plan Type', key: 'planType' },
                            { label: 'Assigned At', key: 'assignedAt' },
                            { label: 'Completed At', key: 'completedAt' },
                          ]
                          : [
                            { label: '#', key: null },
                            { label: 'Name', key: 'name' },
                            { label: 'Phone', key: 'phone' },
                            { label: 'Call Status', key: 'callStatus' },
                            { label: 'Call Duration', key: 'callDuration' },
                            { label: 'Interested', key: 'interested' },
                            { label: 'Plan Type', key: 'planType' },
                          ]
                      ).map((col, idx) => (
                        <th
                          key={idx}
                          style={{ cursor: col.key ? 'pointer' : 'default' }}
                          onClick={() => {
                            if (!col.key) return;
                            if (sortKey === col.key) setSortOrder(prev => (prev === 'asc' ? 'desc' : 'asc'));
                            else {
                              setSortKey(col.key);
                              setSortOrder('asc');
                            }
                          }}
                        >
                          {col.label} {col.key === sortKey && (sortOrder === 'asc' ? '▲' : '▼')}
                        </th>
                      ))}
                    </tr>
                  </thead>

                  <tbody>
                    {currentItems.map((s, idx) => (
                      <tr key={s._id}>
                        <td>{idx + 1 + (currentPage - 1) * itemsPerPage}</td>

                        {/* Name with tick and tooltip */}
                        <td>
                          <OverlayTrigger
                            placement="top"
                            overlay={
                              s.callInfo?.verified
                                ? (<Tooltip id={`tooltip-verified-${s._id}`}>Call info verified by admin</Tooltip>)
                                : <></>
                            }
                          >
                            <span className="d-inline-flex align-items-center">
                              {s.name}
                              {s.callInfo?.verified && (
                                <FaCheckCircle style={{ marginLeft: 5, color: 'green' }} />
                              )}
                            </span>
                          </OverlayTrigger>
                        </td>

                        {isExpanded ? (
                          <>
                            <td>{s.phone}</td>
                            <td>{s.course}</td>
                            <td>{s.callInfo?.callStatus || 'Pending'}</td>
                            <td>
                              {s.callInfo?.callDuration != null
                                ? `${Math.round(s.callInfo.callDuration * 60)} sec`
                                : '-'}
                            </td>
                            <td>{s.callInfo?.interested || '---'}</td>
                            <td>{s.callInfo?.planType || '-'}</td>
                            <td>
                              {s.assignedAt
                                ? new Date(s.assignedAt).toLocaleString('en-GB', { day: '2-digit', month: 'short', year: 'numeric', hour: 'numeric', minute: '2-digit', second: '2-digit', hour12: true })
                                : '-'}
                            </td>
                            <td>
                              {s.callInfo?.completedAt
                                ? new Date(s.callInfo.completedAt).toLocaleString('en-GB', { day: '2-digit', month: 'short', year: 'numeric', hour: 'numeric', minute: '2-digit', second: '2-digit', hour12: true })
                                : '-'}
                            </td>
                          </>
                        ) : (
                          <>
                            <td>{s.phone}</td>
                            <td>{s.callInfo?.callStatus || 'Pending'}</td>
                            <td>
                              {s.callInfo?.callDuration != null
                                ? `${Math.round(s.callInfo.callDuration * 60)} sec`
                                : '-'}
                            </td>
                            <td>{s.callInfo?.interested || '---'}</td>
                            <td>{s.callInfo?.planType || '-'}</td>
                          </>
                        )}
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
                    <Dropdown>
                      <Dropdown.Toggle
                        variant="outline-secondary"
                        size="sm"
                        id="dropdown-items-per-page"
                      >
                        Show: {itemsPerPage}
                      </Dropdown.Toggle>

                      <Dropdown.Menu>
                        {[5, 10, 15, 20, 25, 30, 35, 40, 50, 100,200,300].map(size => (
                          <Dropdown.Item
                            key={size}
                            active={itemsPerPage === size}
                            onClick={() => {
                              setItemsPerPage(size);
                              setCurrentPage(1);
                            }}
                          >
                            {size}
                          </Dropdown.Item>
                        ))}
                      </Dropdown.Menu>
                    </Dropdown>
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
