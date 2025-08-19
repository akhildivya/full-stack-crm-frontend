import React, { useState, useEffect } from 'react'

import { useNavigate,useLocation } from 'react-router-dom'
import '../css/spinner.css'

function Spinner() {
    const [count, setCount] = useState(5)
    const navigate = useNavigate()
    const location=useLocation()

    useEffect(() => {
        const interval = setInterval(() => {
            setCount((prevValue) => --prevValue)
        }, 1000)
        count === 0 && navigate('/login',{
            state:location.pathname,
        })
        return () => clearInterval(interval)
    }, [count, navigate,location])

    
    return (
        <>
            <div className="fullscreen-center">
                <h1>Redirecting to you in {count} second{count !== 1 && 's'}</h1>
                <div className="spinner-border" role="status">
                    <span className="visually-hidden">Loading...</span>
                </div>
            </div>
        </>
    )
}

export default Spinner