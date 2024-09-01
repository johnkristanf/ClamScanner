import axios, { AxiosResponse } from "axios";

export function DeleteAccount(account_id: number): Promise<AxiosResponse<any, any>> {

    try {
        return axios.delete(`http://107.21.85.163:8080/delete/account/${encodeURIComponent(account_id)}`, {
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
