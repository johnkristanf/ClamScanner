/* eslint-disable @typescript-eslint/no-explicit-any */
import axios, { AxiosResponse } from "axios";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function FetchPersonnelAccounts(): Promise<AxiosResponse<any, any>> {
    try {
        return axios.get("https://clamscanner.com/go/personnel/accounts", {
            withCredentials: true
        });
    } catch (error) {
        console.error(error);
        return Promise.reject(error); 
    }
}



export async function FetchAdminData() {

    try {
        const response = await axios.get("https://clamscanner.com/go/admin/data", {
            withCredentials: true
        });

        return response.data

    } catch (error) {
        console.error(error);
    }
}


export async function SignOut() {

    try {
        const response = await axios.post("https://clamscanner.com/go/signout", {}, {
            withCredentials: true
        });

       if(response.status === 200) window.location.href = "/"
       
    } catch (error) {
        console.error(error);
    }
}



export function FetchAccountToEdit(personnel_id: number | undefined): Promise<AxiosResponse<any, any>> {
    console.log("id sa FetchAccountToEdit: ", personnel_id);
    
    try {
        return axios.get(`https://clamscanner.com/go/personnel/account/edit/${personnel_id}`, {
            withCredentials: true
        });
    } catch (error) {
        console.error(error);
        return Promise.reject(error); 
    }
}