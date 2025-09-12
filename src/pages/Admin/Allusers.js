import React, { useEffect, useMemo, useState } from "react";
import axios from "axios";
import { Table } from "react-bootstrap";
import Layout from '../../components/layout/Layout'
import Adminmenu from '../../components/layout/Adminmenu'
function Allusers() {
  const [searchTerm, setSearchTerm] = useState("");
  const [users, setUsers] = useState([]);

  {/*useEffect(() => {
    axios.get("http://localhost:4000/all-users")
      .then(response => {
        setUsers(response.data);
        console.log("Fetched users:", response.data);
      })
      .catch(error => console.error("Error fetching users:", error));
  }, []);*/}
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

    // Start polling every 5 seconds
    intervalId = setInterval(fetchUsers, 1000);

    // Cleanup when component unmounts
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

  // --- filter (case-insensitive) ---
  const normalized = searchTerm.trim().toLowerCase();
  const filteredUsers = useMemo(() => {
  if (!normalized) return users;
  return users.filter(user => {
    const name  = String(user.username || user.name || '').toLowerCase();
    const email = String(user.email || '').toLowerCase();
    const phone = String(user.phone ?? '').toLowerCase(); // <-- use String() or toString()
    const statusText = user.verified ? "verified" : "not verified";
    return (
      name.includes(normalized) ||
      email.includes(normalized) ||
      phone.includes(normalized)  ||
      statusText.includes(normalized)
       
    );
  });
}, [users, normalized]);

  return (
    <Layout title={"CRM - All Users"}>
      <div className="container-fluid m-3 p-3 admin-root">
        <div className="row">
          <aside className="col-md-3"><Adminmenu /></aside>
          <main className="col-md-9">
            <div className="card admin-card p-4">
              <div className="mb-3">
                <input
                  type="text"
                  className="form-control search-input"
                  placeholder="Search employees..."
                  value={searchTerm}
                  onChange={e => setSearchTerm(e.target.value)}
                />
              </div>

              <div className="table-responsive">
                <Table className="custom-table">
                  <thead>
                    <tr>
                      <th>#</th><th>Name</th><th>Email</th><th>Phone</th><th>Status</th><th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredUsers.map((user, index) => (
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
                {filteredUsers.length === 0 && (
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
