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

            <div className="card user-profile-card">
              {!editing ? (
                <>
                  <h3>{user?.username}</h3>
                  <p>Email: {user?.email}</p>
                  <p>Phone: {user?.phone}</p>
                  <p>
                    Status: {user?.verified == null ? 'Loading...' : user.verified ? 'Verified' : 'Not Verified'}
                  </p>
                  <button className="btn btn-primary" onClick={() => { setForm(user); setEditing(true); }}>
                    Edit
                  </button>
                </>
              ) : (
                <>
                  <input
                    type="text"
                    className="form-control"
                    name="username"
                    value={form.username}
                    onChange={handleChange}
                  />
                  <input
                    type="email"
                    className="form-control"
                    name="email"
                    value={form.email}
                    onChange={handleChange}
                  />
                  <input
                    type="tel"
                    className="form-control"
                    name="phone"
                    value={form.phone}
                    onChange={handleChange}
                  />
                  <button className="btn btn-success" onClick={handleSave}>
                    Save
                  </button>
                  <button className="btn btn-secondary mt-2" onClick={() => setEditing(false)}>
                    Cancel
                  </button>
                </>
              )}
            </div>

          </main>
        </div>
      </div>


    </Layout>
  )
}

export default Profile