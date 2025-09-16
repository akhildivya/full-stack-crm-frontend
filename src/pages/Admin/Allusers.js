import React, { useEffect, useMemo, useState } from "react";
import axios from "axios";
import { Table } from "react-bootstrap";
import Layout from '../../components/layout/Layout'
import Adminmenu from '../../components/layout/Adminmenu'

function Allusers() {
  const [searchTerm, setSearchTerm] = useState("");
  const [users, setUsers] = useState([]);

  // Sorting UI state
  const [sortKey, setSortKey] = useState(""); // '', 'name', 'status', 'email', 'phone'
  const [sortOrder, setSortOrder] = useState("asc"); // 'asc' | 'desc'

  useEffect(() => {
    let intervalId;

    const fetchUsers = async () => {
      try {
        const response = await axios.get("http://localhost:4000/all-users");
        setUsers(response.data);
        console.log("Fetched users:", response.data);
      } catch (error) {
        console.error("Error fetching users:", error);
      }
    };

    // Fetch immediately
    fetchUsers();

    // Polling every 1 second (as in your code)
    intervalId = setInterval(fetchUsers, 1000);

    return () => {
      clearInterval(intervalId);
    };
  }, []);

  const handleVerify = (userId) => {
    axios.put(`http://localhost:4000/verify/${userId}`)
      .then(response => {
        setUsers(prev => prev.map(u => u._id === userId ? response.data : u));
      })
      .catch(error => console.error(error));
  };

  // --- filter (case-insensitive) + sort ---
  const normalized = searchTerm.trim().toLowerCase();

  const filteredAndSorted = useMemo(() => {
    // 1) Filter
    const filtered = users.filter(user => {
      if (!normalized) return true;
      const name = String(user.username || user.name || '').toLowerCase();
      const email = String(user.email || '').toLowerCase();
      const phone = String(user.phone ?? '').toLowerCase();
      const statusText = user.verified ? "verified" : "not verified";
      return (
        name.includes(normalized) ||
        email.includes(normalized) ||
        phone.includes(normalized) ||
        statusText.includes(normalized)
      );
    });

    // 2) If no sort, return filtered
    if (!sortKey) return filtered;

    // 3) Sort (work on a copy)
    const sorted = [...filtered].sort((a, b) => {
      let cmp = 0;

      if (sortKey === "name") {
        const aName = String(a.username || a.name || '');
        const bName = String(b.username || b.name || '');
        // localeCompare for robust alphabetical sorting
        cmp = aName.localeCompare(bName, undefined, { sensitivity: "base" });
      } else if (sortKey === "email") {
        const aEmail = String(a.email || '');
        const bEmail = String(b.email || '');
        cmp = aEmail.localeCompare(bEmail, undefined, { sensitivity: "base" });
      } else if (sortKey === "phone") {
        // compare as strings (normalize undefined to empty)
        const aPhone = String(a.phone || '');
        const bPhone = String(b.phone || '');
        cmp = aPhone.localeCompare(bPhone, undefined, { sensitivity: "base" });
      } else if (sortKey === "status") {
        // convert boolean to number so true/false sort predictably
        // (Number(true) === 1, Number(false) === 0)
        cmp = Number(a.verified ? 1 : 0) - Number(b.verified ? 1 : 0);
        // if you want Verified first by default, you can invert logic or set default order
      }

      return sortOrder === "asc" ? cmp : -cmp;
    });

    return sorted;
  }, [users, normalized, sortKey, sortOrder]);

  return (
    <Layout title={"CRM - All Users"}>
      <div className="container-fluid m-3 p-3 admin-root">
        <div className="row">
          <aside className="col-md-3"><Adminmenu /></aside>
          <main className="col-md-9">
            <div className="card admin-card p-4">
              {/* <div className="mb-3 controls-flex d-flex flex-wrap align-items-center gap-2">
                <div className="flex-grow-1" style={{ minWidth: 200 }}>
                  <input
                    type="text"
                    className="form-control w-100"
                    placeholder="Search employees..."
                    value={searchTerm}
                    onChange={e => setSearchTerm(e.target.value)}
                  />
                </div>
                <div className="flex-shrink-1 select-container" style={{ minWidth: 140 }}>
                  <select
                    id="sortKey"
                    value={sortKey}
                    onChange={e => setSortKey(e.target.value)}
                    className="form-select "
                  >
                    <option value="">-- none --</option>
                    <option value="name">Name</option>
                    <option value="status">Status (Verified)</option>
                    <option value="email">Email</option>
                    <option value="phone">Phone</option>
                  </select>
                </div>
                <div className="flex-shrink-1 select-container" style={{ minWidth: 120 }}>
                  <select
                    id="sortOrder"
                    value={sortOrder}
                    onChange={e => setSortOrder(e.target.value)}
                    className="form-select"
                  >
                    <option value="asc">Ascending</option>
                    <option value="desc">Descending</option>
                  </select>
                </div>
              </div>*/}

              {/*<div className="mb-3 controls-flex d-flex flex-wrap align-items-center gap-2">
                <div className="control-item" style={{ flex: '1 1 200px', minWidth: 0 }}>
                  <input
                    type="text"
                    className="form-control w-100"
                    placeholder="Search employees..."
                    value={searchTerm}
                    onChange={e => setSearchTerm(e.target.value)}
                  />
                </div>
                <div className="control-item" style={{ flex: '1 1 200px', minWidth: 0 }}>
                  <select
                    id="sortKey"
                    value={sortKey}
                    onChange={e => setSortKey(e.target.value)}
                    className="form-select  w-100"
                  >
                    <option value="">-- none --</option>
                    <option value="name">Name</option>
                    <option value="status">Status (Verified)</option>
                    <option value="email">Email</option>
                    <option value="phone">Phone</option>
                  </select>
                </div>
                <div className="control-item" style={{ flex: '1 1 200px', minWidth: 0 }}>
                  <select
                    id="sortOrder"
                    value={sortOrder}
                    onChange={e => setSortOrder(e.target.value)}
                    className="form-select  w-100"
                  >
                    <option value="asc">Ascending</option>
                    <option value="desc">Descending</option>
                  </select>
                </div>
              </div>*/}
              <div className="mb-3 controls-flex d-flex flex-wrap align-items-center gap-2" style={{ width: '100%' }}>
                <div className="control-item" style={{ flex: '1 1 0', minWidth: 0 }}>
                  <input
                    type="text"
                    className="form-control w-100"
                    placeholder="Search ..."
                    value={searchTerm}
                    onChange={e => setSearchTerm(e.target.value)}
                  />
                </div>
                <div className="control-item" style={{ flex: '1 1 0', minWidth: 0 }}>
                  <select
                    id="sortKey"
                    value={sortKey}
                    onChange={e => setSortKey(e.target.value)}
                    className="form-select w-100"
                  >
                    <option value="">-- none --</option>
                    <option value="name">Name</option>
                    <option value="status">Status (Verified)</option>
                    <option value="email">Email</option>
                    <option value="phone">Phone</option>
                  </select>
                </div>
                <div className="control-item" style={{ flex: '1 1 0', minWidth: 0 }}>
                  <select
                    id="sortOrder"
                    value={sortOrder}
                    onChange={e => setSortOrder(e.target.value)}
                    className="form-select w-100"
                  >
                    <option value="asc">Ascending</option>
                    <option value="desc">Descending</option>
                  </select>
                </div>
              </div>


              <div className="table-responsive">
                <Table className="custom-table">
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
                    {filteredAndSorted.map((user, index) => (
                      <tr key={user._id || index}>
                        <td>{index + 1}</td>
                        <td>{user.username}</td>
                        <td>{user.email}</td>
                        <td>{user.phone}</td>
                        <td>{user.verified ? 'Verified' : 'Not Verified'}</td>
                        <td>
                          {!user.verified && (
                            <button onClick={() => handleVerify(user._id)} className="btn btn-sm btn-danger">
                              Verify
                            </button>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </Table>
                {filteredAndSorted.length === 0 && (
                  <div className="text-center">No users found.</div>
                )}
              </div>

            </div>
          </main>
        </div>
      </div>
    </Layout>
  );
}

export default Allusers;
