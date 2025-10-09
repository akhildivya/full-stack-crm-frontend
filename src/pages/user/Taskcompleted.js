import Layout from '../../components/layout/Layout';
import Usermenu from '../../components/layout/Usermenu';
import React, { useEffect, useState, useMemo } from 'react';
import axios from 'axios';
import { Table, Form, Dropdown, Spinner } from 'react-bootstrap';
import { BASEURL } from '../../service/baseUrl';
import '../../css/taskcompleted.css';

function Taskcompleted() {
  const [students, setStudents] = useState([]);
  const [summary, setSummary] = useState({});
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [sortKey, setSortKey] = useState('assignedAt');
  const [sortOrder, setSortOrder] = useState('desc');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);

  useEffect(() => {
    let intervalId;
    const fetchStudents = async () => {
      try {
        const { data } = await axios.get(`${BASEURL}/assigned-summary`);
        if (data.success) {
          setStudents(data.students || []);
          setSummary(data.summary || {});
        } else {
          setStudents([]);
          setSummary({});
        }
      } catch (err) {
        console.error(err);
        setStudents([]);
        setSummary({});
      } finally {
        setLoading(false);
      }
    };
    fetchStudents();
    intervalId = setInterval(fetchStudents, 10 * 1000); // 10,000 ms = 10 sec


    return () => {
      clearInterval(intervalId);
    };
  }, []);

  const normalized = searchTerm.trim().toLowerCase();

  const filtered = useMemo(() => {
    return (students || []).filter(s => {
      if (!normalized) return true;
      const callStatus = s.callInfo?.callStatus || '';
      return (
        s.name.toLowerCase().includes(normalized) ||
        s.phone.toLowerCase().includes(normalized) ||
        s.course.toLowerCase().includes(normalized) ||
        callStatus.toLowerCase().includes(normalized)
      );
    });
  }, [students, normalized]);

  const sorted = useMemo(() => {
    return [...filtered].sort((a, b) => {
      let aVal = a[sortKey] ?? '';
      let bVal = b[sortKey] ?? '';

      if (sortKey === 'callStatus') {
        aVal = a.callInfo?.callStatus ?? '';
        bVal = b.callInfo?.callStatus ?? '';
      }

      if (sortKey === 'assignedAt' || sortKey === 'completedAt') {
        aVal = aVal ? new Date(aVal) : new Date(0);
        bVal = bVal ? new Date(bVal) : new Date(0);
      }

      if (aVal < bVal) return sortOrder === 'asc' ? -1 : 1;
      if (aVal > bVal) return sortOrder === 'asc' ? 1 : -1;
      return 0;
    });
  }, [filtered, sortKey, sortOrder]);

  const currentItems = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return sorted.slice(start, start + itemsPerPage);
  }, [sorted, currentPage, itemsPerPage]);

  const totalPages = Math.ceil(sorted.length / itemsPerPage);

  if (loading)
    return (
      <div className="loading-container">
        <Spinner animation="border" variant="primary" />
        <div>Loading students...</div>
      </div>
    );

  return (
    <Layout title="CRM - Task Completed">
      <div className="container-fluid m-3 p-3 admin-root">
        <div className="row">
          <aside className="col-md-3">
            <Usermenu />
          </aside>
          <main className="col-md-9">
            <div className="card admin-card p-4">
              <div className="row mb-3 g-3">
                <div className="col-md-4 mb-2">
                  <div className="summary-card bg-primary text-white p-3 rounded shadow-sm">
                    <h6>Total Assigned</h6>
                    <h3>{summary.totalAssigned}</h3>
                  </div>
                </div>
                <div className="col-md-4 mb-2">
                  <div className="summary-card bg-success text-white p-3 rounded shadow-sm">
                    <h6>Completed</h6>
                    <h3>{summary.completed}</h3>
                  </div>
                </div>
                <div className="col-md-4 mb-2">
                  <div className="summary-card bg-warning text-dark p-3 rounded shadow-sm">
                    <h6>Pending</h6>
                    <h3>{summary.pending}</h3>
                  </div>
                </div>
                <div className="col-md-4 mb-2">
                  <div className="summary-card bg-info text-white p-3 rounded shadow-sm">
                    <h6>Total Call Duration (sec)</h6>
                    <h3>{summary.totalCallDuration}</h3>
                  </div>
                </div>
                <div className="col-md-4 mb-2">
                  <div className="summary-card bg-danger text-white p-3 rounded shadow-sm">
                    <h6>Total Interestes</h6>
                    <h3>{summary.totalInterested}</h3>
                  </div>
                </div>
                <div className="col-md-4 mb-2">
                  <div className="summary-card bg-secondary text-white p-3 rounded shadow-sm">
                    <h6>Missing Interest</h6>
                    <h3>{summary.missingInterest}</h3>
                  </div>
                </div>
              </div>

              {/* Plan Counts */}
              <div className="row mb-3">
                {['starter', 'gold', 'master'].map(plan => (
                  <div className="col-md-4 mb-2" key={plan}>
                    <div className={`summary-card plan-${plan} text-white p-3 rounded shadow-sm`}>
                      <h6>{plan.charAt(0).toUpperCase() + plan.slice(1)} Plan</h6>
                      <h3>{summary.planCounts?.[plan] || 0}</h3>
                    </div>
                  </div>
                ))}
              </div>

              {/* Course-wise Counts */}
              <div className="mb-3">
                <h6>Course-wise Count:</h6>
                <div className="d-flex flex-wrap gap-2">
                  {summary.courseCounts &&
                    Object.entries(summary.courseCounts).map(([course, count]) => (
                      <span key={course} className="badge bg-secondary p-2">
                        {course}: {count}
                      </span>
                    ))
                  }
                </div>
              </div>
              {/* Search & Sort */}
              <div className="d-flex flex-wrap align-items-center mb-3 gap-2">
                <Form.Control
                  type="text"
                  placeholder="Search students..."
                  value={searchTerm}
                  onChange={e => setSearchTerm(e.target.value)}
                  style={{ maxWidth: '300px' }}
                />
                <Dropdown>
                  <Dropdown.Toggle variant="outline-secondary">
                    Sort by: {sortKey}
                  </Dropdown.Toggle>
                  <Dropdown.Menu>
                    {['name', 'phone', 'course', 'callStatus', 'assignedAt', 'completedAt'].map(col => (
                      <Dropdown.Item
                        key={col}
                        onClick={() => {
                          if (sortKey === col) setSortOrder(prev => (prev === 'asc' ? 'desc' : 'asc'));
                          else { setSortKey(col); setSortOrder('asc'); }
                        }}
                      >
                        {col}
                      </Dropdown.Item>
                    ))}
                  </Dropdown.Menu>
                </Dropdown>
              </div>

              {/* Table */}
              <div className="table-responsive">
                <Table className="custom-table table-hover align-middle">
                  <thead className="table-dark">
                    <tr>
                      <th>#</th>
                      <th>Name</th>
                      <th>Phone</th>
                      <th>Course</th>
                      <th>Call Status</th>
                      <th>Call Duration</th>
                      <th>Interested</th>
                      <th>Plan Type</th>
                      <th>Assigned At</th>
                      <th>Completed At</th> {/* New Column */}
                    </tr>
                  </thead>
                  <tbody>
                    {currentItems.map((s, idx) => (
                      <tr key={s._id}>
                        <td>{idx + 1 + (currentPage - 1) * itemsPerPage}</td>
                        <td>{s.name}</td>
                        <td>{s.phone}</td>
                        <td>{s.course}</td>
                        <td>{s.callInfo?.callStatus || 'Pending'}</td>
                        <td>{s.callInfo?.callDuration ?? '-'}</td>
                        <td>{s.callInfo?.interested === true ? 'Yes' : s.callInfo?.interested === false ? 'No' : '-'}</td>
                        <td>{s.callInfo?.planType || '-'}</td>
                        <td>{s.assignedAt ? new Date(s.assignedAt).toLocaleString('en-GB', {
                          day: '2-digit',
                          month: 'short',
                          year: 'numeric',
                          hour: 'numeric',
                          minute: '2-digit',
                          second: '2-digit',
                          hour12: true
                        }) : '-'}</td>
                        <td>
                          {s.callInfo?.completedAt
                            ? new Date(s.callInfo.completedAt).toLocaleString('en-GB', {
                              day: '2-digit',
                              month: 'short',
                              year: 'numeric',
                              hour: 'numeric',
                              minute: '2-digit',
                              second: '2-digit',
                              hour12: true
                            })
                            : '-'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </Table>

                {/* Pagination */}
                <div className="d-flex justify-content-between align-items-center mt-3">
                  <div>
                    <button className="btn btn-outline-primary me-2" onClick={() => setCurrentPage(p => Math.max(p - 1, 1))} disabled={currentPage === 1}>&laquo;</button>
                    <button className="btn btn-outline-primary" onClick={() => setCurrentPage(p => Math.min(p + 1, totalPages))} disabled={currentPage === totalPages}>&raquo;</button>
                  </div>
                  <div>
                    <select className="form-select form-select-sm" value={itemsPerPage} onChange={e => { setItemsPerPage(Number(e.target.value)); setCurrentPage(1); }}>
                      {[5, 10, 15, 20, 25, 30, 50, 100].map(size => <option key={size} value={size}>{size}</option>)}
                    </select>
                  </div>
                </div>

              </div>
            </div>
          </main>
        </div>
      </div>
    </Layout>
  );
}

export default Taskcompleted;
