import { useForm } from "react-hook-form";
import { useMutation, useQueryClient } from "react-query";
import { TrainModel } from "../../http/post/train";
import Swal from "sweetalert2";
import { useEffect } from "react";
import { FetchModelType } from "../../types/datasets";

export function ModelDetailsModal({ setisModelDetailsOpen, modelDetails }:{
    setisModelDetailsOpen: React.Dispatch<React.SetStateAction<boolean>>,
    modelDetails: FetchModelType,
    
}){
    
    return(
        <>
            <div className="bg-gray-950 fixed top-0  w-full h-full opacity-75" style={{zIndex: 6000}}></div>
            
            <div className="flex w-full h-full justify-center items-center">

                <div className="flex flex-col  gap-5 bg-white rounded-md absolute top-0 w-[30%] p-5 mt-12" style={{ zIndex: 7000 }}>
                    <h1 className="font-bold text-4xl text-center"> {modelDetails.version} </h1>

                    <h1 className="font-semibold text-lg">Convolutional Neural Network</h1>
                    <h1 className="font-semibold text-lg">Training Accuracy: {modelDetails.train_acc}%</h1>
                    <h1 className="font-semibold text-lg">Training Loss: {modelDetails.train_loss}%</h1>

                    <button 
                        onClick={() => setisModelDetailsOpen(false)}
                        className="bg-black rounded-md p-3 text-white w-full hover:opacity-75">
                            Close
                    </button>

                </div>
            </div>
            
        </>
       
    )

}


export function TrainForm({setisTrainModalOpen}: {
    setisTrainModalOpen: React.Dispatch<React.SetStateAction<boolean>>
}){

    const { register, handleSubmit, reset } = useForm<{ version: string }>();

    const queryClient = useQueryClient();

    const { isLoading, mutate } = useMutation(TrainModel, {
        onSuccess: () => {
          queryClient.invalidateQueries("train_model");
          setisTrainModalOpen(false)
          reset();
        },
  
        onError: (error: any) => {
          console.error("Signup error:", error);
        },
    })


    const onSubmit = (data: { version: string } ) => {
        console.log("data", data)
        mutate(data.version)
    }


    useEffect(() => {
        if(isLoading) {
            setisTrainModalOpen(false)
    
            Swal.fire({
                title: "Training will take a few moments!",
                didOpen: () => {
                  Swal.showLoading();
                },
            })
        }
    }, [isLoading])

   
        

    
    return(
        <>
            <div className="bg-gray-950 fixed top-0  w-full h-full opacity-75" style={{zIndex: 6000}}></div>
            
            <div className="flex w-full h-full justify-center items-center">

                <div className="flex flex-col items-center gap-5 bg-white rounded-md absolute top-0 w-[30%] p-8 mt-12" style={{ zIndex: 7000 }}>
                    <h1 className="font-bold text-4xl">Train New Model</h1>

                    <form onSubmit={handleSubmit(onSubmit)}>

                        <label className="font-bold">Model Version</label>
                        <input 
                            {...register("version", { required: true })}
                            type="number" 
                            step="any"
                            className="rounded-md mt-2 bg-gray-300 placeholder-gray-500 font-semibold p-2 w-[100%] focus:outline-blue-950" 
                            placeholder="Enter Model Version"/>

                        <button 
                            type="submit"
                            className="bg-blue-900 rounded-md mt-5 p-3 text-white w-full hover:opacity-75">
                                Train
                        </button>

                    </form>


                    <button 
                        onClick={() => setisTrainModalOpen(false)}
                        className="bg-black rounded-md p-3 text-white w-full hover:opacity-75">
                            Cancel
                    </button>

                </div>
            </div>
            
        </>
       
    )
}