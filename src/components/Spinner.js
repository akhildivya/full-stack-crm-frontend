

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



