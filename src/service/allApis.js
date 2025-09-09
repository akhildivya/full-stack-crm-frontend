import { BASEURL } from "./baseUrl";
import { commonApi } from "./commonStructure";

export const loginApi = async (body) => {
    return await commonApi('POST', `${BASEURL}/login`, body, "")
}
export const registerApi=async(body)=>{
    return await commonApi('POST',`${BASEURL}/register`,body,"")
}
export const privateRouteApi=async()=>{
    return await commonApi('GET',`${BASEURL}/user-auth`,"","")
}
export const adminRouteApi=async()=>{
    return await commonApi('GET',`${BASEURL}/admin-auth`,"","")
}
export const forgotPasswordApi=async(body)=>{
    return await commonApi('POST',`${BASEURL}/forgot-password`,body,"")
}
export const resetPasswordApi=async(header,body,id)=>{
    return await commonApi('POST',`${BASEURL}/reset-password/${id}`,body,header)
}

