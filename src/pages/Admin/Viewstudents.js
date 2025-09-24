import React, { useEffect, useState } from 'react';
import Layout from '../../components/layout/Layout';
import Adminmenu from '../../components/layout/Adminmenu';
import axios from 'axios';
import { Table, Dropdown, Button, Modal, Form } from 'react-bootstrap';
import '../../css/viewstudents.css';

function Viewstudents() {
  const [students, setStudents] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [deletedStudentId, setDeletedStudentId] = useState(null);

  // For validation errors of selectedStudent
  const [validationErrors, setValidationErrors] = useState({});

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(10);

  // Sorting
  const [sortColumn, setSortColumn] = useState('name');
  const [sortOrder, setSortOrder] = useState('asc');

  useEffect(() => {
    document.title = 'CRM - Student Details';
    const fetchStudents = async () => {
      try {
        const res = await axios.get('http://localhost:4000/admin/view-students');
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
    // Reset validation errors
    setValidationErrors({});
    // Use a shallow clone so we can mutate selectedStudent safely
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
    // update student
    setSelectedStudent(prev => ({
      ...prev,
      [name]: value
    }));

    // validate
    const err = validateField(name, value);
    setValidationErrors(prevErrs => ({
      ...prevErrs,
      [name]: err
    }));
  };

  const canSave = () => {
    if (!selectedStudent) return false;
    // Validate all fields again
    const fields = ['name', 'email', 'phone', 'course', 'place'];
    let errs = {};
    let hasError = false;
    for (let f of fields) {
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
    if (!canSave()) {
      return;
    }
    try {
      await axios.put(`http://localhost:4000/admin/update-student/${selectedStudent._id}`, selectedStudent);
      setStudents(students.map(stu => (stu._id === selectedStudent._id ? selectedStudent : stu)));
      handleCloseModal();
    } catch (err) {
      console.error('Error updating student', err);
      // Optionally set a global error
    }
  };

  const handleDelete = async () => {
    try {
      await axios.delete(`http://localhost:4000/admin/delete-student/${deletedStudentId}`);
      setStudents(students.filter(stu => stu._id !== deletedStudentId));
      setDeletedStudentId(null);
    } catch (err) {
      console.error('Error deleting student', err);
    }
  };

  const handleConfirmDelete = (id) => {
    setDeletedStudentId(id);
  };

  const filteredStudents = students.filter(student => {
    const lower = searchTerm.toLowerCase();
    return (
      (student.name && student.name.toLowerCase().includes(lower)) ||
      (student.email && student.email.toLowerCase().includes(lower)) ||
      (student.phone && student.phone.toLowerCase().includes(lower)) ||
      (student.course && student.course.toLowerCase().includes(lower)) ||
      (student.place && student.place.toLowerCase().includes(lower))
    );
  });

  const sortedStudents = [...filteredStudents].sort((a, b) => {
    const aVal = a[sortColumn]?.toString().toLowerCase() || '';
    const bVal = b[sortColumn]?.toString().toLowerCase() || '';
    if (sortOrder === 'asc') {
      return aVal.localeCompare(bVal);
    } else {
      return bVal.localeCompare(aVal);
    }
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

  if (loading) return (
    <div className="loader-overlay">
      <div className="loader-box">
        <div className="spinner"></div>
        <p className="loader-text">Loading...</p>
      </div>
    </div>
  );
  if (error) return <div className="vs-error">{error}</div>;

  return (
    <Layout title={"CRM - Student Details"}>
      <div className="container-fluid m-3 p-3 admin-root">
        <div className="row">
          <aside className="col-md-3">
            <Adminmenu />
          </aside>
          <main className="col-md-9">
            <div className="card admin-card vs-card p-4">
              <div className="controls-row mb-3">
                <div className="search-box flex-grow-1">
                  <input
                    type="text"
                    className="form-control"
                    placeholder="Search by name, email, phone, course, place etc…"
                    value={searchTerm}
                    onChange={handleSearchChange}
                  />
                </div>
                <div className="dropdowns-group">
                  <Dropdown>
                    <Dropdown.Toggle variant="outline-secondary" id="dropdown-sort-column">
                      Sort by: {sortColumn.charAt(0).toUpperCase() + sortColumn.slice(1)}
                    </Dropdown.Toggle>
                    <Dropdown.Menu>
                      {['name', 'email', 'phone', 'course', 'place'].map(col => (
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

              <div className="table-responsive vs-table-responsive">
                <Table className="custom-table table-hover align-middle">
                  <thead className="table-header">
                    <tr>
                      <th>#</th>
                      <th>Name</th>
                      <th>Email</th>
                      <th>Phone</th>
                      <th>Course</th>
                      <th>Place</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {currentRows.length > 0 ? (
                      currentRows.map((student, idx) => (
                        <tr key={student._id || idx}>
                          <td>{indexOfFirstRow + idx + 1}</td>
                          <td>{student.name}</td>
                          <td>{student.email}</td>
                          <td>{student.phone}</td>
                          <td>{student.course}</td>
                          <td>{student.place}</td>
                          <td className="vs-actions-td">
                            <button className="btn btn-sm btn-primary vs-btn-action mt-1" onClick={() => handleEdit(student)}>Edit</button>
                            <button className="btn btn-sm btn-danger vs-btn-action mt-1" onClick={() => handleConfirmDelete(student._id)}>Delete</button>
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr className="vs-no-data">
                        <td colSpan="7">No matching records found.</td>
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

      <Modal show={showModal} onHide={handleCloseModal} dialogClassName="custom-modal-dialog">
        <Modal.Header closeButton className="custom-modal-header">
          <Modal.Title>Edit Student</Modal.Title>
        </Modal.Header>
        <Modal.Body className="custom-modal-body">
          {selectedStudent && (
            <Form>
              {['name', 'email', 'phone', 'course', 'place'].map(field => (
                <Form.Group className="mb-3" controlId={`form${field}`} key={field}>
                  <Form.Label>{field.charAt(0).toUpperCase() + field.slice(1)}</Form.Label>
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

      {/* Confirm Delete */}
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
          <Button variant="danger" onClick={handleDelete}>
            Delete
          </Button>
        </Modal.Footer>
      </Modal>
    </Layout>
  );
}

export default Viewstudents;
