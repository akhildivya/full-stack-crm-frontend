import React from 'react'
import { Link } from 'react-router-dom';
import Layout from '../components/layout/Layout'
import '../css/pagenotfound.css'
function Pagenotfound() {
  return (

    <Layout title={"Oops! Page Not Found"}>
      <div className="nf-wrap">
        <div className="nf-card">
          <img src="https://i.postimg.cc/52kyKqsk/228438-P28070-739.jpg" alt="404 animation" className="nf-img" />
          <div className="nf-content">
            <h1>404</h1>
            <p>Oops! Page not found.</p>
            <Link to="/" className="nf-button">Go Home</Link>
          </div>
        </div>
      </div>
    </Layout>
  )
}

export default Pagenotfound