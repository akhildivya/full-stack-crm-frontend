import React, { useEffect, useState } from 'react'
import { NavLink } from 'react-router-dom'
import '../../css/admin.css'
import axios from 'axios';
import { useAuth } from '../../context/auth';
import { FaCheckCircle, FaTimesCircle } from "react-icons/fa";
import { BASEURL } from '../../service/baseUrl';

function Usermenu() {
  const [verified, setVerified] = useState(null);
  const [auth] = useAuth();
  const user = auth.user;
  const username = auth?.user?.username ?? 'User';
  const userType = auth?.user?.userType ? ` (${auth.user.userType})` : '';

  const linkClass = ({ isActive }) =>
    `list-group-item d-flex align-items-center ${isActive ? 'active' : ''}`;

  useEffect(() => {
    let intervalId;

    const fetchStatus = async () => {
      try {
        const response = await axios.get(`${BASEURL}/status`);
        if (response.data && typeof response.data.verified !== 'undefined') {
          setVerified(response.data.verified);
        }
      } catch (error) {
       /* console.error('Error fetching verified status:', error);*/
      }
    };

    if (user) {

      fetchStatus();

      intervalId = setInterval(fetchStatus, 1000);
    }


    return () => {
      if (intervalId) {
        clearInterval(intervalId);
      }
    };

  }, [user]);


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
            <h5 className="m-0">{username}{userType}</h5>
            <StatusIcon className='m-1 p-1' verified={verified} />
          </div>

          <div className="list-group">

            <NavLink to="/user-dashboard/profile" className={linkClass}>
              <i className="bi bi-person-circle me-2" aria-hidden="true"></i>
              <span>My profile</span>
            </NavLink>

            <NavLink to="/user-dashboard/daily-duty" className={linkClass}>
              <i className="bi bi-calendar-date-fill me-2" aria-hidden="true"></i>
              <span>Daily routine</span>
            </NavLink>

            <NavLink to="/user-dashboard/completed-tasks" className={linkClass}>
              <i className="bi bi-card-checklist me-2" aria-hidden="true"></i>
              <span>Body of work</span>
            </NavLink>
          </div>

        </div>
      </nav>

    </>
  )
}

export default Usermenu