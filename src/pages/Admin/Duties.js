import React, { useEffect, useState } from 'react'
import Layout from '../../components/layout/Layout'
import Adminmenu from '../../components/layout/Adminmenu'
import { Spinner, Table } from 'react-bootstrap'
import axios from 'axios'
import { BASEURL } from '../../service/baseUrl'

function Duties() {
  const [stats, setStats] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const formatDate = (dateVal) => {
    if (!dateVal) return '—';
    const d = new Date(dateVal);
    const day = String(d.getDate()).padStart(2, '0');
    const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sept", "Oct", "Nov", "Dec"];
    const month = monthNames[d.getMonth()];
    const year = d.getFullYear();
    return `${day}-${month}-${year}`;
  };
  useEffect(() => {
    const fetchStats = async () => {
      try {
        const res = await axios.get(`${BASEURL}/admin/users-assignment-stats`);
        setStats(res.data);
      } catch (err) {
        console.error("Error fetching stats", err);
        setError("Failed to fetch data");
      } finally {
        setLoading(false);
      }
    };
    fetchStats();
  }, []);
  if (loading) return <Spinner animation="border" />;
  if (error) return <div>{error}</div>;
  return (
    <Layout title={"CRM- Allotted Duties"}>

      <div className="container-fluid m-3 p-3 admin-root">
        <div className="row">
          <aside className="col-md-3">
            <Adminmenu />
          </aside>

          <main className="col-md-9">
            <div className="card admin-card p-4">
              <h4>Duties</h4>
              <Table striped bordered hover>
                <thead>
                  <tr>
                    <th>#</th>
                    <th>Username</th>
                    <th>Email</th>
                    <th>Assigned Count</th>
                    <th>Last Assigned Date</th>
                  </tr>
                </thead>
                <tbody>
                  {stats.map((u, idx) => (
                    <tr key={u.userId || idx}>
                      <td>{idx + 1}</td>
                      <td>{u.username}</td>
                      <td>{u.email}</td>
                      <td>{u.count}</td>
                      <td>{formatDate(u.lastAssigned)}</td>
                    </tr>
                  ))}
                </tbody>
              </Table>
            </div>
          </main>
        </div>
      </div>

    </Layout>
  )
}

export default Duties