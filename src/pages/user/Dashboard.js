import React from 'react'
import Layout from '../../components/layout/Layout'
import Usermenu from '../../components/layout/Usermenu'
import '../../css/user.css'

function Dashboard() {
  
  return (
    <Layout title={"CRM-User-Dashboard "}>
       {/* <div className='container-fluid m-3 p-3'>
          <div className='row'>
            <div className='col-md-3'>
              <Usermenu />
            </div>
            <div className='col-md-9'>
                <div className='card w-75 p-3'>

                </div>
            </div>
          </div>

        </div>*/}
        <div className="container-fluid m-3 p-3 user-layout">
<div className="row">
<div className="col-md-3">
<Usermenu />
</div>


<div className="col-md-9">
<div className="user-card p-3 responsive-card">
<h4>Welcome back 🎉</h4>
<p className="hint">Quick summary and links to important tasks.</p>
{/* Put dashboard widgets here (grid or cards). */}
</div>
</div>
</div>
</div>
    </Layout>
  )
}

export default Dashboard
