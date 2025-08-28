import { useState,useEffect } from "react";
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

}

