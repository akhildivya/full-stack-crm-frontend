import React, { useEffect, useState } from 'react';
import Layout from '../../components/layout/Layout';
import Adminmenu from '../../components/layout/Adminmenu';
import axios from 'axios';
import { Table, Dropdown, Button, Modal, Form } from 'react-bootstrap';
import '../../css/viewstudents.css';
import { toast } from 'react-toastify';
import {BASEURL} from '../../service/baseUrl'
function Viewstudents() {
  const [students, setStudents] = useState([]);
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


  // --- New State for Assign Feature ---
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [users, setUsers] = useState([]);
  // --- New State for Assign Feature ---
  const [selectedUserId, setSelectedUserId] = useState(null);

  useEffect(() => {
    document.title = 'CRM - Student Details';
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

    // If empty search, show all
    if (!lower) return true;
    return matchesText || matchesStatus;
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
  if (error) {
    return <div className="vs-error">{error}</div>;
  }

  return (
    <Layout title={"CRM - Student Details"}>
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
                      {['name', 'email', 'phone', 'course', 'place', 'status'].map(col => (
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
                      <th>Email</th>
                      <th>Phone</th>
                      <th>Course</th>
                      <th>Place</th>
                      <th>Status</th>

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
                          <td className={`align-middle ${student.assignedTo ? "assigned-name" : ""}`}>
                            {student.name}
                          </td>
                          <td className="align-middle">{student.email}</td>
                          <td className="align-middle">{student.phone}</td>
                          <td className="align-middle">{student.course}</td>
                          <td className="align-middle">{student.place}</td>
                          <td className="align-middle">
                            {student.assignedTo ? (
                              <span className="badge bg-success">Assigned</span>
                            ) : (
                              <span className="badge bg-secondary">Unassigned</span>
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
                        <td colSpan="8">No matching records found.</td>
                      </tr>
                    )}
                  </tbody>

                </Table>
              </div>

              <div className="vs-pagination-container d-flex align-items-center">
                <Button
                  variant="outline-secondary"
                  size="sm"
                  onClick={() => goToPage(currentPage - 1)}
                  disabled={currentPage === 1}
                >
                  Previous
                </Button>
                {[...Array(totalPages)].map((_, idx) => (
                  <Button
                    key={idx + 1}
                    variant={currentPage === idx + 1 ? 'primary' : 'outline-secondary'}
                    size="sm"
                    className="mx-1"
                    onClick={() => goToPage(idx + 1)}
                  >
                    {idx + 1}
                  </Button>
                ))}
                <Button
                  variant="outline-secondary"
                  size="sm"
                  onClick={() => goToPage(currentPage + 1)}
                  disabled={currentPage === totalPages}
                >
                  Next
                </Button>
                <Dropdown className="ms-auto">
                  <Dropdown.Toggle variant="outline-secondary" size="sm" id="dropdown-rows-per-page">
                    {rowsPerPage} / page
                  </Dropdown.Toggle>
                  <Dropdown.Menu>
                    {[5, 10, 20, 50, 75, 100].map(size => (
                      <Dropdown.Item
                        key={size}
                        active={rowsPerPage === size}
                        onClick={() => handleRowsPerPageSelect(size)}
                      >
                        {size} / page
                      </Dropdown.Item>
                    ))}
                  </Dropdown.Menu>
                </Dropdown>
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
            Save Changes
          </Button>
        </Modal.Footer>
      </Modal>

      <Modal show={deletedStudentId !== null} onHide={() => setDeletedStudentId(null)}>
        <Modal.Header closeButton>
          <Modal.Title>Confirm Deletion</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          Are you sure you want to delete this student? This action cannot be undone.
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setDeletedStudentId(null)}>
            Cancel
          </Button>
          <Button variant="danger" onClick={handleDeleteOne}>
            Delete
          </Button>
        </Modal.Footer>
      </Modal>

      <Modal show={showBulkDeleteConfirm} onHide={() => setShowBulkDeleteConfirm(false)}>
        <Modal.Header closeButton>
          <Modal.Title>Confirm Delete Selected</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          Are you sure you want to delete <strong>{selectedIds.size}</strong> selected student(s)? This action cannot be undone.
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowBulkDeleteConfirm(false)}>
            Cancel
          </Button>
          <Button variant="danger" onClick={handleBulkDelete}>
            Delete All Selected
          </Button>
        </Modal.Footer>
      </Modal>




      <Modal show={showAssignModal} onHide={() => setShowAssignModal(false)}>
        <Modal.Header closeButton>
          <Modal.Title>Assign Selected Students</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <p>Select a user to assign <strong>{selectedIds.size}</strong> student(s):</p>
          {users.length > 0 ? (
            <Form>
              {users.map(user => (
                <Form.Check
                  type="radio"
                  id={`user-${user._id}`}
                  key={user._id}
                  label={user.username}
                  name="assignUser"
                  value={user._id}
                  checked={selectedUserId === user._id}
                  onChange={() => setSelectedUserId(user._id)}
                  className="mb-2"
                />
              ))}
            </Form>
          ) : <p>No users available</p>}
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => { setShowAssignModal(false); setSelectedUserId(null); }}>Close</Button>
          <Button
            variant="primary"
            onClick={async () => {
              if (!selectedUserId) return alert('Please select a user!');

              // 🔹 Check if selected students are already assigned
              const alreadyAssigned = students.filter(
                stu => selectedIds.has(stu._id) && stu.assignedTo
              );

              if (alreadyAssigned.length > 0) {
                toast.info(
                  `The following student(s) are already assigned: ${alreadyAssigned
                    .map(stu => stu.name)
                    .join(', ')}`
                );
                return;
              }

              try {
                await axios.put(`${BASEURL}/admin/assign-students`, {
                  studentIds: Array.from(selectedIds),
                  userId: selectedUserId
                });
                const res = await axios.get(`${BASEURL}/admin/view-students`);
                setStudents(res.data);
                setSelectedIds(new Set());
                setSelectedUserId(null);
                setShowAssignModal(false);
              } catch (err) {
                console.error('Error assigning students', err);
              }
            }}
          >
            Save
          </Button>
        </Modal.Footer>
      </Modal>
    </Layout>
  );
}

export default Viewstudents;
