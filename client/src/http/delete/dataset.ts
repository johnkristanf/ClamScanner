import axios, { AxiosResponse } from "axios";
import { DeleteDatasetClassType } from "../../types/datasets";

export function DeleteDatasetClass(data: DeleteDatasetClassType): Promise<AxiosResponse<any, any>> {

    try {
        return axios.delete(`http://107.21.85.163:8080/delete/class/${encodeURIComponent(data.class_id)}/${encodeURIComponent(data.className)}`, {
            withCredentials: true
        });
    } catch (error) {
        console.error(error);
        return Promise.reject(error); 
    }
}
