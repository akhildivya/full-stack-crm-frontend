import React, { useState } from 'react'
import Layout from '../../components/layout/Layout'
import { Link, useNavigate } from 'react-router-dom'
import { toast } from 'react-toastify';
import '../../css/auth.css'
import { registerApi } from '../../service/allApis';
import { AiFillEye, AiFillEyeInvisible } from 'react-icons/ai';
import { FaUser } from 'react-icons/fa';
import { MdEmail } from "react-icons/md";
import { PiLockKeyFill } from "react-icons/pi";
import { FaPhone } from "react-icons/fa";
import { PiLockKeyOpenFill } from "react-icons/pi";
function Register() {
    const navigate = useNavigate()

    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);
    const [showSecret, setShowSecret] = useState(false)
    const [errors, setErrors] = useState({});
    const [inputs, setInputs] = useState({
        username: '',
        email: '',
        password: '',
        phone: '',
        confirmPassword: '',
        userType: 'User',
        secretKey: ''

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

    console.log(inputs);


    const validateField = (name, value) => {
        let error = "";

        if (name === "username") {
            if (!value) {
                error = "username is required";
            } else if (!/^[A-Z]/.test(value)) {
                error = "first letter must be uppercase";
            }
            else if (value.length < 3) {
                error = "minimum 3 characters";
            } else if (value.length > 25) {
                error = "maximum 25 characters";
            } else if (!/^[A-Za-z ]+$/.test(value)) {
                error = "letters and spaces only";
            }
        }

        if (name === "email") {
            if (!value) {
                error = "email is required";
            } else if (!/^[\w.-]+@[\w-]+\.[A-Za-z]{2,}$/.test(value)) {
                error = "invalid email address";
            }
        }

        if (name === "phone") {
            if (!value) {
                error = "mobile number is required";
            } else if (value.length < 10) {
                error = "minimum 10 digits";
            } else if (value.length > 15) {
                error = "maximum 15 characters";
            } else if (!/^\+?[0-9]{10,15}$/.test(value)) {
                error = "invalid mobile number format";
            }
        }

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


    const handleRegister = async (e) => {

        e.preventDefault()

        const { username, email, password, confirmPassword, userType, secretKey, phone } = inputs
        const errors = [];

        if (userType === "Admin" && secretKey !== "Unl0ckMySuperH30Best2025!") {
            errors.push("Invalid secretkey");
            setInputs({

                username: "",
                email: "",
                password: "",
                confirmPassword: "",
                phone: '',
                userType: 'User'
            })
        }
        if (!username || !email || !password || !phone || !confirmPassword) {
            errors.push("All fields are required!");
        }

        if (errors.length > 0) {
            toast.warn(
                <div>
                    {errors.map((err, idx) => (
                        <div key={idx}>{err}</div>
                    ))}
                </div>,
                { position: "top-center", autoClose: 5000, }
            );
            return;
        }
        if (validateAll()) {
            console.log("Form submitted:", inputs);
            // proceed with your API call or other logic
        }
        {/*   if (userType == "Admin" && secretKey != "AdarshT") {

            toast.warn('Invalid Admin', {
                position: "top-center",
                autoClose: 5000,
                hideProgressBar: false,
                closeOnClick: false,
                pauseOnHover: true,
                draggable: true,
                progress: undefined,
                theme: "light",

            });
        
            return

        }
        if (!username || !email || !password || !confirmPassword) {
            toast.warn('All fields are required!', {
                position: "top-center",
                autoClose: 5000,
                hideProgressBar: false,
                closeOnClick: false,
                pauseOnHover: true,
                draggable: true,
                progress: undefined,
                theme: "light",

            });

            return

       }*/}
        if (password !== confirmPassword) {
            toast.warn('Passwords do not match', {
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
                password: "",
                confirmPassword: "",
                phone: '',
                userType: 'User'
            })
            return;

        }

        try {
            const result = await registerApi({ username, email, phone, password, userType })
            console.log(result);
            if (result.status == 200) {
                toast.success(`${result?.data}`, {
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
                    password: "",
                    confirmPassword: "",
                    phone: '',
                    userType: 'User'
                })
                navigate('/login')
            }
            else {
                toast.error(`${result.response.data?.message}` || "Registration failed", {
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
                    password: "",
                    confirmPassword: "",
                    phone: '',
                    userType: 'User'
                })
            }
        }

        catch (error) {

            toast.error('server error', {
                position: "top-center",
                autoClose: 5000,
                hideProgressBar: false,
                closeOnClick: true,
                pauseOnHover: true,
                draggable: true,
                progress: undefined,
                theme: "light",
            });
            setInputs({ username: '', email: '', password: '', confirmPassword: '', phone: '', userType: 'User' });
        }



    }

    return (
        <Layout title={'CRM - Register New User'}>
            <div className="signup-page">
                <form className="signup-card"  >
                    <h6 className="form-heading" >Register</h6>
                    <div className="radio-group">
                        <label className={`radio-label ${inputs.userType === 'User' ? 'selected' : ''}`}>
                            <input
                                type="radio"
                                name="userType"
                                value="User"
                                checked={inputs.userType === 'User'}
                                onChange={handleChange}
                                className="password-input"
                            />
                            User
                        </label>
                        <label className={`radio-label ${inputs.userType === 'Admin' ? 'selected' : ''}`}>
                            <input
                                type="radio"
                                name="userType"
                                value="Admin"
                                checked={inputs.userType === 'Admin'}
                                onChange={handleChange}
                                className="password-input"
                            />
                            Admin
                        </label>
                    </div>
                    {inputs.userType == "Admin" ? (
                        <div className='input-container'>

                            <input
                                name='secretKey'
                                type={showSecret ? 'text' : 'password'}
                                className="password-input"
                                placeholder="secret key"
                                onChange={handleChange}

                            />
                            <span
                                className="toggle-icon"
                                onClick={() => setShowSecret((prev) => !prev)}
                                aria-label="Toggle Password Visibility"
                            >
                                {showSecret ? <PiLockKeyOpenFill /> : <PiLockKeyFill />}
                            </span>

                        </div>
                    ) : null}

                    {/* <div className='wrapper'>

                        <input type="text" name="username"
                            value={inputs.username}
                            onChange={handleChange}
                            onBlur={handleBlur}
                            placeholder="username" required
                            className="input-with-icon"

                        />

                        {errors.username && <p className="error-message">{errors.username}</p>}
                    </div>*/}

                    <div className="password-field-wrapper">
                        <div className={`input-container${errors.username ? ' error' : ''}`}>
                            <input

                                name="username"
                                value={inputs.username}
                                onChange={handleChange}
                                onBlur={handleBlur}
                                placeholder="username"
                                required
                                className="password-input"
                            />
                            <FaUser size={15} className="toggle-icon" />

                        </div>
                        {errors.username && <p className="error-message">{errors.username}</p>}
                    </div>


                    <div className="password-field-wrapper">
                        <div className={`input-container${errors.email ? ' error' : ''}`}>
                            <input

                                name="email"
                                value={inputs.email}
                                onChange={handleChange}
                                onBlur={handleBlur}
                                placeholder="email"
                                required
                                className="password-input"
                            />
                            <MdEmail size={15} className="toggle-icon" />

                        </div>
                        {errors.email && <p className="error-message">{errors.email}</p>}
                    </div>
                    <div className="password-field-wrapper">
                        <div className={`input-container${errors.phone ? ' error' : ''}`}>
                            <input

                                name="phone"
                                value={inputs.phone}
                                onChange={handleChange}
                                onBlur={handleBlur}
                                placeholder="mobile"
                                required
                                className="password-input"
                            />
                            <FaPhone size={15} className="toggle-icon" />

                        </div>
                        {errors.phone && <p className="error-message">{errors.phone}</p>}
                    </div>

                    {/* <div className="wrapper">
                        <input type="email" name="email"
                            value={inputs.email}
                            onChange={handleChange}
                            onBlur={handleBlur}
                            placeholder="email" required
                            className="input-with-icon"
                        />

                        {errors.email && <p className="error-message">{errors.email}</p>}

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


                    <button type="submit" onClick={(e) => handleRegister(e)}>Sign Up</button>
                    <p className='signup-text'>Already have account? <Link to={'/login'} className="signup-link">Login</Link></p>
                </form>
            </div>
        </Layout>
    )
}

export default Register