/*import React, { useState, useEffect } from 'react'

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

export default Spinner*/

/* works import React, { useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import '../css/spinner.css';

function Spinner({ seconds = 160, to = '/login' }) {
  const [count, setCount] = useState(seconds);
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    if (count <= 0) {
      // replace so back button won't return to blocked page
      navigate(to, { replace: true, state: { from: location } });
      return;
    }
    const t = setTimeout(() => setCount(c => c - 1), 1000);
    return () => clearTimeout(t);
  }, [count, navigate, location, to]);

  return (
    <div className="fullscreen-center">
      <h1>Redirecting you in {count} second{count !== 1 && 's'}</h1>
      <div className="spinner-border" role="status">
        <span className="visually-hidden">Loading...</span>
      </div>
    </div>
  );
}

export default Spinner; */


import React, { useState, useRef, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import '../css/spinner.css';

function Spinner({
    seconds = 5,
    to = '/',
    message = 'Access Denied',
    redirect = false,     // default: no redirect
}) {
    const [count, setCount] = useState(seconds);
    const timeoutRef = useRef();
    const navigate = useNavigate();
    const location = useLocation();

    useEffect(() => {
        if (count <= 0) {
            if (redirect && to) {
                navigate(to, { replace: true, state: { from: location } });
            }
            return;
        }

        timeoutRef.current = setTimeout(() => {
            setCount((c) => c - 1);
        }, 1000);

        return () => clearTimeout(timeoutRef.current);
    }, [count, redirect, to, navigate, location]);

    return (
        <div className="fullscreen-center">
            <h2>{message}</h2>
            {redirect && (
                <p>Redirecting in {count} second{count !== 1 && 's'}…</p>
            )}
            <div className="spinner-border" role="status">
                <span className="visually-hidden">Loading...</span>
            </div>
            {!redirect && (
                <button
                    onClick={() => navigate(to, { replace: true })}
                    className="btn btn-primary mt-3"
                >
                    Goto Home
                </button>
            )}
        </div>
    );
}

export default Spinner;



