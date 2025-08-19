import React, { useState } from 'react'
import Layout from '../../components/layout/Layout'
import { Link, useNavigate } from 'react-router-dom'
import { toast } from 'react-toastify';
import '../../css/auth.css'
import { registerApi } from '../../service/allApis';


function Register() {
    const navigate = useNavigate()
    const [inputs, setInputs] = useState({
        username: '',
        email: '',
        password: ''
        
    })
    const takeInput = (e) => {
        const { name, value } = e.target
        setInputs({ ...inputs, [name]: value })
    }
    console.log(inputs);
    const handleRegister = async (e) => {
        e.preventDefault()
        const { username, email, password } = inputs
        if (!username || !email || !password) {
            toast.warn('Please fill all data', {
                position: "top-center",
                autoClose: 5000,
                hideProgressBar: false,
                closeOnClick: false,
                pauseOnHover: true,
                draggable: true,
                progress: undefined,
                theme: "light",

            });
        }
        else {
            const result = await registerApi(inputs)
            console.log(result);
            if (result.status == 200) {
                toast.success(`${result.data}`, {
                    position: "top-center",
                    autoClose: 5000,
                    hideProgressBar: false,
                    closeOnClick: false,
                    pauseOnHover: true,
                    draggable: true,
                    progress: undefined,
                    theme: "light",
                });
                setInputs({

                    username: "",
                    email: "",
                    password: ""
                })
                navigate('/login')
            }
            else {
                toast.error(`${result.response.data}`, {
                    position: "top-center",
                    autoClose: 5000,
                    hideProgressBar: false,
                    closeOnClick: true,
                    pauseOnHover: true,
                    draggable: true,
                    progress: undefined,
                    theme: "light",

                });
                setInputs({

                    username: "",
                    email: "",
                    password: ""
                })
            }
        }
    }

    return (
        <Layout title={'CRM - Register New User'}>
            <div className="signup-page">
                <form className="signup-card" >
                    <h4 className="form-heading" >Create Account</h4>

                    <input type="text" name="username" value={inputs.username} onChange={(e) => takeInput(e)} placeholder="username" required />
                    <input type="email" name="email" value={inputs.email} onChange={(e) => takeInput(e)} placeholder="email" required />
                    <input type="password" name="password" value={inputs.password} onChange={(e) => takeInput(e)} placeholder="password" required />
                    
                    <button type="submit" onClick={(e) => handleRegister(e)}>Sign Up</button>
                    <p className='signup-text'>Already have account? <Link to={'/login'} className="signup-link">Login</Link></p>
                </form>
            </div>
        </Layout>
    )
}

export default Register