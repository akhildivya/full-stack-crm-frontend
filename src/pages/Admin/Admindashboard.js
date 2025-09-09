import React from 'react'
import Layout from '../../components/layout/Layout'
import Adminmenu from '../../components/layout/Adminmenu'
import '../../css/admin.css'
function Admindashboard() {
  return (
    <Layout title={'CRM- Admin-Dashboard'}>
      
       {/* <div className='container-fluid m-3 p-3'>
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
         <div className="container-fluid admin-layout">
      <div className="row gx-3">
        <div className="col-md-3 d-none d-md-block">
          <Adminmenu />
        </div>

        <div className="col-12 col-md-9">
          {/* Mobile menu (on top) */}
          <div className="d-md-none mb-2">
            <Adminmenu />
          </div>

          <div className="admin-card">
            <div className="d-flex justify-content-between align-items-center mb-3">
              <h4 className="mb-0">Admin Panel</h4>
              <div className="d-flex gap-2">
                <div className="color-card">Total Users<br /><strong>1,234</strong></div>
                <div className="color-card">Active<br /><strong>987</strong></div>
              </div>
            </div>

            {/* Put real content here — tables, charts, forms */}
            <div className="mt-3">
              <p>Welcome to your redesigned admin area — responsive and colorful.</p>

              {/* Example card */}
              <div className="card p-3 mt-3" style={{borderRadius:12}}>
                <h5>Quick actions</h5>
                <div className="d-flex gap-2 flex-wrap">
                  <button className="btn btn-outline-light">Add user</button>
                  <button className="btn btn-outline-light">Export</button>
                  <button className="btn btn-outline-light">Settings</button>
                </div>
              </div>
            </div>

          </div>
        </div>
      </div>
    </div>
        

         
    </Layout>
  )
}

export default Admindashboard