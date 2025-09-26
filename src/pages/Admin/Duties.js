import React from 'react'
import Layout from '../../components/layout/Layout'
import Adminmenu from '../../components/layout/Adminmenu'

function Duties() {
  return (
      <Layout title={"CRM- Allotted Duties"}>
    
      <div className="container-fluid m-3 p-3 admin-root">
        <div className="row">
          <aside className="col-md-3">
            <Adminmenu />
          </aside>

          <main className="col-md-9">
            <div className="card admin-card p-4">
              <h4>Duties</h4>
              
            </div>
          </main>
        </div>
      </div>

    </Layout>
  )
}

export default Duties