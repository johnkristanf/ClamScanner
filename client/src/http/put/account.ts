/* eslint-disable @typescript-eslint/no-explicit-any */
import axios, { AxiosResponse } from "axios";
import { PersonnelAccounts } from "../../types/account";

export function EditPersonnelAccount(account: PersonnelAccounts): Promise<AxiosResponse<any, any>> {

    console.log("account sa EditPersonnelAccount: ", account);
    
    try {
        return axios.put("https://clamscanner.com/go/personnel/account/edit", account, {
            withCredentials: true
        });
    } catch (error) {
        console.error(error);
        return Promise.reject(error); 
    }
}