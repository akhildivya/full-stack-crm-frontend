import React from 'react'
import Layout from '../components/layout/Layout'
import { useAuth } from '../context/auth'
import { Row, Col } from 'react-bootstrap';
import '../css/home.css'
function HomePage() {
    const [auth, setAuth] = useAuth()
    return (

        <Layout title={"CRM - Superhhero Learning"}>
            <div class="homepage-container">
                <div class="text-section">
                    <h1>The Smart Simple <br /> Online CRM</h1>
                    <p><b>Build stronger customer relationships, make more sales and save time.</b></p>
                </div>
                <div class="image-section">
                    <img src="https://i.postimg.cc/g21fVZKh/25644134-7015971-removebg-preview.png" alt="ChatGPT Illustration" />
                </div>
            </div>
        </Layout>
    )
}

export default HomePage