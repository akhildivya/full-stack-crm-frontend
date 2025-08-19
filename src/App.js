import { Route, Routes } from "react-router-dom";
import HomePage from "./pages/HomePage";
import About from "./pages/About";
import Contact from "./pages/Contact";
import Policy from "./pages/Policy";
import Pagenotfound from "./pages/Pagenotfound";
import Register from "./pages/Auth/Register";
import Login from "./pages/Auth/Login";
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import Dashboard from "./pages/user/Dashboard";
import PrivateRoute from "./components/routes/Private";

function App() {
  return (
    <>
      <ToastContainer />
      <Routes>
        <Route path='/' element={<HomePage />}></Route>
        <Route path='/dashboard' element={<PrivateRoute />}>
          <Route path="" element={<Dashboard />} />
        </Route>

        <Route path='/register' element={<Register />}></Route>
        <Route path='/login' element={<Login />}></Route>
        <Route path='/about' element={<About />}></Route>
        <Route path='/contact' element={<Contact />}></Route>
        <Route path='/policy' element={<Policy />}></Route>
        <Route path='*' element={<Pagenotfound />}></Route>
      </Routes>

    </>
  );
}

export default App;
