import React from 'react'
import Layout from '../../components/layout/Layout'
import Usermenu from '../../components/layout/Usermenu'
import '../../css/user.css'
function Profile() {
  return (
    <Layout title={"User profile"}>
       {/* <div className='container-fluid m-3 p-3'>
                <div className='row'>
                    <div className='col-md-3'>
                        <Usermenu />
                    </div>
                    <div className='col-md-9'>
                        <h4>profile</h4>
                    </div>

                </div>
            </div>*/}
            <div className='container-fluid m-3 p-3 user-layout'>
<div className='row'>
<div className='col-md-3'>
<Usermenu />
</div>
<div className='col-md-9'>
<div className='user-card p-3 responsive-card'>
<h4>My Profile</h4>
<p className='hint'>Update your details, change password, manage preferences.</p>
{/* Profile form or details go here */}
</div>
</div>
</div>
</div>
        
    </Layout>
  )
}

export default Profile