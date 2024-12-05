import axios, { AxiosResponse } from "axios";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function TrainModel(version: string): Promise<AxiosResponse<any, any>> {
    try {
        return axios.post("https://clamscanner.com/go/train/model", { version: version });
    } catch (error) {
        console.error(error);
        return Promise.reject(error); 
    }
}
