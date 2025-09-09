
import { NavLink } from 'react-router-dom'
import '../../css/admin.css'


function Adminmenu() {
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
<div className="d-none d-md-block admin-sidebar">
        <div className="sidebar-brand">
          <div className="logo">AH</div>
          <div>
            <strong>Admin</strong>
            <div className="text-muted small">Dashboard</div>
          </div>
        </div>

        <div className="list-group">
          <NavLink to="/admin-dashboard/all-users" className={linkClass}>
            <i className="bi bi-people-fill"></i>
            <span className="nav-text">All users</span>
          </NavLink>

          <NavLink to="/admin-dashboard/about" className={linkClass}>
            <i className="bi bi-info-circle-fill"></i>
            <span className="nav-text">About</span>
          </NavLink>

          <NavLink to="/admin-dashboard/contact" className={linkClass}>
            <i className="bi bi-envelope-fill"></i>
            <span className="nav-text">Contact</span>
          </NavLink>
        </div>

        <div className="sidebar-accent" />
      </div>

      {/* Mobile: offcanvas button + offcanvas menu */}
      <div className="d-md-none">
        <button
          className="btn btn-outline-light w-100 mb-2"
          type="button"
          data-bs-toggle="offcanvas"
          data-bs-target="#adminOffcanvas"
          aria-controls="adminOffcanvas"
        >
          <i className="bi bi-list" /> Menu
        </button>

        <div className="offcanvas offcanvas-start text-bg-dark" tabIndex="-1" id="adminOffcanvas" aria-labelledby="adminOffcanvasLabel">
          <div className="offcanvas-header">
            <h5 className="offcanvas-title" id="adminOffcanvasLabel">Admin</h5>
            <button type="button" className="btn-close btn-close-white" data-bs-dismiss="offcanvas" aria-label="Close"></button>
          </div>
          <div className="offcanvas-body">
            <div className="list-group">
              <NavLink to="/admin-dashboard/all-users" className={({isActive}) => `list-group-item ${isActive ? 'active' : ''}`} data-bs-dismiss="offcanvas">
                <i className="bi bi-people-fill" /> All users
              </NavLink>
              <NavLink to="/admin-dashboard/about" className={({isActive}) => `list-group-item ${isActive ? 'active' : ''}`} data-bs-dismiss="offcanvas">
                <i className="bi bi-info-circle-fill" /> About
              </NavLink>
              <NavLink to="/admin-dashboard/contact" className={({isActive}) => `list-group-item ${isActive ? 'active' : ''}`} data-bs-dismiss="offcanvas">
                <i className="bi bi-envelope-fill" /> Contact
              </NavLink>
            </div>
          </div>
        </div>
      </div>
    </>

  )

}
export default Adminmenu
