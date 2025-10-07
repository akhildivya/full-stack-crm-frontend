import React from 'react'
import Layout from '../components/layout/Layout'
import { useAuth } from '../context/auth'
import '../css/home.css'
import { Link } from 'react-router-dom'
function HomePage() {
    const [auth, setAuth] = useAuth()
    return (

        <Layout title={"CRM - Superhero Learning"}>
            <div className="homepage-container">
                {/* Hero Section */}
                <section className="hero-section">
                    <div className="hero-inner">
                        <div className="hero-text">
                            <div className="hero-card">
                                <h1>The Smart, Simple <br /> Online CRM</h1>
                                <p>Build stronger customer relationships, make more sales, and save time effortlessly.</p>
                                <div className="hero-cta">
                                    <Link to='/register'><button className="btn-primary">Get Started</button></Link>
                                    <button className="btn-secondary">Learn More</button>
                                </div>
                            </div>
                        </div>

                        <div className="hero-slider">
                            <div className="slider">
                                <div className="track">
                                    <img src="https://i.postimg.cc/g21fVZKh/25644134-7015971-removebg-preview.png" alt="CRM Illustration 1" />
                                    <img src="https://i.postimg.cc/m2G3P3Tr/illustration2.png" alt="CRM Illustration 2" />
                                    <img src="https://i.postimg.cc/3x3K9n3v/illustration3.png" alt="CRM Illustration 3" />
                                </div>
                            </div>
                        </div>
                    </div>
                </section>

                {/* Features Section */}
                <section className="features-section">
                    <h2>Why Superhhero CRM?</h2>
                    <div className="features-grid">
                        <div className="feature-card">
                            <i className="bi bi-people-fill feature-icon"></i>
                            <h3>Manage Customers</h3>
                            <p>Keep all your customer data in one place for smarter decision-making.</p>
                        </div>
                        <div className="feature-card">
                            <i className="bi bi-bar-chart-fill feature-icon"></i>
                            <h3>Sales Analytics</h3>
                            <p>Track sales performance and identify growth opportunities easily.</p>
                        </div>
                        <div className="feature-card">
                            <i className="bi bi-clock-fill feature-icon"></i>
                            <h3>Save Time</h3>
                            <p>Automate repetitive tasks so our team can focus on what matters.</p>
                        </div>
                    </div>
                </section>

                
            </div>
        </Layout>

    )
}

export default HomePage