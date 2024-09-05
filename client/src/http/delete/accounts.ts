import axios, { AxiosResponse } from "axios";

export function DeleteAccount(account_id: number): Promise<AxiosResponse<any, any>> {

    try {
        return axios.delete(`https://clamscanner.com/go/delete/account/${encodeURIComponent(account_id)}`, {
            headers: {
                "Content-Type": "application/json",
            },
            withCredentials: true
        });
    } catch (error) {
        console.error(error);
        return Promise.reject(error); 
    }
}
