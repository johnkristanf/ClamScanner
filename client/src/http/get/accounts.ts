import axios, { AxiosResponse } from "axios";

export function FetchPersonnelAccounts(): Promise<AxiosResponse<any, any>> {
    try {
        return axios.get("http://107.21.85.163:8080/personnel/accounts", {
            withCredentials: true
        });
    } catch (error) {
        console.error(error);
        return Promise.reject(error); 
    }
}



export async function FetchAdminData() {

    try {
        const response = await axios.get("http://107.21.85.163:8080/admin/data", {
            withCredentials: true
        });

        return response.data

    } catch (error) {
        console.error(error);
    }
}


export async function SignOut() {

    try {
        const response = await axios.post("http://107.21.85.163:8080/signout", {}, {
            withCredentials: true
        });

       if(response.status === 200) window.location.href = "/"
       
    } catch (error) {
        console.error(error);
    }
}