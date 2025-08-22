import React, { useState } from 'react'
import Layout from '../../components/layout/Layout'
import { useParams, useNavigate } from 'react-router-dom'
import axios from 'axios'
import { toast } from 'react-toastify';
import { AiFillEye, AiFillEyeInvisible } from 'react-icons/ai';

function ResetPassword() {
    const { id, token } = useParams()
    const navigate = useNavigate()
    const [errors, setErrors] = useState({});
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);
    const [inputs, setInputs] = useState({

        password: '',
        confirmPassword: ''

    })

    const handleChange = (e) => {
        const { name, value } = e.target
        // setInputs({ ...inputs, [name]: value })
        setInputs((prev) => ({
            ...prev,
            [name]: value,
        }));
        const errorMsg = validateField(name, value);
        setErrors((prev) => ({
            ...prev,
            [name]: errorMsg,
        }));

    }

    const handleBlur = (e) => {
        // Optional: re-run validation on blur for fields that haven’t been touched
        handleChange(e);
    };

    const validateAll = () => {
        const newErrors = {};
        Object.entries(inputs).forEach(([field, value]) => {
            const error = validateField(field, value);
            if (error) newErrors[field] = error;
        });
        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };
    const validateField = (name, value) => {
        let error = "";
        if (name === "password") {
            if (!value) {
                error = "password is required";
            } else if (
                !/^(?=.*\d)(?=.*[a-z])(?=.*[A-Z]).{6,15}$/.test(value)
            ) {
                error =
                    "6-15 chars contain atleast one uppercase, one lowercase, and one digit";
            }
        }
        if (name === "confirmPassword") {
            if (!value) {
                error = "confirm password is required";
            } else if (
                !/^(?=.*\d)(?=.*[a-z])(?=.*[A-Z]).{6,15}$/.test(value)
            ) {
                error =
                    "6-15 chars, contain atleast one uppercase, one lowercase, and one digit";
            }
        }

        return error;
    };


    const handleReset = async (e) => {
        e.preventDefault()
        const { password, confirmPassword } = inputs
        if (!password || !confirmPassword) {
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

        if (password !== confirmPassword) {
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
            setInputs({
                password: "",
                confirmPassword: ""
            })
            return

        }
        if (validateAll()) {
            console.log("Form submitted:", inputs);
            // proceed with your API call or other logic
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

            toast.error('network connectivity issues', {
                position: "top-center",
                autoClose: 7000,
                hideProgressBar: false,
                closeOnClick: false,
                pauseOnHover: true,
                draggable: true,
                progress: undefined,
                theme: "light",

            });
            setInputs({
                password: "",
                confirmPassword: ""
            })

        }
    }
    return (
        <Layout title={'CRM-Reset Password'}>
            <div className="signup-page">
                <form className="signup-card" >
                    <h6 className="form-heading" >Reset Password</h6>

                    {/*  <div style={{ position: 'relative', width: '100%' }}>
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
                    </div>*/}


                    {/*   <div style={{ position: 'relative', width: '100%' }}>
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
                    </div>*/}
                    <div className="password-field-wrapper">
                        <div className={`input-container${errors.password ? ' error' : ''}`}>
                            <input
                                type={showPassword ? 'text' : 'password'}
                                name="password"
                                value={inputs.password}
                                onChange={handleChange}
                                onBlur={handleBlur}
                                placeholder="password"
                                required
                                className="password-input"
                            />
                            <span
                                className="toggle-icon"
                                onClick={() => setShowPassword((prev) => !prev)}
                                aria-label="Toggle Password Visibility"
                            >
                                {showPassword ? <AiFillEye /> : <AiFillEyeInvisible />}
                            </span>
                        </div>
                        {errors.password && <p className="error-message">{errors.password}</p>}
                    </div>

                    <div className="password-field-wrapper">
                        <div className={`input-container${errors.confirmPassword ? ' error' : ''}`}>
                            <input
                                type={showConfirmPassword ? 'text' : 'password'}
                                name="confirmPassword"
                                value={inputs.confirmPassword}
                                onChange={handleChange}
                                onBlur={handleBlur}
                                placeholder="confirm password"
                                required
                                className="password-input"
                            />
                            <span
                                className="toggle-icon"
                                onClick={() => setShowConfirmPassword((prev) => !prev)}
                                aria-label="Toggle Password Visibility"
                            >
                                {showConfirmPassword ? <AiFillEye /> : <AiFillEyeInvisible />}
                            </span>
                        </div>
                        {errors.confirmPassword && <p className="error-message">{errors.confirmPassword}</p>}
                    </div>

                    <button type="submit" onClick={(e) => handleReset(e)} >Send</button>

                </form>

            </div>
        </Layout>
    )
}

export default ResetPassword