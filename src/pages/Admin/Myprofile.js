import React, { useEffect, useState } from 'react'
import Layout from '../../components/layout/Layout'
import Adminmenu from '../../components/layout/Adminmenu'
import '../../css/admin.css'
import axios from 'axios'
import { useAuth } from '../../context/auth'
import { useNavigate } from 'react-router-dom'
import AdminConfirmDelete from './AdminConfirmDelete'

function Myprofile() {
  const navigate = useNavigate()
  const [auth, setAuth] = useAuth();
  const [user, setUser] = useState(auth.user || null);
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState(user);
  const [showModal, setShowModal] = useState(false);
  const [errors, setErrors] = useState({});
  const [selectedUser, setSelectedUser] = useState(null);
  useEffect(() => {
    axios.get('http://localhost:4000/admin-profile')
      .then(res => setUser(res.data))
      .catch(err => console.error(err));
  }, []);
  console.log(user);



  const validate = (name, value) => {
    let error;
    if (name === "username") {
      if (!value) {
        error = "username is required";
      } else if (!/^[A-Z]/.test(value)) {
        error = "first letter must be uppercase";
      }
      else if (value.length < 3) {
        error = "minimum 3 characters";
      } else if (value.length > 25) {
        error = "maximum 25 characters";
      } else if (!/^[A-Za-z ]+$/.test(value)) {
        error = "letters and spaces only";
      }
    }

    if (name === "email") {
      if (!value) {
        error = "email is required";
      } else if (!/^[\w.-]+@[\w-]+\.[A-Za-z]{2,}$/.test(value)) {
        error = "invalid email address";
      }
    }

    if (name === "phone") {
      if (!value) {
        error = "mobile number is required";
      } else if (value.length < 10) {
        error = "minimum 10 digits";
      } else if (value.length > 15) {
        error = "maximum 15 characters";
      } else if (!/^\+?[0-9]{10,15}$/.test(value)) {
        error = "invalid mobile number format";
      }
    }
    return error;
  };
  const openModal = (user) => {
    setSelectedUser(user);
    setShowModal(true);
  };

  const closeModal = () => {
    setSelectedUser(null);
    setShowModal(false);
  };

  const handleChange = e => {
    const { name, value } = e.target;
    setForm({
      ...form,
      [name]: name === "verified" ? (value === "true") : value
    });

    const errorMsg = validate(name, value);
    setErrors((prev) => ({ ...prev, [name]: errorMsg }));
  };
  const handleCheckboxChange = e => {
    const { name, checked } = e.target;
    setForm(prev => ({
      ...prev,
      [name]: checked
    }));

    // maybe clear any errors
    setErrors(prev => ({
      ...prev,
      [name]: null
    }));
  };

  const handleSave = async () => {
    const newErrors = {};
    ['username', 'email', 'phone', 'verified'].forEach((field) => {
      const error = validate(field, form[field]);
      if (error) newErrors[field] = error;
    });
    if (Object.keys(newErrors).length) {
      setErrors(newErrors);
      return;
    }

    setEditing(false);
    try {
      const res = await axios.put('http://localhost:4000/admin-profile', form); // adapt to your API

      const updatedUser = res.data; // ensure this is the updated user object

      // Update local component state
      setUser(updatedUser);
      setForm(updatedUser);
      setEditing(false);

      // IMPORTANT: update global auth state so other components re-render
      setAuth(prev => ({ ...prev, user: updatedUser }));

      // If you also store auth in localStorage separately, update that too (AuthProvider already handles persistence)
      // localStorage.setItem('auth', JSON.stringify({ ...auth, user: updatedUser }));

    } catch (err) {
      console.error('Save failed', err);
    }
  };

  if (user == null) return <p>Loading...</p>;
  {/* const handleDelete = async userId => {
    try {
      await axios.delete(`http://localhost:4000/delete-user/${userId}`);
      navigate('/');
      // Optionally, redirect or update UI
    } catch (err) {
      console.error(err.response?.data || err.message);
    }
    
  };*/}
  const confirmDelete = async () => {
    if (!selectedUser) return;

    try {
      await axios.delete(`http://localhost:4000/admin-delete/${selectedUser._id}`);
      // Optionally update the UI list immediately:

      setAuth(prev => ({ ...prev, user: null, token: '' }));
      try { localStorage.removeItem('auth'); } catch (e) { /* ignore */ }
      closeModal();
      navigate('/'); // redirect to home
    } catch (err) {
      console.error('Error deleting user:', err.response?.data || err.message);
      closeModal();
    }
  };
  return (
    <Layout title={"CRM- Admin Profile"}>

      <div className="container-fluid m-3 p-3 admin-root">
        <div className="row">
          <aside className="col-md-3">
            <Adminmenu />
          </aside>

          <main className="col-md-9">

            <div className="card admin-card p-4">

              <table className="profile-table table">
                <thead>
                  <tr>
                    <th>Name</th>
                    <th>Email</th>
                    <th>Phone</th>
                    <th>Status</th>
                    <th>Edit</th>
                    <th>Delete</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    {/* Name */}
                    <td >
                      {editing ? (
                        <>
                          <input
                            type="text"
                            name="username"
                            value={form.username}
                            onChange={handleChange}
                            className={`form-control ${errors.username ? 'is-invalid' : ''}`}
                          />
                          {errors.username && <div className="invalid-feedback">{errors.username}</div>}
                        </>
                      ) : (
                        user.username
                      )}
                    </td>

                    {/* Email */}
                    <td >
                      {editing ? (
                        <>
                          <input
                            type="email"
                            name="email"
                            value={form.email}
                            onChange={handleChange}
                            className={`form-control ${errors.email ? 'is-invalid' : ''}`}
                          />
                          {errors.email && <div className="invalid-feedback">{errors.email}</div>}
                        </>
                      ) : (
                        user.email
                      )}
                    </td>

                    {/* Phone */}
                    <td >
                      {editing ? (
                        <>
                          <input
                            type="tel"
                            name="phone"
                            value={form.phone}
                            onChange={handleChange}
                            className={`form-control ${errors.phone ? 'is-invalid' : ''}`}
                          />
                          {errors.phone && <div className="invalid-feedback">{errors.phone}</div>}
                        </>
                      ) : (
                        user.phone
                      )}
                    </td>

                    {/* Verified */}
                    <td>
                      {editing ? (
                        <div className="form-check">
                          <input
                            type="checkbox"
                            name="verified"
                            checked={!!form.verified}
                            onChange={handleCheckboxChange}
                            className="form-check-input"
                            id="verifiedCheckbox"
                          />
                          <label className="form-check-label" htmlFor="verifiedCheckbox">
                            Verified
                          </label>
                        </div>
                      ) : (
                        user.verified == null
                          ? 'Loading…'
                          : (user.verified ? '✓' : '✗')
                      )}
                    </td>
                    {/* Edit / Save / Cancel */}
                    <td className="text-center">
                      {editing ? (
                        <>
                          <button
                            type="button"
                            className="btn btn-success me-2 "
                            onClick={handleSave}
                          >
                            Save
                          </button>
                          <button
                            type="button"
                            className="btn btn-secondary mt-2"
                            onClick={() => {
                              setForm(user);
                              setEditing(false);
                            }}
                          >
                            Cancel
                          </button>
                        </>
                      ) : (
                        <button
                          type="button"
                          className="btn btn-primary"
                          onClick={() => {
                            setForm(user);
                            setEditing(true);
                          }}
                        >
                          Edit
                        </button>
                      )}
                    </td>

                    {/* Delete */}
                    <td className="text-center">
                      <button
                        type="button"
                        className="btn btn-danger"
                        onClick={() => openModal(user)}
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                </tbody>
              </table>
              <AdminConfirmDelete
                show={showModal}
                onHide={closeModal}
                onConfirm={confirmDelete}
                userName={selectedUser?.username}
              />
            </div>
          </main>

        </div>
      </div>

    </Layout>
  )
}

export default Myprofile