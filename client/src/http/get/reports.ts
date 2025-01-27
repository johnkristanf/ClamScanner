/* eslint-disable @typescript-eslint/no-explicit-any */
import axios, { AxiosResponse } from "axios";
import { FetchMapReportsParams } from "../../types/map";

export function FetchReports(): Promise<AxiosResponse<any, any>> {
    try {
        return axios.get("http://localhost:8080/fetch/reports", {
            withCredentials: true
        });
    } catch (error) {
        console.error(error);
        return Promise.reject(error); 
    }
}


export function FetchMapReports({ month, mollusk, status }: FetchMapReportsParams): Promise<AxiosResponse<any, any>> {
    try {
        return axios.get(`http://localhost:8080/fetch/map/reports/${month}/${encodeURIComponent(mollusk)}/${encodeURIComponent(status)}`, {
            withCredentials: true
        });
    } catch (error) {
        console.error(error);
        return Promise.reject(error); 
    }
}



export function FetchYearlyReportsPerCity(): Promise<AxiosResponse<any, any>> {
    try {
        return axios.get("http://localhost:8080/fetch/reports/city", {
            withCredentials: true
        });
    } catch (error) {
        console.error(error);
        return Promise.reject(error); 
    }
}

export function FetchYearlyReportsPerProvince(): Promise<AxiosResponse<any, any>> {
    try {
        return axios.get("http://localhost:8080/fetch/reports/province", {
            withCredentials: true
        });
    } catch (error) {
        console.error(error);
        return Promise.reject(error); 
    }
}


export function FetchReportsPerMollusk(): Promise<AxiosResponse<any, any>> {
    try {
        return axios.get("http://localhost:8080/fetch/reports/mollusk", {
            withCredentials: true
        });
    } catch (error) {
        console.error(error);
        return Promise.reject(error); 
    }
}


export function FetchReportsPerYear(): Promise<AxiosResponse<any, any>> {
    try {
        return axios.get("http://localhost:8080/fetch/reports/year", {
            withCredentials: true
        });
    } catch (error) {
        console.error(error);
        return Promise.reject(error); 
    }
}


export function FetchResolvedReportsPerYear(): Promise<AxiosResponse<any, any>> {
    try {
        return axios.get("http://localhost:8080/fetch/reports/year/resolved", {
            withCredentials: true
        });
    } catch (error) {
        console.error(error);
        return Promise.reject(error); 
    }
}