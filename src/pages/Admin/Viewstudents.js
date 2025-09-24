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

    // Pagination state
    const [currentPage, setCurrentPage] = useState(1);
    const [rowsPerPage, setRowsPerPage] = useState(10);

    // Sorting state
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
        setCurrentPage(1);  // reset to first page when search changes
    };

    const handleSortChange = (column) => {
        if (sortColumn === column) {
            setSortOrder(prevOrder => prevOrder === 'asc' ? 'desc' : 'asc');
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
        setSelectedStudent(student);
        setShowModal(true);
    };

    const handleDelete = async () => {
        try {
            await axios.delete(`http://localhost:4000/admin/delete-student/${deletedStudentId}`);
            setStudents(students.filter(student => student._id !== deletedStudentId));
            setDeletedStudentId(null);
        } catch (err) {
            console.error('Error deleting student', err);
        }
    };

    const handleCloseModal = () => {
        setShowModal(false);
        setSelectedStudent(null);
    };

    const handleSaveChanges = async () => {
        try {
            await axios.put(`http://localhost:4000/admin/update-student/${selectedStudent._id}`, selectedStudent);
            setStudents(students.map(student => student._id === selectedStudent._id ? selectedStudent : student));
            handleCloseModal();
        } catch (err) {
            console.error('Error updating student', err);
        }
    };

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setSelectedStudent(prevState => ({
            ...prevState,
            [name]: value
        }));
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
        const aValue = a[sortColumn]?.toLowerCase() || '';
        const bValue = b[sortColumn]?.toLowerCase() || '';
        if (sortOrder === 'asc') {
            return aValue.localeCompare(bValue);
        } else {
            return bValue.localeCompare(aValue);
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
                                            currentRows.map((student, index) => (
                                                <tr key={student._id || index}>
                                                    <td>{indexOfFirstRow + index + 1}</td>
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

            <Modal
                show={showModal}
                onHide={handleCloseModal}
                dialogClassName="custom-modal-dialog"
            >
                <Modal.Header closeButton className="custom-modal-header">
                    <Modal.Title>Edit Student</Modal.Title>
                </Modal.Header>
                <Modal.Body className="custom-modal-body">
                    {selectedStudent && (
                        <Form>
                            <Form.Group controlId="formName">
                                <Form.Label>Name</Form.Label>
                                <Form.Control
                                    type="text"
                                    name="name"
                                    value={selectedStudent.name}
                                    onChange={handleInputChange}
                                    placeholder="Enter name"
                                    className="custom-form-control"
                                />
                            </Form.Group>

                            <Form.Group controlId="formEmail">
                                <Form.Label>Email</Form.Label>
                                <Form.Control
                                    type="email"
                                    name="email"
                                    value={selectedStudent.email}
                                    onChange={handleInputChange}
                                    placeholder="Enter email"
                                    className="custom-form-control"
                                />
                            </Form.Group>

                            <Form.Group controlId="formPhone">
                                <Form.Label>Phone</Form.Label>
                                <Form.Control
                                    type="text"
                                    name="phone"
                                    value={selectedStudent.phone}
                                    onChange={handleInputChange}
                                    placeholder="Enter phone number"
                                    className="custom-form-control"
                                />
                            </Form.Group>

                            <Form.Group controlId="formCourse">
                                <Form.Label>Course</Form.Label>
                                <Form.Control
                                    type="text"
                                    name="course"
                                    value={selectedStudent.course}
                                    onChange={handleInputChange}
                                    placeholder="Enter course"
                                    className="custom-form-control"
                                />
                            </Form.Group>

                            <Form.Group controlId="formPlace">
                                <Form.Label>Place</Form.Label>
                                <Form.Control
                                    type="text"
                                    name="place"
                                    value={selectedStudent.place}
                                    onChange={handleInputChange}
                                    placeholder="Enter place"
                                    className="custom-form-control"
                                />
                            </Form.Group>
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



            {/* Confirm Delete Modal */}
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


