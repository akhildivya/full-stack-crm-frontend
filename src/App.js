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
import Forgotpassword from "./pages/Auth/Forgotpassword";
import ResetPassword from "./pages/Auth/ResetPassword";
import AdminRoute from "./components/routes/Adminroute";
import Admindashboard from "./pages/Admin/Admindashboard";
import Allusers from "./pages/Admin/Allusers";
import Myprofile from "./pages/Admin/Myprofile";
import Profile from "./pages/user/Profile";
import Uploadsheet from "./pages/Admin/Uploadsheet";
import Viewstudents from "./pages/Admin/Viewstudents";
import Duties from "./pages/Admin/Duties";
import DutyList from "./pages/user/DutyList";
import Taskcompleted from "./pages/user/Taskcompleted";
import Workreport from "./pages/Admin/Workreport";
import Summary from "./pages/Admin/Summary";

function App() {
  return (
    <>
      <ToastContainer />
      <Routes>
        <Route path='/' element={<HomePage />}></Route>
        <Route path='/user-dashboard' element={<PrivateRoute />}>
          <Route index element={<Dashboard />} />
          <Route path='profile' element={<Profile />} />
          <Route path='daily-duty' element={<DutyList />} />
          <Route path='completed-tasks' element={<Taskcompleted />}></Route>
        </Route>
        <Route path='/admin-dashboard' element={<AdminRoute />}>
          <Route index element={<Admindashboard />} />
          <Route path='all-users' element={<Allusers />} />
          <Route path='my-profile' element={<Myprofile />} />
          <Route path='upload-sheet' element={<Uploadsheet />} />
          <Route path='about' element={<About />}></Route>
          <Route path='contact' element={<Contact />}></Route>
          <Route path='student-details' element={<Viewstudents />}> </Route>
          <Route path='alloted-duties' element={<Duties />}> </Route>
          <Route path='work-report' element={<Workreport />}></Route>
          <Route path='summary-report' element={<Summary />}></Route>
        </Route>
        <Route path='/register' element={<Register />}></Route>
        <Route path='/login' element={<Login />}></Route>
        <Route path='/forgot-password' element={<Forgotpassword />}></Route>
        <Route path='/reset-password/:id/:token' element={<ResetPassword />}></Route>

        <Route path='/policy' element={<Policy />}></Route>
        <Route path='*' element={<Pagenotfound />}></Route>
      </Routes>

    </>
  );
}

export default App;
