import React, { useEffect, useMemo, useState } from 'react';
import axios from 'axios';
import Layout from '../../components/layout/Layout';
import Adminmenu from '../../components/layout/Adminmenu';
import { BASEURL } from '../../service/baseUrl';

function Workreport() {
    const [users, setUsers] = useState([]);
    const [selectedUserId, setSelectedUserId] = useState('');
    const [students, setStudents] = useState([]);
    const [loadingUsers, setLoadingUsers] = useState(false);
    const [loadingStudents, setLoadingStudents] = useState(false);
    const [error, setError] = useState('');
    const [searchTerm, setSearchTerm] = useState('');
    const [sortConfig, setSortConfig] = useState({ key: null, direction: 'asc' });
    const [currentPage, setCurrentPage] = useState(1);
    const [rowsPerPage, setRowsPerPage] = useState(10);

    useEffect(() => {
        const fetchUsers = async () => {
            try {
                setLoadingUsers(true);
                const res = await axios.get(`${BASEURL}/admin/get-users`);
                setUsers(res.data);
            } catch (err) {
                console.error('Error fetching users:', err);
                setError('Failed to fetch users');
            } finally {
                setLoadingUsers(false);
            }
        };
        fetchUsers();
    }, []);

    useEffect(() => {
        const fetchStudents = async () => {
            if (!selectedUserId) {
                setStudents([]);
                return;
            }
            try {
                setLoadingStudents(true);
                const res = await axios.get(`${BASEURL}/admin/get-work-report`, {
                    params: { assignedTo: selectedUserId }
                });
                setStudents(res.data);
            } catch (err) {
                console.error('Error fetching assigned students:', err);
                setError('Failed to fetch students');
            } finally {
                setLoadingStudents(false);
            }
        };
        fetchStudents();
        // reset page when user changes
        setCurrentPage(1);
    }, [selectedUserId]);

    const handleUserSelect = (e) => {
        setSelectedUserId(e.target.value);
        setSearchTerm('');
        setSortConfig({ key: null, direction: 'asc' });
    };

    const duplicateUsernames = useMemo(() => {
        const countMap = {};
        users.forEach(u => {
            const name = u.username || '';
            countMap[name] = (countMap[name] || 0) + 1;
        });
        return new Set(
            Object.entries(countMap)
                .filter(([_, cnt]) => cnt > 1)
                .map(([name]) => name)
        );
    }, [users]);

    // Summary metrics (for the selected user’s students list)
    const summary = useMemo(() => {
        let totalContacts = 0;
        let completed = 0;
        let pending = 0;
        let totalCallDuration = 0;
        let totalInterest = 0;
        let missingInterest = 0;
        const planCounts = {
            starter: 0,
            gold: 0,
            master: 0
        };

        students.forEach(s => {
            totalContacts += 1;
            const ci = s.callInfo || {};

            if (ci.completedAt) {
                completed += 1;
            } else {
                pending += 1;
            }

            if (ci.callDuration != null && !isNaN(ci.callDuration)) {
                totalCallDuration += Number(ci.callDuration);
            }

            if (ci.interested != null) {
                totalInterest += Number(ci.interested);
            } else {
                missingInterest += 1;
            }

            if (ci.planType) {
                const pt = ci.planType.toLowerCase();
                if (pt.includes('starter')) planCounts.starter += 1;
                else if (pt.includes('gold')) planCounts.gold += 1;
                else if (pt.includes('master')) planCounts.master += 1;
            }
        });

        return {
            totalContacts,
            completed,
            pending,
            totalCallDuration,
            totalInterest,
            missingInterest,
            planCounts
        };
    }, [students]);

    const processedStudents = useMemo(() => {
        let filtered = [...students];
        if (searchTerm) {
            const term = searchTerm.toLowerCase();
            filtered = filtered.filter(s => {
                const ci = s.callInfo || {};
                return (
                    s.name?.toLowerCase().includes(term) ||
                    s.email?.toLowerCase().includes(term) ||
                    s.course?.toLowerCase().includes(term) ||
                    s.place?.toLowerCase().includes(term) ||
                    (ci.callStatus?.toLowerCase().includes(term) ?? false) ||
                    (ci.planType?.toLowerCase().includes(term) ?? false)
                );
            });
        }

        if (sortConfig.key) {
            filtered.sort((a, b) => {
                let aVal, bVal;
                const key = sortConfig.key;
                if (key.startsWith('callInfo.')) {
                    const innerKey = key.split('.')[1];
                    aVal = (a.callInfo && a.callInfo[innerKey]) ?? '';
                    bVal = (b.callInfo && b.callInfo[innerKey]) ?? '';
                } else {
                    aVal = a[key];
                    bVal = b[key];
                }

                if (aVal instanceof Date) aVal = aVal.getTime();
                if (bVal instanceof Date) bVal = bVal.getTime();

                if (typeof aVal === 'string') {
                    aVal = aVal.toLowerCase();
                    bVal = bVal.toLowerCase();
                }
                if (aVal < bVal) return sortConfig.direction === 'asc' ? -1 : 1;
                if (aVal > bVal) return sortConfig.direction === 'asc' ? 1 : -1;
                return 0;
            });
        }

        const totalCount = filtered.length;
        const totalPages = Math.ceil(totalCount / rowsPerPage) || 1;
        const clampedPage = Math.min(Math.max(currentPage, 1), totalPages);
        const startIndex = (clampedPage - 1) * rowsPerPage;
        const paged = filtered.slice(startIndex, startIndex + rowsPerPage);

        return {
            totalCount,
            totalPages,
            currentPage: clampedPage,
            rows: paged
        };
    }, [students, searchTerm, sortConfig, currentPage, rowsPerPage]);

    const { totalCount, totalPages, currentPage: effectivePage, rows: currentRows } = processedStudents;

    const requestSort = (key) => {
        let direction = 'asc';
        if (sortConfig.key === key && sortConfig.direction === 'asc') {
            direction = 'desc';
        }
        setSortConfig({ key, direction });
    };

    const goToPage = (page) => {
        if (page < 1 || page > totalPages) return;
        setCurrentPage(page);
    };

    const handleRowsPerPageChange = (e) => {
        const newRpp = Number(e.target.value);
        setRowsPerPage(newRpp);
        setCurrentPage(1);
    };

    const renderHeader = (label, key) => {
        const isActive = sortConfig.key === key;
        const arrow = isActive ? (sortConfig.direction === 'asc' ? ' ▲' : ' ▼') : '';
        return (
            <th
                onClick={() => requestSort(key)}
                className={isActive ? 'sorted-column' : ''}
                style={{ cursor: 'pointer' }}
            >
                {label}{arrow}
            </th>
        );
    };

    // Course-wise counts (for current selected user)
    const courseCounts = useMemo(() => {
        const map = {};
        students.forEach(s => {
            const c = s.course || 'Unknown';
            map[c] = (map[c] || 0) + 1;
        });
        return map;
    }, [students]);

    return (
        <Layout title={"CRM - Work Report"}>
            <div className="container-fluid m-3 p-3 admin-root">
                <div className="row">
                    <aside className="col-md-3">
                        <Adminmenu />
                    </aside>
                    <main className="col-md-9">
                        <div className="card admin-card p-4">
                            <div className="assigned-students-section">



                                <div className="search-wrapper mb-3">
                                    <input
                                        type="text"
                                        placeholder="Search..."
                                        className="form-control"
                                        value={searchTerm}
                                        onChange={(e) => {
                                            setSearchTerm(e.target.value);
                                            setCurrentPage(1);
                                        }}
                                    />
                                </div>

                                <div className="row mb-3">
                                    <div className="col-md-4 mb-2">
                                        <label htmlFor="userDropdown">Select User:</label>
                                        {error && <p className="error-text">{error}</p>}
                                        {loadingUsers ? (
                                            <span>Loading users...</span>
                                        ) : (
                                            <select
                                                id="userDropdown"
                                                className="form-select"
                                                value={selectedUserId}
                                                onChange={handleUserSelect}
                                            >
                                                <option value="">-- Select a user --</option>
                                                {users.map((u) => (
                                                    <option key={u._id} value={u._id}>
                                                        {duplicateUsernames.has(u.username)
                                                            ? `${u.username} (${u.email})`
                                                            : u.username}
                                                    </option>
                                                ))}
                                            </select>
                                        )}
                                    </div>
                                    <div className="col-md-4 mb-2">
                                        <label htmlFor="sortBy">Sort By:</label>
                                        <select
                                            id="sortBy"
                                            className="form-select"
                                            value={sortConfig.key || ''}
                                            onChange={(e) => requestSort(e.target.value)}
                                        >
                                            <option value="">Select</option>
                                            <option value="name">Name</option>
                                            <option value="email">Email</option>
                                            <option value="phone">Phone</option>
                                            <option value="course">Course</option>
                                            <option value="place">Place</option>
                                            <option value="callInfo.callStatus">Call Status</option>
                                            <option value="callInfo.callDuration">Call Duration</option>
                                            <option value="callInfo.interested">Interested</option>
                                            <option value="callInfo.planType">Plan Type</option>
                                            <option value="assignedAt">Assigned At</option>
                                            <option value="callInfo.completedAt">Completed At</option>
                                        </select>
                                    </div>
                                    <div className="col-md-4 mb-2">
                                        <label htmlFor="sortDirection">Direction:</label>
                                        <select
                                            id="sortDirection"
                                            className="form-select"
                                            value={sortConfig.direction}
                                            onChange={(e) => setSortConfig({ ...sortConfig, direction: e.target.value })}
                                        >
                                            <option value="asc">Ascending</option>
                                            <option value="desc">Descending</option>
                                        </select>
                                    </div>
                                </div>

                                <div className="table-container">
                                    {loadingStudents ? (
                                        <p>Loading students...</p>
                                    ) : (
                                        <div className="table-responsive custom-table-wrapper">
                                            {/* Summary line before the table */}
                                            <div className="summary-line mb-3">
                                                <strong>Total Contacts:</strong> {summary.totalContacts} |{' '}
                                                <strong>Completed:</strong> {summary.completed} |{' '}
                                                <strong>Pending:</strong> {summary.pending} |{' '}
                                                <strong>Total Call Duration:</strong> {summary.totalCallDuration} |{' '}
                                                <strong>Total Interest:</strong> {summary.totalInterest} |{' '}
                                                <strong>Missing Interest:</strong> {summary.missingInterest} |{' '}
                                                <strong>Starter Plan:</strong> {summary.planCounts.starter} |{' '}
                                                <strong>Gold Plan:</strong> {summary.planCounts.gold} |{' '}
                                                <strong>Master Plan:</strong> {summary.planCounts.master}
                                            </div>
                                            {/* Course-wise count summary below the table */}
                                            <div className="course-summary mt-4">
                                                <h6>Course-wise Counts:</h6>
                                                <ul>
                                                    {Object.entries(courseCounts).map(([course, cnt]) => (
                                                        <li key={course}>
                                                            <strong>{course}</strong>: {cnt}
                                                        </li>
                                                    ))}
                                                </ul>
                                            </div>

                                            <table className="table custom-table table-hover align-middle">
                                                <thead className="table-header">
                                                    <tr>
                                                        {renderHeader('Current Assignee', 'assignedTo.username')}
                                                        {renderHeader('Assignee Email', 'assignedTo.email')}
                                                        {renderHeader('Name', 'name')}
                                                        {renderHeader('Email', 'email')}
                                                        {renderHeader('Phone', 'phone')}
                                                        {renderHeader('Course', 'course')}
                                                        {renderHeader('Place', 'place')}
                                                        {renderHeader('Call Status', 'callInfo.callStatus')}
                                                        {renderHeader('Call Duration', 'callInfo.callDuration')}
                                                        {renderHeader('Interested', 'callInfo.interested')}
                                                        {renderHeader('Plan Type', 'callInfo.planType')}
                                                        {renderHeader('Assigned At', 'assignedAt')}
                                                        {renderHeader('Completed At', 'callInfo.completedAt')}
                                                    </tr>
                                                </thead>
                                                <tbody>
                                                    {currentRows.length === 0 ? (
                                                        <tr>
                                                            <td colSpan="13" className="no-data-cell">
                                                                No students assigned.
                                                            </td>
                                                        </tr>
                                                    ) : (
                                                        currentRows.map((s) => {
                                                            const ci = s.callInfo || {};
                                                            const assignedAt = s.assignedAt ? new Date(s.assignedAt) : null;
                                                            const completedAt = ci.completedAt ? new Date(ci.completedAt) : null;
                                                            const isSameDate =
                                                                assignedAt &&
                                                                completedAt &&
                                                                assignedAt.toDateString() === completedAt.toDateString();

                                                            return (
                                                                <tr
                                                                    key={s._id}
                                                                    className={s.callMarked === 'marked' ? 'marked-row' : ''}
                                                                >
                                                                    <td data-label="Current Assignee">{s.assignedTo?.username || ''}</td>
                                                                    <td data-label="Assignee Email">{s.assignedTo?.email || ''}</td>
                                                                    <td data-label="Name">{s.name}</td>
                                                                    <td data-label="Email">{s.email}</td>
                                                                    <td data-label="Phone">{s.phone}</td>
                                                                    <td data-label="Course">{s.course}</td>
                                                                    <td data-label="Place">{s.place}</td>
                                                                    <td data-label="Call Status">{ci.callStatus ?? ''}</td>
                                                                    <td data-label="Call Duration">{ci.callDuration ?? ''}</td>
                                                                    <td data-label="Interested">
                                                                        {ci.interested != null ? ci.interested.toString() : ''}
                                                                    </td>
                                                                    <td data-label="Plan Type">{ci.planType ?? ''}</td>
                                                                    <td
                                                                        data-label="Assigned At"
                                                                        className={isSameDate ? 'highlight-cell' : ''}
                                                                    >
                                                                        {s.assignedAt
                                                                            ? new Date(s.assignedAt).toLocaleString('en-GB', {
                                                                                day: '2-digit',
                                                                                month: 'short',
                                                                                year: 'numeric',
                                                                                hour: 'numeric',
                                                                                minute: '2-digit',
                                                                                second: '2-digit',
                                                                                hour12: true
                                                                            })
                                                                            : ''}
                                                                    </td>
                                                                    <td
                                                                        data-label="Completed At"
                                                                        className={isSameDate ? 'highlight-cell' : ''}
                                                                    >
                                                                        {ci.completedAt
                                                                            ? new Date(ci.completedAt).toLocaleString('en-GB', {
                                                                                day: '2-digit',
                                                                                month: 'short',
                                                                                year: 'numeric',
                                                                                hour: 'numeric',
                                                                                minute: '2-digit',
                                                                                second: '2-digit',
                                                                                hour12: true
                                                                            })
                                                                            : ''}
                                                                    </td>
                                                                </tr>
                                                            );
                                                        })
                                                    )}
                                                </tbody>
                                            </table>
                                        </div>
                                    )}
                                </div>

                                {/* Rows-per-page dropdown and count */}
                                <div className="rows-per-page-container mt-3">
                                    <label htmlFor="rppSelect" className="me-2">Rows per page:</label>
                                    <select
                                        id="rppSelect"
                                        className="form-select d-inline-block w-auto"
                                        value={rowsPerPage}
                                        onChange={handleRowsPerPageChange}
                                    >
                                        <option value={5}>5</option>
                                        <option value={10}>10</option>
                                        <option value={25}>25</option>
                                        <option value={50}>50</option>
                                        <option value={100}>100</option>
                                        <option value={students.length || 0}>All</option>
                                    </select>
                                    <span className="ms-3">
                                        {`Showing ${currentRows.length} of ${totalCount}`}
                                    </span>
                                </div>

                                {/* Pagination controls */}
                                {totalPages > 1 && (
                                    <div className="pagination-controls mt-3 d-flex justify-content-center align-items-center">
                                        <button
                                            className="btn btn-sm btn-outline-primary me-2"
                                            onClick={() => goToPage(effectivePage - 1)}
                                            disabled={effectivePage === 1}
                                        >
                                            Previous
                                        </button>
                                        <span className="mx-2">
                                            Page {effectivePage} of {totalPages}
                                        </span>
                                        <button
                                            className="btn btn-sm btn-outline-primary ms-2"
                                            onClick={() => goToPage(effectivePage + 1)}
                                            disabled={effectivePage === totalPages}
                                        >
                                            Next
                                        </button>
                                    </div>
                                )}


                            </div>
                        </div>
                    </main>
                </div>
            </div>
        </Layout>
    );
}

export default Workreport;
