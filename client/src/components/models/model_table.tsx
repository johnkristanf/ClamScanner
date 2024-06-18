import { useQuery } from "react-query";
import { FetchModels } from "../../http/get/model";
import { FetchModelType } from "../../types/datasets";


export function ModelTable({ setisModelDetailsModal, setModelDetails, setNumberOfTrainedModels }: {
    setisModelDetailsModal: React.Dispatch<React.SetStateAction<boolean>>,
    setModelDetails: React.Dispatch<React.SetStateAction<FetchModelType | undefined>>,
    setNumberOfTrainedModels:  React.Dispatch<React.SetStateAction<number | undefined>>
}){

    const models_query = useQuery("reported_cases", FetchModels);
    const models: FetchModelType[] = models_query.data?.data;
    if(models) setNumberOfTrainedModels(models.length)



    console.log("models: ", models)

    const openModelModal = (data: FetchModelType) => {
        setisModelDetailsModal(true)
        setModelDetails(data)
    }

    // Check if there are models available
    if (!models || models.length === 0) {
        return <div className="text-white text-2xl font-bold text-center">No Trained Models</div>;
    }

    return (
        <div className="overflow-auto flex items-center justify-center h-full w-full scrollable-container">
            <div className="rounded-md h-full w-full">
                <table className="text-sm text-left w-full text-gray-800 font-semibold dark:text-gray-400 h-[50%] bg-white">
                    <thead className="text-md text-gray-700 uppercase bg-gray-50 dark:bg-gray-700 dark:text-gray-400 font-bold">
                        <tr>
                            <th scope="col" className="py-3 px-6">Versions</th>
                            <th scope="col" className="py-3 px-6">Trained At</th>
                            <th scope="col" className="py-3 px-6">Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {models && models.map((item) => (
                            <tr key={item.version} className="text-black font-bold">
                                <td scope="col" className="py-3 px-6"> {item.version} </td>
                                <td scope="col" className="py-3 px-6"> {item.trained_at} </td>
                                <td scope="col" className="py-3 px-6 text-white flex gap-3">
                                    <button 
                                        onClick={() => openModelModal(item)}
                                        className="bg-blue-900 rounded-md p-2 hover:opacity-75">
                                        Train Details
                                    </button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
