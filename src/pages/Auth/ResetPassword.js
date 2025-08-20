import React, { useState } from 'react'
import Layout from '../../components/layout/Layout'
import { useParams, useNavigate } from 'react-router-dom'
import axios from 'axios'

function ResetPassword() {
    const { id, token } = useParams()
    const navigate = useNavigate()
    const [password, setPassword] = useState("")
    const [message, setMessage] = useState("")
    const handleReset = async (e) => {
        e.preventDefault()
        try {
            const result = await axios.post(`http://localhost:4000/reset-password/${id}/${token}`, { password })
            setMessage(result.data.message)
            if (result.status == 200) {
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

                    <input type="password" name="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="New Password" required />



                    <button type="submit" onClick={(e) => handleReset(e)} >Send</button>
{message && <p>{message}</p>}
                </form>
                
            </div>
        </Layout>
    )
}

export default ResetPassword