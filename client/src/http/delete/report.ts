import axios, { AxiosResponse } from "axios";

type ReportsData = {
    report_id: number,
    molluskName: string,
    province: string, 
    city: string
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function DeleteReport(data: ReportsData): Promise<AxiosResponse<any, any>> {

    try {
        return axios.delete(`https://clamscanner.com/go/delete/reports/${encodeURIComponent(data.report_id)}/${encodeURIComponent(data.molluskName)}/${encodeURIComponent(data.province)}/${encodeURIComponent(data.city)}`, {
            withCredentials: true
        });
    } catch (error) {
        console.error(error);
        return Promise.reject(error); 
    }
}
