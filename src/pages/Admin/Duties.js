// src/pages/admin/Duties.jsx
import React, { useEffect, useMemo, useState } from 'react';
import Layout from '../../components/layout/Layout';
import Adminmenu from '../../components/layout/Adminmenu';
import { Spinner, Table, Dropdown, Button, Card, Row, Col } from 'react-bootstrap';
import axios from 'axios';
import { BASEURL } from '../../service/baseUrl';
import '../../css/duties.css';

function Duties() {
  const [stats, setStats] = useState([]);
  const [overview, setOverview] = useState({
    totalStudents: 0,
    unassignedLeads: 0,
    assignedLeads: 0,
  });
  const [loading, setLoading] = useState(true);
  const [overviewLoading, setOverviewLoading] = useState(true);
  const [error, setError] = useState(null);
  const [overviewError, setOverviewError] = useState(null);

  // UI state
  const [searchTerm, setSearchTerm] = useState('');
  const [sortKey, setSortKey] = useState('username');
  const [sortOrder, setSortOrder] = useState('asc');
  const [currentPage, setCurrentPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(10);

  const formatDate = (dateVal) => {
    if (!dateVal) return '—';
    const d = new Date(dateVal);
    const day = String(d.getDate()).padStart(2, '0');
    const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sept", "Oct", "Nov", "Dec"];
    const month = monthNames[d.getMonth()];
    const year = d.getFullYear();

    const timeString = d.toLocaleString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: true
    });
    return `${day}-${month}-${year} ${timeString}`;
  };

  useEffect(() => {
    // fetch table stats
    const fetchStats = async () => {
      try {
        const res = await axios.get(`${BASEURL}/admin/users-assignment-stats`);
        setStats(Array.isArray(res.data) ? res.data : []);
      } catch (err) {
        console.error('Error fetching stats', err);
        setError('Failed to fetch data');
      } finally {
        setLoading(false);
      }
    };

    // fetch overview counts
    const fetchOverview = async () => {
      try {
        const res = await axios.get(`${BASEURL}/admin/leads-overview`);
        if (res.data && res.data.success) {
          setOverview(res.data.data);
        } else {
          setOverviewError('Failed to load overview');
        }
      } catch (err) {
        console.error('Error fetching overview', err);
        setOverviewError('Failed to fetch overview');
      } finally {
        setOverviewLoading(false);
      }
    };

    fetchOverview();
    fetchStats();
  }, []);

  // Filtering, sorting, pagination as before...
  const normalized = searchTerm.trim().toLowerCase();
  const filtered = useMemo(() => {
    if (!normalized) return stats;
    return stats.filter(u => {
      const name = String(u.username || '').toLowerCase();
      const email = String(u.email || '').toLowerCase();
      const count = String(u.count || '').toLowerCase();
      return name.includes(normalized) || email.includes(normalized) || count.includes(normalized);
    });
  }, [stats, normalized]);

  const sorted = useMemo(() => {
    const arr = [...filtered];
    arr.sort((a, b) => {
      let cmp = 0;
      if (sortKey === 'username') {
        const A = String(a.username || '').toLowerCase();
        const B = String(b.username || '').toLowerCase();
        cmp = A.localeCompare(B, undefined, { sensitivity: 'base' });
      } else if (sortKey === 'email') {
        const A = String(a.email || '').toLowerCase();
        const B = String(b.email || '').toLowerCase();
        cmp = A.localeCompare(B, undefined, { sensitivity: 'base' });
      } else if (sortKey === 'count') {
        cmp = (Number(a.count) || 0) - (Number(b.count) || 0);
      } else if (sortKey === 'lastAssigned') {
        const ta = a.lastAssigned ? new Date(a.lastAssigned).getTime() : 0;
        const tb = b.lastAssigned ? new Date(b.lastAssigned).getTime() : 0;
        cmp = ta - tb;
      }
      return sortOrder === 'asc' ? cmp : -cmp;
    });
    return arr;
  }, [filtered, sortKey, sortOrder]);

  const totalItems = sorted.length;
  const totalPages = Math.max(1, Math.ceil(totalItems / rowsPerPage));
  const idxLast = currentPage * rowsPerPage;
  const idxFirst = idxLast - rowsPerPage;
  const currentRows = sorted.slice(idxFirst, idxLast);

  const goToPage = (pageNum) => {
    let p = pageNum;
    if (p < 1) p = 1;
    if (p > totalPages) p = totalPages;
    setCurrentPage(p);
  };

  const handleSortColumn = (col) => {
    if (sortKey === col) {
      setSortOrder(prev => (prev === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortKey(col);
      setSortOrder('asc');
    }
    setCurrentPage(1);
  };

  // Show loading spinner (centered) while either is loading
  if (loading || overviewLoading) {
    return (
      <Layout title={"CRM- Allotted Duties"}>
        <div className="container-fluid m-3 p-3 admin-root">
          <div className="row">
            <aside className="col-md-3"><Adminmenu /></aside>
            <main className="col-md-9 d-flex justify-content-center align-items-center" style={{ minHeight: '60vh' }}>
              <Spinner animation="border" role="status">
                <span className="visually-hidden">Loading...</span>
              </Spinner>
            </main>
          </div>
        </div>
      </Layout>
    );
  }

  if (error || overviewError) {
    return (
      <Layout title={"CRM- Allotted Duties"}>
        <div className="container-fluid m-3 p-3 admin-root">
          <div className="row">
            <aside className="col-md-3"><Adminmenu /></aside>
            <main className="col-md-9">
              <div className="card admin-card p-4">
                <div>{error || overviewError}</div>
              </div>
            </main>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout title={"CRM- Allotted Duties"}>
      <div className="container-fluid m-3 p-3 admin-root">
        <div className="row">
          <aside className="col-md-3"><Adminmenu /></aside>
          <main className="col-md-9">
            <div className="card admin-card p-4">

              <Row className="overview-stats mb-4">
                <Col xs={12} md={4} className="stat-box-col">
                  <div className="stat-box">
                    <div className="stat-title">Total Students</div>
                    <div className="stat-value">{overview.totalStudents}</div>
                  </div>
                </Col>
                <Col xs={12} md={4} className="stat-box-col">
                  <div className="stat-box">
                    <div className="stat-title">Assigned Leads</div>
                    <div className="stat-value">{overview.assignedLeads}</div>
                  </div>
                </Col>
                <Col xs={12} md={4} className="stat-box-col">
                  <div className="stat-box">
                    <div className="stat-title">Unassigned Leads</div>
                    <div className="stat-value">{overview.unassignedLeads}</div>
                  </div>
                </Col>

              </Row>
              {/* Search + sort controls */}
              <div className="mb-3 d-flex flex-wrap align-items-center gap-2">
                <div className="flex-grow-1" style={{ minWidth: '200px' }}>
                  <input
                    type="text"
                    className="form-control"
                    placeholder="Search by username, email or count..."
                    value={searchTerm}
                    onChange={e => { setSearchTerm(e.target.value); setCurrentPage(1); }}
                  />
                </div>
                <div className="d-flex gap-2 justify-content-between">
                  <Dropdown>
                    <Dropdown.Toggle variant="outline-secondary" id="dropdown-sort-column">
                      Sort by: {sortKey.charAt(0).toUpperCase() + sortKey.slice(1)}
                    </Dropdown.Toggle>
                    <Dropdown.Menu>
                      {['username', 'email', 'count', 'lastAssigned'].map(col => (
                        <Dropdown.Item key={col} onClick={() => handleSortColumn(col)}>
                          {col === 'lastAssigned' ? 'Last Assigned' : (col.charAt(0).toUpperCase() + col.slice(1))}
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

              <div className="table-responsive">
                <Table className="custom-table table-hover align-middle">
                  <thead>
                    <tr>
                      <th style={{ width: 48 }}>#</th>
                      <th>Name</th>
                      <th>Email</th>
                      <th>Assigned Count</th>
                      <th>Last Assigned Date</th>
                    </tr>
                  </thead>
                  <tbody>
                    {currentRows.length > 0 ? (
                      currentRows.map((u, idx) => {
                        const globalIndex = idxFirst + idx + 1;
                        return (
                          <tr key={u.userId || u._id || globalIndex}>
                            <td>{globalIndex}</td>
                            <td>{u.username}</td>
                            <td>{u.email}</td>
                            <td>{u.count}</td>
                            <td>{formatDate(u.lastAssigned)}</td>
                          </tr>
                        );
                      })
                    ) : (
                      <tr>
                        <td colSpan="5" className="text-center">No matching records found.</td>
                      </tr>
                    )}
                  </tbody>
                </Table>
              </div>

              {/* Pagination & rows-per-page */}
              <div className="mt-3 d-flex justify-content-between align-items-center">
                <div>
                  <Button variant="outline-secondary" size="sm" onClick={() => goToPage(currentPage - 1)} disabled={currentPage === 1}>Previous</Button>
                  {[...Array(totalPages)].map((_, i) => {
                    const pageNum = i + 1;
                    return (
                      <Button
                        key={pageNum}
                        variant={currentPage === pageNum ? "primary" : "outline-secondary"}
                        size="sm"
                        className="mx-1"
                        onClick={() => goToPage(pageNum)}
                      >
                        {pageNum}
                      </Button>
                    );
                  })}
                  <Button variant="outline-secondary" size="sm" onClick={() => goToPage(currentPage + 1)} disabled={currentPage === totalPages}>Next</Button>
                </div>
                <div>
                  <Dropdown>
                    <Dropdown.Toggle variant="outline-secondary" size="sm" id="dropdown-rows-per-page">
                      {rowsPerPage}
                    </Dropdown.Toggle>
                    <Dropdown.Menu>
                      {[5, 10, 20, 50].map(num => (
                        <Dropdown.Item key={num} active={rowsPerPage === num} onClick={() => { setRowsPerPage(num); setCurrentPage(1); }}>
                          {num}
                        </Dropdown.Item>
                      ))}
                    </Dropdown.Menu>
                  </Dropdown>
                </div>
              </div>

            </div>
          </main>
        </div>
      </div>
    </Layout>
  );
}

export default Duties;
