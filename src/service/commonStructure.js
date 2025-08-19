import axios from "axios";
export const commonApi = async (method, url, body, header) => {
    const config = {
        method,
        url,
        data: body,
        headers: header ? header : { 'Content-Type': 'application/json'  }
    }
    return await axios(config).then(response => {
        return response
    }).catch(response => {
        return response
    })
}