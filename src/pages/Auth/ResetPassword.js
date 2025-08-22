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
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);


    const handleReset = async (e) => {
        e.preventDefault()
        if (!password || !confirm) {
            toast.warn("Password cannot be blank", {
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

            toast.error('Server error due to internet connectivity', {
                position: "top-center",
                autoClose: 7000,
                hideProgressBar: false,
                closeOnClick: false,
                pauseOnHover: true,
                draggable: true,
                progress: undefined,
                theme: "light",

            });
            setPassword("")
            setConfirm("")
        }
    }
    return (
        <Layout title={'CRM-Reset Password'}>
            <div className="signup-page">
                <form className="signup-card" >
                    <h6 className="form-heading" >Reset Password</h6>

                    <div style={{ position: 'relative', width: '100%' }}>
                        <input type={showPassword ? 'text' : 'password'} name="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="New password" required />
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
                            {showPassword ? <AiFillEye /> : <AiFillEyeInvisible />}
                        </span>
                    </div>


                    <div style={{ position: 'relative', width: '100%' }}>
                        <input type={showConfirmPassword ? 'text' : 'password'} placeholder="Confirm new password" value={confirm} onChange={e => setConfirm(e.target.value)} required />
                        <span
                            onClick={() => setShowConfirmPassword((prev) => !prev)}
                            style={{
                                position: 'absolute',
                                right: 8,
                                top: '50%',

                                transform: 'translateY(-50%)',
                                cursor: 'pointer'
                            }}
                            aria-label="Toggle Password Visibility"
                        >
                            {showConfirmPassword ? <AiFillEye /> : <AiFillEyeInvisible />}
                        </span>
                    </div>

                    <button type="submit" onClick={(e) => handleReset(e)} >Send</button>

                </form>

            </div>
        </Layout>
    )
}

export default ResetPassword