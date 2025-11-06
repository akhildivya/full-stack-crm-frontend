import React, { useEffect, useState, useMemo, useRef } from 'react';
import { Table, Dropdown, Spinner, Modal, Button, Form, OverlayTrigger, Tooltip } from 'react-bootstrap';
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

  const [hideVerified, setHideVerified] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
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

  const [completedStudentIds, setCompletedStudentIds] = useState(() => {
    const raw = localStorage.getItem('completedStudentIds');
    return raw ? JSON.parse(raw) : [];
  });

  const [callSessionId, setCallSessionId] = useState(() => {
    return localStorage.getItem('callSessionId') || null;
  }); // NEW: init from localStorage // NEW
  const [callStartTime, setCallStartTime] = useState(() => {
    const v = localStorage.getItem('callStartTime');
    return v ? parseInt(v, 10) : null;
  }); // NEW: init from localStorage

  const [currentStudentId, setCurrentStudentId] = useState(null);

  const callInProgress = !!callSessionId;



  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible' && callSessionId && callStartTime) {
        const endTime = Date.now();
        const durationSeconds = Math.round((endTime - callStartTime) / 1000);

        // call backend stop endpoint
        axios.post(`${BASEURL}/stop`, {
          sessionId: callSessionId,

        }, {
          headers: { Authorization: auth.token }
        }).then(res => {
          toast.success(
            <>
              Timer ended. Duration:{' '}
              <span style={{ filter: 'blur(5px)', display: 'inline-block' }}>
                {durationSeconds} seconds
              </span>
              .
            </>,
            { position: 'top-center' }
          );
        }).catch(err => {
          console.error('Error stopping call session', err);
          toast.error('Error stopping call session', {
            position: 'top-center'
          }); // NEW
        }).finally(() => {
          if (currentStudentId) {
            setCompletedStudentIds(prev => {
              const newList = [...prev, String(currentStudentId)];
              localStorage.setItem('completedStudentIds', JSON.stringify(newList));
              return newList;
            });
          }
          setCurrentStudentId(null);

          setCallSessionId(null);  // NEW
          setCallStartTime(null);  // NEW
          localStorage.removeItem('callSessionId');
          localStorage.removeItem('callStartTime');
          localStorage.setItem('callInProgress', 'false');
        });


      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [callSessionId, callStartTime, auth.token]); // NEW

  // populate form when modal opens
  useEffect(() => {
    document.title = 'CRM - Daily Routine';
    if (selectedStudent) {
      setFormData({
        callStatus: selectedStudent.callInfo?.callStatus || '',
        callDuration: selectedStudent.callInfo?.callDuration || '',
        interested: selectedStudent.callInfo?.interested || '',
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

      if (!normalized) {
        return true;
      }

      const checks = [
        s.name && s.name.toLowerCase().includes(normalized),
        s.email && s.email.toLowerCase().includes(normalized),
        s.phone && String(s.phone).toLowerCase().includes(normalized),
        s.course && s.course.toLowerCase().includes(normalized),
        s.place && s.place.toLowerCase().includes(normalized),
        statusText === normalized, // changed for strict match
        assignedAtStr.toLowerCase().includes(normalized),
      ];

      return checks.some(Boolean);
    });
  }, [students, normalized, updatedStudents]);

  // sorting
  const sorted = useMemo(() => {
    return [...filtered].sort((a, b) => {
      if (sortKey === 'assignedAt') {
        const aAssignedAt = new Date(a.assignedAt).getTime();
        const bAssignedAt = new Date(b.assignedAt).getTime();
        return sortOrder === 'asc' ? aAssignedAt - bAssignedAt : bAssignedAt - aAssignedAt;
      }

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

  const visibleRows = useMemo(() => {
    if (!hideVerified) {
      return sorted;
    }
    return sorted.filter(s => !(s.callInfo?.verified === true));
  }, [sorted, hideVerified]);

  // pagination
  const currentItems = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    return visibleRows.slice(startIndex, startIndex + itemsPerPage);
  }, [visibleRows, currentPage, itemsPerPage]);

  const totalPages = Math.ceil(sorted.length / itemsPerPage);

  const handleInputChange = e => {
    const { name, value } = e.target;
    setFormData(prev => {
      if (name === 'interested') {
        if (value === 'No' || value === 'Inform Later') {
          return { ...prev, interested: value, planType: '' };
        }
        if (value === 'Yes') {
          return { ...prev, interested: 'Yes', planType: prev.planType || 'Starter' };
        }
      }

      return { ...prev, [name]: value };
    });
  };

  const handleSave = async () => {
    if (!selectedStudent) return;

    // Convert minutes + seconds to decimal minutes
    const minutes = parseInt(formData.callDurationMinutes || 0, 10);
    const seconds = parseInt(formData.callDurationSeconds || 0, 10);
    const totalDurationInMinutes = minutes + seconds / 60;

    const payload = {
      callStatus: formData.callStatus,
      callDuration:
        formData.callStatus === 'Switched Off' ? null : totalDurationInMinutes || null,
      interested:
        formData.callStatus === 'Accepted' ? formData.interested || null : null,
      planType:
        formData.interested === 'Yes' ? formData.planType || null : null,
    };

    try {
      const response = await axios.put(
        `${BASEURL}/students/${selectedStudent._id}/status`,
        payload,
        { headers: { Authorization: auth.token } }
      );

      if (response.data?.success) {
        const updatedStudent = response.data.student;

        setStudents(prev =>
          prev.map(stu => (stu._id === updatedStudent._id ? updatedStudent : stu))
        );

        // Add to updated list (or keep if already exists)
        setUpdatedStudents(prev =>
          prev.includes(updatedStudent._id)
            ? prev
            : [...prev, updatedStudent._id]
        );

        toast.success('Call status saved successfully!', { position: 'top-center' });
        setShowModal(false);
        setSelectedStudent(null);
      } else {
        toast.error(response.data?.message || 'Failed to save call status', {
          position: 'top-center',
        });
      }
    } catch (err) {
      console.error('Error updating student status:', err);
      toast.error('Server or network error', { position: 'top-center' });
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

    // ✅ 1. Apply search and sort filters same as your table
    let filtered = [...students];

    // Apply search filter (example: assuming you have a `searchTerm` state)
    if (searchTerm?.trim()) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(s =>
        [s.name, s.email, s.phone, s.course, s.place]
          .some(v => v?.toLowerCase().includes(term))
      );
    }

    // Apply sorting
    if (sortKey) {
      filtered.sort((a, b) => {
        let valA = a[sortKey] ?? '';
        let valB = b[sortKey] ?? '';
        if (sortKey === 'assignedAt') {
          valA = new Date(valA);
          valB = new Date(valB);
        }
        if (typeof valA === 'string') valA = valA.toLowerCase();
        if (typeof valB === 'string') valB = valB.toLowerCase();

        if (valA < valB) return sortOrder === 'asc' ? -1 : 1;
        if (valA > valB) return sortOrder === 'asc' ? 1 : -1;
        return 0;
      });
    }

    // ✅ Use filtered/sorted data for PDF export
    const totalAssigned = filtered.length;
    const marked = filtered.filter(s => updatedStudents.includes(s._id)).length;
    const notMarked = totalAssigned - marked;

    // Latest assigned
    let latestAssignedDate = null;
    let newCount = 0;
    const unmarked = filtered.filter(
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

    // ✅ Summary line
    const summaryLine = [
      `Total: ${totalAssigned}`,
      `Completed: ${marked}`,
      `Pending: ${notMarked}`,
      `New: ${newCount}`,
      `Last Assigned: ${latestAssignedDate
        ? latestAssignedDate.toLocaleString('en-GB', {
          day: '2-digit',
          month: 'short',
          year: 'numeric',
          hour: '2-digit',
          minute: '2-digit',
          second: '2-digit',
          hour12: true,
        })
        : '-'
      }`,
    ].join(' | ');

    // ✅ Header
    doc.setFontSize(14);
    doc.text('CRM - Daily Routine', pageWidth / 2, margin.top - 20, { align: 'center' });

    doc.setFontSize(10);
    doc.text(summaryLine, margin.left, margin.top);

    // ✅ Table data
    const tableData = filtered.map((student, i) => {
      const isUpdated = updatedStudents.includes(student._id);
      const statusText = isUpdated ? 'Marked' : 'Not Marked';
      return [
        i + 1,
        student.name || '',
        statusText,
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
      ];
    });

    const head = [['#', 'Name', 'Status', 'Email', 'Phone', 'Course', 'Place', 'Assigned At']];

    autoTable(doc, {
      startY: margin.top + 20,
      margin,
      head,
      body: tableData,
      theme: 'striped',
      headStyles: { fillColor: [0, 123, 255], textColor: 255, halign: 'center' },
      styles: { fontSize: 9, cellPadding: 3, overflow: 'linebreak' },
      bodyStyles: { fillColor: [245, 247, 250] },
      didDrawPage: (data) => {
        const pageCount = doc.internal.getNumberOfPages();
        doc.setFontSize(9);
        doc.text(
          `Page ${doc.internal.getCurrentPageInfo().pageNumber} of ${pageCount}`,
          pageWidth - margin.right,
          pageHeight - margin.bottom + 10,
          { align: 'right' }
        );
      },
    });

    doc.save('CRM_Daily_Routine_Report.pdf');
  };

  // After students & updatedStudents are known

  const summaryDetails = useMemo(() => {
    const totalAssigned = students.length;

    const marked = updatedStudents.length;
    const notMarked = totalAssigned - marked;


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
        <div>Loading contacts…</div>
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
                      placeholder="Find by anything...."
                      value={searchTerm}
                      onChange={e => setSearchTerm(e.target.value)}
                    />
                  </div>

                  <div className="d-flex justify-content-center gap-2 ">
                    <Dropdown>
                      <Dropdown.Toggle variant="outline-secondary" id="dropdown-sort-column">
                        Sort by: {sortKey.charAt(0).toUpperCase() + sortKey.slice(1)}
                      </Dropdown.Toggle>
                      <Dropdown.Menu>
                        {['name', 'email', 'phone', 'course', 'place', 'status', 'assignedAt'].map(col => (
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
                    <div className="d-flex justify-content-between align-items-center mb-2">
                      <div className="d-flex gap-2">
                        <Button
                          variant={isExpanded ? "secondary" : "primary"}
                          size="sm"
                          onClick={() => setIsExpanded(prev => !prev)}
                        >
                          {isExpanded ? "Shrink View" : "Expand View"}
                        </Button>
                      </div>
                      <div className="d-flex align-items-center  gap-2">
                        <button
                          className="btn btn-outline-secondary btn-sm"
                          onClick={() => setHideVerified(prev => !prev)}
                        >
                          {hideVerified ? "Show Verified Rows" : "Hide Verified Rows"}
                        </button>
                        {/* ... other controls */}
                      </div>
                    </div>

                    <Table className="custom-table table-hover align-middle">
                      <thead>
                        <tr>
                          {[
                            { key: '#', show: true, sortKey: 'index' },
                            { key: 'Name', show: true, sortKey: 'name' },
                            { key: 'Status', show: true, sortKey: 'status' },
                            { key: 'Email', show: isExpanded, sortKey: 'email' },
                            { key: 'Phone', show: true, sortKey: 'phone' },
                            { key: 'Course', show: isExpanded, sortKey: 'course' },
                            { key: 'Place', show: isExpanded, sortKey: 'place' },
                            { key: 'Assigned At', show: isExpanded, sortKey: 'assignedAt' },
                            { key: 'Actions', show: true, sortKey: null },
                          ]
                            .filter(col => col.show)
                            .map((col, idx) => (
                              <th
                                key={idx}
                                style={{ cursor: col.sortKey ? 'pointer' : 'default' }}
                                onClick={() => {
                                  if (!col.sortKey) return;
                                  if (sortKey === col.sortKey) setSortOrder(prev => (prev === 'asc' ? 'desc' : 'asc'));
                                  else {
                                    setSortKey(col.sortKey);
                                    setSortOrder('asc');
                                  }
                                }}
                              >
                                {col.key}{' '}
                                {col.sortKey === sortKey && (
                                  <span>{sortOrder === 'asc' ? '▲' : '▼'}</span>
                                )}
                              </th>
                            ))}
                        </tr>
                      </thead>

                      <tbody>
                        {(() => {
                          const latestAssignedTime = Math.max(
                            ...students
                              .filter(s => s.assignedAt && !updatedStudents.includes(s._id))
                              .map(s => new Date(s.assignedAt).getTime())
                          );

                          return currentItems.map((s, idx) => {
                            const isUpdated = updatedStudents.includes(s._id);
                            const isCompleted = completedStudentIds.includes(s._id); // NEW
                            const isLatest =
                              s.assignedAt &&
                              new Date(s.assignedAt).getTime() === latestAssignedTime &&
                              !isUpdated;

                            return (
                              <tr key={s._id || idx}>
                                <td>{idx + 1 + (currentPage - 1) * itemsPerPage}</td>
                                <td style={{ color: isUpdated ? 'red' : 'inherit' }}>
                                  {s.name}{' '}
                                  {isLatest && (
                                    <sup style={{ color: 'green', fontWeight: 'bold', fontSize: '0.75rem', marginLeft: '4px' }}>
                                      NEW
                                    </sup>
                                  )}
                                </td>
                                <td>
                                  {isUpdated ? (
                                    <span className="badge bg-success">Marked</span>
                                  ) : (
                                    <span className="badge bg-secondary">Not Marked</span>
                                  )}
                                </td>
                                {isExpanded && <td>{s.email}</td>}
                                <td>
                                  {isCompleted ? (
                                    <span style={{
                                      textDecoration: 'line-through',
                                      color: 'grey',
                                      cursor: 'not-allowed'
                                    }}>
                                      {s.phone}
                                    </span>
                                  ) : (
                                    <a
                                      href={`tel:${s.phone}`}
                                      onClick={async e => {
                                        e.preventDefault();
                                        if (callInProgress) {
                                          toast.info('Call already in progress.', { position: 'top-center' });
                                          return;
                                        }
                                        // When starting, set currentStudentId
                                        setCurrentStudentId(s._id);

                                        const res = await axios.post(`${BASEURL}/start`, { studentId: s._id }, {
                                          headers: { Authorization: auth.token },
                                        });
                                        const newSessionId = res.data.sessionId;
                                        const startTime = Date.now();
                                        setCallSessionId(newSessionId);
                                        setCallStartTime(startTime);
                                        localStorage.setItem('callSessionId', newSessionId);
                                        localStorage.setItem('callStartTime', startTime.toString());
                                        localStorage.setItem('callInProgress', 'true');

                                        toast.info('Timer started', { position: 'top-center' });
                                        window.location.href = `tel:${s.phone}`;
                                      }}
                                      style={{
                                        textDecoration: 'none',
                                        color: 'blue',
                                        cursor: callInProgress ? 'not-allowed' : 'pointer',
                                        pointerEvents: callInProgress ? 'none' : 'auto',
                                        opacity: callInProgress ? 0.6 : 1
                                      }}
                                    >
                                      {s.phone}
                                    </a>
                                  )}
                                </td>
                                {isExpanded && (
                                  <>
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
                                  </>
                                )}
                                <td>
                                  <OverlayTrigger
                                    placement="top"
                                    overlay={
                                      s.callInfo?.verified
                                        ? <Tooltip id={`tooltip-verified-${s._id}`}>
                                          Editing disabled: this record has been verified by admin.
                                        </Tooltip>
                                        : <></>
                                    }
                                  >
                                    <span className="d-inline-block">
                                      <Button
                                        variant={isUpdated ? 'outline-success' : 'outline-primary'}
                                        size="sm"
                                        disabled={s.callInfo?.verified === true}
                                        onClick={() => {
                                          if (s.callInfo?.verified) {
                                            // No toast here — tooltip is shown on hover automatically
                                            return;
                                          }
                                          setSelectedStudent(s);
                                          setFormData({
                                            callStatus: s.callInfo?.callStatus || '',
                                            callDuration: s.callInfo?.callDuration || '',
                                            interested:
                                              s.callInfo?.interested === 'Yes' ? 'Yes' :
                                                s.callInfo?.interested === 'No' ? 'No' :
                                                  '',
                                            planType: s.callInfo?.planType || '',
                                          });
                                          setShowModal(true);
                                        }}
                                        style={s.callInfo?.verified ? { pointerEvents: 'none' } : {}}
                                      >
                                        {isUpdated ? 'Edit' : 'Add'}
                                      </Button>
                                    </span>
                                  </OverlayTrigger>
                                </td>
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
                        <Dropdown>
                          <Dropdown.Toggle variant="outline-secondary" size="sm" id="dropdown-items-per-page">
                            Show: {itemsPerPage}
                          </Dropdown.Toggle>

                          <Dropdown.Menu>
                            {[2, 5, 10, 15, 20, 25, 30, 35, 40, 50, 100].map(size => (
                              <Dropdown.Item
                                key={size}
                                active={itemsPerPage === size}
                                onClick={() => {
                                  setCurrentPage(1);
                                  setItemsPerPage(size);
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
              {/* Call Status */}
              <Form.Group controlId="callStatus" className="mb-3">
                <Form.Label>Call Status</Form.Label>
                <Form.Control
                  as="select"
                  value={formData.callStatus || ''}
                  onChange={handleInputChange}
                  name="callStatus"
                >
                  <option value="">-- Select --</option>
                  <option value="Missed">Missed</option>
                  <option value="Rejected">Rejected</option>
                  <option value="Accepted">Accepted</option>
                  <option value="Switched Off">Switched Off</option>
                </Form.Control>
              </Form.Group>

              {/* Call Duration: visible for Missed, Rejected, Accepted */}
              {['Missed', 'Rejected', 'Accepted'].includes(formData.callStatus) && (
                <Form.Group controlId="callDuration" className="mb-3">
                  <Form.Label>Call Duration</Form.Label>
                  <div className="d-flex align-items-center gap-2">
                    <Form.Control
                      as="select"
                      name="callDurationMinutes"
                      value={formData.callDurationMinutes || ''}
                      onChange={handleInputChange}
                      style={{ width: '50%' }}
                    >
                      <option value="">Minutes</option>
                      {[...Array(60)].map((_, i) => (
                        <option key={i} value={i}>{i} min</option>
                      ))}
                    </Form.Control>

                    <Form.Control
                      as="select"
                      name="callDurationSeconds"
                      value={formData.callDurationSeconds || ''}
                      onChange={handleInputChange}
                      style={{ width: '50%' }}
                    >
                      <option value="">Seconds</option>
                      {[...Array(60)].map((_, i) => (
                        <option key={i} value={i}>{i} sec</option>
                      ))}
                    </Form.Control>
                  </div>
                </Form.Group>
              )}


              {/* Interested: only for Accepted */}
              {formData.callStatus === 'Accepted' && (
                <Form.Group controlId="interested" className="mb-3">
                  <Form.Label>Interested</Form.Label>
                  <Form.Control
                    as="select"
                    value={formData.interested || ''}
                    onChange={handleInputChange}
                    name="interested"
                  >
                    <option value="">-- Select --</option>
                    <option value="Yes">Yes</option>
                    <option value="No">No</option>
                    <option value="Inform Later">Inform Later</option>
                  </Form.Control>
                </Form.Group>
              )}


              {/* Plan Type: only if interested === 'Yes' */}
              {formData.interested === 'Yes' && (
                <Form.Group controlId="planType" className="mb-3">
                  <Form.Label>Plan Type</Form.Label>
                  <Form.Control
                    as="select"
                    value={formData.planType || ''}
                    onChange={handleInputChange}
                    name="planType"
                  >
                    <option value="">-- Select Plan --</option>
                    <option value="Starter">Starter</option>
                    <option value="Gold">Gold</option>
                    <option value="Master">Master</option>
                  </Form.Control>
                </Form.Group>
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
