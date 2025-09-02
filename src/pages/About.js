import React from 'react'
import Layout from '../components/layout/Layout'
import Adminmenu from '../components/layout/Adminmenu'

function About() {
    return (
        <Layout title={"CRM- About Us"}>
            {/*<div className='container-fluid m-3 p-3'>
                <div className='row'>
                    <div className='col-md-3'>
                        <Adminmenu />
                    </div>
                    <div className='col-md-9'>
                        <h4>About us</h4>
                    </div>

                </div>
            </div>*/}

            <div className="container-fluid m-3 p-3">
      <div className="row">
        <aside className="col-12 col-md-3 mb-3">
          {/* mobile toggle shown here too (keeps UX consistent if About is loaded directly) */}
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

        <main className="col-12 col-md-9">
          <h4>About us</h4>
          <p>
            This is the about page. On small screens, tap <strong>Menu</strong> to open navigation.
          </p>
        </main>
      </div>
    </div>

        </Layout>
    )
}

export default About