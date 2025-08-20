import React, { useState } from 'react'
import Layout from '../../components/layout/Layout'
import '../../css/auth.css'
//import '../../css/test.css'

import { Link, useNavigate, useLocation } from 'react-router-dom'
import { toast } from 'react-toastify';
import { loginApi } from '../../service/allApis';
import { useAuth } from '../../context/auth';

function Login() {
    const navigate = useNavigate()
    const location = useLocation()
    const [auth, setAuth] = useAuth()
    const [inputs, setInputs] = useState({
        email: "",
        password: ""
    })
    const takeInput = (e) => {
        const { name, value } = e.target
        setInputs({ ...inputs, [name]: value })
    }
    console.log(inputs);

    const handleLogin = async (e) => {

        e.preventDefault()
        const { email, password } = inputs
        if (!email || !password) {
            toast.warn('Pleace fill all data', {
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
            const result = await loginApi(inputs)
            console.log(result);
            if (result.status == 200) {

                toast.success('Login success', {
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

                    email: "",
                    password: ""
                })
                setAuth({
                    ...auth,
                    user: result.data.user,
                    token: result.data.token,
                })
                localStorage.setItem('auth', JSON.stringify(result.data))

                navigate(location.state || '/dashboard')
            }
            else {
                toast.error(`${result.response.data}`, {
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

                    email: "",
                    password: ""
                })
            }

        }
    }
    return (
        <Layout title={'CRM - Login'}>

            <div className="signup-page">
                <form className="signup-card" >
                    <h4 className="form-heading" >Login</h4>

                    <input type="email" name="email" value={inputs.email} onChange={(e) => takeInput(e)} placeholder="email" required />

                    <input type="password" name="password" value={inputs.password} onChange={(e) => takeInput(e)} placeholder="password" required />

                    <button type="submit" onClick={(e) => handleLogin(e)}  >Login</button>
                    <p className='signup-text' > Forgot Password? <Link className="signup-link" to={'/forgot-password'} >Click here</Link></p>
                    <p className='signup-text' > New user? <Link className="signup-link" to={'/register'} >Signup</Link></p>
                </form>
            </div>
        </Layout>
    )
}

export default Login