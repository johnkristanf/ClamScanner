import { useQuery } from "react-query";
import { FetchModels } from "../../http/get/model";
import { FetchModelType } from "../../types/datasets";


export function ModelTable({ setNumberOfTrainedModels }: {
    setNumberOfTrainedModels:  React.Dispatch<React.SetStateAction<number | undefined>>
}){

    const models_query = useQuery("reported_cases", FetchModels);
    const models: FetchModelType[] = models_query.data?.data;
    if(models) setNumberOfTrainedModels(models.length)



    console.log("models: ", models)

    // const openModelModal = (data: FetchModelType) => {
    //     setisModelDetailsModal(true)
    //     setModelDetails(data)
    // }

    return (
        <div className="overflow-auto flex items-center justify-center h-full w-full scrollable-container">
            <div className="rounded-md h-full w-full">
                <table className="text-sm text-left w-full text-gray-800 font-semibold dark:text-gray-400 h-[50%] bg-white">
                    <thead className="text-md text-gray-700 uppercase bg-gray-50 dark:bg-gray-700 dark:text-gray-400 font-bold">
                        <tr>
                            <th scope="col" className="py-3 px-6">Versions</th>
                            <th scope="col" className="py-3 px-6">Accuracy</th>
                            <th scope="col" className="py-3 px-6">Loss</th>
                            <th scope="col" className="py-3 px-6">Trained At</th>
                            {/* <th scope="col" className="py-3 px-6">Actions</th> */}
                        </tr>
                    </thead>
                    <tbody>
                        {models && models.map((item) => (
                            <tr key={item.model_id} className="text-black font-bold">
                                <td scope="col" className="py-3 px-6"> {item.version} </td>
                                <td scope="col" className="py-3 px-6"> {item.train_acc} </td>
                                <td scope="col" className="py-3 px-6"> {item.train_loss} </td>
                                <td scope="col" className="py-3 px-6"> {item.trained_at} </td>
                                {/* <td scope="col" className="py-3 px-6 text-white flex gap-3">
                                    <button 
                                        onClick={() => openModelModal(item)}
                                        className="bg-blue-900 rounded-md p-2 hover:opacity-75">
                                        Train Details
                                    </button>
                                </td> */}
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
