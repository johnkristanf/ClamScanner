/* eslint-disable @typescript-eslint/no-explicit-any */
import axios, { AxiosResponse } from "axios";

export async function FetchDatasetClassesDashboard(): Promise<AxiosResponse | any> {

    try {
        return axios.get("http://localhost:8080/fetch/dataset/class", {
            withCredentials: true
        });
      
    } catch (error) {
        console.error(error);
    }
}


export function FetchDatasetClasses(): Promise<AxiosResponse<any, any>> {
    try {
        return axios.get("http://localhost:8080/fetch/dataset/class", {
            withCredentials: true
        });
    } catch (error) {
        console.error(error);
        return Promise.reject(error); 
    }
}




export async function FetchDatasetClassImages(datasetClass: string): Promise<AxiosResponse<any, any>>  {
    console.log("classFolderName", datasetClass)

    try {
        return axios.get(`http://localhost:5000/fetch/images/${encodeURIComponent(datasetClass)}`, {
            withCredentials: true
        });

    } catch (error) {
        console.error(error);
        return Promise.reject(error); 
    }
}

