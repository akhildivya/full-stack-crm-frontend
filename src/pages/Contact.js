import React from 'react'
import Layout from '../components/layout/Layout'
import Adminmenu from '../components/layout/Adminmenu'

function Contact() {
  return (
    <Layout title={"CRM- Contactus"}>
        <div className='container-fluid m-3 p-3'>
                <div className='row'>
                    <div className='col-md-3'>
                        <Adminmenu />
                    </div>
                    <div className='col-md-9'>
                        <h4>Contact us</h4>
                    </div>

                </div>
            </div>
    </Layout>
  )
}

export default Contact