import axios, { AxiosResponse } from "axios";
import { adminLoginCredentials } from "../../types/account";

export function Signup(createAccountFormData: FormData): Promise<AxiosResponse<any, any>> {
    try {
        return axios.post("http://localhost:8080/auth/signup", createAccountFormData, {
            withCredentials: true
        });
    } catch (error) {
        console.error(error);
        return Promise.reject(error); 
    }
}


export async function AdminLogin(loginCredentials: adminLoginCredentials): Promise<boolean> {
    try {
        const response = await axios.post("http://localhost:8080/admin/login", loginCredentials, {
            withCredentials: true
        })

        if(response.status === 200) return true

        return false

    } catch (error) {
        console.error(error)
        return false
    }
}