import React, { useEffect, useState, useMemo } from 'react';
import { Table, Dropdown, Spinner, Modal, Button, Form } from 'react-bootstrap';
import Usermenu from '../../components/layout/Usermenu';
import Layout from '../../components/layout/Layout';
import { BASEURL } from '../../service/baseUrl';
import axios from 'axios';
import { useAuth } from '../../context/auth';
import { toast } from 'react-toastify';
import '../../css/dutylist.css';

function DutyList() {
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [searchTerm, setSearchTerm] = useState('');
  const [sortKey, setSortKey] = useState('name');
  const [sortOrder, setSortOrder] = useState('asc');

  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);

  const [updatedStudents, setUpdatedStudents] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [formData, setFormData] = useState({
    callStatus: '',
    callDuration: '',
    interested: '',
    planType: '',
  });
  const [auth] = useAuth();

  // populate form when modal opens
  useEffect(() => {
    if (selectedStudent) {
      setFormData({
        callStatus: selectedStudent.callInfo?.callStatus || '',
        callDuration: selectedStudent.callInfo?.callDuration || '',
        interested:
          selectedStudent.callInfo?.interested === true
            ? 'yes'
            : selectedStudent.callInfo?.interested === false
            ? 'no'
            : '',
        planType: selectedStudent.callInfo?.planType || '',
      });
    }
  }, [selectedStudent]);

  // fetch once when component mounts / auth changes
  useEffect(() => {
    let mounted = true;
    const fetchAssigned = async () => {
      if (!auth || !auth.token) {
        if (mounted) {
          setError('Not authenticated');
          setLoading(false);
        }
        return;
      }
      try {
        const resp = await axios.get(`${BASEURL}/assigned-contact-details`, {
          headers: { Authorization: auth.token },
        });

        if (resp.data?.success) {
          const fetched = resp.data.students || [];
          if (!mounted) return;
          setStudents(fetched);

          // derive updated students from callInfo on server
          const alreadyUpdated = fetched
            .filter(s => s.callInfo && s.callInfo.callStatus) // if callStatus exists -> consider updated
            .map(s => s._id);
          setUpdatedStudents(alreadyUpdated);
        } else {
          setError(resp.data?.message || 'Failed to fetch assigned students');
        }
      } catch (err) {
        console.error('Error fetching assigned students:', err);
        setError('Server or network error');
      } finally {
        if (mounted) setLoading(false);
      }
    };

    fetchAssigned();

    return () => {
      mounted = false;
    };
  }, [auth]);

  // search & filtering
  const normalized = searchTerm.trim().toLowerCase();
  const filtered = useMemo(() => {
    return students.filter(s => {
        const isUpdated = updatedStudents.includes(s._id);
    const statusText = isUpdated ? 'marked' : 'not marked';
      if (!normalized) return true;
      return (
        s.name.toLowerCase().includes(normalized) ||
        (s.email || '').toLowerCase().includes(normalized) ||
        (s.phone && String(s.phone).toLowerCase().includes(normalized)) ||
        (s.course || '').toLowerCase().includes(normalized) ||
        (s.place || '').toLowerCase().includes(normalized) ||
        statusText.includes(normalized) 
      );
    });
  }, [students, normalized, updatedStudents]);

  // sorting
  const sorted = useMemo(() => {
    return [...filtered].sort((a, b) => {
        if (sortKey === 'status') {
      const aStatus = updatedStudents.includes(a._id) ? 'marked' : 'not marked';
      const bStatus = updatedStudents.includes(b._id) ? 'marked' : 'not marked';
      const cmp = aStatus.localeCompare(bStatus, undefined, { sensitivity: 'base' });
      return sortOrder === 'asc' ? cmp : -cmp;
        }
      const aVal = ((a[sortKey] || '') + '').toString().toLowerCase();
      const bVal = ((b[sortKey] || '') + '').toString().toLowerCase();
      const cmp = aVal.localeCompare(bVal, undefined, { sensitivity: 'base' });
      return sortOrder === 'asc' ? cmp : -cmp;
    });
  }, [filtered, sortKey, sortOrder,updatedStudents]);

  // pagination
  const currentItems = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    return sorted.slice(startIndex, startIndex + itemsPerPage);
  }, [sorted, currentPage, itemsPerPage]);

  const totalPages = Math.ceil(sorted.length / itemsPerPage);

  const handleInputChange = e => {
    const { name, value } = e.target;
    setFormData(prev => {
      if (name === 'interested') {
        if (value === 'no') return { ...prev, interested: 'no', planType: '' };
        if (value === 'yes') return { ...prev, interested: 'yes', planType: prev.planType || 'starter' };
      }
      return { ...prev, [name]: value };
    });
  };

  const handleSave = async () => {
    if (!selectedStudent) return;
    try {
      const response = await axios.put(
        `${BASEURL}/students/${selectedStudent._id}/status`,
        { ...formData },
        { headers: { Authorization: auth.token } }
      );

      if (response.data?.success) {
        const updatedStudent = response.data.student;

        // replace the student in local list with backend-returned object
        setStudents(prev =>
          prev.map(stu => (stu._id === updatedStudent._id ? updatedStudent : stu))
        );

        // mark updated
        setUpdatedStudents(prev => (prev.includes(updatedStudent._id) ? prev : [...prev, updatedStudent._id]));

        toast.success('Student status updated successfully!');
        setShowModal(false);
        setSelectedStudent(null);
      } else {
        toast.error(response.data?.message || 'Failed to update student status');
      }
    } catch (err) {
      console.error('Error updating student status:', err);
      toast.error('Server or network error');
    }
  };

  if (loading)
    return (
      <div className="loading-container">
        <Spinner animation="border" variant="primary" />
        <div>Loading assigned students…</div>
      </div>
    );
  if (error)
    return (
      <div className="loading-container">
        <div className="error-message">{error}</div>
      </div>
    );

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
                <div className="d-flex flex-wrap align-items-center mb-3 gap-2">
                  <div className="flex-grow-1" style={{ minWidth: '200px' }}>
                    <input
                      type="text"
                      className="form-control"
                      placeholder="Search students..."
                      value={searchTerm}
                      onChange={e => setSearchTerm(e.target.value)}
                    />
                  </div>

                  <div className="d-flex gap-2">
                    <Dropdown>
                      <Dropdown.Toggle variant="outline-secondary" id="dropdown-sort-column">
                        Sort by: {sortKey.charAt(0).toUpperCase() + sortKey.slice(1)}
                      </Dropdown.Toggle>
                      <Dropdown.Menu>
                        {['name', 'email', 'phone', 'course', 'place','status'].map(col => (
                          <Dropdown.Item
                            key={col}
                            onClick={() => {
                              if (sortKey === col) setSortOrder(prev => (prev === 'asc' ? 'desc' : 'asc'));
                              else {
                                setSortKey(col);
                                setSortOrder('asc');
                              }
                            }}
                          >
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
                          <th>Actions</th>
                          <th>Status</th>
                        </tr>
                      </thead>
                      <tbody>
                        {currentItems.map((s, idx) => {
                          const isUpdated = updatedStudents.includes(s._id);
                          return (
                            <tr key={s._id || idx}>
                              <td>{idx + 1 + (currentPage - 1) * itemsPerPage}</td>
                              <td style={{ color: isUpdated ? 'red' : 'inherit' }}>{s.name}</td>
                              <td>{s.email}</td>
                              <td>{s.phone}</td>
                              <td>{s.course}</td>
                              <td>{s.place}</td>
                              <td>
                                {s.assignedAt
                                  ? new Date(s.assignedAt).toLocaleString('en-IN', {
                                      day: '2-digit',
                                      month: 'short',
                                      year: 'numeric',
                                      hour: '2-digit',
                                      minute: '2-digit',
                                      second: '2-digit',
                                      hour12: true,
                                    })
                                  : '-'}
                              </td>
                              <td>
                                <Button
                                  variant="outline-primary"
                                  size="sm"
                                  onClick={() => {
                                    setSelectedStudent(s);
                                    setFormData({
                                      callStatus: s.callInfo?.callStatus || '',
                                      callDuration: s.callInfo?.callDuration || '',
                                      interested:
                                        s.callInfo?.interested === true
                                          ? 'yes'
                                          : s.callInfo?.interested === false
                                          ? 'no'
                                          : '',
                                      planType: s.callInfo?.planType || '',
                                    });
                                    setShowModal(true);
                                  }}
                                  disabled={isUpdated}
                                >
                                  Update
                                </Button>
                              </td>
                              <td>{isUpdated ? 'Marked' : 'Not Marked'}</td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </Table>

                    <div className="d-flex justify-content-between align-items-center mt-3">
                      <div>
                        <button
                          className="btn btn-outline-primary me-2"
                          onClick={() => currentPage > 1 && setCurrentPage(currentPage - 1)}
                          disabled={currentPage === 1}
                        >
                          &laquo;
                        </button>
                        <button
                          className="btn btn-outline-primary"
                          onClick={() => currentPage < totalPages && setCurrentPage(currentPage + 1)}
                          disabled={currentPage === totalPages}
                        >
                          &raquo;
                        </button>
                      </div>

                      <div className="d-flex align-items-center gap-2">
                        <select
                          className="form-select form-select-sm"
                          value={itemsPerPage}
                          onChange={e => {
                            setCurrentPage(1);
                            setItemsPerPage(Number(e.target.value));
                          }}
                        >
                          {[2, 5, 10, 15, 20, 25, 50, 100].map(size => (
                            <option key={size} value={size}>
                              {size}
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </main>
        </div>

        <Modal show={showModal} onHide={() => setShowModal(false)}>
          <Modal.Header closeButton>
            <Modal.Title>Update Call Status</Modal.Title>
          </Modal.Header>
          <Modal.Body>
            <Form>
              <Form.Group controlId="callStatus">
                <Form.Label>Call Status</Form.Label>
                <Form.Control as="select" value={formData.callStatus} onChange={handleInputChange} name="callStatus">
                  <option value="missed">Missed</option>
                  <option value="rejected">Rejected</option>
                  <option value="accepted">Accepted</option>
                </Form.Control>
              </Form.Group>

              {formData.callStatus === 'accepted' && (
                <>
                  <Form.Group controlId="callDuration">
                    <Form.Label>Call Duration (minutes)</Form.Label>
                    <Form.Control type="number" value={formData.callDuration} onChange={handleInputChange} name="callDuration" />
                  </Form.Group>

                  <Form.Group controlId="interested">
                    <Form.Label>Interested</Form.Label>
                    <Form.Control as="select" value={formData.interested} onChange={handleInputChange} name="interested">
                      <option value="yes">Yes</option>
                      <option value="no">No</option>
                    </Form.Control>
                  </Form.Group>

                  {formData.interested === 'yes' && (
                    <Form.Group controlId="planType">
                      <Form.Label>Plan Type</Form.Label>
                      <Form.Control as="select" value={formData.planType} onChange={handleInputChange} name="planType">
                        <option value="starter">starter</option>
                        <option value="gold">Gold</option>
                        <option value="master">Master</option>
                      </Form.Control>
                    </Form.Group>
                  )}
                </>
              )}
            </Form>
          </Modal.Body>
          <Modal.Footer>
            <Button variant="secondary" onClick={() => setShowModal(false)}>
              Close
            </Button>
            <Button variant="primary" onClick={handleSave}>
              Save Changes
            </Button>
          </Modal.Footer>
        </Modal>
      </div>
    </Layout>
  );
}

export default DutyList;
