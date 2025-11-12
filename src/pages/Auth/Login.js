import React, { useState } from 'react'
import Layout from '../../components/layout/Layout'
import '../../css/auth.css'
import { AiFillEye, AiFillEyeInvisible } from 'react-icons/ai';
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { toast } from 'react-toastify';
import { loginApi } from '../../service/allApis';
import { useAuth } from '../../context/auth';
import { MdEmail } from 'react-icons/md';

function Login() {
    const navigate = useNavigate()
    const location = useLocation()
    const [showPassword, setShowPassword] = useState(false);
    const [errors, setErrors] = useState({});
    const [auth, setAuth] = useAuth()
    const [inputs, setInputs] = useState({
        email: "",
        password: ""
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
    {/* console.log(inputs);*/ }
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
        if (name === "email") {
            if (!value) {
                error = "email is required";
            } else if (!/^[\w.-]+@[\w-]+\.[A-Za-z]{2,}$/.test(value)) {
                error = "invalid email address";
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


        return error;
    };
    const handleLogin = async (e) => {

        e.preventDefault()
        const isValid = validateAll();

        // If validation failed, show a warning toast and stop
        if (!isValid) {
            toast.warn("Please fix the highlighted errors before submitting.", {
                position: "top-center",
                autoClose: 5000,
                theme: "light",
            });
            return;
        }
        if (validateAll()) {
            /* console.log("Form submitted:", inputs);*/
            
        }
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
            /*   console.log(result);*/
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
                    user: result.data?.user,
                    token: result.data?.token,
                })
                localStorage.setItem('auth', JSON.stringify(result.data))

                /*navigate(location.state || '/dashboard')*/
                const userType = result.data?.user?.userType;
                /* if (userType === 'Admin') {
                     navigate(location.state || '/admin-dashboard');
                 } else {
                     navigate( location.state ||'/user-dashboard');
                 }*/
                const dest = location.state?.from?.pathname || (userType === 'Admin' ? '/admin-dashboard' : '/user-dashboard');
                navigate(dest, { replace: true });
            }
            else {
                toast.error(`${result.response?.data}`, {
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
        <Layout title={'CRM - Sign In'}>

            <div className="signup-page">
                <form className="signup-card" >
                    <h6 className="form-heading" >Login</h6>

                    {/*    <div>
                        <input type="email" name="email"
                            value={inputs.email}
                            onChange={handleChange}
                            onBlur={handleBlur}
                            placeholder="email" required />
                        {errors.email && <p className="error-message">{errors.email}</p>}
                    </div>*/}
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


                    <button type="submit" onClick={(e) => handleLogin(e)}  >Login</button>

                    <p className='signup-text' > New user? <Link className="signup-link" to={'/register'} >Signup</Link></p>
                    <p className='signup-text' > Forgot Password? <Link className="signup-link" to={'/forgot-password'} >Click here</Link></p>
                </form>
            </div>
        </Layout>
    )
}

export default Login