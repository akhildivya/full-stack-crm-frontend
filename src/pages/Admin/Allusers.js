// src/pages/admin/Allusers.js

import React, { useEffect, useMemo, useState } from "react";
import axios from "axios";
import { Table, Dropdown, Button } from "react-bootstrap";
import Layout from '../../components/layout/Layout';
import Adminmenu from '../../components/layout/Adminmenu';
import {BASEURL} from '../../service/baseUrl'
function Allusers() {
  const [searchTerm, setSearchTerm] = useState("");
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Sorting state
  const [sortKey, setSortKey] = useState("name");
  const [sortOrder, setSortOrder] = useState("asc");

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(10);

  const pollingInterval = 1000;

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const response = await axios.get(`${BASEURL}/all-users`);
        setUsers(response.data);
      } catch (err) {
        console.error("Error fetching users:", err);
        setError("Error fetching users");
      } finally {
        setLoading(false);
      }
    };

    fetchUsers();
    const intervalId = setInterval(fetchUsers, pollingInterval);
    return () => clearInterval(intervalId);
  }, []);

  const handleVerify = (userId) => {
    axios.put(`${BASEURL}/verify/${userId}`)
      .then(response => {
        setUsers(prev => prev.map(u => u._id === userId ? response.data : u));
      })
      .catch(err => {
        console.error("Error verifying user:", err);
      });
  };

  const handleSearchChange = (e) => {
    setSearchTerm(e.target.value);
    setCurrentPage(1);
  };

  const handleSortColumn = (col) => {
    if (sortKey === col) {
      setSortOrder(prev => (prev === "asc" ? "desc" : "asc"));
    } else {
      setSortKey(col);
      setSortOrder("asc");
    }
    setCurrentPage(1);
  };

  const handleSortOrderChange = (order) => {
    setSortOrder(order);
    setCurrentPage(1);
  };

  const handleRowsPerPageChange = (num) => {
    setRowsPerPage(num);
    setCurrentPage(1);
  };

  // filtering
  const normalized = searchTerm.trim().toLowerCase();
  const filtered = useMemo(() => {
    return users.filter(user => {
      if (!normalized) return true;
      const name = String(user.username || user.name || "").toLowerCase();
      const email = String(user.email || "").toLowerCase();
      const phone = String(user.phone || "").toLowerCase();
      const statusText = user.verified ? "verified" : "not verified";
      return (
        name.includes(normalized) ||
        email.includes(normalized) ||
        phone.includes(normalized) ||
        statusText.includes(normalized)
      );
    });
  }, [users, normalized]);

  // sorting
  const sorted = useMemo(() => {
    return [...filtered].sort((a, b) => {
      let cmp = 0;
      if (sortKey === "name") {
        const aName = String(a.username || a.name || "");
        const bName = String(b.username || b.name || "");
        cmp = aName.localeCompare(bName, undefined, { sensitivity: "base" });
      } else if (sortKey === "email") {
        const aEmail = String(a.email || "");
        const bEmail = String(b.email || "");
        cmp = aEmail.localeCompare(bEmail, undefined, { sensitivity: "base" });
      } else if (sortKey === "phone") {
        const aPhone = String(a.phone || "");
        const bPhone = String(b.phone || "");
        cmp = aPhone.localeCompare(bPhone, undefined, { sensitivity: "base" });
      } else if (sortKey === "status") {
        cmp = (a.verified ? 1 : 0) - (b.verified ? 1 : 0);
      }
      return sortOrder === "asc" ? cmp : -cmp;
    });
  }, [filtered, sortKey, sortOrder]);

  // pagination calculations
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
      <Layout title={"CRM - Verify users"}>
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

              {/* Search + sort controls above the table */}
              <div className="mb-3 d-flex flex-wrap align-items-center gap-2">
                <div className="flex-grow-1" style={{ minWidth: '200px' }}>
                  <input
                    type="text"
                    className="form-control"
                    placeholder="Search by name, email, phone, status..."
                    value={searchTerm}
                    onChange={handleSearchChange}
                  />
                </div>

                <div className="d-flex gap-2">
                  <Dropdown>
                    <Dropdown.Toggle variant="outline-secondary"  id="dropdown-sort-column">
                      Sort by: {sortKey.charAt(0).toUpperCase() + sortKey.slice(1)}
                    </Dropdown.Toggle>
                    <Dropdown.Menu>
                      {['name', 'email', 'phone', 'status'].map(col => (
                        <Dropdown.Item
                          key={col}
                          onClick={() => handleSortColumn(col)}
                        >
                          {col.charAt(0).toUpperCase() + col.slice(1)}
                        </Dropdown.Item>
                      ))}
                    </Dropdown.Menu>
                  </Dropdown>

                  <Dropdown>
                    <Dropdown.Toggle variant="outline-secondary"  id="dropdown-sort-order">
                      {sortOrder === 'asc' ? 'Ascending' : 'Descending'}
                    </Dropdown.Toggle>
                    <Dropdown.Menu>
                      <Dropdown.Item onClick={() => handleSortOrderChange('asc')}>Ascending</Dropdown.Item>
                      <Dropdown.Item onClick={() => handleSortOrderChange('desc')}>Descending</Dropdown.Item>
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
                    {currentRows.length > 0 ? (
                      currentRows.map((user, idx) => {
                        const globalIndex = idxFirst + idx + 1;
                        return (
                          <tr key={user._id || globalIndex}>
                            <td>{globalIndex}</td>
                            <td>{user.username || user.name}</td>
                            <td>{user.email}</td>
                            <td>{user.phone}</td>
                            <td>{user.verified ? "Verified" : "Not Verified"}</td>
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
                        );
                      })
                    ) : (
                      <tr>
                        <td colSpan="6" className="text-center">No matching records found.</td>
                      </tr>
                    )}
                  </tbody>
                </Table>
              </div>

              {/* Pagination & rows-per-page below the table */}
              <div className="mt-3 d-flex justify-content-between align-items-center">
                <div>
                  <Button
                    variant="outline-secondary"
                    size="sm"
                    onClick={() => goToPage(currentPage - 1)}
                    disabled={currentPage === 1}
                  >
                    Previous
                  </Button>
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
                  <Button
                    variant="outline-secondary"
                    size="sm"
                    onClick={() => goToPage(currentPage + 1)}
                    disabled={currentPage === totalPages}
                  >
                    Next
                  </Button>
                </div>

                <div>
                  <Dropdown>
                    <Dropdown.Toggle variant="outline-secondary" size="sm" id="dropdown-rows-per-page">
                      {rowsPerPage}
                    </Dropdown.Toggle>
                    <Dropdown.Menu>
                      {[5, 10, 20, 50].map(num => (
                        <Dropdown.Item
                          key={num}
                          active={rowsPerPage === num}
                          onClick={() => handleRowsPerPageChange(num)}
                        >
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

export default Allusers;
