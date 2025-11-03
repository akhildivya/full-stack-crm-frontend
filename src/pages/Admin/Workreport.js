import React, { useEffect, useMemo, useState } from 'react';
import axios from 'axios';
import Layout from '../../components/layout/Layout';
import Adminmenu from '../../components/layout/Adminmenu';
import { BASEURL } from '../../service/baseUrl';
import { jsPDF } from 'jspdf';
import { autoTable } from 'jspdf-autotable';
import { FaFilePdf } from 'react-icons/fa';
import { Button } from 'react-bootstrap';
import { toast } from 'react-toastify';
import { Dropdown, ButtonGroup } from 'react-bootstrap';
import { Accordion } from 'react-bootstrap';
import { useAuth } from '../../context/auth';
import { FaCheckCircle } from 'react-icons/fa';
function Workreport() {
    const [auth] = useAuth();
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
    const [selectedIds, setSelectedIds] = useState([]);

    const [isExpanded, setIsExpanded] = useState(false);
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
        let intervalId;
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
        intervalId = setInterval(() => {
            fetchStudents();
        }, 30000);
        // reset page when user changes
        setCurrentPage(1);
        return () => {
            // cleanup the interval when component unmounts or selectedUserId changes
            clearInterval(intervalId);
        };
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
    let missingInterest = 0;
    const planCounts = { starter: 0, gold: 0, master: 0 };
    let missedCalls = 0, rejectedCalls = 0, acceptedCalls = 0, switchedOffCalls = 0;

    // ✅ NEW: to accumulate timer durations (from callSessionDurationSeconds)
    let totalTimerDurationSeconds = 0;

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

        if (ci.interested === 'Yes') {
            countYes += 1;
        } else if (ci.interested === 'No') {
            countNo += 1;
        } else if (ci.interested === 'Inform Later') {
            countInformLater += 1;
        } else {
            missingInterest += 1;
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
        else if (status === 'switched off') {
            switchedOffCalls += 1;
        }

        // ✅ NEW: accumulate total callSession timer duration from backend-injected field
        if (s.callSessionDurationSeconds && !isNaN(s.callSessionDurationSeconds)) {
            totalTimerDurationSeconds += Number(s.callSessionDurationSeconds);
        }
    });

    const totalInterest = countYes + countNo + countInformLater;
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
        switchedOffCalls,
        countYes,
        countNo,
        countInformLater,
        totalInterest,
        missingInterest,

        // ✅ NEW: include total timer duration seconds
        totalTimerDurationSeconds
    };
}, [students]);

    

    const processedStudents = useMemo(() => {
        const formatForSearch = (dateStrOrVal) => {
            if (!dateStrOrVal) return '';
            const d = new Date(dateStrOrVal);
            if (isNaN(d)) return '';

            
            let s = d.toLocaleString('en-GB', {
                day: '2-digit',
                month: 'short',     // "Oct"
                year: 'numeric',
                hour: 'numeric',
                minute: '2-digit',
                second: '2-digit',
                hour12: true
            }); 
            s = s.replace(',', '').trim();
           
            s = typeof s.replaceAll === 'function' ? s.replaceAll(':', '.') : s.replace(/:/g, '.');
            s = s.toLowerCase(); 

            
            return s.replace(/\s+/g, ' ');
        };
        let filtered = [...students];
        if (searchTerm) {
            const term = searchTerm.toLowerCase();
            filtered = filtered.filter(s => {
                const ci = s.callInfo || {};

                const assignedAtFormatted = formatForSearch(s.assignedAt);
                const completedAtFormatted = formatForSearch(ci.completedAt);
                const interestedText = ci.interested?.toLowerCase() || '';

                return (
                    s.name?.toLowerCase().includes(term) ||
                    s.email?.toLowerCase().includes(term) ||
                    s.course?.toLowerCase().includes(term) ||
                    s.place?.toLowerCase().includes(term) ||
                    (ci.callStatus?.toLowerCase().includes(term) ?? false) ||
                    (ci.planType?.toLowerCase().includes(term) ?? false) ||
                    interestedText.includes(term) ||
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
                    if (innerKey === 'interested') {
                        const map = { 'yes': 1, 'no': 2, 'inform later': 3, null: 4, '': 4 };
                        aVal = aVal?.toLowerCase() || '';
                        bVal = bVal?.toLowerCase() || '';
                        return (map[aVal] - map[bVal]) * (sortConfig.direction === 'asc' ? -1 : 1);
                    }
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
            const sec = summary.totalSeconds || 0;
            const m = Math.floor(sec / 60);
            const s = sec % 60;
            const durStr = (m > 0 ? `${m} min ` : '') + `${s} sec`;

            const line3 = `Total Call Duration: ${durStr}  |  Total Interest: ${summary.totalInterest || 0}  |  Missing Interest: ${summary.missingInterest || 0}`;
            doc.text(line3, 40, y);

            y += 16;
            const line4 = `Missed Calls: ${summary.missedCalls || 0}  |  Rejected Calls: ${summary.rejectedCalls || 0}  |  Accepted Calls: ${summary.acceptedCalls || 0} | Switched Off Calls: ${summary.switchedOffCalls || 0}`;
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
            const head = [
                [
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
                ]
            ];

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
                    ci.interested != null ? (ci.interested === 'Yes' ? 'Yes' : ci.interested === 'No' ? 'No' : ci.interested === 'Inform Later' ? 'Inform Later' : '---') : '---',
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

    const handleSelectStudent = (id) => {
        setSelectedIds((prev) =>
            prev.includes(id) ? prev.filter((sid) => sid !== id) : [...prev, id]
        );
    };

    const handleSelectAll = () => {
        if (selectedIds.length === currentRows.length) {
            setSelectedIds([]);
        } else {
            setSelectedIds(currentRows.map((s) => s._id));
        }
    };
    const handleDeleteStudent = async (id) => {
        // show a toast with confirm/cancel
        const toastId = toast.warn(
            <div>
                <p>Delete this student?</p>
                <div style={{ marginTop: '8px', display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
                    <button
                        onClick={async () => {
                            toast.dismiss(toastId);

                            try {
                                await axios.delete(`${BASEURL}/admin/delete-student/${id}`);
                                setStudents((prev) => prev.filter((s) => s._id !== id));
                                toast.success("Student deleted successfully", {
                                    position: "top-center",
                                    autoClose: 5000,
                                    hideProgressBar: false,
                                    closeOnClick: false,
                                    pauseOnHover: true,
                                    draggable: true,
                                    progress: undefined,
                                    theme: "light",
                                });
                            } catch (err) {
                                console.error(err);
                                toast.error("Failed to delete student", {
                                    position: "top-center",
                                    autoClose: 5000,
                                    hideProgressBar: false,
                                    closeOnClick: false,
                                    pauseOnHover: true,
                                    draggable: true,
                                    progress: undefined,
                                    theme: "light",
                                });
                            }
                        }}
                        style={{ background: '#d9534f', color: '#fff', border: 'none', padding: '4px 8px', borderRadius: '4px' }}
                    >
                        Confirm
                    </button>

                    <button
                        onClick={() => {
                            toast.dismiss(toastId);
                            // optionally show cancellation message
                            toast.info("Deletion cancelled");
                        }}
                        style={{ background: '#6c757d', color: '#fff', border: 'none', padding: '4px 8px', borderRadius: '4px' }}
                    >
                        Cancel
                    </button>
                </div>
            </div>,
            {
                autoClose: false,
                closeOnClick: false,
                draggable: false,
                position: 'top-center',
            }
        );
    };
    const handleBulkDelete = async () => {
        if (selectedIds.length === 0) {
            toast.info('No students selected for deletion.', {
                position: "top-center",
                autoClose: 3000,
                hideProgressBar: false,
                closeOnClick: true,
                pauseOnHover: true,
                draggable: true,
                theme: "light",
            });
            return;
        }

        // Show custom confirmation toast
        const toastId = toast.warn(
            <div>
                <p>Delete {selectedIds.length} selected students?</p>
                <div style={{ marginTop: '8px', display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
                    <button
                        onClick={async () => {
                            toast.dismiss(toastId);
                            try {
                                await axios.delete(`${BASEURL}/admin/bulk-delete-students`, {
                                    data: { ids: selectedIds },
                                });
                                setStudents((prev) => prev.filter((s) => !selectedIds.includes(s._id)));
                                setSelectedIds([]);
                                toast.success(`${selectedIds.length} students deleted successfully`, {
                                    position: "top-center",
                                    autoClose: 5000,
                                    hideProgressBar: false,
                                    closeOnClick: false,
                                    pauseOnHover: true,
                                    draggable: true,
                                    theme: "light",
                                });
                            } catch (err) {
                                console.error(err);
                                toast.error('Failed to bulk delete students', {
                                    position: "top-center",
                                    autoClose: 5000,
                                    hideProgressBar: false,
                                    closeOnClick: false,
                                    pauseOnHover: true,
                                    draggable: true,
                                    theme: "light",
                                });
                            }
                        }}
                        style={{ background: '#d9534f', color: '#fff', border: 'none', padding: '4px 8px', borderRadius: '4px' }}
                    >
                        Confirm
                    </button>

                    <button
                        onClick={() => {
                            toast.dismiss(toastId);
                            toast.info("Bulk deletion cancelled", {
                                position: "top-center",
                                autoClose: 3000,
                                hideProgressBar: false,
                                closeOnClick: true,
                                pauseOnHover: true,
                                draggable: true,
                                theme: "light",
                            });
                        }}
                        style={{ background: '#6c757d', color: '#fff', border: 'none', padding: '4px 8px', borderRadius: '4px' }}
                    >
                        Cancel
                    </button>
                </div>
            </div>,
            {
                autoClose: false,
                closeOnClick: false,
                draggable: false,
                position: 'top-center',
            }
        );
    };

    const handleBulkAdmission = async () => {
        // get selectedIds, ask confirm, then send to backend: move to “admission” table
        try {
            await axios.post(`${BASEURL}/admin/move-to-admission`, { ids: selectedIds });
            // remove those students from current table state
            setStudents(prev => prev.filter(s => !selectedIds.includes(s._id)));
            toast.success("Moved to Admission successfully", {
                position: "top-center",
                autoClose: 5000,
                hideProgressBar: false,
                closeOnClick: false,
                pauseOnHover: true,
                draggable: true,
                progress: undefined,
                theme: "light",

            });
            // clear selectedIds, refresh summary if needed
            setSelectedIds([]);
        } catch (err) {
            toast.error("Failed to move to Admission", {
                position: "top-center",
                autoClose: 5000,
                hideProgressBar: false,
                closeOnClick: false,
                pauseOnHover: true,
                draggable: true,
                progress: undefined,
                theme: "light",

            });
        }
    };

    const handleBulkContactLater = async () => {
        try {
            await axios.post(`${BASEURL}/admin/move-to-contact-later`, { ids: selectedIds });
            setStudents(prev => prev.filter(s => !selectedIds.includes(s._id)));
            toast.success("Moved to Contact Later successfully", {
                position: "top-center",
                autoClose: 5000,
                hideProgressBar: false,
                closeOnClick: false,
                pauseOnHover: true,
                draggable: true,
                progress: undefined,
                theme: "light",

            });
            setSelectedIds([]);
        } catch (err) {
            toast.error("Failed to move to Contact Later",);
        }
    };
    const handleBulkVerify = async () => {
        if (selectedIds.length === 0) return;
        try {
            const resp = await axios.put(
                `${BASEURL}/admin/students-call/bulk-verify`,
                { ids: selectedIds },
                { headers: { Authorization: auth.token } }
            );
            if (resp.data.success) {
                toast.success(resp.data.message, { position: 'top-center' });

                // Update local state: set verified flag for students
                setStudents(prev =>
                    prev.map(s =>
                        selectedIds.includes(s._id)
                            ? { ...s, callInfo: { ...s.callInfo, verified: true } }
                            : s
                    )
                );
                setSelectedIds([]);
            } else {
                toast.error(resp.data.message || 'Bulk verify failed', { position: 'top-center' });
            }
        } catch (err) {
            console.error('Error bulk verifying:', err);
            toast.error('Server or network error', { position: 'top-center' });
        }
    };
    const handleSingleVerify = async (studentId) => {
        try {
            const resp = await axios.put(
                `${BASEURL}/admin/students-call/${studentId}/verify`,
                {},
                { headers: { Authorization: auth.token } }
            );
            if (resp.data.success) {
                toast.success(resp.data.message, { position: 'top-center' });
                // update state
                setStudents(prev =>
                    prev.map(s =>
                        s._id === studentId
                            ? { ...s, callInfo: { ...s.callInfo, verified: true } }
                            : s
                    )
                );
            } else {
                toast.error(resp.data.message || 'Verify failed', { position: 'top-center' });
            }
        } catch (err) {
            console.error('Error verifying:', err);
            toast.error('Server or network error', { position: 'top-center' });
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

                                {/* Controls row (search + select user + sort by + sort order) */}
                                <div className="row g-3 align-items-center mb-3 flex-wrap">
                                    {/* Search Input */}
                                    <div className="col-12 col-md-3">
                                        <div className="search-wrapper">
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
                                    </div>

                                    {/* Select User Dropdown */}
                                    <div className="col-12 col-md-3">
                                        {error && <p className="error-text">{error}</p>}
                                        {loadingUsers ? (
                                            <span>Loading users...</span>
                                        ) : (
                                            <Dropdown id="userDropdown" className="w-100">
                                                <Dropdown.Toggle variant="outline-secondary" className="w-100">
                                                    {users.find(u => u._id === selectedUserId)?.username || "-- Select a user --"}
                                                </Dropdown.Toggle>
                                                <Dropdown.Menu className="w-100">
                                                    {users.map((u) => (
                                                        <Dropdown.Item
                                                            key={u._id}
                                                            onClick={() => handleUserSelect({ target: { value: u._id } })}
                                                            active={u._id === selectedUserId}
                                                        >
                                                            {duplicateUsernames.has(u.username)
                                                                ? `${u.username} (${u.email})`
                                                                : u.username}
                                                        </Dropdown.Item>
                                                    ))}
                                                </Dropdown.Menu>
                                            </Dropdown>
                                        )}
                                    </div>

                                    {/* Sort By Dropdown */}
                                    <div className="col-12 col-md-3">
                                        <Dropdown className="w-100">
                                            <Dropdown.Toggle variant="outline-secondary" id="dropdown-sort-column" className="w-100">
                                                Sort by: {
                                                    [
                                                        { label: "Name", value: "name" },
                                                        { label: "Email", value: "email" },
                                                        { label: "Phone", value: "phone" },
                                                        { label: "Course", value: "course" },
                                                        { label: "Place", value: "place" },
                                                        { label: "Call Status", value: "callInfo.callStatus" },
                                                        { label: "Call Duration", value: "callInfo.callDuration" },
                                                        { label: "Interested", value: "callInfo.interested" },
                                                        { label: "Plan Type", value: "callInfo.planType" },
                                                        { label: "Assigned At", value: "assignedAt" },
                                                        { label: "Completed At", value: "callInfo.completedAt" }
                                                    ].find(item => item.value === sortConfig.key)?.label || "Select"
                                                }
                                            </Dropdown.Toggle>
                                            <Dropdown.Menu className="w-100">
                                                {[
                                                    { label: "Name", value: "name" },
                                                    { label: "Email", value: "email" },
                                                    { label: "Phone", value: "phone" },
                                                    { label: "Course", value: "course" },
                                                    { label: "Place", value: "place" },
                                                    { label: "Call Status", value: "callInfo.callStatus" },
                                                    { label: "Call Duration", value: "callInfo.callDuration" },
                                                    { label: "Interested", value: "callInfo.interested" },
                                                    { label: "Plan Type", value: "callInfo.planType" },
                                                    { label: "Assigned At", value: "assignedAt" },
                                                    { label: "Completed At", value: "callInfo.completedAt" }
                                                ].map(({ label, value }) => (
                                                    <Dropdown.Item
                                                        key={value}
                                                        onClick={() => requestSort(value)}
                                                        active={sortConfig.key === value}
                                                    >
                                                        {label}
                                                    </Dropdown.Item>
                                                ))}
                                            </Dropdown.Menu>
                                        </Dropdown>
                                    </div>


                                    {/* Sort Order Dropdown */}
                                    <div className="col-12 col-md-3">
                                        <Dropdown className="w-100">
                                            <Dropdown.Toggle variant="outline-secondary" id="dropdown-sort-order" className="w-100">
                                                {sortConfig.direction === "asc" ? "Ascending" : "Descending"}
                                            </Dropdown.Toggle>
                                            <Dropdown.Menu className="w-100">
                                                <Dropdown.Item onClick={() => setSortConfig({ ...sortConfig, direction: "asc" })}>
                                                    Ascending
                                                </Dropdown.Item>
                                                <Dropdown.Item onClick={() => setSortConfig({ ...sortConfig, direction: "desc" })}>
                                                    Descending
                                                </Dropdown.Item>
                                            </Dropdown.Menu>
                                        </Dropdown>
                                    </div>
                                </div>

                                {/* … rest of your code: table-container, summary-line, etc. … */}

                                <div className="table-container">
                                    {loadingStudents ? (
                                        <p>Loading students…</p>
                                    ) : (
                                        <div className="table-responsive custom-table-wrapper">
                                            <Accordion defaultActiveKey="0" className="mb-3">
                                                <Accordion.Item eventKey="0">
                                                    <Accordion.Header>Summary</Accordion.Header>
                                                    <Accordion.Body>
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

                                                                    {
                                                                        label: "Timer Total Duration (sec)",
                                                                        value: (() => {
                                                                            const sec = summary.totalTimerDurationSeconds || 0;
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
                                                                    { label: "Switched Off Calls", value: summary.switchedOffCalls },
                                                                    { label: "Starter Plan", value: summary.planCounts.starter },
                                                                    { label: "Gold Plan", value: summary.planCounts.gold },
                                                                    { label: "Master Plan", value: summary.planCounts.master }
                                                                ].map((item, idx, arr) => {
                                                                    let sep;
                                                                    if (idx === 1) {
                                                                        sep = <br />;
                                                                    } else if ((idx - 2) % 3 === 2 && idx !== arr.length - 1) {
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

                                                            {/* Course-wise count summary */}
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
                                                        </div>
                                                    </Accordion.Body>
                                                </Accordion.Item>
                                            </Accordion>
                                            <div className="mb-3 d-flex justify-content-start gap-2">
                                                <Button
                                                    variant="success"
                                                    size="sm"
                                                    disabled={selectedIds.length === 0}
                                                    onClick={handleBulkVerify}
                                                >
                                                    Verify Selected ({selectedIds.length})
                                                </Button>
                                                <Button
                                                    variant="primary"
                                                    size="sm"
                                                    disabled={selectedIds.length === 0}
                                                    onClick={handleBulkAdmission}
                                                >
                                                    Admission Selected ({selectedIds.length})
                                                </Button>

                                                <Button
                                                    variant="warning"
                                                    size="sm"
                                                    disabled={selectedIds.length === 0}
                                                    onClick={handleBulkContactLater}
                                                >
                                                    Contact Later Selected ({selectedIds.length})
                                                </Button>

                                                <Button
                                                    variant="danger"
                                                    size="sm"
                                                    disabled={selectedIds.length === 0}
                                                    onClick={handleBulkDelete}
                                                >
                                                    Delete Selected ({selectedIds.length})
                                                </Button>
                                            </div>

                                            <div className="d-flex justify-content-start mb-2">
                                                <Button
                                                    variant={isExpanded ? "secondary" : "primary"}
                                                    size="sm"
                                                    onClick={() => setIsExpanded(prev => !prev)}
                                                >
                                                    {isExpanded ? "Shrink View" : "Expand View"}
                                                </Button>
                                            </div>
                                            <table className="table custom-table table-hover align-middle">
                                                <thead className="table-header">
                                                    <tr>
                                                        <th>
                                                            <input
                                                                type="checkbox"
                                                                checked={selectedIds.length === currentRows.length && currentRows.length > 0}
                                                                onChange={handleSelectAll}
                                                            />
                                                        </th>
                                                        <th>#</th>
                                                        {renderHeader('Name', 'name')}
                                                        {renderHeader('Call Status', 'callInfo.callStatus')}
                                                        {renderHeader('Call Duration', 'callInfo.callDuration')}
                                                        {renderHeader('Timer Duration (sec)', 'callSessionDurationSeconds')}  {/* NEW */}
                                                        {renderHeader('Interested', 'callInfo.interested')}
                                                        {renderHeader('Plan Type', 'callInfo.planType')}
                                                        {isExpanded && (
                                                            <>
                                                                {renderHeader('Email', 'email')}
                                                                {renderHeader('Phone', 'phone')}
                                                                {renderHeader('Course', 'course')}
                                                                {renderHeader('Place', 'place')}
                                                                {renderHeader('Assigned At', 'assignedAt')}
                                                                {renderHeader('Completed At', 'callInfo.completedAt')}
                                                                {renderHeader('Same Date?', 'sameDateMatch')}
                                                            </>
                                                        )}
                                                        <th>Action</th>
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
                                                            const totalSec = s.callSessionDurationSeconds != null ? s.callSessionDurationSeconds : null;  // NEW
                                                            const assignedAt = s.assignedAt ? new Date(s.assignedAt) : null;
                                                            const completedAt = ci.completedAt ? new Date(ci.completedAt) : null;

                                                            const isSameDate =
                                                                assignedAt &&
                                                                completedAt &&
                                                                assignedAt.toDateString() === completedAt.toDateString();
                                                            const serialNo = (effectivePage - 1) * rowsPerPage + idx + 1;

                                                            return (
                                                                <tr key={s._id} className={s.callMarked === 'marked' ? 'marked-row' : ''}>
                                                                    <td>
                                                                        <input
                                                                            type="checkbox"
                                                                            checked={selectedIds.includes(s._id)}
                                                                            onChange={() => handleSelectStudent(s._id)}
                                                                        />
                                                                    </td>
                                                                    <td>{serialNo}</td>
                                                                    <td>
                                                                        {s.name} {ci.verified && (
                                                                            <FaCheckCircle style={{ marginLeft: '5px', color: 'green' }} />
                                                                        )}
                                                                    </td>
                                                                    <td>{ci.callStatus ?? '-'}</td>
                                                                    <td>
                                                                        {ci.callDuration != null && !isNaN(ci.callDuration) ?
                                                                            (() => {
                                                                                const totalSecFromMinutes = Math.round(ci.callDuration * 60);
                                                                                const m = Math.floor(totalSecFromMinutes / 60);
                                                                                const sSec = totalSecFromMinutes % 60;
                                                                                return (m > 0 ? `${m} min ` : '') + `${sSec} sec`;
                                                                            })() : '-'}
                                                                    </td>
                                                                    <td>
                                                                        {/* NEW: show the timer duration in seconds */}
                                                                        {totalSec != null ? `${totalSec} sec` : '-'}
                                                                    </td>
                                                                    <td>{ci.interested ?? '-'}</td>
                                                                    <td>{ci.planType ?? '-'}</td>

                                                                    {isExpanded && (
                                                                        <>
                                                                            <td>{s.email}</td>
                                                                            <td>{s.phone}</td>
                                                                            <td>{s.course}</td>
                                                                            <td>{s.place}</td>
                                                                            <td>
                                                                                {assignedAt ? assignedAt.toLocaleString('en-GB', {
                                                                                    day: '2-digit', month: 'short', year: 'numeric',
                                                                                    hour: 'numeric', minute: '2-digit', second: '2-digit',
                                                                                    hour12: true
                                                                                }) : ''}
                                                                            </td>
                                                                            <td>
                                                                                {completedAt ? completedAt.toLocaleString('en-GB', {
                                                                                    day: '2-digit', month: 'short', year: 'numeric',
                                                                                    hour: 'numeric', minute: '2-digit', second: '2-digit',
                                                                                    hour12: true
                                                                                }) : ''}
                                                                            </td>
                                                                            <td>{isSameDate ? '✔' : ''}</td>
                                                                        </>
                                                                    )}
                                                                    <td>
                                                                        <Button variant="outline-danger" size="sm" className="me-2" onClick={() => handleDeleteStudent(s._id)}>
                                                                            Delete
                                                                        </Button>
                                                                        <Button variant="outline-success" size="sm" onClick={() => handleSingleVerify(s._id)}>
                                                                            Verify
                                                                        </Button>
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

                            </div>

                            <div className="d-flex flex-column flex-md-row justify-content-between align-items-center mt-3 gap-2 flex-wrap">

                                {/* Rows-per-page dropdown */}
                                <div className="d-flex align-items-center flex-wrap">
                                    <label className="me-2 mb-0 fw-semibold">Rows/page:</label>
                                    <Dropdown as={ButtonGroup}>
                                        <Dropdown.Toggle
                                            variant="outline-primary"
                                            size="sm"
                                            id="dropdown-rows"
                                        >
                                            {rowsPerPage === students.length ? "All" : rowsPerPage}
                                        </Dropdown.Toggle>

                                        <Dropdown.Menu>
                                            {[2, 5, 10, 25, 50, 100].map((num) => (
                                                <Dropdown.Item key={num} onClick={() => handleRowsPerPageChange({ target: { value: num } })}>
                                                    {num}
                                                </Dropdown.Item>
                                            ))}
                                            <Dropdown.Divider />
                                            <Dropdown.Item onClick={() => handleRowsPerPageChange({ target: { value: students.length || 0 } })}>
                                                All
                                            </Dropdown.Item>
                                        </Dropdown.Menu>
                                    </Dropdown>
                                    <span className="ms-3 text-nowrap">
                                        {`Showing ${currentRows.length} of ${totalCount}`}
                                    </span>
                                </div>

                                {/* Pagination controls */}
                                {totalPages > 1 && (
                                    <div className="d-flex align-items-center flex-wrap justify-content-center">
                                        <button
                                            className="btn btn-sm btn-outline-primary me-2"
                                            onClick={() => goToPage(effectivePage - 1)}
                                            disabled={effectivePage === 1}
                                        >
                                            &lsaquo;
                                        </button>
                                        <span className="mx-2 text-nowrap">
                                            Page {effectivePage} of {totalPages}
                                        </span>
                                        <button
                                            className="btn btn-sm btn-outline-primary"
                                            onClick={() => goToPage(effectivePage + 1)}
                                            disabled={effectivePage === totalPages}
                                        >
                                            &rsaquo;
                                        </button>
                                    </div>
                                )}
                            </div>
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

                    </main>
                </div>
            </div>
        </Layout>

    );
}

export default Workreport;
