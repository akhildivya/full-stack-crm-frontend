/*import { useState,useEffect } from "react";
import { useAuth } from "../../context/auth";
import { Outlet } from "react-router-dom";
import Spinner from "../Spinner";
//import axios from "axios";

import { adminRouteApi } from "../../service/allApis";


export default function AdminRoute(){
    const [ok,setOk]=useState(false)
    const [auth,setAuth]=useAuth()

    useEffect(()=>{
        const authCheck=async()=>{
           
           const res=await adminRouteApi()
            if(res.data?.ok){
                setOk(true)
            }
            else{
                setOk(false)
            }
        }
        if(auth?.token) authCheck()
        },[auth?.token]);
    return ok? <Outlet /> : <Spinner />

}*/

/* works import React, { useEffect, useState } from 'react';
import { Outlet, Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/auth';
import Spinner from '../Spinner';
import { adminRouteApi } from '../../service/allApis';

export default function AdminRoute() {
  const [ok, setOk] = useState(null);
  const [auth] = useAuth();
  const location = useLocation();

  useEffect(() => {
    if (!auth?.token) {
      setOk(false);
      return;
    }
    if (auth?.user?.userType !== 'Admin') {
      setOk(false);
      return;
    }

    const authCheck = async () => {
      try {
        const res = await adminRouteApi();
        setOk(Boolean(res?.data?.ok));
      } catch (err) {
        setOk(false);
      }
    };

    authCheck();
  }, [auth?.token, auth?.user]);

  if (ok === null) return <Spinner />;
  if (!ok) return <Navigate to="/login" state={{ from: location }} replace />;

  return <Outlet />;
}*/
import React, { useEffect, useState } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/auth';
import Spinner from '../Spinner';
import { adminRouteApi } from '../../service/allApis';

export default function AdminRoute() {
  const [ok, setOk] = useState(null);
  const [auth] = useAuth();
  const location = useLocation();

  useEffect(() => {
    if (!auth?.token || auth.user?.userType !== 'Admin') {
      setOk(false);
      return;
    }

    (async () => {
      try {
        const res = await adminRouteApi();
        setOk(Boolean(res?.data?.ok));
      } catch {
        setOk(false);
      }
    })();
  }, [auth?.token, auth?.user]);

  if (ok === null) {
    return <Spinner message="Verifying admin access…" seconds={5} redirect={false} />;
  }

  if (!ok) {
    // Show access denied spinner without redirection
    return <Spinner message="Access Denied" seconds={5} redirect={false}   to="/" />;
  }

  return <Outlet />;
}






