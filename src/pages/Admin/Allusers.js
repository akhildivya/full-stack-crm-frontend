import React, { useEffect, useMemo, useState } from "react";
import axios from "axios";
import { Table, Dropdown } from "react-bootstrap";
import Layout from '../../components/layout/Layout';
import Adminmenu from '../../components/layout/Adminmenu';

function Allusers() {
  const [searchTerm, setSearchTerm] = useState("");
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Sorting state using dropdowns
  const [sortKey, setSortKey] = useState("name");   // default sort column
  const [sortOrder, setSortOrder] = useState("asc"); // 'asc' or 'desc'

  const pollingInterval = 1000; // milliseconds

  useEffect(() => {
    let intervalId;

    const fetchUsers = async () => {
      try {
        const response = await axios.get("http://localhost:4000/all-users");
        setUsers(response.data);
      } catch (err) {
        console.error("Error fetching users:", err);
        setError("Error fetching users");
      } finally {
        setLoading(false);
      }
    };

    fetchUsers();
    intervalId = setInterval(fetchUsers, pollingInterval);

    return () => {
      clearInterval(intervalId);
    };
  }, []);

  const handleVerify = (userId) => {
    axios.put(`http://localhost:4000/verify/${userId}`)
      .then(response => {
        setUsers(prev => prev.map(u => u._id === userId ? response.data : u));
      })
      .catch(error => {
        console.error("Error verifying user:", error);
      });
  };

  const normalized = searchTerm.trim().toLowerCase();

  const filteredAndSorted = useMemo(() => {
    // 1) Filter
    const filtered = users.filter(user => {
      if (!normalized) return true;
      const name = String(user.username || user.name || '').toLowerCase();
      const email = String(user.email || '').toLowerCase();
      const phone = String(user.phone || '').toLowerCase();
      const statusText = user.verified ? "verified" : "not verified";
      return (
        name.includes(normalized) ||
        email.includes(normalized) ||
        phone.includes(normalized) ||
        statusText.includes(normalized)
      );
    });

    // 2) Sort
    const sorted = [...filtered].sort((a, b) => {
      let cmp = 0;

      if (sortKey === "name") {
        const aName = String(a.username || a.name || '');
        const bName = String(b.username || b.name || '');
        cmp = aName.localeCompare(bName, undefined, { sensitivity: "base" });
      } else if (sortKey === "email") {
        const aEmail = String(a.email || '');
        const bEmail = String(b.email || '');
        cmp = aEmail.localeCompare(bEmail, undefined, { sensitivity: "base" });
      } else if (sortKey === "phone") {
        const aPhone = String(a.phone || '');
        const bPhone = String(b.phone || '');
        cmp = aPhone.localeCompare(bPhone, undefined, { sensitivity: "base" });
      } else if (sortKey === "status") {
        // Verified first or not – you can decide whether verified = true is 'bigger' or 'smaller'
        cmp = (a.verified ? 1 : 0) - (b.verified ? 1 : 0);
      }

      return sortOrder === "asc" ? cmp : -cmp;
    });

    return sorted;
  }, [users, normalized, sortKey, sortOrder]);

  if (loading) {
    return (
      <Layout title={"CRM - All Users"}>
        <div className="container-fluid m-3 p-3 admin-root">
          <div className="row">
            <aside className="col-md-3"><Adminmenu /></aside>
            <main className="col-md-9">
              <div className="card admin-card p-4">
                <div>Loading users...</div>
              </div>
            </main>
          </div>
        </div>
      </Layout>
    );
  }

  if (error) {
    return (
      <Layout title={"CRM - All Users"}>
        <div className="container-fluid m-3 p-3 admin-root">
          <div className="row">
            <aside className="col-md-3"><Adminmenu /></aside>
            <main className="col-md-9">
              <div className="card admin-card p-4">
                <div>Error: {error}</div>
              </div>
            </main>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout title={"CRM - All Users"}>
      <div className="container-fluid m-3 p-3 admin-root">
        <div className="row">
          <aside className="col-md-3"><Adminmenu /></aside>
          <main className="col-md-9">
            <div className="card admin-card p-4">

              <div className="controls-row mb-3 d-flex flex-wrap align-items-center gap-2">
                <div className="search-box flex-grow-1" style={{ minWidth: '200px' }}>
                  <input
                    type="text"
                    className="form-control"
                    placeholder="Search by name, email, phone, status..."
                    value={searchTerm}
                    onChange={e => setSearchTerm(e.target.value)}
                  />
                </div>
                <div className="dropdowns-group d-flex gap-2">
                  <Dropdown>
                    <Dropdown.Toggle variant="outline-secondary" id="dropdown-sort-column">
                      Sort by: {sortKey.charAt(0).toUpperCase() + sortKey.slice(1)}
                    </Dropdown.Toggle>
                    <Dropdown.Menu>
                      {['name', 'email', 'phone', 'status'].map(col => (
                        <Dropdown.Item
                          key={col}
                          onClick={() => setSortKey(col)}
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

              <div className="table-responsive">
                <Table className="custom-table table-hover align-middle">
                  <thead>
                    <tr>
                      <th>#</th>
                      <th>Name</th>
                      <th>Email</th>
                      <th>Phone</th>
                      <th>Status</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredAndSorted.length > 0 ? (
                      filteredAndSorted.map((user, index) => (
                        <tr key={user._id || index}>
                          <td>{index + 1}</td>
                          <td>{user.username || user.name}</td>
                          <td>{user.email}</td>
                          <td>{user.phone}</td>
                          <td>{user.verified ? 'Verified' : 'Not Verified'}</td>
                          <td>
                            {!user.verified && (
                              <button
                                onClick={() => handleVerify(user._id)}
                                className="btn btn-sm btn-danger"
                              >
                                Verify
                              </button>
                            )}
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan="6" className="text-center">No users found.</td>
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

export default Allusers;
