export type DatasetClassTypes = {
    class_id:           number
    name:               string 
    scientific_name:    string
    description:        string 
    status:             string 
    count:              string 
}

export type DeleteDatasetClassType = {
    class_id: number, 
    className:string
}


export type FetchModelType = {
    model_id: number
    version: string,
    train_acc: number,
    train_loss: number,
    trained_at: string
}


export type ImageData = {
    key: string,
    url: string
}


export type DeleteImageDataTypes = { 
    selectedKeys: string[], 
    class_id: number, 
    datasetClass: string 
}