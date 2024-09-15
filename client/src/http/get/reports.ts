import axios, { AxiosResponse } from "axios";
import { FetchMapReportsParams } from "../../types/map";

export function FetchReports(): Promise<AxiosResponse<any, any>> {
    try {
        return axios.get("https://clamscanner.com/go/fetch/reports", {
            withCredentials: true
        });
    } catch (error) {
        console.error(error);
        return Promise.reject(error); 
    }
}


export function FetchMapReports({ month, mollusk, status }: FetchMapReportsParams): Promise<AxiosResponse<any, any>> {
    try {
        return axios.get(`https://clamscanner.com/go/fetch/map/reports/${month}/${encodeURIComponent(mollusk)}/${encodeURIComponent(status)}`, {
            withCredentials: true
        });
    } catch (error) {
        console.error(error);
        return Promise.reject(error); 
    }
}



export function FetchYearlyReportsPerCity(): Promise<AxiosResponse<any, any>> {
    try {
        return axios.get("https://clamscanner.com/go/fetch/reports/city", {
            withCredentials: true
        });
    } catch (error) {
        console.error(error);
        return Promise.reject(error); 
    }
}

export function FetchYearlyReportsPerProvince(): Promise<AxiosResponse<any, any>> {
    try {
        return axios.get("https://clamscanner.com/go/fetch/reports/province", {
            withCredentials: true
        });
    } catch (error) {
        console.error(error);
        return Promise.reject(error); 
    }
}


export function FetchReportsPerMollusk(): Promise<AxiosResponse<any, any>> {
    try {
        return axios.get("https://clamscanner.com/go/fetch/reports/mollusk", {
            withCredentials: true
        });
    } catch (error) {
        console.error(error);
        return Promise.reject(error); 
    }
}