/* eslint-disable @typescript-eslint/no-explicit-any */
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

export async function GenerateReports(){
    try {
        const response = await axios.get('https://clamscanner.com/go/generate/reports', {
          responseType: 'blob', 
        });
  
        return response.data;
      } catch (error) {
        console.error('Error downloading Excel file:', error);
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



export function FetchScanLogs(): Promise<AxiosResponse<any, any>> {
    try {
        return axios.get("https://clamscanner.com/go/fetch/scan/logs", {
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


export function FetchReportsPerYear(): Promise<AxiosResponse<any, any>> {
    try {
        return axios.get("https://clamscanner.com/go/fetch/reports/year", {
            withCredentials: true
        });
    } catch (error) {
        console.error(error);
        return Promise.reject(error); 
    }
}


export function FetchResolvedReportsPerYear(): Promise<AxiosResponse<any, any>> {
    try {
        return axios.get("https://clamscanner.com/go/fetch/reports/year/resolved", {
            withCredentials: true
        });
    } catch (error) {
        console.error(error);
        return Promise.reject(error); 
    }
}