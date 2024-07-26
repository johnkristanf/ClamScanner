import axios from "axios";
import { DatasetClassTypes } from "../../types/datasets";

export async function UploadNewImage(uploadFormData: FormData): Promise<boolean | undefined>{

    try {
        const response = await axios.post("http://localhost:5000/upload/dataset/images", uploadFormData, {
            headers: { 
                'Content-Type': 'multipart/form-data'
            }
        });
        console.log("response upload: ", response)
        if(response.status === 200) return true

    } catch (error) {
        console.error(error);
        return false
    }
}



export async function AddNewDatasetClass(data: DatasetClassTypes){

    try {
        return axios.post("http://localhost:8080/add/dataset/class", data, {
            withCredentials: true,
            headers: {
                "Content-Type": "application/json"
            }
        });
    } catch (error) {
        console.error(error);
    }
}

export async function EditDatasetClass(data: DatasetClassTypes){

    try {
        return axios.post("http://localhost:8080/edit/dataset/class", data, {
            withCredentials: true,
            headers: {
                "Content-Type": "application/json"
            }
        });
    } catch (error) {
        console.error(error);
    }
}


