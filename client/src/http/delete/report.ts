import axios, { AxiosResponse } from "axios";

export function DeleteReport(report_id: number): Promise<AxiosResponse<any, any>> {

    try {
        return axios.delete(`http://localhost:8080/delete/reports/${encodeURIComponent(report_id)}`, {
            withCredentials: true
        });
    } catch (error) {
        console.error(error);
        return Promise.reject(error); 
    }
}
