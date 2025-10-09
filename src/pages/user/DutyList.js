import React, { useEffect, useState, useMemo } from 'react';
import { Table, Dropdown, Spinner, Modal, Button, Form } from 'react-bootstrap';
import Usermenu from '../../components/layout/Usermenu';
import Layout from '../../components/layout/Layout';
import { BASEURL } from '../../service/baseUrl';
import axios from 'axios';
import { useAuth } from '../../context/auth';
import { toast } from 'react-toastify';
import '../../css/dutylist.css';
import { jsPDF } from 'jspdf';
import { autoTable } from 'jspdf-autotable';

import { FaFilePdf } from 'react-icons/fa';
function DutyList() {
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [searchTerm, setSearchTerm] = useState('');
  const [sortKey, setSortKey] = useState('name');
  const [sortOrder, setSortOrder] = useState('asc');

  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);

  const [updatedStudents, setUpdatedStudents] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [formData, setFormData] = useState({
    callStatus: '',
    callDuration: '',
    interested: '',
    planType: '',
  });
  const [auth] = useAuth();

  // populate form when modal opens
  useEffect(() => {
    document.title = 'CRM - Daily Routine';
    if (selectedStudent) {
      setFormData({
        callStatus: selectedStudent.callInfo?.callStatus || '',
        callDuration: selectedStudent.callInfo?.callDuration || '',
        interested:
          selectedStudent.callInfo?.interested === true
            ? 'yes'
            : selectedStudent.callInfo?.interested === false
              ? 'no'
              : '',
        planType: selectedStudent.callInfo?.planType || '',
      });
    }
  }, [selectedStudent]);

  // fetch once when component mounts / auth changes
  useEffect(() => {
    let mounted = true;
    let intervalId;
    const fetchAssigned = async () => {
      if (!auth || !auth.token) {
        if (mounted) {
          setError('Not authenticated');
          setLoading(false);
        }
        return;
      }
      try {
        const resp = await axios.get(`${BASEURL}/assigned-contact-details`, {
          headers: { Authorization: auth.token },
        });

        if (resp.data?.success) {
          const fetched = resp.data.students || [];
          if (!mounted) return;
          setStudents(fetched);

          // derive updated students from callInfo on server
          const alreadyUpdated = fetched
            .filter(s => s.callInfo && s.callInfo.callStatus) // if callStatus exists -> consider updated
            .map(s => s._id);
          setUpdatedStudents(alreadyUpdated);
        } else {
          setError(resp.data?.message || 'Failed to fetch assigned students');
        }
      } catch (err) {
        console.error('Error fetching assigned students:', err);
        setError('Server or network error');
      } finally {
        if (mounted) setLoading(false);
      }
    };

    fetchAssigned();
    intervalId = setInterval(fetchAssigned, 10000); // Poll every 10 seconds

    return () => {
      mounted = false;
      clearInterval(intervalId); // 
    };
  }, [auth]);



  // search & filtering
  const normalized = searchTerm.trim().toLowerCase();
  const filtered = useMemo(() => {
    return students.filter(s => {
      const isUpdated = updatedStudents.includes(s._id);
      const statusText = isUpdated ? 'marked' : 'not marked';
      const assignedAtStr = s.assignedAt
        ? new Date(s.assignedAt).toLocaleString('en-IN', {
          day: '2-digit',
          month: 'short',
          year: 'numeric',
          hour: '2-digit',
          minute: '2-digit',
          second: '2-digit',
          hour12: true,
        })
        : '';
      if (!normalized) return true;
      return (
        s.name.toLowerCase().includes(normalized) ||
        (s.email || '').toLowerCase().includes(normalized) ||
        (s.phone && String(s.phone).toLowerCase().includes(normalized)) ||
        (s.course || '').toLowerCase().includes(normalized) ||
        (s.place || '').toLowerCase().includes(normalized) ||
        statusText.includes(normalized) ||
        assignedAtStr.toLowerCase().includes(normalized)
      );
    });
  }, [students, normalized, updatedStudents]);

  // sorting
  const sorted = useMemo(() => {
    return [...filtered].sort((a, b) => {
      if (sortKey === 'status') {
        const aStatus = updatedStudents.includes(a._id) ? 'marked' : 'not marked';
        const bStatus = updatedStudents.includes(b._id) ? 'marked' : 'not marked';
        const cmp = aStatus.localeCompare(bStatus, undefined, { sensitivity: 'base' });
        return sortOrder === 'asc' ? cmp : -cmp;
      }
      const aVal = ((a[sortKey] || '') + '').toString().toLowerCase();
      const bVal = ((b[sortKey] || '') + '').toString().toLowerCase();
      const cmp = aVal.localeCompare(bVal, undefined, { sensitivity: 'base' });
      return sortOrder === 'asc' ? cmp : -cmp;
    });
  }, [filtered, sortKey, sortOrder, updatedStudents]);

  // pagination
  const currentItems = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    return sorted.slice(startIndex, startIndex + itemsPerPage);
  }, [sorted, currentPage, itemsPerPage]);

  const totalPages = Math.ceil(sorted.length / itemsPerPage);

  const handleInputChange = e => {
    const { name, value } = e.target;
    setFormData(prev => {
      if (name === 'interested') {
        if (value === 'no') return { ...prev, interested: 'no', planType: '' };
        if (value === 'yes') return { ...prev, interested: 'yes', planType: prev.planType || 'starter' };
      }
      return { ...prev, [name]: value };
    });
  };

  const handleSave = async () => {
    if (!selectedStudent) return;
    try {
      const response = await axios.put(
        `${BASEURL}/students/${selectedStudent._id}/status`,
        { ...formData },
        { headers: { Authorization: auth.token } }
      );

      if (response.data?.success) {
        const updatedStudent = response.data.student;

        // replace the student in local list with backend-returned object
        setStudents(prev =>
          prev.map(stu => (stu._id === updatedStudent._id ? updatedStudent : stu))
        );

        // mark updated
        setUpdatedStudents(prev => (prev.includes(updatedStudent._id) ? prev : [...prev, updatedStudent._id]));

        toast.success('Student status updated successfully!');
        setShowModal(false);
        setSelectedStudent(null);
      } else {
        toast.error(response.data?.message || 'Failed to update student status');
      }
    } catch (err) {
      console.error('Error updating student status:', err);
      toast.error('Server or network error');
    }
  };
const exportToPDF = () => {
  const doc = new jsPDF({
    unit: 'pt',
    format: 'a4',
  });

  const margin = { top: 60, bottom: 60, left: 10, right: 10 };
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();

  // Compute summary details
  const totalAssigned = students.length;
  const marked = updatedStudents.length;
  const notMarked = totalAssigned - marked;

  let latestAssignedDate = null;
  let newCount = 0;
  if (students.length > 0) {
    const unmarked = students.filter(
      s => s.assignedAt && !updatedStudents.includes(s._id)
    );
    if (unmarked.length > 0) {
      const times = unmarked.map(s => new Date(s.assignedAt).getTime());
      const maxTime = Math.max(...times);
      latestAssignedDate = new Date(maxTime);
      newCount = unmarked.filter(
        s => new Date(s.assignedAt).getTime() === maxTime
      ).length;
    }
  }

  // Build summary line
  const summaryLine = [
    `Total Assigned: ${totalAssigned}`,
    `Completed: ${marked}`,
    `Pending: ${notMarked}`,
    `New: ${newCount}`,
    `Last Assigned: ${
      latestAssignedDate
        ? latestAssignedDate.toLocaleString('en-GB', {
            day: '2-digit',
            month: 'short',
            year: 'numeric',
            hour: 'numeric',
            minute: '2-digit',
            second: '2-digit',
            hour12: true,
          })
        : '-'
    }`,
  ].join(' | ');

  // First, draw heading + summary
  doc.setFontSize(14);
  doc.setTextColor(40);
  const headingY = margin.top - 20;
  doc.text('CRM-Daily Routine', pageWidth / 2, headingY, { align: 'center' });

  doc.setFontSize(10);
  doc.setTextColor(60);
  const summaryY = headingY + 20;
  doc.text(summaryLine, margin.left, summaryY);

  // Then draw the table, starting a bit lower so it doesn’t overlap summary
  const tableStartY = summaryY + 15;

  // Prepare table data
  const tableData = students.map((student, index) => {
    const statusText = updatedStudents.includes(student._id) ? 'Marked' : 'Not Marked';
    return [
      index + 1,
      student.name || '',
      student.email || '',
      student.phone || '',
      student.course || '',
      student.place || '',
      student.assignedAt
        ? new Date(student.assignedAt).toLocaleString('en-IN', {
            day: '2-digit',
            month: 'short',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit',
            hour12: true,
          })
        : '-',
      statusText,
    ];
  });

  const head = [
    ['#', 'Name', 'Email', 'Phone', 'Course', 'Place', 'Assigned At', 'Status'],
  ];

  autoTable(doc, {
    startY: tableStartY,
    margin: margin,
    head: head,
    body: tableData,
    theme: 'striped',
    headStyles: {
      fillColor: [0, 123, 255],
      textColor: [255, 255, 255],
      halign: 'center',
    },
    styles: {
      fontSize: 10,
      cellPadding: 4,
      overflow: 'linebreak',
    },
    bodyStyles: {
      fillColor: [245, 247, 250],
    },
    didDrawPage: (data) => {
      // Page numbering in footer
      const pageCount = doc.internal.getNumberOfPages();
      doc.setFontSize(10);
      doc.text(
        `Page ${doc.internal.getCurrentPageInfo().pageNumber} of ${pageCount}`,
        pageWidth - margin.right,
        pageHeight - margin.bottom + 10,
        null,
        null,
        'right'
      );
    },
  });

  doc.save('daily_routine_report.pdf');
};




  // After students & updatedStudents are known

  const summaryDetails = useMemo(() => {
    const totalAssigned = students.length;

    const marked = updatedStudents.length;
    const notMarked = totalAssigned - marked;

    // “New” means the one with the latest assignedAt that is not marked yet?
    // You already have logic for “latestAssignedTime” in your render; reuse that:
    let newCount = 0;
    let latestAssignedDate = null;
    if (students.length > 0) {
      // filter only unmarked
      const unmarked = students.filter(s => !updatedStudents.includes(s._id) && s.assignedAt);
      if (unmarked.length > 0) {
        const times = unmarked.map(s => new Date(s.assignedAt).getTime());
        const maxT = Math.max(...times);
        latestAssignedDate = new Date(maxT);
        newCount = unmarked.filter(s => new Date(s.assignedAt).getTime() === maxT).length;
      }
    }

    return {
      totalAssigned,
      marked,
      notMarked,
      newCount,
      latestAssignedDate,
    };
  }, [students, updatedStudents]);

  if (loading)
    return (
      <div className="loading-container">
        <Spinner animation="border" variant="primary" />
        <div>Loading assigned students…</div>
      </div>
    );
  if (error)
    return (
      <div className="loading-container">
        <div className="error-message">{error}</div>
      </div>
    );

  return (
    <Layout title={"CRM - Daily Routine"}>
      <div className="container-fluid m-3 p-3 admin-root">
        <div className="row">
          <aside className="col-md-3">
            <Usermenu />
          </aside>

          <main className="col-md-9">
            <div className="card admin-card p-4">

              <div className="container mt-4">
                <div className="d-flex flex-wrap align-items-center mb-3 gap-2">
                  <div className="flex-grow-1" style={{ minWidth: '200px' }}>
                    <input
                      type="text"
                      className="form-control"
                      placeholder="Search students..."
                      value={searchTerm}
                      onChange={e => setSearchTerm(e.target.value)}
                    />
                  </div>

                  <div className="d-flex justify-content-center gap-2">
                    <Dropdown>
                      <Dropdown.Toggle variant="outline-secondary" id="dropdown-sort-column">
                        Sort by: {sortKey.charAt(0).toUpperCase() + sortKey.slice(1)}
                      </Dropdown.Toggle>
                      <Dropdown.Menu>
                        {['name', 'email', 'phone', 'course', 'place', 'status'].map(col => (
                          <Dropdown.Item
                            key={col}
                            onClick={() => {
                              if (sortKey === col) setSortOrder(prev => (prev === 'asc' ? 'desc' : 'asc'));
                              else {
                                setSortKey(col);
                                setSortOrder('asc');
                              }
                            }}
                          >
                            {col.charAt(0).toUpperCase() + col.slice(1)}
                          </Dropdown.Item>
                        ))}
                      </Dropdown.Menu>
                    </Dropdown>

                    <Dropdown>
                      <Dropdown.Toggle variant="outline-secondary" id="dropdown-sort-order">
                        {sortOrder === 'asc' ? 'Ascending' : 'Descending'}
                      </Dropdown.Toggle>
                      <Dropdown.Menu>
                        <Dropdown.Item onClick={() => setSortOrder('asc')}>Ascending</Dropdown.Item>
                        <Dropdown.Item onClick={() => setSortOrder('desc')}>Descending</Dropdown.Item>
                      </Dropdown.Menu>
                    </Dropdown>
                  </div>
                  <div className="summary-overview mb-3">
                    <span><span className="label-key">Total Assigned:</span> <span className="value">{summaryDetails.totalAssigned}</span></span>
                    <span><span className="label-key">Marked:</span> <span className="value">{summaryDetails.marked}</span></span>
                    <span><span className="label-key">Not Marked:</span> <span className="value">{summaryDetails.notMarked}</span></span>
                    <span><span className="label-key">New:</span> <span className="value">{summaryDetails.newCount}</span></span>
                    <span>
                      <span className="label-key">Last Assigned:</span>
                      <span className="value">
                        {summaryDetails.latestAssignedDate
                          ? summaryDetails.latestAssignedDate.toLocaleString('en-GB', {
                            day: '2-digit',
                            month: 'short',
                            year: 'numeric',
                            hour: 'numeric',
                            minute: '2-digit',
                            second: '2-digit',
                            hour12: true,
                          })
                          : '-'}
                      </span>
                    </span>
                  </div>
                </div>

                {sorted.length === 0 ? (
                  <div>No students match your search / no students assigned.</div>
                ) : (
                  <div className="table-responsive">
                    <Table className="custom-table table-hover align-middle">
                      <thead>
                        <tr>
                          <th>#</th>
                          <th>Name</th>
                          <th>Email</th>
                          <th>Phone</th>
                          <th>Course</th>
                          <th>Place</th>
                          <th>Assigned At</th>
                          <th>Actions</th>
                          <th>Status</th>
                        </tr>
                      </thead>
                      <tbody>
                        {(() => {
                          // Find the latest assignedAt date among students that are NOT yet updated
                          const latestAssignedTime = Math.max(
                            ...students
                              .filter(s => s.assignedAt && !updatedStudents.includes(s._id))
                              .map(s => new Date(s.assignedAt).getTime())
                          );

                          return currentItems.map((s, idx) => {
                            const isUpdated = updatedStudents.includes(s._id);
                            const isLatest =
                              s.assignedAt &&
                              new Date(s.assignedAt).getTime() === latestAssignedTime &&
                              !isUpdated; // Only show NEW if not updated

                            return (
                              <tr key={s._id || idx}>
                                <td>{idx + 1 + (currentPage - 1) * itemsPerPage}</td>
                                <td style={{ color: isUpdated ? 'red' : 'inherit' }}>
                                  {s.name}{' '}
                                  {isLatest && (
                                    <sup
                                      style={{
                                        color: 'green',
                                        fontWeight: 'bold',
                                        fontSize: '0.75rem',
                                        marginLeft: '4px',
                                      }}
                                    >
                                      NEW
                                    </sup>
                                  )}
                                </td>
                                <td>{s.email}</td>
                                <td>{s.phone}</td>
                                <td>{s.course}</td>
                                <td>{s.place}</td>
                                <td>
                                  {s.assignedAt
                                    ? new Date(s.assignedAt).toLocaleString('en-IN', {
                                      day: '2-digit',
                                      month: 'short',
                                      year: 'numeric',
                                      hour: '2-digit',
                                      minute: '2-digit',
                                      second: '2-digit',
                                      hour12: true,
                                    })
                                    : '-'}
                                </td>
                                <td>
                                  <Button
                                    variant="outline-primary"
                                    size="sm"
                                    onClick={() => {
                                      setSelectedStudent(s);
                                      setFormData({
                                        callStatus: s.callInfo?.callStatus || '',
                                        callDuration: s.callInfo?.callDuration || '',
                                        interested:
                                          s.callInfo?.interested === true
                                            ? 'yes'
                                            : s.callInfo?.interested === false
                                              ? 'no'
                                              : '',
                                        planType: s.callInfo?.planType || '',
                                      });
                                      setShowModal(true);
                                    }}
                                    disabled={isUpdated}
                                  >
                                    Update
                                  </Button>
                                </td>
                                <td>{isUpdated ? 'Marked' : 'Not Marked'}</td>
                              </tr>
                            );
                          });
                        })()}
                      </tbody>
                    </Table>

                    <div className="d-flex justify-content-between align-items-center mt-3">
                      <div>
                        <button
                          className="btn btn-outline-primary me-2"
                          onClick={() => currentPage > 1 && setCurrentPage(currentPage - 1)}
                          disabled={currentPage === 1}
                        >
                          &laquo;
                        </button>
                        <button
                          className="btn btn-outline-primary"
                          onClick={() => currentPage < totalPages && setCurrentPage(currentPage + 1)}
                          disabled={currentPage === totalPages}
                        >
                          &raquo;
                        </button>
                      </div>

                      <div className="d-flex align-items-center gap-2">
                        <select
                          className="form-select form-select-sm"
                          value={itemsPerPage}
                          onChange={e => {
                            setCurrentPage(1);
                            setItemsPerPage(Number(e.target.value));
                          }}
                        >
                          {[2, 5, 10, 15, 20, 25, 50, 100].map(size => (
                            <option key={size} value={size}>
                              {size}
                            </option>
                          ))}
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
                )}
              </div>
            </div>
          </main>
        </div>

        <Modal show={showModal} onHide={() => setShowModal(false)}>
          <Modal.Header closeButton>
            <Modal.Title>Update Call Status</Modal.Title>
          </Modal.Header>
          <Modal.Body>
            <Form>
              <Form.Group controlId="callStatus">
                <Form.Label>Call Status</Form.Label>
                <Form.Control as="select" value={formData.callStatus} onChange={handleInputChange} name="callStatus">
                  <option value="missed">Missed</option>
                  <option value="rejected">Rejected</option>
                  <option value="accepted">Accepted</option>
                </Form.Control>
              </Form.Group>

              {formData.callStatus === 'accepted' && (
                <>
                  <Form.Group controlId="callDuration">
                    <Form.Label>Call Duration (minutes)</Form.Label>
                    <Form.Control type="number" value={formData.callDuration} onChange={handleInputChange} name="callDuration" />
                  </Form.Group>

                  <Form.Group controlId="interested">
                    <Form.Label>Interested</Form.Label>
                    <Form.Control as="select" value={formData.interested} onChange={handleInputChange} name="interested">
                      <option value="yes">Yes</option>
                      <option value="no">No</option>
                    </Form.Control>
                  </Form.Group>

                  {formData.interested === 'yes' && (
                    <Form.Group controlId="planType">
                      <Form.Label>Plan Type</Form.Label>
                      <Form.Control as="select" value={formData.planType} onChange={handleInputChange} name="planType">
                        <option value="starter">starter</option>
                        <option value="gold">Gold</option>
                        <option value="master">Master</option>
                      </Form.Control>
                    </Form.Group>
                  )}
                </>
              )}
            </Form>
          </Modal.Body>
          <Modal.Footer>
            <Button variant="secondary" onClick={() => setShowModal(false)}>
              Close
            </Button>
            <Button variant="primary" onClick={handleSave}>
              Save Changes
            </Button>
          </Modal.Footer>
        </Modal>
      </div>
    </Layout>
  );
}

export default DutyList;
