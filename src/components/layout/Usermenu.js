import React, { useEffect, useState } from 'react'
import { NavLink } from 'react-router-dom'
import '../../css/admin.css'
import axios from 'axios';
import { useAuth } from '../../context/auth';
import { FaCheckCircle, FaTimesCircle } from "react-icons/fa";

function Usermenu() {
  const [verified, setVerified] = useState(null);
  const [auth] = useAuth(); 
  const username = auth?.user?.username ?? 'Admin';
  const userType = auth?.user?.userType ? ` (${auth.user.userType})` : '';

  const linkClass = ({ isActive }) =>
    `list-group-item d-flex align-items-center ${isActive ? 'active' : ''}`;

  useEffect(() => {
    // Fetch user's verification status
    axios.get('http://localhost:4000/status')
      .then(response => setVerified(response.data.verified))
      .catch(error => console.error(error));
  }, []);


  const StatusIcon = ({ verified }) => {
    return verified ? (
      <FaCheckCircle style={{ color: "green" }} size={20} aria-label="Verified" />
    ) : (
      <FaTimesCircle style={{ color: "red" }} size={20} aria-label="Not Verified" />
    );
  }
  return (

    <>

      <nav className="admin-sidebar">
        <div className="admin-panel p-3">
          <div className="brand mb-3 d-flex align-items-center">
            <div className="brand-icon me-2">
              <i className="bi bi-shield-lock-fill" aria-hidden="true"></i>
            </div>
            <h6 className="m-0">{username}{userType}</h6>
            <StatusIcon className='m-1 p-1'  verified={verified} />
          </div>

          <div className="list-group">

            <NavLink to="/user-dashboard/profile" className={linkClass}>
              <i className="bi bi-people-fill me-2" aria-hidden="true"></i>
              <span>My Profile</span>
            </NavLink>




          </div>


        </div>
      </nav>





    </>
  )
}

export default Usermenu