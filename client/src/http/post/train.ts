import axios, { AxiosResponse } from "axios";

export function TrainModel(version: string): Promise<AxiosResponse<any, any>> {
    try {
        return axios.post("http://107.21.85.163:5000/train/model", { version: version });
    } catch (error) {
        console.error(error);
        return Promise.reject(error); 
    }
}
