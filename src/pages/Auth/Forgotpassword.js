import React, { useState } from 'react'
import Layout from '../../components/layout/Layout'
import { toast } from 'react-toastify';
import { forgotPasswordApi } from '../../service/allApis';
import { MdEmail } from 'react-icons/md';


function Forgotpassword() {

    const [email, setEmail] = useState("")
    const [error, setError] = useState("");
    const validateEmail = (value) => {
        if (!value) {
            return "email is required";
        } else if (!/^[\w.-]+@[\w-]+\.[A-Za-z]{2,}$/.test(value)) {
            return "invalid email address";
        }
        return "";
    };

    const handleChange = (e) => {
        const val = e.target.value;
        setEmail(val);
        setError(validateEmail(val));
    };

    const handleBlur = (e) => {
        setError(validateEmail(email));
    };
    const handleSubmit = (e) => {
        e.preventDefault();
        const err = validateEmail(email);
        setError(err);
        if (!err) {
            // proceed with valid email
           /* console.log("Submitted email:", email);*/
        }
    };

    const handleForgotPassword = async (e) => {
        e.preventDefault()

        //  const result = await axios.post('http://localhost:4000/forgot-password', { email })
        if (!email) {
            toast.warn('email address is required.', {
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

            if (result.status == 200) {
                toast.success(`${result.data?.message}`, {
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

            }
            else {
                toast.error(`${result.response.data?.message}` || 'server error', {
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

            }



        }
    }

    return (
        <Layout title={'CRM - Forgot password'}>
            <div className="signup-page">
                <form className="signup-card" onSubmit={handleSubmit} noValidate >
                    <h6 className="form-heading" >Forgot Password</h6>
                    <div className="password-field-wrapper">
                        <div className={`input-container${error ? ' error' : ''}`}>
                            <input
                                type="email"
                                name="email"
                                value={email}
                                onChange={handleChange}
                                placeholder="email"
                                onBlur={handleBlur}
                                required
                                className="password-input"
                            />
                            <MdEmail size={15} className="toggle-icon" />
                        </div>

                        {error && <p className="error-message">{error}</p>}
                    </div>

                    <button type="submit" onClick={(e) => handleForgotPassword(e)} >Send</button>
                </form>
            </div>

        </Layout>
    )
}

export default Forgotpassword