
import { NavLink } from 'react-router-dom'
import '../../css/admin.css'
import { useAuth } from '../../context/auth';
import { FaCheckCircle, FaTimesCircle } from "react-icons/fa";
import { useEffect, useState } from 'react';
import axios from 'axios';
import { BASEURL } from '../../service/baseUrl';

function Adminmenu() {
  const [verified, setVerified] = useState(null);
  const [auth] = useAuth(); // Destructure the auth state
  const user = auth.user;
  const username = auth?.user?.username ?? 'Admin';
  const userType = auth?.user?.userType ? ` (${auth.user.userType})` : '';
  const linkClass = ({ isActive }) =>
    `list-group-item d-flex align-items-center ${isActive ? 'active' : ''}`;

  useEffect(() => {
    // Fetch admin's verification status
    if (user) {
      axios.get(`${BASEURL}/admin-status`)
        .then(response => setVerified(response.data.verified))
        .catch(error => console.error(error));
    }

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
            <h5 className="m-0"> {username}{userType}</h5>
            <StatusIcon className='m-1 p-1' verified={verified} />
          </div>

          <div className="list-group">
            <NavLink to="/admin-dashboard/my-profile" className={linkClass}>
              <i className="bi bi-person-circle me-2" aria-hidden="true"></i>
              <span>My profile</span>

            </NavLink>
            <NavLink to="/admin-dashboard/all-users" className={linkClass}>
              <i className="bi bi-person-check-fill me-2" aria-hidden="true"></i>
              <span>Verify users</span>
            </NavLink>


            <NavLink to="/admin-dashboard/upload-sheet" className={linkClass}>
              <i className="bi bi-file-earmark-excel-fill me-2" aria-hidden="true"></i>
              <span>Attach sheet</span>
            </NavLink>

            <NavLink to="/admin-dashboard/student-details" className={linkClass}>
              <i className="bi bi-person-lines-fill me-2" aria-hidden="true"></i>
              <span>Registry</span>
            </NavLink>

            <NavLink to="/admin-dashboard/alloted-duties" className={linkClass}>
              <i className="bi bi-bar-chart-steps me-2" aria-hidden="true"></i>
              <span>Stat/lead</span>
            </NavLink>

            <NavLink to="/admin-dashboard/work-report" className={linkClass}>
              <i className="bi bi-filetype-pdf me-2" aria-hidden="true"></i>
              <span>Work report</span>
            </NavLink>

            <NavLink to="/admin-dashboard/summary-report" className={linkClass}>
              <i className="bi bi-file-pdf me-2" aria-hidden="true"></i>
              <span>Summary</span>
            </NavLink>

            <NavLink to="/admin-dashboard/user-performance" className={linkClass}>
              <i className="bi bi-trophy-fill me-2" aria-hidden="true"></i>
              <span>Performance</span>
            </NavLink>

            <NavLink to="/admin-dashboard/follow-up" className={linkClass}>
              <i className="bi bi-archive me-2" aria-hidden="true"></i>
              <span>Follow up</span>
            </NavLink>

          </div>
        </div>
      </nav>
    </>

  )

}
export default Adminmenu
