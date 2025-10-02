import React, { useEffect, useState, useMemo } from 'react'
import { Table, Dropdown, Spinner } from 'react-bootstrap';
import Usermenu from '../../components/layout/Usermenu'
import Layout from '../../components/layout/Layout'
import { BASEURL } from '../../service/baseUrl';
import axios from 'axios';
import { useAuth } from '../../context/auth';
import '../../css/dutylist.css'
function DutyList() {
    const [students, setStudents] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    const [searchTerm, setSearchTerm] = useState("");
    const [sortKey, setSortKey] = useState("name");
    const [sortOrder, setSortOrder] = useState("asc");

    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 10;
    const [auth] = useAuth();

    useEffect(() => {
        const fetchAssigned = async () => {
            try {
                if (!auth || !auth.token) {
                    setError("Not authenticated");
                    setLoading(false);
                    return;
                }
                const resp = await axios.get(`${BASEURL}/assigned-contact-details`);
                if (resp.data && resp.data.success) {
                    setStudents(resp.data.students);
                } else {
                    setError(resp.data.message || "Failed to fetch assigned students");
                }
            } catch (err) {
                console.error("Error fetching assigned students:", err);
                setError("Server or network error");
            } finally {
                setLoading(false);
            }
        };

        fetchAssigned(); // Initial fetch

        const intervalId = setInterval(fetchAssigned, 1000); // Poll every 1 second

        return () => clearInterval(intervalId); // Cleanup on component unmount
    }, [auth]);


    // Filtering (search)
    const normalized = searchTerm.trim().toLowerCase();
    const filtered = useMemo(() => {
        return students.filter(s => {
            if (!normalized) return true;
            return (
                s.name.toLowerCase().includes(normalized) ||
                s.email.toLowerCase().includes(normalized) ||
                (s.phone && String(s.phone).toLowerCase().includes(normalized)) ||
                s.course.toLowerCase().includes(normalized) ||
                s.place.toLowerCase().includes(normalized)
            );
        });
    }, [students, normalized]);

    // Sorting
    const sorted = useMemo(() => {
        return [...filtered].sort((a, b) => {
            let cmp = 0;
            const aVal = (a[sortKey] || "").toString().toLowerCase();
            const bVal = (b[sortKey] || "").toString().toLowerCase();
            cmp = aVal.localeCompare(bVal, undefined, { sensitivity: 'base' });
            return sortOrder === 'asc' ? cmp : -cmp;
        });
    }, [filtered, sortKey, sortOrder]);

    const currentItems = useMemo(() => {
        const startIndex = (currentPage - 1) * itemsPerPage;
        const endIndex = startIndex + itemsPerPage;
        return sorted.slice(startIndex, endIndex);
    }, [sorted, currentPage]);

    const handlePageChange = (pageNumber) => {
        setCurrentPage(pageNumber);
    };
    if (loading) return <div className="loading-container">
        <Spinner animation="border" variant="primary" />
        <div>Loading assigned students…</div>
    </div>
    if (error) return <div className="loading-container">
        <div className="error-message">{error}</div>
    </div>

    return (
        <Layout title={"CRM- User's Duty List"}>

            <div className="container-fluid m-3 p-3 admin-root">
                <div className="row">
                    <aside className="col-md-3">
                        <Usermenu />
                    </aside>

                    <main className="col-md-9">
                        <div className="card admin-card p-4">
                            <div className="container mt-4">
                                {/* Search + sort controls */}
                                <div className="d-flex flex-wrap align-items-center mb-3 gap-2">
                                    <div className="flex-grow-1" style={{ minWidth: '200px' }}>
                                        <input
                                            type="text"
                                            className="form-control"
                                            placeholder="Search students..."
                                            value={searchTerm}
                                            onChange={e => {
                                                setSearchTerm(e.target.value);
                                            }}
                                        />
                                    </div>
                                    <div className="d-flex gap-2">
                                        <Dropdown>
                                            <Dropdown.Toggle variant="outline-secondary" id="dropdown-sort-column">
                                                Sort by: {sortKey.charAt(0).toUpperCase() + sortKey.slice(1)}
                                            </Dropdown.Toggle>
                                            <Dropdown.Menu>
                                                {['name', 'email', 'phone', 'course', 'place'].map(col => (
                                                    <Dropdown.Item key={col} onClick={() => {
                                                        if (sortKey === col) {
                                                            setSortOrder(prev => (prev === "asc" ? "desc" : "asc"));
                                                        } else {
                                                            setSortKey(col);
                                                            setSortOrder("asc");
                                                        }
                                                    }}>
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
                                </div>

                                {/* Table */}
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
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {sorted.map((s, idx) => (
                                                    <tr key={s._id || idx}>
                                                        <td>{idx + 1}</td>
                                                        <td>{s.name}</td>
                                                        <td>{s.email}</td>
                                                        <td>{s.phone}</td>
                                                        <td>{s.course}</td>
                                                        <td>{s.place}</td>
                                                        <td>{s.assignedAt ? new Date(s.assignedAt).toLocaleString('en-IN', {
                                                            day: '2-digit',
                                                            month: 'short',
                                                            year: 'numeric',
                                                            hour: '2-digit',
                                                            minute: '2-digit',
                                                            second: '2-digit',
                                                            hour12: true,
                                                        }) : "-"}</td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </Table>
                                    </div>
                                )}
                            </div>
                        </div>
                    </main>
                </div>
            </div>

        </Layout>
    )
}

export default DutyList