import React, { useEffect, useMemo, useState } from 'react';
import axios from 'axios';
import Layout from '../../components/layout/Layout';
import Adminmenu from '../../components/layout/Adminmenu';
import { BASEURL } from '../../service/baseUrl';
import { jsPDF } from 'jspdf';
import { autoTable } from 'jspdf-autotable';
import { FaFilePdf } from 'react-icons/fa';
import { Button } from 'react-bootstrap';

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
    const [bsummary, setSummary] = useState({});
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
                setStudents(res.data.students || []);
                setSummary(res.data.summary || {});
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
        let countYes = 0, countNo = 0, countInformLater = 0;
        const planCounts = { starter: 0, gold: 0, master: 0 };
        let missedCalls = 0, rejectedCalls = 0, acceptedCalls = 0;

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

            if (ci.interested === true) {
                countYes += 1;
            } else if (ci.interested === false) {
                countNo += 1;
            } else {
                countInformLater += 1;
            }

            if (ci.planType) {
                const pt = ci.planType.toLowerCase();
                if (pt.includes('starter')) planCounts.starter += 1;
                else if (pt.includes('gold')) planCounts.gold += 1;
                else if (pt.includes('master')) planCounts.master += 1;
            }

            const status = ci.callStatus?.toLowerCase();
            if (status === 'missed') missedCalls += 1;
            else if (status === 'rejected') rejectedCalls += 1;
            else if (status === 'accepted' || status === 'answered') acceptedCalls += 1;
        });

        const totalInterest = countYes + countNo + countInformLater;
        const missingInterest = countNo + countInformLater;
        const totalSeconds = Math.round(totalCallDuration * 60);
        return {
            totalContacts,
            completed,
            pending,
            totalCallDuration,
            totalSeconds,
            planCounts,
            missedCalls,
            rejectedCalls,
            acceptedCalls,

            countYes,
            countNo,
            countInformLater,

            totalInterest,
            missingInterest
        };
    }, [students]);

    const processedStudents = useMemo(() => {
        const formatForSearch = (dateStrOrVal) => {
            if (!dateStrOrVal) return '';
            const d = new Date(dateStrOrVal);
            if (isNaN(d)) return '';

            // create consistent locale string, then transform to "10-Oct-2025 10.30.47 pm"
            let s = d.toLocaleString('en-GB', {
                day: '2-digit',
                month: 'short',     // "Oct"
                year: 'numeric',
                hour: 'numeric',
                minute: '2-digit',
                second: '2-digit',
                hour12: true
            }); // e.g. "10 Oct 2025, 10:30:47 PM" or "10 Oct 2025, 10:30:47 pm"

            // normalize: remove comma, replace ":" with ".", ensure am/pm lowercase
            s = s.replace(',', '').trim();
            // replace all colons with dots (use replaceAll if present, otherwise regex)
            s = typeof s.replaceAll === 'function' ? s.replaceAll(':', '.') : s.replace(/:/g, '.');
            s = s.toLowerCase(); // make 'pm' lowercase for matching: "10 oct 2025 10.30.47 pm"

            // remove extra spaces that might appear between tokens and collapse them
            return s.replace(/\s+/g, ' ');
        };
        let filtered = [...students];
        if (searchTerm) {
            const term = searchTerm.toLowerCase();
            filtered = filtered.filter(s => {
                const ci = s.callInfo || {};

                const assignedAtFormatted = formatForSearch(s.assignedAt);
                const completedAtFormatted = formatForSearch(ci.completedAt);

                return (
                    s.name?.toLowerCase().includes(term) ||
                    s.email?.toLowerCase().includes(term) ||
                    s.course?.toLowerCase().includes(term) ||
                    s.place?.toLowerCase().includes(term) ||
                    (ci.callStatus?.toLowerCase().includes(term) ?? false) ||
                    (ci.planType?.toLowerCase().includes(term) ?? false) ||
                    assignedAtFormatted.includes(term) ||
                    completedAtFormatted.includes(term)
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
            const course = s.course?.toLowerCase().trim();

            // Normalize course names
            if (course === 'btech' || course === 'btech') {
                map['BTech'] = (map['BTech'] || 0) + 1;
            } else if (course === 'plus one' || course === 'plus one') {
                map['Plus One'] = (map['Plus One'] || 0) + 1;
            } else if (course === 'plus two' || course === 'plus two') {
                map['Plus Two'] = (map['Plus Two'] || 0) + 1;
            } else {
                map[course] = (map[course] || 0) + 1;
            }
        });

        return map;
    }, [students]);
    // inside Workreport component (after processedStudents)
    const formatDisplayDate = (dateVal) => {
        if (!dateVal) return '';
        const d = new Date(dateVal);
        if (isNaN(d)) return '';

        // Format to same style as table but replace ":" with "." and lowercase AM/PM
        let s = d.toLocaleString('en-GB', {
            day: '2-digit',
            month: 'short',
            year: 'numeric',
            hour: 'numeric',
            minute: '2-digit',
            second: '2-digit',
            hour12: true
        }); // e.g. "10 Oct 2025, 10:30:47 PM"

        s = s.replace(',', '').trim();
        s = typeof s.replaceAll === 'function' ? s.replaceAll(':', '.') : s.replace(/:/g, '.');
        s = s.toLowerCase();
        return s.replace(/\s+/g, ' ');
    };
    const formatFilenameDate = (date) => {
        const d = new Date(date);
        const day = String(d.getDate()).padStart(2, '0');
        const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
        const mon = monthNames[d.getMonth()];
        const year = d.getFullYear();
        return `${day}-${mon}-${year}`;
    };
    const formatDateForComparison = (dateStr) => {
        if (!dateStr) return null;
        const d = new Date(dateStr);
        if (!isNaN(d)) {
            // Format: "YYYY-MM-DD"
            return `${d.getFullYear()}-${d.getMonth() + 1}-${d.getDate()}`;
        }
        return null;
    }
    const hasSameDateRows = useMemo(() => {
        return students.some(s => {
            const ci = s.callInfo || {};
            if (!s.assignedAt || !ci.completedAt) return false;
            const assignedAt = new Date(s.assignedAt);
            const completedAt = new Date(ci.completedAt);
            return assignedAt.toDateString() === completedAt.toDateString();
        });
    }, [students]);
    const sameDateCount = useMemo(() => {
        return students.reduce((count, s) => {
            const ci = s.callInfo || {};
            if (s.assignedAt && ci.completedAt) {
                const a = new Date(s.assignedAt);
                const c = new Date(ci.completedAt);
                if (a.toDateString() === c.toDateString()) {
                    return count + 1;
                }
            }
            return count;
        }, 0);
    }, [students]);

  const exportToPDF = () => {
  try {
    const doc = new jsPDF({
      orientation: 'landscape',
      unit: 'pt',
      format: 'a4'
    });

    const now = new Date();
    const username = processedStudents.rows[0]?.assignedTo?.username || 'All';
    const userEmail = processedStudents.rows[0]?.assignedTo?.email || '-';

    const datePart = formatFilenameDate(now);
    const filename = `Work-report-${username.replace(/\s+/g, '-').toLowerCase()}-${datePart}.pdf`;
    const title = `Work Report - ${username}`;

    // Title
    doc.setFontSize(16);
    doc.text(title, doc.internal.pageSize.getWidth() / 2, 28, { align: 'center' });

    // Summary lines
    doc.setFontSize(11);
    let y = 55;

    const line1 = `Current Assignee: ${username}  |  Assignee Email: ${userEmail}`;
    doc.text(line1, 40, y);

    y += 16;
    const line2 = `Total Contacts: ${summary.totalContacts || 0}  |  Completed: ${summary.completed || 0}  |  Pending: ${summary.pending || 0}`;
    doc.text(line2, 40, y);

    y += 16;
    // Format total call duration
    const sec = summary.totalSeconds || 0;
    const m = Math.floor(sec / 60);
    const s = sec % 60;
    const durStr = (m > 0 ? `${m} min ` : '') + `${s} sec`;

    const line3 = `Total Call Duration: ${durStr}  |  Total Interest: ${summary.totalInterest || 0}  |  Missing Interest: ${summary.missingInterest || 0}`;
    doc.text(line3, 40, y);

    y += 16;
    const line4 = `Missed Calls: ${summary.missedCalls || 0}  |  Rejected Calls: ${summary.rejectedCalls || 0}  |  Accepted Calls: ${summary.acceptedCalls || 0}`;
    doc.text(line4, 40, y);

    y += 16;
    const line5 = `Starter Plan: ${summary.planCounts?.starter || 0}  |  Gold Plan: ${summary.planCounts?.gold || 0}  |  Master Plan: ${summary.planCounts?.master || 0}`;
    doc.text(line5, 40, y);

    y += 16;
    doc.setFontSize(11);
    doc.text(`Same Date Count: ${sameDateCount}`, 40, y);

    // Add Yes/No/Inform Later counts
    y += 20;
    doc.text(`Yes: ${summary.countYes || 0}  |  No: ${summary.countNo || 0}  |  Inform Later: ${summary.countInformLater || 0}`, 40, y);

    // Course-wise summary
    y += 20;
    doc.setFontSize(11);
    doc.text('Course-wise Counts:', 40, y);
    y += 14;
    Object.entries(courseCounts).forEach(([course, cnt]) => {
      doc.text(`${course}: ${cnt}`, 60, y);
      y += 14;
    });

    // Table header
    const head = [[
      '#',
      'Name',
      'Email',
      'Phone',
      'Course',
      'Place',
      'Call Status',
      'Call Duration',
      'Interested',
      'Plan Type',
      'Assigned At',
      'Completed At',
      'Same Date?'
    ]];

    // Table body
    const body = processedStudents.rows.map((s, index) => {
      const ci = s.callInfo || {};
      let sameDateTick = '';
      if (s.assignedAt && ci.completedAt) {
        const a = new Date(s.assignedAt);
        const c = new Date(ci.completedAt);
        if (a.toDateString() === c.toDateString()) {
          sameDateTick = '✔';
        }
      }

      // Format each row’s call duration into “min sec”
      let rowDurStr = '-';
      if (ci.callDuration != null && !isNaN(ci.callDuration)) {
        const rowSec = Math.round(ci.callDuration * 60);
        const rm = Math.floor(rowSec / 60);
        const rs = rowSec % 60;
        rowDurStr = (rm > 0 ? `${rm} min ` : '') + `${rs} sec`;
      }

      return [
        index + 1,
        s.name || '',
        s.email || '',
        s.phone || '',
        s.course || '',
        s.place || '',
        ci.callStatus ?? '-',
        rowDurStr,
        ci.interested != null ? (ci.interested ? 'Yes' : 'No') : 'Inform Later',
        ci.planType ?? '-',
        formatDisplayDate(s.assignedAt),
        formatDisplayDate(ci.completedAt),
        sameDateTick
      ];
    });

    // Render table
    autoTable(doc, {
      head,
      body,
      startY: y + 10,
      styles: { fontSize: 9, cellPadding: 4, overflow: 'linebreak' },
      headStyles: { fillColor: [41, 128, 185] },
      columnStyles: {
        0: { cellWidth: 25 },
        1: { cellWidth: 100 },
        2: { cellWidth: 130 },
        3: { cellWidth: 80 },
        10: { cellWidth: 90 },
        11: { cellWidth: 90 }
      },
      margin: { top: 36, left: 20, right: 20, bottom: 30 },
      didDrawPage: function () {
        const pageCount = doc.internal.getNumberOfPages();
        const pageHeight = doc.internal.pageSize.height;
        const footerText = `Page ${doc.internal.getCurrentPageInfo().pageNumber} / ${pageCount}`;
        doc.setFontSize(9);
        doc.text(footerText, doc.internal.pageSize.getWidth() - 40, pageHeight - 10, { align: 'right' });
      }
    });

    doc.save(filename);
  } catch (err) {
    console.error('Error exporting PDF:', err);
  }
};


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
                                                {[
                                                    { label: 'Current Assignee', value: students[0]?.assignedTo?.username || '-' },
                                                    { label: 'Assignee Email', value: students[0]?.assignedTo?.email || '-' },
                                                    { label: "Total Contacts", value: summary.totalContacts },
                                                    { label: "Completed", value: summary.completed },
                                                    { label: "Pending", value: summary.pending },
                                                    { label: "Total Call Duration (min)", value: summary.totalCallDuration },
                                                    {
                                                        label: "Total Call Duration (sec)",
                                                        value: (() => {
                                                            const sec = summary.totalSeconds || 0;
                                                            const m = Math.floor(sec / 60);
                                                            const s = sec % 60;
                                                            return (m > 0 ? `${m} min ` : '') + `${s} sec`;
                                                        })()
                                                    },
                                                    { label: "Total Interest", value: summary.totalInterest },
                                                    { label: "Missing Interest", value: summary.missingInterest },
                                                    { label: "Yes", value: summary.countYes },
                                                    { label: "No", value: summary.countNo },
                                                    { label: "Inform Later", value: summary.countInformLater },
                                                    { label: "Missed Calls", value: summary.missedCalls },
                                                    { label: "Rejected Calls", value: summary.rejectedCalls },
                                                    { label: "Accepted Calls", value: summary.acceptedCalls },
                                                    { label: "Starter Plan", value: summary.planCounts.starter },
                                                    { label: "Gold Plan", value: summary.planCounts.gold },
                                                    { label: "Master Plan", value: summary.planCounts.master }
                                                ].map((item, idx, arr) => {
                                                    let sep;
                                                    if (idx === 1) {
                                                        // after "Assignee Email"
                                                        sep = <br />;
                                                    } else if ((idx - 2) % 3 === 2 && idx !== arr.length - 1) {
                                                        // apply line break after every 3 items *after* the first two
                                                        sep = <br />;
                                                    } else {
                                                        sep = ' | ';
                                                    }
                                                    return (
                                                        <span key={idx}>
                                                            <strong>{item.label}:</strong> {item.value}{sep}
                                                        </span>
                                                    );
                                                })}
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
                                            {hasSameDateRows && (
                                                <div className="text-success text-center mb-3" style={{ fontSize: '1rem', fontWeight: 'bold' }}>
                                                    ✔ Same Assigned and Completed Dates Found
                                                </div>
                                            )}
                                            {sameDateCount > 0 && (
                                                <div className="text-success text-center mb-2" style={{ fontSize: '1rem', fontWeight: 'bold' }}>
                                                    ✔ Same Date Count: {sameDateCount}
                                                </div>
                                            )}

                                            <table className="table custom-table table-hover align-middle">
                                                <thead className="table-header">
                                                    <tr>
                                                        <th>#</th>
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
                                                        {renderHeader('Same Date?', 'sameDateMatch')}
                                                    </tr>
                                                </thead>
                                                <tbody>
                                                    {currentRows.length === 0 ? (
                                                        <tr>
                                                            <td colSpan="13" className="no-data-cell">
                                                                No matches found.
                                                            </td>
                                                        </tr>
                                                    ) : (
                                                        currentRows.map((s, idx) => {
                                                            const ci = s.callInfo || {};
                                                            const assignedAt = s.assignedAt ? new Date(s.assignedAt) : null;
                                                            const completedAt = ci.completedAt ? new Date(ci.completedAt) : null;

                                                            // Compare only the date, ignoring time
                                                            const isSameDate =
                                                                assignedAt &&
                                                                completedAt &&
                                                                assignedAt.toDateString() === completedAt.toDateString();
                                                            const serialNo = (effectivePage - 1) * rowsPerPage + idx + 1;

                                                            return (
                                                                <tr
                                                                    key={s._id}
                                                                    className={s.callMarked === 'marked' ? 'marked-row' : ''}
                                                                >
                                                                    <td data-label="#">{serialNo}</td>
                                                                    <td data-label="Name">{s.name}</td>
                                                                    <td data-label="Email">{s.email}</td>
                                                                    <td data-label="Phone">{s.phone}</td>
                                                                    <td data-label="Course">{s.course}</td>
                                                                    <td data-label="Place">{s.place}</td>
                                                                    <td data-label="Call Status">{ci.callStatus ?? '-'}</td>
                                                                    <td data-label="Call Duration">
                                                                        {ci.callDuration != null && !isNaN(ci.callDuration) ? (() => {
                                                                            const totalSec = Math.round(ci.callDuration * 60);
                                                                            const m = Math.floor(totalSec / 60);
                                                                            const s = totalSec % 60;
                                                                            return (m > 0 ? `${m} min ` : '') + `${s} sec`;
                                                                        })() : '-'}
                                                                    </td>
                                                                    <td data-label="Interested">
                                                                        {ci.interested === true
                                                                            ? 'Yes'
                                                                            : ci.interested === false
                                                                                ? 'No'
                                                                                : 'Inform Later'}
                                                                    </td>
                                                                    <td data-label="Plan Type">{ci.planType ?? '-'}</td>
                                                                    <td
                                                                        data-label="Assigned At"
                                                                        className={isSameDate ? 'highlight-cell' : ''}
                                                                    >
                                                                        {assignedAt
                                                                            ? assignedAt.toLocaleString('en-GB', {
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
                                                                        {completedAt
                                                                            ? completedAt.toLocaleString('en-GB', {
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
                                                                    <td data-label="Same Date?">
                                                                        {(() => {
                                                                            const ci = s.callInfo || {};
                                                                            if (s.assignedAt && ci.completedAt) {
                                                                                const a = new Date(s.assignedAt);
                                                                                const c = new Date(ci.completedAt);
                                                                                if (a.toDateString() === c.toDateString()) {
                                                                                    return '✔';  // or use an icon component
                                                                                }
                                                                            }
                                                                            return '';
                                                                        })()}
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
                                <div className="me-2 mt-5">
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
                        </div>
                    </main>
                </div>
            </div>
        </Layout>
    );
}

export default Workreport;
