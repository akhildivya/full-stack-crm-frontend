import React from 'react'
import Container from 'react-bootstrap/Container';
import Nav from 'react-bootstrap/Nav';
import Navbar from 'react-bootstrap/Navbar';
import { useAuth } from '../../context/auth';
import { toast } from 'react-toastify';
import { useNavigate } from 'react-router-dom';
import '../../css/header.css'
function Header() {
  const navigate = useNavigate()

  const [auth, setAuth] = useAuth()
  const handleLogout = () => {
    setAuth({
      ...auth, user: null, token: ''
    })

    localStorage.removeItem('auth')


    toast.success('Logout successfully', {
      position: "top-center",
      autoClose: 5000,
      hideProgressBar: false,
      closeOnClick: false,
      pauseOnHover: true,
      draggable: true,
      progress: undefined,
      theme: "light",

    });
    navigate('/')
  }
  const toPath = auth.user?.userType === 'Admin'
    ? '/admin-dashboard'
    : '/user-dashboard';
    const title = auth?.user?.username
    ? `${auth.user.username}${auth.user.userType ? ` (${auth.user.userType})` : ''}`
    : 'Dropdown';
  return (
    <>
      <Navbar expand="lg" className="custom-navbar"  >
        <Container>
          <Navbar.Brand href="/" className="d-flex align-items-center">
            <img
              alt=""
              src="https://i.postimg.cc/FFGqLz88/output-onlinegiftools-6.gif"
              width="40"
              height="40"
              className="d-inline-block align-top"
            />{' '}
            <strong className="brand-text">JustDo</strong>
          </Navbar.Brand>
          <Navbar.Toggle aria-controls="basic-navbar-nav" />
          <Navbar.Collapse id="basic-navbar-nav">
            <Nav className="ms-auto">
              <Nav.Link href="/"><strong>Home</strong></Nav.Link>
              {

                !auth.user ? <>
                  <Nav.Link href="/register"><strong>Signup</strong></Nav.Link>
                  <Nav.Link href="/login"><strong>Login</strong></Nav.Link>

                </> : <>   <Nav.Link href={toPath} ><strong>{auth?.user?.username}{auth?.user?.userType && ` (${auth.user.userType})`}</strong></Nav.Link>
                  
                  <Nav.Link onClick={handleLogout}  ><strong>Logout</strong></Nav.Link></>
              }


            </Nav>
          </Navbar.Collapse>
        </Container>
      </Navbar>
    </>
  )
}

export default Header