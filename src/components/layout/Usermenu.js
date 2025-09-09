import React from 'react'
import { NavLink } from 'react-router-dom'
import '../../css/user.css'
function Usermenu() {
  return (
    <>
       {/* <div className="list-group">
        <h4>User Panel</h4>

        <NavLink to="/user-dashboard/profile" className="list-group-item list-group-item-NavLinkcation  NavLinkctive">My Profile</NavLink>
        <NavLink to="" className="list-group-item list-group-item-NavLinkaction  ">Daily Tasks</NavLink>
        <NavLink to="" className="list-group-item list-group-item-NavLinkaction ">Completed tasks</NavLink>

      </div>*/}
      <div className="d-md-none mb-3">
<button className="btn btn-sm btn-outline-light" type="button" data-bs-toggle="offcanvas" data-bs-target="#userSidebar" aria-controls="userSidebar">
☰ Menu
</button>
</div>


{/* Offcanvas for small screens */}
<div className="offcanvas offcanvas-start text-bg-dark" tabIndex="-1" id="userSidebar" aria-labelledby="userSidebarLabel">
<div className="offcanvas-header">
<h5 className="offcanvas-title" id="userSidebarLabel">User Panel</h5>
<button type="button" className="btn-close btn-close-white" data-bs-dismiss="offcanvas" aria-label="Close"></button>
</div>
<div className="offcanvas-body">
<div className="list-group">
<NavLink to="/user-dashboard/profile" className={({isActive})=> isActive ? 'list-group-item active' : 'list-group-item'}>My Profile</NavLink>
<NavLink to="" className={({isActive})=> isActive ? 'list-group-item active' : 'list-group-item'}>Daily Tasks</NavLink>
<NavLink to="" className={({isActive})=> isActive ? 'list-group-item active' : 'list-group-item'}>Completed Tasks</NavLink>
</div>
</div>
</div>


{/* Always-visible sidebar on md+ screens */}
<div className="d-none d-md-block user-sidebar p-3">
<h6 className="panel-heading">User Panel</h6>
<div className="list-group">
<NavLink to="/user-dashboard/profile" className={({isActive})=> isActive ? 'list-group-item active' : 'list-group-item'}>My Profile</NavLink>
<NavLink to="/user-dashboard/daily-tasks" className={({isActive})=> isActive ? 'list-group-item active' : 'list-group-item'}>Daily Tasks</NavLink>
<NavLink to="/user-dashboard/completed" className={({isActive})=> isActive ? 'list-group-item active' : 'list-group-item'}>Completed Tasks</NavLink>
</div>
</div>
    </>
  )
}

export default Usermenu