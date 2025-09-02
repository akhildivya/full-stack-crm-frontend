import React from 'react'
import Layout from '../../components/layout/Layout'
import Adminmenu from '../../components/layout/Adminmenu'
import '../../css/admindash.css'
function Admindashboard() {
  return (
    <Layout title={'CRM- Admin-Dashboard'}>
        
        {/*<div className='container-fluid m-3 p-3'>
          <div className='row'>
            <div className='col-md-3'>
              <Adminmenu />
            </div>
            <div className='col-md-9'>
                <div className='card w-75 p-3'>

                </div>
            </div>
          </div>

        </div>*/}
 <div className="container-fluid m-3 p-3">
      <div className="row">
        {/* Sidebar column */}
        <aside className="col-12 col-md-3 mb-3">
          {/* mobile-only toggle button (Bootstrap collapse) */}
          <div className="d-md-none mb-2">
            <button
              className="btn menu-btn w-100"
              type="button"
              data-bs-toggle="collapse"
              data-bs-target="#adminSidebar"
              aria-expanded="false"
              aria-controls="adminSidebar"
            >
              ☰ Menu
            </button>
          </div>

          <Adminmenu />
        </aside>

        {/* Main content column */}
        <main className="col-12 col-md-9">
          <div className="card p-3 admin-card w-100">
            <h4>Admin Dashboard</h4>
            <p className="mb-0">Welcome to the admin area. Select an item from the menu.</p>
          </div>
        </main>
      </div>
    </div>
        
         
    </Layout>
  )
}

export default Admindashboard