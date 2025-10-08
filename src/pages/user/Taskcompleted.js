import Layout from '../../components/layout/Layout';
import Usermenu from '../../components/layout/Usermenu';
import React, { useEffect, useState, useMemo } from 'react';
import axios from 'axios';
import { Table, Form, Dropdown, Spinner } from 'react-bootstrap';
import { BASEURL } from '../../service/baseUrl';
import '../../css/dutylist.css';

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

              {/* Summary */}
              <div className="mb-3">
                <strong>Total Assigned:</strong> {summary.totalAssigned} &nbsp;|&nbsp;
                <strong>Completed:</strong> {summary.completed} &nbsp;|&nbsp;
                <strong>Pending:</strong> {summary.pending} &nbsp;|&nbsp;
                <strong>Total Call Duration (sec):</strong> {summary.totalCallDuration} &nbsp;|&nbsp;
                <strong>Total Interested:</strong> {summary.totalInterested}
              </div>

              {/* Plan & Course Summary */}
              <div className="mb-3">
                <strong>Plan Counts:</strong> Starter: {summary.planCounts?.starter || 0}, 
                Gold: {summary.planCounts?.gold || 0}, 
                Master: {summary.planCounts?.master || 0}
              </div>
              <div className="mb-3">
                <strong>Course-wise Count:</strong>
                {summary.courseCounts &&
                  Object.entries(summary.courseCounts).map(([course, count]) => (
                    <span key={course}> {course}: {count};</span>
                  ))}
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
                    {['name','phone','course','callStatus','assignedAt','completedAt'].map(col => (
                      <Dropdown.Item
                        key={col}
                        onClick={() => {
                          if (sortKey === col) setSortOrder(prev => (prev==='asc'?'desc':'asc'));
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
                        <td>{idx + 1 + (currentPage-1)*itemsPerPage}</td>
                        <td>{s.name}</td>
                        <td>{s.phone}</td>
                        <td>{s.course}</td>
                        <td>{s.callInfo?.callStatus || 'Pending'}</td>
                        <td>{s.callInfo?.callDuration ?? '-'}</td>
                        <td>{s.callInfo?.interested===true?'Yes':s.callInfo?.interested===false?'No':'-'}</td>
                        <td>{s.callInfo?.planType || '-'}</td>
                        <td>{s.assignedAt ? new Date(s.assignedAt).toLocaleString() : '-'}</td>
                        <td>
                          {s.callInfo?.completedAt 
                            ? new Date(s.callInfo.completedAt).toLocaleString() 
                            : '-'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </Table>

                {/* Pagination */}
                <div className="d-flex justify-content-between align-items-center mt-3">
                  <div>
                    <button className="btn btn-outline-primary me-2" onClick={()=>setCurrentPage(p=>Math.max(p-1,1))} disabled={currentPage===1}>&laquo;</button>
                    <button className="btn btn-outline-primary" onClick={()=>setCurrentPage(p=>Math.min(p+1,totalPages))} disabled={currentPage===totalPages}>&raquo;</button>
                  </div>
                  <div>
                    <select className="form-select form-select-sm" value={itemsPerPage} onChange={e=>{ setItemsPerPage(Number(e.target.value)); setCurrentPage(1); }}>
                      {[5,10,15,20].map(size=> <option key={size} value={size}>{size}</option>)}
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
