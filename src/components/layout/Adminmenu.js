
import { NavLink } from 'react-router-dom'
import '../../css/admin.css'
import { useAuth } from '../../context/auth';


function Adminmenu() {
const [auth] = useAuth(); // Destructure the auth state
  const username = auth?.user?.username ?? 'Admin';
  const userType = auth?.user?.userType ? ` (${auth.user.userType})` : '';
  const linkClass = ({ isActive }) =>
    `list-group-item d-flex align-items-center ${isActive ? 'active' : ''}`;
  return (
    <>
      {/* <div className="list-group">
        <h4>Admin Panel</h4>

        <NavLink to="/admin-dashboard/all-users" className="list-group-item list-group-item-NavLinkcation  NavLinkctive">Allusers</NavLink>
        <NavLink to="/admin-dashboard/about" className="list-group-item list-group-item-NavLinkaction  ">About</NavLink>
        <NavLink to="/admin-dashboard/contact" className="list-group-item list-group-item-NavLinkaction ">Contact</NavLink>

      </div>*/}
      <nav className="admin-sidebar">
        <div className="admin-panel p-3">
          <div className="brand mb-3 d-flex align-items-center">
            <div className="brand-icon me-2">
              <i className="bi bi-shield-lock-fill" aria-hidden="true"></i>
            </div>
            <h5 className="m-0"> {username}{userType}</h5>
          </div>

          <div className="list-group">
            <NavLink to="/admin-dashboard/all-users" className={linkClass}>
              <i className="bi bi-people-fill me-2" aria-hidden="true"></i>
              <span>All users</span>
            </NavLink>

            <NavLink to="/admin-dashboard/about" className={linkClass}>
              <i className="bi bi-info-circle-fill me-2" aria-hidden="true"></i>
              <span>About</span>
            </NavLink>

            <NavLink to="/admin-dashboard/contact" className={linkClass}>
              <i className="bi bi-telephone-fill me-2" aria-hidden="true"></i>
              <span>Contact</span>
            </NavLink>

          
          </div>


        </div>
      </nav>
    </>

  )

}
export default Adminmenu
