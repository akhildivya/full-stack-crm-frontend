import React from 'react'
import Layout from '../components/layout/Layout'
import Adminmenu from '../components/layout/Adminmenu'
import '../css/admin.css'
function About() {
  return (
    <Layout title={"CRM- About Us"}>
    {/* <div className='container-fluid m-3 p-3'>
                <div className='row'>
                    <div className='col-md-3'>
                        <Adminmenu />
                    </div>
                    <div className='col-md-9'>
                        <h4>About us</h4>
                    </div>

                </div>
            </div>*/}
            <div className='container-fluid m-3 p-3'>
      <div className='row'>
        <div className='col-md-3 d-none d-md-block'>
          <Adminmenu />
        </div>

        <div className='col-12 col-md-9'>
          <div className="admin-card">
            <h4>About us</h4>
            <p className="text-muted">This area describes the admin application — replace with your company text.</p>

            <div className="row">
              <div className="col-sm-6">
                <div className="card p-3 mb-3">
                  <h6>Mission</h6>
                  <p className="small">Our mission is to build great admin UIs.</p>
                </div>
              </div>
              <div className="col-sm-6">
                <div className="card p-3 mb-3">
                  <h6>Contact</h6>
                  <p className="small">admin@yourdomain.com</p>
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

export default About