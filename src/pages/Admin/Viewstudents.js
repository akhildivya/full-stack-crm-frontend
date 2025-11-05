import React, { useEffect, useState } from 'react';
import Layout from '../../components/layout/Layout';
import Adminmenu from '../../components/layout/Adminmenu';
import axios from 'axios';
import { Table, Dropdown, Button, Modal, Form, Pagination, Tooltip, OverlayTrigger } from 'react-bootstrap';
import '../../css/viewstudents.css';
import { toast } from 'react-toastify';
import { BASEURL } from '../../service/baseUrl'
import { jsPDF } from 'jspdf';
import { autoTable } from 'jspdf-autotable';
import { FaFilePdf } from 'react-icons/fa';

function Viewstudents() {
  let globalSerialIndex = 1;
  const [students, setStudents] = useState([]);
  const [assignedStudents, setAssignedStudents] = useState([]); // new
  const [showAssignedModal, setShowAssignedModal] = useState(false); // new
const [isExpandedView, setIsExpandedView] = useState(true);

  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [deletedStudentId, setDeletedStudentId] = useState(null);

  const [selectedIds, setSelectedIds] = useState(new Set());
  const [showBulkDeleteConfirm, setShowBulkDeleteConfirm] = useState(false);

  const [validationErrors, setValidationErrors] = useState({});

  const [currentPage, setCurrentPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [sortColumn, setSortColumn] = useState('name');
  const [sortOrder, setSortOrder] = useState('asc');



  const [showAssignModal, setShowAssignModal] = useState(false);
  const [users, setUsers] = useState([]);

  const [selectedUserId, setSelectedUserId] = useState(null);



  const [assignedPage, setAssignedPage] = useState(1);
  const [assignedRowsPerPage, setAssignedRowsPerPage] = useState(10);

  // derive pagination slices for assignedStudents
  const assignedTotalPages = Math.ceil(assignedStudents.length / assignedRowsPerPage);
  const assignedIdxFirst = (assignedPage - 1) * assignedRowsPerPage;
  const assignedIdxLast = assignedIdxFirst + assignedRowsPerPage;
  const assignedCurrentRows = assignedStudents.slice(assignedIdxFirst, assignedIdxLast);


  //NEW
  const [historyOpenFor, setHistoryOpenFor] = useState(null);

  const [assignedSearchTerm, setAssignedSearchTerm] = useState('');
  const [assignedSortConfig, setAssignedSortConfig] = useState({ key: null, direction: 'asc' });
  // function to resolve nested keys (e.g. "assignedTo.username")
  const getNested = (obj, path) =>
    path.split('.').reduce((o, p) => (o ? o[p] : undefined), obj);

  const handleAssignedSort = (key) => {
    setAssignedSortConfig(prev => {
      if (prev.key === key) {
        return { key, direction: prev.direction === 'asc' ? 'desc' : 'asc' };
      }
      return { key, direction: 'asc' };
    });
  };

  const renderAssignedSortIndicator = (key) => {
    if (assignedSortConfig.key !== key) return null;
    return assignedSortConfig.direction === 'asc' ? ' ▲' : ' ▼';
  };
  const assigneeCounts = React.useMemo(() => {
    const counts = {};
    assignedStudents.forEach(stu => {
      const name = stu.assignedTo?.username || 'Unassigned';
      counts[name] = (counts[name] || 0) + 1;
    });
    return counts;
  }, [assignedStudents]);

  const handleAssignPageChange = (pageNum) => {
    if (pageNum < 1) pageNum = 1;
    if (pageNum > assignedTotalPages) pageNum = assignedTotalPages;
    setAssignedPage(pageNum);
  }
  useEffect(() => {
    document.title = 'CRM - Enrollee List';
    const fetchStudents = async () => {
      try {
        const res = await axios.get(`${BASEURL}/admin/view-students`);
        setStudents(res.data);
      } catch (err) {
        console.error('Error fetching students', err);
        setError('Error fetching students');
      } finally {
        setLoading(false);
      }
    };

    fetchStudents();
    const intervalId = setInterval(fetchStudents, 1000);
    return () => clearInterval(intervalId);
  }, []);


  // Fetch users for assign modal
  const fetchUsers = async () => {
    try {
      const res = await axios.get(`${BASEURL}/admin/get-users`);
      setUsers(res.data);
      console.log(users);

    } catch (err) {
      console.error('Error fetching users', err);
    }
  };
  //New
  const handleCloseAssignedModal = () => {
    setShowAssignedModal(false);
    setHistoryOpenFor(null);
  };

  const handleSearchChange = (e) => {
    setSearchTerm(e.target.value);
    setCurrentPage(1);
  };

  const handleSortChange = (column) => {
    if (sortColumn === column) {
      setSortOrder(prev => (prev === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortColumn(column);
      setSortOrder('asc');
    }
    setCurrentPage(1);
  };

  const handleRowsPerPageSelect = (num) => {
    setRowsPerPage(num);
    setCurrentPage(1);
  };

  const handleEdit = (student) => {
    setValidationErrors({});
    setSelectedStudent({ ...student });
    setShowModal(true);
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setSelectedStudent(null);
    setValidationErrors({});
  };

  const validateField = (name, value) => {
    let errorMsg = '';
    if (name === 'name') {
      if (!value) {
        errorMsg = 'Name is required';
      } else if (!/^[A-Z]/.test(value)) {
        errorMsg = 'First letter must be uppercase';
      } else if (value.length < 3) {
        errorMsg = 'Minimum 3 characters';
      } else if (value.length > 25) {
        errorMsg = 'Maximum 25 characters';
      } else if (!/^[A-Za-z ]+$/.test(value)) {
        errorMsg = 'Letters and spaces only';
      }
    }
    if (name === 'email') {
      if (!value) {
        errorMsg = 'Email is required';
      } else if (!/^[\w.-]+@[\w-]+\.[A-Za-z]{2,}$/.test(value)) {
        errorMsg = 'Invalid email address';
      }
    }
    if (name === 'phone') {
      if (!value) {
        errorMsg = 'Mobile number is required';
      } else if (value.length < 10) {
        errorMsg = 'Minimum 10 digits';
      } else if (value.length > 15) {
        errorMsg = 'Maximum 15 digits';
      } else if (!/^\+?[0-9]{10,15}$/.test(value)) {
        errorMsg = 'Invalid mobile number format';
      }
    }
    if (name === 'course') {
      if (!value) {
        errorMsg = 'Course is required';
      } else if (value.length < 2) {
        errorMsg = 'Course name too short';
      } else if (value.length > 50) {
        errorMsg = 'Course name too long';
      }
    }
    if (name === 'place') {
      if (!value) {
        errorMsg = 'Place is required';
      } else if (value.length < 2) {
        errorMsg = 'Place too short';
      } else if (value.length > 50) {
        errorMsg = 'Place too long';
      }
    }
    return errorMsg;
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setSelectedStudent(prev => ({
      ...prev,
      [name]: value
    }));
    const err = validateField(name, value);
    setValidationErrors(prevErrs => ({
      ...prevErrs,
      [name]: err
    }));
  };

  const canSave = () => {
    if (!selectedStudent) return false;
    const fields = ['name', 'email', 'phone', 'course', 'place'];
    let errs = {};
    let hasError = false;
    for (const f of fields) {
      const msg = validateField(f, selectedStudent[f] ?? '');
      if (msg) {
        hasError = true;
      }
      errs[f] = msg;
    }
    setValidationErrors(errs);
    return !hasError;
  };

  const handleSaveChanges = async () => {
    if (!canSave()) return;
    try {
      await axios.put(
        `${BASEURL}/admin/update-student/${selectedStudent._id}`,
        selectedStudent
      );
      setStudents(students.map(stu =>
        stu._id === selectedStudent._id ? selectedStudent : stu
      ));
      handleCloseModal();
    } catch (err) {
      console.error('Error updating student', err);
    }
  };

  const handleDeleteOne = async () => {
    try {
      await axios.delete(`${BASEURL}/admin/delete-student/${deletedStudentId}`);
      setStudents(students.filter(stu => stu._id !== deletedStudentId));
      setDeletedStudentId(null);
    } catch (err) {
      console.error('Error deleting student', err);
    }
  };

  const handleConfirmDeleteOne = (id) => {
    setDeletedStudentId(id);
  };
  const fetchAssigned = async () => {
    try {
      const res = await axios.get(`${BASEURL}/admin/view-assigned-students`);
      setAssignedStudents(res.data);
    } catch (err) {
      console.error('Error fetching assigned students', err);
      toast.error('Failed to load assigned students');
    }
  };

  //New
  const toggleHistory = (studentId) => {
    setHistoryOpenFor(prev => (prev === studentId ? null : studentId));
  };
  const filteredStudents = students.filter(stu => {
    const lower = searchTerm.trim().toLowerCase();

    // Match text fields
    const matchesText =
      (stu.name && stu.name.toLowerCase().includes(lower)) ||
      (stu.email && stu.email.toLowerCase().includes(lower)) ||
      (stu.phone && stu.phone.toLowerCase().includes(lower)) ||
      (stu.course && stu.course.toLowerCase().includes(lower)) ||
      (stu.place && stu.place.toLowerCase().includes(lower));

    // Status string
    const status = stu.assignedTo ? 'assigned' : 'unassigned';
    const matchesStatus =
      status.startsWith(lower) || lower.startsWith(status);
    const callStatus = stu.callMarked || 'not marked';  // fallback
    const matchesCallStatus =
      callStatus.toLowerCase().startsWith(lower) ||
      lower.startsWith(callStatus.toLowerCase());
    // If empty search, show all
    if (!lower) return true;
    return matchesText || matchesStatus || matchesCallStatus;
  });


  const sortedStudents = [...filteredStudents].sort((a, b) => {
    let aVal, bVal;


    if (sortColumn === 'status') {
      aVal = a.assignedTo ? 'assigned' : 'unassigned';
      bVal = b.assignedTo ? 'assigned' : 'unassigned';
    } else {
      aVal = a[sortColumn]?.toString().toLowerCase() || '';
      bVal = b[sortColumn]?.toString().toLowerCase() || '';
    }

    return sortOrder === 'asc'
      ? aVal.localeCompare(bVal)
      : bVal.localeCompare(aVal);
  });

  const indexOfLastRow = currentPage * rowsPerPage;
  const indexOfFirstRow = indexOfLastRow - rowsPerPage;
  const currentRows = sortedStudents.slice(indexOfFirstRow, indexOfLastRow);
  const totalPages = Math.ceil(sortedStudents.length / rowsPerPage);

  const goToPage = (pageNum) => {
    if (pageNum < 1) pageNum = 1;
    else if (pageNum > totalPages) pageNum = totalPages;
    setCurrentPage(pageNum);
  };

  const handleToggleSelect = (id) => {
    setSelectedIds(prev => {
      const newSet = new Set(prev);
      if (newSet.has(id)) newSet.delete(id);
      else newSet.add(id);
      return newSet;
    });
  };

  const handleSelectAllCurrentPage = () => {
    const idsOnPage = currentRows.map(stu => stu._id);
    setSelectedIds(prev => {
      const newSet = new Set(prev);
      idsOnPage.forEach(id => newSet.add(id));
      return newSet;
    });
  };

  const handleUnselectAllCurrentPage = () => {
    const idsOnPage = currentRows.map(stu => stu._id);
    setSelectedIds(prev => {
      const newSet = new Set(prev);
      idsOnPage.forEach(id => newSet.delete(id));
      return newSet;
    });
  };

  const handleBulkDelete = async () => {
    if (selectedIds.size === 0) {
      return;
    }
    try {
      await axios.delete(`${BASEURL}/admin/bulk-delete-students`, {
        data: { ids: Array.from(selectedIds) }
      });
      setStudents(students.filter(stu => !selectedIds.has(stu._id)));
      setSelectedIds(new Set());
      setShowBulkDeleteConfirm(false);
    } catch (err) {
      console.error('Error deleting students in bulk', err);
    }
  };

  const exportToPDF = () => {
    const doc = new jsPDF({
      unit: 'pt',
      format: 'a4',
    });

    const margin = { top: 60, bottom: 40, left: 10, right: 10 };
    const pageWidth = doc.internal.pageSize.getWidth();

    // Compute summary values from full students array (not just currentRows)
    const totalStudents = students.length;  // assuming `students` is full list
    const assignedCount = students.filter(stu => stu.assignedTo).length;
    const unassignedCount = totalStudents - assignedCount;
    const markedCount = students.filter(stu => stu.callMarked === 'marked').length;
    const notMarkedCount = students.filter(stu => stu.callMarked !== 'marked').length;
    // First, draw the title
    doc.setFontSize(14);
    doc.setTextColor(40);
    doc.text(
      "CRM - Contact Details Summary Report",
      pageWidth / 2,
      margin.top - 30,
      { align: 'center' }
    );

    // Then draw the summary line just below the title
    const summaryY = margin.top - 3; // or tweak for spacing
    doc.setFontSize(12);
    doc.setTextColor(0);
    const summaryText = `Total Students: ${totalStudents} | Assigned: ${assignedCount} | Unassigned: ${unassignedCount} | Marked:${markedCount} | Not Marked : ${notMarkedCount}`;
    doc.text(summaryText, margin.left, summaryY);

    // Prepare table data
    const tableData = currentRows.map((stu, idx) => {
      const statusText = stu.assignedTo ? 'Assigned' : 'Unassigned';
      const callStatusText = stu.callMarked === 'marked' ? 'Marked' : 'Not Marked';
      return [
        indexOfFirstRow + idx + 1,
        stu.name || '',
        stu.email || '',
        stu.phone || '',
        stu.place || '',
        stu.course || '',
        statusText,
        callStatusText
      ];
    });
    const head = [['#', 'Name', 'Email', 'Phone', 'Place', 'Course', 'Status', 'Call Status']];

    autoTable(doc, {
      startY: margin.top + 20,  // push table down so it doesn't overlap summary
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
        // footer with page numbers
        const pageCount = doc.internal.getNumberOfPages();
        doc.setFontSize(10);
        const footerText = `Page ${doc.internal.getCurrentPageInfo().pageNumber} of ${pageCount}`;
        const y = doc.internal.pageSize.getHeight() - 10;
        doc.text(footerText, pageWidth / 2, y, { align: 'center' });
      }
    });

    doc.save('crm_contact_details_summary_report.pdf');
  };

  const exportAssignedToPDF = () => {
    const doc = new jsPDF({ unit: 'pt', format: 'a4' });
    const margin = { top: 60, bottom: 40, left: 10, right: 10 };
    const pageWidth = doc.internal.pageSize.getWidth();

    // Apply search filter
    const lowerSearchTerm = assignedSearchTerm.trim().toLowerCase();
    const filtered = assignedStudents.filter(stu => {
      if (!lowerSearchTerm) return true;
      const checks = [
        stu.name?.toLowerCase(),
        stu.email?.toLowerCase(),
        stu.phone?.toLowerCase(),
        stu.course?.toLowerCase(),
        stu.place?.toLowerCase(),
        stu.assignedTo?.username?.toLowerCase(),
        stu.assignedTo?.email?.toLowerCase(),
        stu.assignedAt ? formatAssignedDate(stu.assignedAt).toLowerCase() : ''
      ];
      return checks.some(str => str?.includes(lowerSearchTerm));
    });

    // Apply sorting
    const { key, direction } = assignedSortConfig;
    if (key) {
      filtered.sort((a, b) => {
        const aVal = getNested(a, key);
        const bVal = getNested(b, key);
        if (aVal == null && bVal == null) return 0;
        if (aVal == null) return 1;
        if (bVal == null) return -1;
        const aStr = aVal.toString().toLowerCase();
        const bStr = bVal.toString().toLowerCase();
        return direction === 'asc' ? aStr.localeCompare(bStr) : bStr.localeCompare(aStr);
      });
    }

    const summaryText = `Summary: ${Object.entries(assigneeCounts)
      .map(([name, count]) => `${name}: ${count}`)
      .join(' | ')}`;
    // Prepare data rows
    const dataRows = filtered.map((stu, idx) => [
      assignedIdxFirst + idx + 1,
      stu.assignedTo?.username || stu.assignedTo?._id || '',
      formatAssignedDate(stu.assignedAt) || '',
      stu.name || '',
      stu.email || '',
      stu.phone || '',
      stu.course || '',
      stu.place || ''
    ]);

    // Define column widths
    const columnWidths = [30, 70, 70, 100, 100, 70, 60, 70];

    // Generate the table
    autoTable(doc, {
      startY: margin.top,
      margin,
      head: [
        ['#', 'Current Assignee', 'Assigned At', 'Name', 'Email', 'Phone', 'Course', 'Place']
      ],
      body: dataRows,
      theme: 'striped',
      headStyles: { fillColor: [0, 123, 255], textColor: [255, 255, 255] },
      columnStyles: {
        0: { cellWidth: columnWidths[0] },
        1: { cellWidth: columnWidths[1] },
        2: { cellWidth: columnWidths[2] },
        3: { cellWidth: columnWidths[3] },
        4: { cellWidth: columnWidths[4] },
        5: { cellWidth: columnWidths[5], halign: 'center' },
        6: { cellWidth: columnWidths[6], halign: 'center' },
        7: { cellWidth: columnWidths[7] }
      },
      styles: {
        overflow: 'linebreak',
        cellWidth: 'auto',
        fontSize: 10,
        lineWidth: 0.1
      },
      tableWidth: 'auto',
      didDrawPage: (data) => {
        doc.setFontSize(14);
        doc.setTextColor(40);
        doc.text("CRM- Assigned Leads Report", pageWidth / 2, margin.top - 30, { align: 'center' });

        const pageCount = doc.internal.getNumberOfPages();
        doc.setFontSize(10);
        doc.text(summaryText, margin.left, margin.top - 5);
        const footer = `Page ${doc.internal.getCurrentPageInfo().pageNumber} of ${pageCount}`;
        doc.text(footer, pageWidth / 2, doc.internal.pageSize.getHeight() - 10, { align: 'center' });
      }
    });

    doc.save('CRM_Assigned_Leads_Report.pdf');
  };



  function formatAssignedDate(dateString) {
    if (!dateString) return '—';
    const d = new Date(dateString);

    const day = String(d.getDate()).padStart(2, '0');
    const monthNames = [
      "Jan", "Feb", "Mar", "Apr",
      "May", "Jun", "Jul", "Aug",
      "Sept", "Oct", "Nov", "Dec"
    ];
    const month = monthNames[d.getMonth()];
    const year = d.getFullYear();

    // Hours, minutes, seconds in 12-hour format with AM/PM
    let hours = d.getHours();
    const minutes = String(d.getMinutes()).padStart(2, '0');
    const seconds = String(d.getSeconds()).padStart(2, '0');
    const ampm = hours >= 12 ? 'PM' : 'AM';
    hours = hours % 12;
    hours = hours ? hours : 12; // the hour '0' should be '12'
    const hourStr = String(hours).padStart(2, '0');

    return `${day}-${month}-${year} ${hourStr}:${minutes}:${seconds} ${ampm}`;
  }
  if (loading) {
    return (
      <div className="loader-overlay">
        <div className="loader-box">
          <div className="spinner"></div>
          <p className="loader-text">Loading...</p>
        </div>
      </div>
    );
  }
  const groupedUsers = users.reduce((acc, user) => {
    acc[user.username] = acc[user.username] || [];
    acc[user.username].push(user);
    return acc;
  }, {});

  if (error) {
    return <div className="vs-error">{error}</div>;
  }


  return (
    <Layout title={"CRM - Enrollee List"}>
      <div className="container-fluid m-3 p-3 admin-root">
        <div className="row">
          <aside className="col-md-3">
            <Adminmenu />
          </aside>
          <main className="col-md-9">
            <div className="card admin-card vs-card p-4">
              {/* Top control: search + sort */}
              <div className="d-flex flex-wrap align-items-center mb-3">
                <div className="search-container flex-grow-1 me-3">
                  <input
                    type="text"
                    className="form-control"
                    placeholder="Find by anything ...."
                    value={searchTerm}
                    onChange={handleSearchChange}
                  />
                </div>
                <div className="d-flex align-items-center sort-controls">
                  <Dropdown className="me-2">
                    <Dropdown.Toggle variant="outline-secondary" id="dropdown-sort-column">
                      Sort by: {sortColumn.charAt(0).toUpperCase() + sortColumn.slice(1)}
                    </Dropdown.Toggle>
                    <Dropdown.Menu>
                      {['name', 'email', 'phone', 'course', 'place', 'status', 'callMarked'].map(col => (
                        <Dropdown.Item key={col} onClick={() => handleSortChange(col)}>
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
                      <Dropdown.Item onClick={() => { setSortOrder('asc'); setCurrentPage(1); }}>Ascending</Dropdown.Item>
                      <Dropdown.Item onClick={() => { setSortOrder('desc'); setCurrentPage(1); }}>Descending</Dropdown.Item>
                    </Dropdown.Menu>
                  </Dropdown>
                </div>
              </div>

              {/* Bulk actions buttons row */}
              <div className="d-flex flex-wrap align-items-center gap-2 mb-3">

                <Button
                  variant="primary"
                  size="sm"
                  disabled={selectedIds.size === 0}
                  onClick={() => { setShowAssignModal(true); fetchUsers(); }}
                >
                  Assign Leads ({selectedIds.size})
                </Button>

                <Button
                  variant="info"
                  size="sm"
                  onClick={() => { fetchAssigned(); setShowAssignedModal(true); }}
                >
                  View Leads
                </Button>
                <Button
                  variant="danger"
                  size="sm"
                  disabled={selectedIds.size === 0}
                  onClick={() => setShowBulkDeleteConfirm(true)}
                >
                  Delete Selected ({selectedIds.size})
                </Button>
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={handleSelectAllCurrentPage}
                >
                  Select Page
                </Button>
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={handleUnselectAllCurrentPage}
                >
                  Unselect Page
                </Button>
              </div>
              <div className="mt-2 fw-bold text-start">
                Total Students: {students.length} |{" "}
                Assigned: {students.filter(stu => stu.assignedTo).length} |{" "}
                Unassigned: {students.filter(stu => !stu.assignedTo).length} | {" "}
                Marked : {students.filter(stu => stu.callMarked === 'marked').length} | {" "}
                Not marked : {students.filter(stu => stu.callMarked !== 'marked').length}
              </div>
              
               <div className="mt-3 mb-3">
        <Button
          variant={isExpandedView ? 'secondary' : 'primary'}
          size="sm"
          onClick={() => setIsExpandedView(prev => !prev)}
        >
          {isExpandedView ? 'Shrink View' : 'Expand View'}
        </Button>
      </div>
      
      <div className="table-responsive vs-table-responsive">
        <Table className="custom-table table-hover align-middle">
          <thead className="table-header">
            <tr>
              <th>
                <input
                  type="checkbox"
                  checked={
                    currentRows.length > 0 &&
                    currentRows.every(stu => selectedIds.has(stu._id))
                  }
                  onChange={(e) => {
                    if (e.target.checked) {
                      handleSelectAllCurrentPage();
                    } else {
                      handleUnselectAllCurrentPage();
                    }
                  }}
                />
              </th>
              <th>#</th>
              <th>Name</th>
              {isExpandedView ? (
                <>
                  <th>Email</th>
                  <th>Phone</th>
                  <th>Course</th>
                  <th>Place</th>
                </>
              ) : (
                <>
                  <th>Phone</th>
                  <th>Course</th>
                </>
              )}
              <th>Status</th>
              <th>Call Status</th>
              <th style={{ minWidth: '140px' }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {currentRows.length > 0 ? (
              currentRows.map((student, idx) => (
                <tr key={student._id || idx}>
                  <td className="align-middle">
                    <input
                      type="checkbox"
                      checked={selectedIds.has(student._id)}
                      onChange={() => handleToggleSelect(student._id)}
                    />
                  </td>
                  <td className="align-middle">{indexOfFirstRow + idx + 1}</td>
                  <td
                    className={
                      `align-middle ` +
                      (student.assignedTo ? "assigned-name " : "") +
                      (student.assignedTo && student.callMarked === 'marked' ? "name-strikethrough " : "")
                    }
                  >
                    <OverlayTrigger
                      placement="top"
                      overlay={
                        <Tooltip id={`tooltip-assignee-${student._id}`}>
                          <div>
                            <strong>Assignee:</strong> {student.assignedTo?.username || 'None'}
                          </div>
                          <div>
                            <strong>Assigned Date:</strong>{" "}
                            {student.assignedAt
                              ? new Date(student.assignedAt).toLocaleString('en-IN', {
                                  day: '2-digit',
                                  month: 'short',
                                  year: 'numeric',
                                  hour: '2-digit',
                                  minute: '2-digit',
                                  second: '2-digit',
                                  hour12: true,
                                })
                              : 'None'}
                          </div>
                        </Tooltip>
                      }
                    >
                      <span style={{
                        textDecoration:
                          student.assignedTo && student.callMarked === 'marked'
                            ? "line-through"
                            : "none"
                      }}>
                        {student.name}
                      </span>
                    </OverlayTrigger>
                  </td>

                  {isExpandedView ? (
                    <>
                      <td className={`align-middle ${student.assignedTo && student.callMarked==='marked' ? 'name-strikethrough' : ''}`}>
                        {student.email}
                      </td>
                      <td className={`align-middle ${student.assignedTo && student.callMarked==='marked' ? 'name-strikethrough' : ''}`}>
                        {student.phone}
                      </td>
                      <td className={`align-middle ${student.assignedTo && student.callMarked==='marked' ? 'name-strikethrough' : ''}`}>
                        {student.course}
                      </td>
                      <td className={`align-middle ${student.assignedTo && student.callMarked==='marked' ? 'name-strikethrough' : ''}`}>
                        {student.place}
                      </td>
                    </>
                  ) : (
                    <>
                      <td className={`align-middle ${student.assignedTo && student.callMarked==='marked' ? 'name-strikethrough' : ''}`}>
                        {student.phone}
                      </td>
                      <td className={`align-middle ${student.assignedTo && student.callMarked==='marked' ? 'name-strikethrough' : ''}`}>
                        {student.course}
                      </td>
                    </>
                  )}

                  <td className="align-middle">
                    {student.assignedTo ? (
                      <span className="badge bg-success">Assigned</span>
                    ) : (
                      <span className="badge bg-secondary">Unassigned</span>
                    )}
                  </td>
                  <td className="align-middle">
                    {student.callMarked === 'marked' ? (
                      <span className="badge bg-success">Marked</span>
                    ) : (
                      <span className="badge bg-secondary">Not Marked</span>
                    )}
                  </td>
                  <td className="align-middle">
                    <div className="d-flex justify-content-end">
                      <Button
                        variant="primary"
                        size="sm"
                        className="me-2"
                        onClick={() => handleEdit(student)}
                      >
                        Edit
                      </Button>
                      <Button
                        variant="danger"
                        className="btn-transition"
                        size="sm"
                        onClick={() => handleConfirmDeleteOne(student._id)}
                      >
                        Delete
                      </Button>
                    </div>
                  </td>
                </tr>
              ))
            ) : (
              <tr className="vs-no-data">
                <td colSpan={isExpandedView ? 10 : 8}>
                  No matching records found.
                </td>
              </tr>
            )}
          </tbody>
        </Table>
      </div>

              <div className="d-flex flex-column flex-sm-row justify-content-between align-items-center mt-4">
                <div className="mb-2 mb-sm-0">
                  <Button variant="outline-secondary" size="sm" onClick={() => goToPage(currentPage - 1)} disabled={currentPage === 1}>
                    &lt; Prev
                  </Button>
                  {[...Array(totalPages)].map((_, i) => {
                    const pageNum = i + 1;
                    return (
                      <Button
                        key={pageNum}
                        variant={currentPage === pageNum ? "primary" : "outline-secondary"}
                        size="sm"
                        className="mx-1"
                        onClick={() => goToPage(pageNum)}
                      >
                        {pageNum}
                      </Button>
                    );
                  })}
                  <Button variant="outline-secondary" size="sm" onClick={() => goToPage(currentPage + 1)} disabled={currentPage === totalPages}>
                    Next &gt;
                  </Button>
                </div>
                <div>
                  <Dropdown>
                    <Dropdown.Toggle variant="outline-secondary" size="sm" id="dropdown-rows-per-page">
                      {rowsPerPage}
                    </Dropdown.Toggle>
                    <Dropdown.Menu>
                      {[1, 2, 5, 10, 20, 30, 40, 50, 60, 80, 100].map(num => (
                        <Dropdown.Item key={num} active={rowsPerPage === num} onClick={() => { setRowsPerPage(num); setCurrentPage(1); }}>
                          {num}
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

          </main>
        </div>
      </div>

      {/* Edit / Delete modals unchanged */}
      <Modal show={showModal} onHide={handleCloseModal} dialogClassName="custom-modal-dialog">
        <Modal.Header closeButton className="custom-modal-header">
          <Modal.Title>Edit Student</Modal.Title>
        </Modal.Header>
        <Modal.Body className="custom-modal-body">
          {selectedStudent && (
            <Form>
              {['name', 'email', 'phone', 'course', 'place'].map(field => (
                <Form.Group className="mb-3" controlId={`form${field}`} key={field}>
                  <Form.Label>
                    {field.charAt(0).toUpperCase() + field.slice(1)}
                  </Form.Label>
                  <Form.Control
                    type={field === 'email' ? 'email' : 'text'}
                    name={field}
                    value={selectedStudent[field] || ''}
                    onChange={handleInputChange}
                    placeholder={`Enter ${field}`}
                    className="custom-form-control"
                  />
                  {validationErrors[field] && (
                    <div className="text-danger small mt-1">
                      {validationErrors[field]}
                    </div>
                  )}
                </Form.Group>
              ))}
            </Form>
          )}
        </Modal.Body>
        <Modal.Footer className="custom-modal-footer">
          <Button variant="secondary" onClick={handleCloseModal}>
            Close
          </Button>
          <Button variant="primary" onClick={handleSaveChanges}>
            Update
          </Button>
        </Modal.Footer>
      </Modal>
      <Modal
        show={deletedStudentId !== null}
        onHide={() => setDeletedStudentId(null)}
        dialogClassName="confirm-delete-modal-dialog"
        contentClassName="confirm-delete-modal-content"
        backdropClassName="confirm-delete-modal-backdrop"
        centered
      >
        <Modal.Header className="confirm-delete-modal-header" closeButton>
          <Modal.Title className="modal-title-custom">Confirm Deletion</Modal.Title>
        </Modal.Header>
        <Modal.Body className="confirm-delete-modal-body">
          Are you sure you want to delete?
        </Modal.Body>
        <Modal.Footer className="confirm-delete-modal-footer">
          <Button className="btn-cancel" variant="secondary" onClick={() => setDeletedStudentId(null)}>
            Cancel
          </Button>
          <Button className="btn-confirm" variant="danger" onClick={handleDeleteOne}>
            Delete
          </Button>
        </Modal.Footer>
      </Modal>

      {/* Bulk Delete Modal */}
      <Modal
        show={showBulkDeleteConfirm}
        onHide={() => setShowBulkDeleteConfirm(false)}
        dialogClassName="confirm-delete-modal-dialog"
        contentClassName="confirm-delete-modal-content"
        backdropClassName="confirm-delete-modal-backdrop"
        centered
      >
        <Modal.Header className="confirm-delete-modal-header" closeButton>
          <Modal.Title className="modal-title-custom">Delete </Modal.Title>
        </Modal.Header>
        <Modal.Body className="confirm-delete-modal-body">
          Are you sure you want to bulk delete <strong>{selectedIds.size}</strong> {selectedIds.size < 2 ? 'selected student' : ' selected student\'s'}?
        </Modal.Body>
        <Modal.Footer className="confirm-delete-modal-footer">
          <Button className="btn-cancel" variant="secondary" onClick={() => setShowBulkDeleteConfirm(false)}>
            Cancel
          </Button>
          <Button className="btn-confirm" variant="danger" onClick={handleBulkDelete}>
            Delete All Selected
          </Button>
        </Modal.Footer>
      </Modal>



      <Modal className="assign-leads-modal" show={showAssignModal} onHide={() => setShowAssignModal(false)} >

        <Modal.Header closeButton>
          <Modal.Title>Assign Leads</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <p>
            Select a user to assign <strong>{selectedIds.size}</strong> {selectedIds.size < 2 ? 'student' : 'students'}
          </p>
          {users.length > 0 ? (
            <Form>
              {Object.values(groupedUsers).map((userGroup, index) => {
                const firstUser = userGroup[0];
                const isDuplicate = userGroup.length > 1;

                return (
                  <div key={index}>
                    {userGroup.map((user) => (
                      <Form.Check
                        type="radio"
                        id={`user-${user._id}`}
                        key={user._id}
                        name="assignUser"
                        value={user._id}
                        checked={selectedUserId === user._id}
                        onChange={() => setSelectedUserId(user._id)}
                        className="mb-2"
                        label={
                          <div>
                            <span>{user.username}</span>
                            {isDuplicate && <small className="text-muted ms-2">{user.email}</small>}
                          </div>
                        }
                      />
                    ))}
                  </div>
                );
              })}
            </Form>
          ) : <p>No users available</p>}
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => { setShowAssignModal(false); setSelectedUserId(null); }}>Close</Button>
          <Button
            variant="primary"
            onClick={async () => {
              if (!selectedUserId) return toast.warning('Please select a user!', {
                position: "top-center",
                autoClose: 5000,
                hideProgressBar: false,
                closeOnClick: false,
                pauseOnHover: true,
                draggable: true,
                progress: undefined,
                theme: "light",
              });

              // 🔹 Check if selected students are already assigned
              const alreadyAssigned = students.filter(
                stu => selectedIds.has(stu._id) && stu.assignedTo
              );

              if (alreadyAssigned.length > 0) {
                const studentCount = alreadyAssigned.length;
                const studentLabel = studentCount > 1 ? 'students are' : 'student is';
                toast.info(
                  <>
                    <span>
                      The following {studentLabel}  already assigned:
                      <br />
                      {alreadyAssigned
                        .map(stu => {
                          const assignedToUsername = stu.assignedTo ? stu.assignedTo.username : 'Unknown';
                          return `${stu.name} : already assigned to ${assignedToUsername} on ${new Date(stu.assignedAt).toLocaleDateString('en-IN', {
                            day: '2-digit',
                            month: 'short',
                            year: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit',
                            second: '2-digit',
                            hour12: true,
                          })}`;
                        })
                        .join(', ')}
                    </span>
                  </>,
                  {
                    position: "top-center",
                    autoClose: 5000,
                    hideProgressBar: false,
                    closeOnClick: false,
                    pauseOnHover: true,
                    draggable: true,
                    progress: undefined,
                    theme: "light",
                    allowHtml: true,
                  }
                );
                return;
              }

              try {
                await axios.put(`${BASEURL}/admin/assign-students`, {
                  studentIds: Array.from(selectedIds),
                  userId: selectedUserId
                });
                toast.success('Students assigned successfully!', {
                  position: "top-center",
                  autoClose: 3000,
                  hideProgressBar: false,
                  closeOnClick: true,
                  pauseOnHover: true,
                  draggable: true,
                  progress: undefined,
                  theme: "light",
                });
                const res = await axios.get(`${BASEURL}/admin/view-students`);
                setStudents(res.data);
                setSelectedIds(new Set());
                setSelectedUserId(null);
                setShowAssignModal(false);
              } catch (err) {
                console.error('Error assigning students', err);
                toast.error('Failed to assign students. Please try again.', {
                  position: "top-center",
                  autoClose: 3000,
                  theme: "colored",
                });
              }
            }}
          >
            Save
          </Button>
        </Modal.Footer>
      </Modal>


      {/* NEW: Assigned students modal */}
      <Modal
        show={showAssignedModal}
        onHide={() => {
          setShowAssignedModal(false);
          setAssignedSearchTerm('');
          setAssignedSortConfig({ key: null, direction: 'asc' });
        }}
        size="lg"
        dialogClassName="assigned-modal-dialog"
      >
        <Modal.Header closeButton>
          <Modal.Title>Assigned Leads</Modal.Title>
        </Modal.Header>
        <Modal.Body>

          <div className="mb-3">
            <input
              type="text"
              className="form-control"
              placeholder="Search by anything..."
              value={assignedSearchTerm}
              onChange={e => {
                setAssignedSearchTerm(e.target.value);
                // reset to first page if you have paging
                setAssignedPage(1);
              }}
            />
          </div>
          {/* Sort controls */}
          <div className="d-flex align-items-center mb-3">
            <span className="me-2">Sort by:</span>
            <Form.Select
              size="sm"
              value={assignedSortConfig.key || ''}
              onChange={e => {
                const col = e.target.value;
                if (col) {
                  handleAssignedSort(col);
                } else {
                  setAssignedSortConfig({ key: null, direction: 'asc' });
                }
                setAssignedPage(1);
              }}
              style={{ width: 'auto' }}
            >
              <option value="">-- None --</option>
              <option value="name">Name</option>
              <option value="email">Email</option>
              <option value="phone">Phone</option>
              <option value="course">Course</option>
              <option value="place">Place</option>
              <option value="assignedTo.username">Assignee</option>
              <option value="assignedAt">Assigned Date</option>
            </Form.Select>

            <Button
              variant="outline-secondary"
              size="sm"
              className="ms-2"
              onClick={() => {
                if (assignedSortConfig.key) {
                  setAssignedSortConfig(prev => ({
                    key: prev.key,
                    direction: prev.direction === 'asc' ? 'desc' : 'asc'
                  }));
                  setAssignedPage(1);
                }
              }}
              disabled={!assignedSortConfig.key}
              title="Toggle sort direction"
            >
              {assignedSortConfig.direction === 'asc' ? '↑' : '↓'}
            </Button>
          </div>
          <div className="mb-3">
            <strong>Summary:</strong>{' '}
            {Object.entries(assigneeCounts).map(([name, cnt], idx, arr) => (
              <span key={name}>
                {name}: {cnt}
                {idx < arr.length - 1 ? ' | ' : ''}
              </span>
            ))}
          </div>
          <Table bordered hover responsive>
            <thead>
              <tr>
                <th>#</th>
                <th onClick={() => handleAssignedSort('assignedTo.username')}>
                  Current Assignee{renderAssignedSortIndicator('assignedTo.username')}
                </th>
                <th onClick={() => handleAssignedSort('assignedAt')}>
                  Assigned At{renderAssignedSortIndicator('assignedAt')}
                </th>
                <th onClick={() => handleAssignedSort('name')}>
                  Name{renderAssignedSortIndicator('name')}
                </th>
                <th onClick={() => handleAssignedSort('email')}>
                  Email{renderAssignedSortIndicator('email')}
                </th>
                <th onClick={() => handleAssignedSort('phone')}>
                  Phone{renderAssignedSortIndicator('phone')}
                </th>
                <th onClick={() => handleAssignedSort('course')}>
                  Course{renderAssignedSortIndicator('course')}
                </th>
                <th onClick={() => handleAssignedSort('place')}>
                  Place{renderAssignedSortIndicator('place')}
                </th>
                <th>History</th>
              </tr>
            </thead>
            <tbody>
              {(() => {
                const lower = assignedSearchTerm.trim().toLowerCase();

                // 1. Filter by search term across *all relevant fields*
                let filtered = assignedStudents.filter(stu => {
                  // If search is empty, include all
                  if (!lower) return true;

                  // Prepare potential string representations of fields
                  const checks = [];

                  // Basic fields
                  if (stu.name) checks.push(stu.name.toLowerCase());
                  if (stu.email) checks.push(stu.email.toLowerCase());
                  if (stu.phone) checks.push(stu.phone.toLowerCase());
                  if (stu.course) checks.push(stu.course.toLowerCase());
                  if (stu.place) checks.push(stu.place.toLowerCase());

                  // Assignee
                  if (stu.assignedTo?.username)
                    checks.push(stu.assignedTo.username.toLowerCase());
                  if (stu.assignedTo?.email)
                    checks.push(stu.assignedTo.email.toLowerCase());

                  // Assigned date: convert to string
                  if (stu.assignedAt) {
                    const dt = formatAssignedDate(stu.assignedAt).toLowerCase();
                    checks.push(dt);
                  }

                  // Finally: does any field “contain” the search term?
                  return checks.some(str => str.includes(lower));
                });

                // 2. Sort if needed
                if (assignedSortConfig.key) {
                  const { key, direction } = assignedSortConfig;
                  filtered = filtered.slice().sort((a, b) => {
                    const getNested = (obj, path) =>
                      path.split('.').reduce((o, p) => (typeof o === 'object' && o ? o[p] : undefined), obj);

                    const aVal = getNested(a, key);
                    const bVal = getNested(b, key);

                    if (aVal == null && bVal == null) return 0;
                    if (aVal == null) return 1;
                    if (bVal == null) return -1;

                    const aStr = aVal.toString().toLowerCase();
                    const bStr = bVal.toString().toLowerCase();

                    if (aStr < bStr) return direction === 'asc' ? -1 : 1;
                    if (aStr > bStr) return direction === 'asc' ? 1 : -1;
                    return 0;
                  });
                }

                // 3. Pagination slice
                const start = (assignedPage - 1) * assignedRowsPerPage;
                const paged = filtered.slice(start, start + assignedRowsPerPage);

                // 4. Render rows or "no records"
                if (paged.length === 0) {
                  return (
                    <tr>
                      <td colSpan={9} style={{ textAlign: 'center' }}>
                        No assigned students found.
                      </td>
                    </tr>
                  );
                }

                return paged.map((stu, idx) => (
                  <React.Fragment key={stu._id}>
                    <tr>
                      <td>{assignedIdxFirst + idx + 1}</td>
                      <td>
                        {stu.assignedTo?.username || stu.assignedTo?._id}
                        {stu.assignedTo?.email && (
                          <div style={{ fontSize: '0.8em', color: '#666' }}>
                            {stu.assignedTo.email}
                          </div>
                        )}
                      </td>
                      <td style={{ minWidth: '150px', width: '250px' }}>
                        {stu.assignedAt ? formatAssignedDate(stu.assignedAt) : '-'}
                      </td>
                      <td>{stu.name}</td>
                      <td>{stu.email}</td>
                      <td>{stu.phone}</td>
                      <td>{stu.course}</td>
                      <td>{stu.place}</td>
                      <td>
                        <Button size="sm" onClick={() => toggleHistory(stu._id)}>
                          {historyOpenFor === stu._id ? 'Hide' : 'Show'}
                        </Button>
                      </td>
                    </tr>

                    {historyOpenFor === stu._id && (
                      <tr>
                        <td colSpan={9}>
                          <div>
                            <strong>Assignment History:</strong>
                            <Table size="sm" bordered>
                              <thead>
                                <tr>
                                  <th>User</th>
                                  <th>Assigned At</th>
                                  <th>Unassigned At</th>
                                </tr>
                              </thead>
                              <tbody>
                                {(stu.assignments || []).map((a, ai) => (
                                  <tr key={ai}>
                                    <td>{a.user?.username || a.user?._id}</td>
                                    <td>
                                      {a.assignedAt
                                        ? formatAssignedDate(a.assignedAt)
                                        : '-'}
                                    </td>
                                    <td>
                                      {a.unassignedAt
                                        ? formatAssignedDate(a.unassignedAt).toLocaleString()
                                        : '---'}
                                    </td>
                                  </tr>
                                ))}
                              </tbody>
                            </Table>
                          </div>
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                ));
              })()}
            </tbody>
          </Table>

        </Modal.Body>
        <Modal.Footer className="d-flex flex-column flex-md-row justify-content-between align-items-center">
          {/* PDF Export Icon */}
          <Button variant="outline-primary" className="me-3 mb-2 mb-md-0" onClick={exportAssignedToPDF} title="Export to PDF">
            <FaFilePdf size={16} /> Export
          </Button>

          {/* Pagination controls */}
          <Pagination>
            <Pagination.Prev disabled={assignedPage === 1} onClick={() => handleAssignPageChange(assignedPage - 1)} />
            {[...Array(assignedTotalPages)].map((_, idx) => {
              const num = idx + 1;
              return (
                <Pagination.Item
                  key={num}
                  active={num === assignedPage}
                  onClick={() => handleAssignPageChange(num)}
                >
                  {num}
                </Pagination.Item>
              );
            })}
            <Pagination.Next disabled={assignedPage === assignedTotalPages} onClick={() => handleAssignPageChange(assignedPage + 1)} />
          </Pagination>

          <Button variant="secondary" onClick={() => setShowAssignedModal(false)}>Close</Button>
        </Modal.Footer>
      </Modal>


    </Layout>
  );
}

export default Viewstudents;
