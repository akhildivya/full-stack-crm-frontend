import React, { useEffect, useState } from 'react';
import Layout from '../../components/layout/Layout';
import Adminmenu from '../../components/layout/Adminmenu';
import axios from 'axios';
import { Table } from 'react-bootstrap';  // Assuming you're using react-bootstrap
import '../../css/viewstudents.css'

function Viewstudents() {
    const [students, setStudents] = useState([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

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
    }, []);

    const handleSearchChange = (e) => {
        setSearchTerm(e.target.value);
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

    if (loading) return <div className="loader-overlay">
        <div className="loader-box">
            <div className="spinner"></div>
            <p className="loader-text">Loading...</p>
        </div>
    </div>
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

                            <div className="vs-search-container">
                                <input
                                    type="text"
                                    placeholder="Search by name, email, phone, etc."
                                    value={searchTerm}
                                    onChange={handleSearchChange}
                                    className="vs-search-input"
                                />
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
                                        {filteredStudents.length > 0 ? (
                                            filteredStudents.map((student, index) => (
                                                <tr key={student._id || index}>
                                                    <td>{index + 1}</td>
                                                    <td>{student.name}</td>
                                                    <td>{student.email}</td>
                                                    <td>{student.phone}</td>
                                                    <td>{student.course}</td>
                                                    <td>{student.place}</td>
                                                    <td>
                                                        {/* Example action buttons */}
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
                        </div>
                    </main>
                </div>
            </div>
        </Layout>
    );
}

export default Viewstudents;
