import React, { useEffect, useState } from 'react';
import Layout from '../../components/layout/Layout';
import Adminmenu from '../../components/layout/Adminmenu';
import axios from 'axios';
import { Table, Dropdown } from 'react-bootstrap';
import '../../css/viewstudents.css';

function Viewstudents() {
    const [students, setStudents] = useState([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    // Pagination state
    const [currentPage, setCurrentPage] = useState(1);
    const [rowsPerPage, setRowsPerPage] = useState(10);

    // Sorting state
    const [sortColumn, setSortColumn] = useState('name');
    const [sortOrder, setSortOrder] = useState('asc');

    const pollingInterval = 1000; // 1 second

    useEffect(() => {
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
        const intervalId = setInterval(fetchStudents, pollingInterval);
        return () => {
            clearInterval(intervalId);
        };
    }, []);

    const handleSearchChange = (e) => {
        setSearchTerm(e.target.value);
        setCurrentPage(1);  // reset to first page when search changes
    };

    const handleSortChange = (column) => {
        setSortColumn(column);
        setSortOrder(prevOrder => prevOrder === 'asc' ? 'desc' : 'asc');
    };

    // Filtered students based on search
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

    // Sorting the filtered students
    const sortedStudents = [...filteredStudents].sort((a, b) => {
        const aValue = a[sortColumn]?.toLowerCase() || '';
        const bValue = b[sortColumn]?.toLowerCase() || '';
        if (sortOrder === 'asc') {
            return aValue.localeCompare(bValue);
        } else {
            return bValue.localeCompare(aValue);
        }
    });

    // Compute pagination
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
                            <div className="d-flex align-items-center mb-3">
                                <div className="input-group me-2 flex-grow-1">
                                    <input
                                        type="text"
                                        className="form-control"
                                        placeholder="Search by name, email, phone, etc."
                                        value={searchTerm}
                                        onChange={handleSearchChange}
                                    />
                                </div>
                                <div className="input-group me-2">
                                    <Dropdown>
                                        <Dropdown.Toggle variant="outline-secondary" id="dropdown-sort-column">
                                            Sort by: {sortColumn.charAt(0).toUpperCase() + sortColumn.slice(1)}
                                        </Dropdown.Toggle>
                                        <Dropdown.Menu>
                                            {['name', 'email', 'phone', 'course', 'place'].map(column => (
                                                <Dropdown.Item key={column} onClick={() => handleSortChange(column)}>
                                                    {column.charAt(0).toUpperCase() + column.slice(1)}
                                                </Dropdown.Item>
                                            ))}
                                        </Dropdown.Menu>
                                    </Dropdown>
                                </div>
                                <div className="input-group">
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
                                                    <td>
                                                        <button className="btn btn-sm btn-primary vs-btn-action">Edit</button>
                                                        <button className="btn btn-sm btn-danger vs-btn-action">Delete</button>
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

                            {/* Pagination Controls */}
                            <div className="vs-pagination-container">
                                <button
                                    className="btn btn-outline-secondary btn-sm"
                                    onClick={() => goToPage(currentPage - 1)}
                                    disabled={currentPage === 1}
                                >
                                    Previous
                                </button>

                                {[...Array(totalPages)].map((_, idx) => (
                                    <button
                                        key={idx + 1}
                                        className={`btn btn-sm ${currentPage === idx + 1 ? 'btn-primary' : 'btn-outline-secondary'} mx-1`}
                                        onClick={() => goToPage(idx + 1)}
                                    >
                                        {idx + 1}
                                    </button>
                                ))}

                                <button
                                    className="btn btn-outline-secondary btn-sm"
                                    onClick={() => goToPage(currentPage + 1)}
                                    disabled={currentPage === totalPages}
                                >
                                    Next
                                </button>

                                <select
                                    value={rowsPerPage}
                                    onChange={e => {
                                        setRowsPerPage(Number(e.target.value));
                                        setCurrentPage(1);
                                    }}
                                    className="form-select form-select-sm vs-rows-per-page-select"
                                    style={{ display: 'inline-block', width: 'auto', marginLeft: '1rem' }}
                                >
                                    {[5, 10, 20, 50].map(size => (
                                        <option key={size} value={size}>
                                            {size} / page
                                        </option>
                                    ))}
                                </select>
                            </div>

                        </div>
                    </main>
                </div>
            </div>
        </Layout>
    );
}

export default Viewstudents;
