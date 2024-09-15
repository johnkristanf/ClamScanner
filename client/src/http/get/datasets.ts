import axios, { AxiosResponse } from "axios";

export async function FetchDatasetClassesDashboard(): Promise<AxiosResponse | any> {

    try {
        return axios.get("https://clamscanner.com/go/fetch/dataset/class", {
            withCredentials: true
        });
      
    } catch (error) {
        console.error(error);
    }
}


export function FetchDatasetClasses(): Promise<AxiosResponse<any, any>> {
    try {
        return axios.get("https://clamscanner.com/go/fetch/dataset/class", {
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
        return axios.get(`https://clamscanner.com/py/fetch/images/${encodeURIComponent(datasetClass)}`, {
            withCredentials: true
        });

    } catch (error) {
        console.error(error);
        return Promise.reject(error); 
    }
}

