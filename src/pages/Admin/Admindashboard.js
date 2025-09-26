// src/pages/AdminDashboard.jsx
import React, { useEffect, useState, useRef } from 'react';
import Layout from '../../components/layout/Layout';
import Adminmenu from '../../components/layout/Adminmenu';
import axios from 'axios';
import { BASEURL } from '../../service/baseUrl';
import '../../css/admindash.css';
import Greeting from '../../components/Greetings';

function AdminDashboard() {
  const [overview, setOverview] = useState({
    totalUsers: 0,
    verifiedUsers: 0,
    pendingUsers: 0,
    newUsers: [],
  });
  const [loading, setLoading] = useState(true);

  const intervalRef = useRef(null);

  useEffect(() => {
    const fetchNewUsers = async () => {
      try {
        const resp = await axios.get(`${BASEURL}/admin/unverified`);
        setOverview(prev => ({
          ...prev,
          newUsers: resp.data,
        }));
      } catch (err) {
        console.error('Error fetching new users:', err);
      }
    };

    intervalRef.current = setInterval(fetchNewUsers, 5000);
    fetchNewUsers();

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, []);

  useEffect(() => {
    const fetchOverview = async () => {
      try {
        const resp = await axios.get(`${BASEURL}/admin/user-overview`);
        setOverview(prev => ({
          ...prev,
          totalUsers: resp.data.totalUsers,
          verifiedUsers: resp.data.verifiedUsers,
          pendingUsers: resp.data.pendingUsers,
        }));
      } catch (err) {
        console.error('Failed to fetch admin overview:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchOverview();
  }, []);

  if (loading) {
    return (
      <div className="loader-overlay">
        <div className="loader-box">
          <div className="spinner"></div>
          <p className="loader-text">Loading...</p>
        </div>
      </div>
    );
  }

  const { totalUsers, verifiedUsers, pendingUsers, newUsers } = overview;

  return (
    <Layout title="CRM - Admin Dashboard">
      <div className="container-fluid m-3 p-3 admin-root">
        <div className="row">
          <aside className="col-md-3">
            <Adminmenu />
          </aside>

          <main className="col-md-9">
            <div className="card admin-card w-100 p-4 mb-4">
              <div className="d-flex flex-column flex-md-row align-items-center justify-content-between mb-3">
                <Greeting /> {/* Display the greeting message */}
                {newUsers.length > 0 && (
                  <span className="badge bg-warning text-dark">
                    {newUsers.length} New
                  </span>
                )}
              </div>

              {newUsers.length > 0 ? (
                <div className="alert alert-warning new-users-alert p-3 position-relative">
                  <strong>{newUsers.length}</strong> New {newUsers.length === 1 ? 'user' : 'users'} awaiting verification...
                  <ul className="list-unstyled mt-2 mb-3">
                    {newUsers.slice(0, 5).map(user => {
                      const regTime = new Date(user.createdAt);
                      const formatted = regTime.toLocaleDateString('en-GB', {
                        day: '2-digit',
                        month: 'short',
                        year: 'numeric', 
                        hour: '2-digit',
                        minute: '2-digit',
                        second: '2-digit',
                        hour12: true,
                      }).replace(/ /g, '-');

                      return (
                        <li key={user._id} className="d-flex align-items-center mb-1">
                          <i className="bi bi-person-circle me-2" />
                          <div>
                            <div>
                              {user.username} ({user.email})
                            </div>
                            <small className="text-muted">Registered: {formatted} </small>
                          </div>
                        </li>
                      );
                    })}
                    {newUsers.length > 5 && (
                      <li>
                        <button className="btn btn-sm btn-link p-0">
                          + {newUsers.length - 5} more
                        </button>
                      </li>
                    )}
                  </ul>
                </div>
              ) : (
                <p className="no-unverified">No pending verifications at this time.</p>
              )}

              <div className="row mt-4 gx-3 gy-3">
                <div className="col-md-4">
                  <div className="metric-card p-3 card-total-users">
                    <h5>Total Users</h5>
                    <p className="fs-4">{totalUsers}</p>
                  </div>
                </div>
                <div className="col-md-4">
                  <div className="metric-card p-3 card-verified-users">
                    <h5>Verified</h5>
                    <p className="fs-4">{verifiedUsers}</p>
                  </div>
                </div>
                <div className="col-md-4">
                  <div className="metric-card p-3 card-pending-users">
                    <h5>Pending</h5>
                    <p className="fs-4">{pendingUsers}</p>
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

export default AdminDashboard;
