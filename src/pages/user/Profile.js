import React, { useEffect, useState } from 'react'
import Layout from '../../components/layout/Layout'
import Usermenu from '../../components/layout/Usermenu'
import '../../css/admin.css'
import axios from 'axios'
import { useAuth } from '../../context/auth'
import { editUserProfileApi } from '../../service/allApis'
import { useNavigate } from 'react-router-dom'
import ConfirmDeleteModal from './ConfirmDeleteModal'
import { BASEURL } from '../../service/baseUrl'
import { toast } from 'react-toastify';
function Profile() {
  const navigate = useNavigate()
  const [auth, setAuth] = useAuth();
  const [user, setUser] = useState(auth.user || null);
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState(user);
  const [showModal, setShowModal] = useState(false);
  const [errors, setErrors] = useState({});
  const [selectedUser, setSelectedUser] = useState(null);


  useEffect(() => {
    let mounted = true;
    const fetchProfile = async () => {
      try {
        const res = await axios.get(`${BASEURL}/my-profile`);
        if (!mounted) return;
        setUser(res.data);
        // keep edit form in sync when not editing
        if (!editing) setForm(res.data);
      } catch (err) {
        console.error('Profile poll failed', err);
      }
    };

    fetchProfile();                    // initial load
    const id = setInterval(fetchProfile, 1000); // every 5s (tune as needed)

    return () => {
      mounted = false;
      clearInterval(id);
    };
  }, [editing]);



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
    setForm((prev) => ({ ...prev, [name]: value }));

    const errorMsg = validate(name, value);
    setErrors((prev) => ({ ...prev, [name]: errorMsg }));
  };


  const handleSave = async () => {
    const newErrors = {};
    ['username', 'email', 'phone'].forEach((field) => {
      const error = validate(field, form[field]);
      if (error) newErrors[field] = error;
    });
    if (Object.keys(newErrors).length) {
      setErrors(newErrors);
      return;
    }

    setEditing(false);
    try {
     
      const res = await editUserProfileApi(form)
      const updatedUser = res.data; // ensure this is the updated user object

      // Update local component state
      setUser(updatedUser);
      setForm(updatedUser);


      // IMPORTANT: update global auth state so other components re-render
      setAuth(prev => ({ ...prev, user: updatedUser }));
      setEditing(false);
      toast.success('Profile updated successfully!', { position: 'top-center' });

      // If you also store auth in localStorage separately, update that too (AuthProvider already handles persistence)
      // localStorage.setItem('auth', JSON.stringify({ ...auth, user: updatedUser }));

    } catch (err) {
      console.error('Save failed', err);
      if (err.response?.status === 400) {
        // backend returns msg e.g. 'Email already exists' or 'Phone number already exists'
        toast.error(err.response.data.message, { position: 'top-center' });
        return;
      } else {
        toast.error('Error updating profile. Please try again.', { position: 'top-center' });
      }

    }
  };

  if (user == null) return <div className="loader-overlay">
    <div className="loader-box">
      <div className="spinner"></div>
      <p className="loader-text">Loading...</p>
    </div>
  </div>

  const confirmDelete = async () => {
    if (!selectedUser) return;

    try {
      await axios.delete(`${BASEURL}/delete-user/${selectedUser._id}`);
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
    <Layout title={"CRM - User Profile"}>

      <div className="container-fluid m-3 p-3 admin-root">
        <div className="row">
          <aside className="col-md-3">
            <Usermenu />
          </aside>

          <main className="col-md-9">

            <div className="card admin-card p-4">

              <table className="profile-table table">
                <thead>
                  <tr>
                    <th>Name</th>
                    <th>Email</th>
                    <th>Phone</th>
                    <th>Verified</th>
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
                    <td >
                      {user.verified == null
                        ? 'Loading…'
                        : user.verified
                          ? 'Verified'
                          : 'Not Verified'}
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
              <ConfirmDeleteModal
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

export default Profile