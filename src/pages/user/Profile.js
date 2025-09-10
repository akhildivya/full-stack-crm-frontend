import React, { useEffect, useState } from 'react'
import Layout from '../../components/layout/Layout'
import Usermenu from '../../components/layout/Usermenu'
import '../../css/admin.css'
import axios from 'axios'
function Profile() {
  const [user, setUser] = useState(null);
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState({});
  const [verified, setVerified] = useState(null);
  useEffect(() => {
    axios.get('http://localhost:4000/my-profile')
      .then(res => setUser(res.data))
      .catch(err => console.error(err));
  }, []);
  console.log(user);


  const handleChange = e => {
    setForm({ ...form, [e.target.name]: e.target.value });
  }; const handleSave = () => {
    axios.put('http://localhost:4000/my-profile', form)
      .then(res => {
        setUser(res.data);
        setEditing(false);
      })
      .catch(err => console.error(err));
  };

  if (!user) return <p>Loading...</p>;

  return (
    <Layout title={"CRM-User profile"}>

      <div className="container-fluid m-3 p-3 admin-root">
        <div className="row">
          <aside className="col-md-3">
            <Usermenu />
          </aside>

          <main className="col-md-9">

            <div className="card admin-card p-4">

              <div className="user-profile-table-container">
                {!editing ? (
                  <table className="profile-table">
                    <tbody>
                      <tr><th>Username:</th><td>{user?.username}</td></tr>
                      <tr><th>Email:</th><td>{user?.email}</td></tr>
                      <tr><th>Phone:</th><td>{user?.phone}</td></tr>
                      <tr><th>Status:</th><td>{user?.verified == null ? 'Loading...' : user.verified ? 'Verified' : 'Not Verified'}</td></tr>
                      <tr><td colSpan="2" className="text-center actions-cell">
                        <button className="btn btn-primary " onClick={() => { setForm(user); setEditing(true); }}>Edit</button>
                      </td></tr>
                    </tbody>
                  </table>
                ) : (
                  <form className="profile-table">
                    <tbody>
                      <tr>
                        <th><label htmlFor="username">Username:</label></th>
                        <td><input type="text" id="username" name="username" value={form.username} onChange={handleChange} className="form-control" /></td>
                      </tr>
                      <tr>
                        <th><label htmlFor="email">Email:</label></th>
                        <td><input type="email" id="email" name="email" value={form.email} onChange={handleChange} className="form-control" /></td>
                      </tr>
                      <tr>
                        <th><label htmlFor="phone">Phone:</label></th>
                        <td><input type="tel" id="phone" name="phone" value={form.phone} onChange={handleChange} className="form-control" /></td>
                      </tr>
                      <tr>
                        <td colSpan="2" className="text-center actions-cell">
                          <button type="button" className="btn btn-success me-2" onClick={handleSave}>Save</button>
                          <button type="button" className="btn btn-secondary" onClick={() => setEditing(false)}>Cancel</button>
                        </td>
                      </tr>
                    </tbody>
                  </form>
                )}
              </div>
            </div>
          </main>
        </div>
      </div>


    </Layout>
  )
}

export default Profile