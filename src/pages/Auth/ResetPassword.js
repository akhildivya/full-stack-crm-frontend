import React, { useState } from 'react'
import Layout from '../../components/layout/Layout'
import { useParams, useNavigate } from 'react-router-dom'
import axios from 'axios'
import { toast } from 'react-toastify';
import { AiFillEye, AiFillEyeInvisible } from 'react-icons/ai';

function ResetPassword() {
    const { id, token } = useParams()
    const navigate = useNavigate()
    const [password, setPassword] = useState("")
    const [confirm, setConfirm] = useState("");
    const [message, setMessage] = useState("")
    const [showPassword, setShowPassword] = useState(false);
    const handleReset = async (e) => {
        e.preventDefault()
        if (!password || !confirm) {
            toast.warn("Cannot be empty", {
                position: "top-center",
                autoClose: 5000,
                hideProgressBar: false,
                closeOnClick: false,
                pauseOnHover: true,
                draggable: true,
                progress: undefined,
                theme: "light",

            })
            return
        }

        if (password !== confirm) {
            toast.error("Passwords don't match", {
                position: "top-center",
                autoClose: 5000,
                hideProgressBar: false,
                closeOnClick: false,
                pauseOnHover: true,
                draggable: true,
                progress: undefined,
                theme: "light",

            });
            setPassword("")
            setConfirm("")
            return
        }
        try {
            const result = await axios.post(`http://localhost:4000/reset-password/${id}/${token}`, { password })
         
            setMessage(result.data.message)
            if (result.status == 200) {
                toast.success(`${result.data?.message}`, {
                    position: "top-center",
                    autoClose: 7000,
                    hideProgressBar: false,
                    closeOnClick: false,
                    pauseOnHover: true,
                    draggable: true,
                    progress: undefined,
                    theme: "light",

                });
                navigate('/login')
            }
        }
        catch (error) {
            setMessage(error.response.data.message)
        }
    }
    return (
        <Layout title={'CRM-Reset Password'}>
            <div className="signup-page">
                <form className="signup-card" >
                    <h4 className="form-heading" >Reset Password</h4>

                    <div style={{ position: 'relative', width: '100%' }}>
                        <input type={showPassword ? 'text' : 'password'} name="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="New Password" required />
                        <span
                            onClick={() => setShowPassword((prev) => !prev)}
                            style={{
                                position: 'absolute',
                                right: 8,
                                top: '50%',
                                transform: 'translateY(-50%)',
                                cursor: 'pointer'
                            }}
                            aria-label="Toggle Password Visibility"
                        >
                            {showPassword ? <AiFillEyeInvisible /> : <AiFillEye />}
                        </span>
                    </div>


                    <div style={{ position: 'relative', width: '100%' }}>
                        <input type={showPassword ? 'text' : 'password'} placeholder="Confirm password" value={confirm} onChange={e => setConfirm(e.target.value)} required />
                        <span
                            onClick={() => setShowPassword((prev) => !prev)}
                            style={{
                                position: 'absolute',
                                right: 8,
                                top: '50%',
                                transform: 'translateY(-50%)',
                                cursor: 'pointer'
                            }}
                            aria-label="Toggle Password Visibility"
                        >
                            {showPassword ? <AiFillEyeInvisible /> : <AiFillEye />}
                        </span>
                    </div>

                    <button type="submit" onClick={(e) => handleReset(e)} >Send</button>

                </form>

            </div>
        </Layout>
    )
}

export default ResetPassword