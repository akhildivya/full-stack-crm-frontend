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
     <div className="container-fluid m-3 p-3 admin-root">
      <div className="row">
        <aside className="col-md-3">
          <Adminmenu />
        </aside>

        <main className="col-md-9">
          <div className="card admin-card w-100 p-3">
            <h3 className="mb-3">Admin Overview</h3>
            <p>Welcome — use the menu to navigate admin pages.</p>
            {/* cards / KPI widgets can go here */}
          </div>
        </main>
      </div>
    </div>

         
    </Layout>
  )
}

export default Admindashboard