// src/pages/AdminDashboard.jsx
import React, { useEffect, useState, useRef } from "react";
import Layout from "../../components/layout/Layout";
import Adminmenu from "../../components/layout/Adminmenu";
import axios from "axios";
import { BASEURL } from "../../service/baseUrl";
import "../../css/admindash.css";
import Greeting from "../../components/Greetings";
import Animatedcounter from "../../components/Animatedcounter";

function AdminDashboard() {
  const [overview, setOverview] = useState({
    totalUsers: 0,
    verifiedUsers: 0,
    pendingUsers: 0,
    newUsers: [],
  });
  const [stats, setStats] = useState({
    totalStudents: 0,
    unassignedLeads: 0,
    assignedLeads: 0,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Refs for intervals
  const newUsersIntervalRef = useRef(null);
  const overviewIntervalRef = useRef(null);
  const statsIntervalRef = useRef(null);

  // Fetch unverified users
  useEffect(() => {
    const fetchNewUsers = async () => {
      try {
        const resp = await axios.get(`${BASEURL}/admin/unverified`);
        setOverview((prev) => ({
          ...prev,
          newUsers: resp.data,
        }));
      } catch (err) {
        console.error("Error fetching new users:", err);
      }
    };

    fetchNewUsers();
    newUsersIntervalRef.current = setInterval(fetchNewUsers, 1000); 

    return () => {
      if (newUsersIntervalRef.current) clearInterval(newUsersIntervalRef.current);
    };
  }, []);

  // Fetch user overview
  useEffect(() => {
    const fetchOverview = async () => {
      try {
        const resp = await axios.get(`${BASEURL}/admin/user-overview`);
        setOverview((prev) => ({
          ...prev,
          totalUsers: resp.data.totalUsers,
          verifiedUsers: resp.data.verifiedUsers,
          pendingUsers: resp.data.pendingUsers,
        }));
      } catch (err) {
        console.error("Failed to fetch admin overview:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchOverview();
    overviewIntervalRef.current = setInterval(fetchOverview, 1000); 

    return () => {
      if (overviewIntervalRef.current) clearInterval(overviewIntervalRef.current);
    };
  }, []);

  // Fetch leads & students stats
  useEffect(() => {
    const fetchStats = async () => {
      try {
        const resp = await axios.get(`${BASEURL}/admin/leads-overview`);
        if (resp.data.success) {
          setStats(resp.data.data);
        } else {
          setError("Failed to fetch stats");
        }
      } catch (err) {
        console.error("Error fetching dashboard stats", err);
        setError("Server error");
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
    statsIntervalRef.current = setInterval(fetchStats, 1000); 

    return () => {
      if (statsIntervalRef.current) clearInterval(statsIntervalRef.current);
    };
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
                <Greeting />
                {newUsers.length > 0 && (
                  <span className="badge bg-warning text-dark">
                    {newUsers.length} New
                  </span>
                )}
              </div>

              {newUsers.length > 0 ? (
                <div className="alert alert-warning new-users-alert p-3 position-relative">
                  <strong>{newUsers.length}</strong>{" "}
                  {newUsers.length === 1 ? "user" : "users"} awaiting verification...
                  <ul className="list-unstyled mt-2 mb-3">
                    {newUsers.slice(0, 5).map((user) => {
                      const regTime = new Date(user.createdAt);
                      const formatted = regTime
                        .toLocaleDateString("en-GB", {
                          day: "2-digit",
                          month: "short",
                          year: "numeric",
                          hour: "2-digit",
                          minute: "2-digit",
                          second: "2-digit",
                          hour12: true,
                        })
                        .replace(/ /g, "-");

                      return (
                        <li key={user._id} className="d-flex align-items-center mb-1">
                          <i className="bi bi-person-circle me-2" />
                          <div>
                            <div>
                              {user.username} ({user.email})
                            </div>
                            <small className="text-muted">
                              Registered: {formatted}{" "}
                            </small>
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

              {/* User Metrics Row */}
              <div className="row mt-4 gx-3 gy-3">
                <div className="col-md-4">
                  <div className="metric-card p-3 card-total-users">
                    <h5>Total Users</h5>
                    <p className="fs-4"><Animatedcounter value={totalUsers} /></p>
                  </div>
                </div>
                <div className="col-md-4">
                  <div className="metric-card p-3 card-verified-users">
                    <h5>Verified</h5>
                    <p className="fs-4"><Animatedcounter value={verifiedUsers} /></p>
                  </div>
                </div>
                <div className="col-md-4">
                  <div className="metric-card p-3 card-pending-users">
                    <h5>Pending</h5>
                    <p className="fs-4"><Animatedcounter value={pendingUsers} /></p>
                  </div>
                </div>
              </div>

             
              <section className="metrics mt-4">
                <div className="metric">
                  <strong><Animatedcounter value={stats.totalStudents}  /></strong>
                  <span>Total Students</span>
                </div>
                <div className="metric">
                  <strong><Animatedcounter value={stats.unassignedLeads} /></strong>
                  <span>Unassigned Leads</span>
                </div>
                <div className="metric">
                  <strong><Animatedcounter value={stats.assignedLeads} /></strong>
                  <span>Assigned Leads</span>
                </div>
              </section>
            </div>
          </main>
        </div>
      </div>
    </Layout>
  );
}

export default AdminDashboard;
