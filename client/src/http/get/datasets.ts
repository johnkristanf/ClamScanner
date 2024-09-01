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
        return axios.get("http://107.21.85.163:8080/fetch/dataset/class", {
            withCredentials: true
        });
    } catch (error) {
        console.error(error);
        return Promise.reject(error); 
    }
}


// export function FetchDatasetClassImages(classFolderName: string): Promise<AxiosResponse<any, any>> {
//     console.log("classFolderName", classFolderName)
//     try {
//         return axios.get(`http://localhost:8080/fetch/images/${encodeURIComponent(classFolderName)}`);
//     } catch (error) {
//         console.error(error);
//         return Promise.reject(error); 
//     }
// }




export async function FetchDatasetClassImages(classFolderName: string) {
    console.log("classFolderName", classFolderName)

    try {
        const response = await axios.get(`http://107.21.85.163:8080/fetch/images/${encodeURIComponent(classFolderName)}`, {
            withCredentials: true
        });
        return response.data


    } catch (error) {
        console.error(error);
    }
}

