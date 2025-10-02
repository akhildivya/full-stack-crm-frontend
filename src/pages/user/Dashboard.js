import React, { useEffect, useState } from 'react'
import Layout from '../../components/layout/Layout'
import Usermenu from '../../components/layout/Usermenu'
import '../../css/admin.css'
import Greetings from '../../components/Greetings'

function Dashboard() {
 
  return (
    <Layout title={"CRM-User-Dashboard "}>
      <div className="container-fluid m-3 p-3 admin-root">
      <div className="row">
        <aside className="col-md-3">
          <Usermenu />
        </aside>

        <main className="col-md-9">
          <div className="card admin-card w-100 p-3">
            <Greetings />
            
          </div>
        </main>
      </div>
    </div>

    </Layout>
  )
}

export default Dashboard
