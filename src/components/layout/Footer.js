import React from 'react'
import { Link } from 'react-router-dom'
import { Row, Col } from 'react-bootstrap'
import '../../css/footer.css'
function Footer() {
  const recipient='hello@superhhero.com';
  const subject=encodeURIComponent("Hello");
  const body=encodeURIComponent('This is a prepilled email body')
  const gmailComposeUrl=`https://mail.google.com/mail/?view=cm&fs=1&to=${recipient}&su=${subject}&body=${body}`
  return (
    <div className="footer-container container-fluid w-100 m-2 p-3 bg-light text-center">
      <Row className="justify-content-center">
        <Col xs="12">
          <b className="footer-text">&copy; {new Date().getFullYear()} CRM Dashboard. All rights reserved.</b>
        </Col>
      </Row>
      <Row className="justify-content-center mt-3">
        <div className="social-buttons">
          <Link style={{ textDecoration: 'none' }}   target="_blank" to="https://www.instagram.com/superhher0" className="social-btn instagram" aria-label="Instagram">
            <i className="fab fa-instagram fa-2x"></i>
          </Link>
          <Link style={{ textDecoration: 'none' }} target="_blank" to="https://www.facebook.com/SuperhheroLearning" className="social-btn facebook" aria-label="Facebook">
            <i className="fab fa-facebook fa-2x"></i>
          </Link>
          <Link style={{ textDecoration: 'none' }} target="_blank" to="https://www.youtube.com/@superhherolearning" className="social-btn youtube" aria-label="YouTube">
            <i className="fab fa-youtube fa-2x"></i>
          </Link>
          <Link style={{ textDecoration: 'none' }} target="_blank" to="https://api.whatsapp.com/send/?phone=919072951609" className="social-btn whatsapp" aria-label="WhatsApp">
            <i className="fab fa-whatsapp fa-2x"></i>
          </Link>
          <a style={{ textDecoration: 'none' }} target="_blank" href={gmailComposeUrl} className="social-btn email" aria-label="Email">
            <i className="fas fa-envelope fa-2x"></i>
          </a>
        </div>
      </Row>
    </div>

  )
}

export default Footer