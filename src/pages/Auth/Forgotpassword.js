import React, { useState } from 'react'
import Layout from '../../components/layout/Layout'
import { toast } from 'react-toastify';
import { forgotPasswordApi } from '../../service/allApis';



function Forgotpassword() {

    const [email, setEmail] = useState("")
    const [message, setMessage] = useState("")
    const handleForgotPassword = async (e) => {
        e.preventDefault()
        //  const result = await axios.post('http://localhost:4000/forgot-password', { email })
        if (!email) {
            toast.warn('Enter a valid email id', {
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
            const result = await forgotPasswordApi({ email })
            setMessage(result.data?.message)
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
                setEmail("")
                setMessage("")
            }
            else {
                toast.error(`${result.response.data.message}`, {
                    position: "top-center",
                    autoClose: 5000,
                    hideProgressBar: false,
                    closeOnClick: false,
                    pauseOnHover: true,
                    draggable: true,
                    progress: undefined,
                    theme: "light",

                });
                setEmail("")
                setMessage("")
            }



        }
    }

    return (
        <Layout title={'CRM - Forgot-password'}>
            <div className="signup-page">
                <form className="signup-card" >
                    <h4 className="form-heading" >Forgot Password</h4>

                    <input type="email" name="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="email" required />



                    <button type="submit" onClick={(e) => handleForgotPassword(e)} >Send</button>

                </form>

            </div>

        </Layout>
    )
}

export default Forgotpassword