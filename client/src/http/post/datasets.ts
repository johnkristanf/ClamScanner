import axios from "axios";
import { DatasetClassTypes } from "../../types/datasets";

export async function UploadNewImage(uploadFormData: FormData): Promise<boolean | undefined>{

    try {
        const response = await axios.post("http://localhost:8080/upload/images", uploadFormData, {
            withCredentials: true,
            headers: { 
                'Content-Type': 'multipart/form-data'
            }
        });
        
        if(response.status === 200) return true

    } catch (error) {
        console.error(error);
        return false
    }
}



export async function AddNewDatasetClass(data: DatasetClassTypes){

    try {
        return axios.post("http://localhost:8080/add/dataset/class", data, {
            withCredentials: true
        });
    } catch (error) {
        console.error(error);
    }
}

