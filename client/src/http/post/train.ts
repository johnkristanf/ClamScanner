import axios, { AxiosResponse } from "axios";

export function TrainModel(version: string): Promise<AxiosResponse<any, any>> {
    try {
        return axios.post("https://clamscanner.com/py/train/model", { version: version });
    } catch (error) {
        console.error(error);
        return Promise.reject(error); 
    }
}
