import axios, { AxiosResponse } from "axios";

export function FetchModels(): Promise<AxiosResponse<any, any>> {
    try {
        return axios.get("http://localhost:8080/fetch/model", {
            withCredentials: true
        });
    } catch (error) {
        console.error(error);
        return Promise.reject(error); 
    }
}
