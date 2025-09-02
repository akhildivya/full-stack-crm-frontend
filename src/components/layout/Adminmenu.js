
import { NavLink } from 'react-router-dom'
import '../../css/adminmenu.css'
function Adminmenu() {
    const linkClass = ({ isActive }) =>
        `list-group-item list-group-item-action ${isActive ? "active" : ""}`;
    return (
        <>
            {/* <div className="list-group">
                <h4>Admin Panel</h4>

                <NavLink to="/admin-dashboard/all-users" className="list-group-item list-group-item-NavLinkcation  NavLinkctive">Allusers</NavLink>
                <NavLink to="/admin-dashboard/about" className="list-group-item list-group-item-NavLinkaction  ">About</NavLink>
                <NavLink to="/admin-dashboard/contact" className="list-group-item list-group-item-NavLinkaction ">Contact</NavLink>
                
            </div>*/}
            {/* Heading shown on md+ - on small screens the toggler in Dashboard shows 'Menu' */}
            {/* Heading shown on md+ - on small screens the toggler in Dashboard shows 'Menu' */}
       {/* Heading shown on md+ - on small screens the toggler in Dashboard shows 'Menu' */}
      <div className="d-none d-md-block mb-3 admin-panel-heading">
        <h4>Admin Panel</h4>
      </div>

      {/* collapse id matches data-bs-target in AdminDashboard's toggle button */}
      <div className="list-group collapse d-md-block admin-sidebar" id="adminSidebar">
        <NavLink to="/admin-dashboard/all-users" className={linkClass}>
          <span className="admin-link-text">All users</span>
        </NavLink>

        <NavLink to="/admin-dashboard/about" className={linkClass}>
          <span className="admin-link-text">About</span>
        </NavLink>

        <NavLink to="/admin-dashboard/contact" className={linkClass}>
          <span className="admin-link-text">Contact</span>
        </NavLink>
      </div>
        </>


    )

}
export default Adminmenu
