import { useState } from "react";
import { SideBar } from "../components/navigation/sidebar";
import { AddNewDatasetModal, InfoDatasetModal, UploadModal } from "../components/modal/datasets";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faExclamationCircle, faPlusCircle, faArrowLeft, faUpload, faChevronRight} from "@fortawesome/free-solid-svg-icons";
import { useMutation, useQuery, useQueryClient } from "react-query";
import { FetchDatasetClasses, FetchDatasetClassImages } from "../http/get/datasets";
import Swal from "sweetalert2";
import { DeleteDatasetClass } from "../http/delete/dataset";
import { DatasetClassTypes } from "../types/datasets";
import ImagePagination from "../components/datasets/pagination";
import ModelsPage from "./models";
import { ClamScannerNavBar } from "../components/navbar";

import '../../public/scrollStyle.css';

function DataSetsPage() {
    const queryClient = useQueryClient();

    const [isSidebarOpen, setisSidebarOpen] = useState<boolean>(false);
    const [datasetDetails, setDatasetDetails] = useState<boolean>(false);
    const [isOpenAddModal, setIsOpenAddModal] = useState<boolean>(false);
    const [isOpenUpload, setisOpenUpload] = useState<boolean>(false);
    const [isOpenInfoModal, setisOpenInfoModal] = useState<boolean>(false);
    const [classDetailsData, setclassDetailsData] = useState<DatasetClassTypes>();

    const [trainingTableSwitch, setTrainingTableSwitch] = useState<string>('dataset');

    const { data: dataset_query, isLoading } = useQuery("dataset_classes", FetchDatasetClasses);
    const datasets: DatasetClassTypes[] = dataset_query?.data;

    const mutate = useMutation(DeleteDatasetClass, {
        onSuccess: () => {
            queryClient.invalidateQueries('dataset_classes');
            Swal.fire({
                title: "Deleted!",
                text: "Class Deleted Successfully",
                icon: "success",
                confirmButtonColor: "#3085d6",
            });
        },
        onMutate: () => {
            Swal.fire({
                title: 'Deleting...',
                text: 'Please wait while the dataset class is being deleted.',
                icon: 'info',
                allowOutsideClick: false,
                showConfirmButton: false,
                willOpen: () => {
                    Swal.showLoading();
                },
            });
        },
    });

    const DeleteDatasetClassPopup = (class_id: number, className: string) => {
        Swal.fire({
            title: "Are you sure?",
            text: "All uploaded images will be deleted",
            icon: "warning",
            showCancelButton: true,
            confirmButtonColor: "#800000",
            cancelButtonColor: "#3085d6",
            confirmButtonText: "Yes, delete it!"
        }).then((result) => {
            if (result.isConfirmed) mutate.mutate({ class_id: class_id, className: className });
        });
    };

    const handleDetailsData = (data: DatasetClassTypes) => {
        setDatasetDetails(true);
        setclassDetailsData(data);
    };

    return (
        <div className="w-full h-full flex flex-col">
            {isSidebarOpen && <SideBar setisSidebarOpen={setisSidebarOpen} />}

            <div className="h-full w-full p-8">
                <ClamScannerNavBar setisSidebarOpen={setisSidebarOpen} pageName="Training"/>

            {
                trainingTableSwitch === 'dataset' && (
            
                <div className="flex justify-center mt-5">
                    <div className="h-full w-full p-5 bg-gray-100 flex flex-col items-center gap-8 mt-14 rounded-md">

                        {isOpenAddModal && (
                            <>
                                <AddNewDatasetModal setisOpenAddModal={setIsOpenAddModal} />
                            </>
                        )}

                        {isOpenUpload && classDetailsData ? (
                            <UploadModal
                                className={classDetailsData?.name}
                                class_id={classDetailsData?.class_id}
                                setisOpenUpload={setisOpenUpload}
                            />
                        ) : null}

                        {isOpenInfoModal && classDetailsData ? (
                            <>
                                <div className="bg-gray-950 fixed top-0 w-full h-full opacity-75" style={{ zIndex: 6000 }}></div>
                                <InfoDatasetModal
                                    classDetailsData={classDetailsData}
                                    setisOpenInfoModal={setisOpenInfoModal}
                                />
                            </>
                        ) : null}

                        {!datasetDetails && (
                            <div className="flex justify-between w-full">
                                <h1 className="font-bold text-3xl">Dataset Classes</h1>
                                <button
                                    onClick={() => setIsOpenAddModal(true)}
                                    className="bg-blue-900 rounded-md font-bold p-2 text-white hover:opacity-75">
                                    <FontAwesomeIcon icon={faPlusCircle} /> Add New Class
                                </button>
                            </div>
                        )}

                        {isLoading ? (
                            <div className="w-full flex justify-center text-white font-semibold text-2xl">
                                <h1>Loading Dataset Classes...</h1>
                            </div>
                        ) : (
                            <div className="flex gap-16 w-full h-full flex-wrap">
                                {datasetDetails && classDetailsData ? (
                                    <DataSetDetails
                                        classDetailsData={classDetailsData}
                                        setDatasetDetails={setDatasetDetails}
                                        setisOpenUpload={setisOpenUpload}
                                        setisOpenInfoModal={setisOpenInfoModal}
                                    />
                                ) : null}



                                    {/* DATASET CLASSES TABLE */}

                                    <div className="w-full flex justify-center max-h-[350px] overflow-y-auto scrollable-container">
                                        {!datasetDetails && (
                                            <div className="rounded-md h-[8%] w-full bg-white">
                                                <table className="text-sm text-left w-full text-gray-800 font-semibold dark:text-gray-400 h-full">
                                                    <thead className="text-md text-gray-700 uppercase bg-gray-50 dark:bg-gray-700 dark:text-gray-400 font-bold">
                                                        <tr>
                                                            <th scope="col" className="py-3 px-6">Name</th>
                                                            <th scope="col" className="py-3 px-6">Status</th>
                                                            <th scope="col" className="py-3 px-6">Actions</th>
                                                        </tr>
                                                    </thead>

                                                    <tbody>

                                                        {
                                                            datasets && datasets.map((data) => (
                                                                <tr 
                                                                    key={data.class_id}
                                                                    className="bg-white border-b dark:bg-gray-800 dark:border-gray-700"
                                                                >
                                                                    <td className="py-4 px-6">{data.name}</td>
                                                                    <td className="py-4 px-6">{data.status}</td>
                                                                    <td className="py-4 px-6 flex gap-3">
                                                                        <button
                                                                            onClick={() => handleDetailsData(data)}
                                                                            className="bg-blue-900 rounded-md font-bold p-2 text-white hover:opacity-75">
                                                                            Details
                                                                        </button>

                                                                        <button
                                                                            onClick={() => DeleteDatasetClassPopup(data.class_id, data.name)}
                                                                            className="bg-red-800 rounded-md font-bold p-2 text-white hover:opacity-75">
                                                                            Delete
                                                                        </button>
                                                                    </td>
                                                                </tr>
                                                            ))
                                                        }
                                                        
                                                    </tbody>
                                                </table>

                                            </div>
                                        )}
                                    </div>


                                </div>
                            )}

                            
                    </div>
                    
                    {/* TRAINED MODELS TABLE */}

                   
                </div>

                )
            }

                {
                    trainingTableSwitch === 'models' && (<ModelsPage />)
                }
                    
                    <div className="w-full flex justify-end font-semibold text-lg">
                        <h1 
                            className="hover:opacity-75 hover:cursor-pointer flex items-center gap-2"
                            onClick={() => setTrainingTableSwitch(trainingTableSwitch === 'dataset' ? 'models' : 'dataset')}
                        >
                            {trainingTableSwitch === 'dataset' ? (
                                <>
                                    Trained Models <FontAwesomeIcon icon={faChevronRight} />
                                </>
                            ) : (
                                <>
                                    <FontAwesomeIcon icon={faChevronRight} className="rotate-180" />
                                    Dataset Classes
                                </>
                            )}
                        </h1>
                    </div>


            </div>

        </div>
    );
}



function DataSetDetails({classDetailsData, setDatasetDetails, setisOpenUpload, setisOpenInfoModal}: {
    classDetailsData: DatasetClassTypes 
    setDatasetDetails: React.Dispatch<React.SetStateAction<boolean>>,
    setisOpenUpload: React.Dispatch<React.SetStateAction<boolean>>
    setisOpenInfoModal: React.Dispatch<React.SetStateAction<boolean>>,
}){

    const { isLoading, data: images_query } = useQuery(
        ["dataset_images", classDetailsData.name],
        () => FetchDatasetClassImages(classDetailsData.name),
        {
          enabled: !!classDetailsData.name,
          refetchOnWindowFocus: false,
        }
    );
      
    const image = images_query?.data;

    console.log("image: ", image)
    


    return(
        <div className="flex flex-col w-full h-full">

            <div className="flex justify-between items-end w-full">
                                    
                <div className="flex flex-col gap-6  items-start">

                    <h1 
                        onClick={() => setDatasetDetails(false)}
                        className="flex items-center gap-2 font-bold text-2xl hover:text-black hover:cursor-pointer"
                        >

                        <FontAwesomeIcon 
                            icon={faArrowLeft} 
                            className="text-3xl" 
                        />

                        Back
                    </h1>

                    <div className="flex flex-col mb-2">
                        <h1 className=" font-bold text-4xl">{classDetailsData?.name}</h1>
                        <h1 className=" font-semibold text-md" > Status: {classDetailsData.status} </h1>
                    </div>

                </div>

                <div className="flex gap-4 mb-6">
                    <button
                        onClick={() => setisOpenUpload(true)}
                        className="bg-blue-900 rounded-md font-bold p-2 text-white hover:opacity-75">
                            <FontAwesomeIcon icon={faUpload}/> Upload 
                    </button>

                    {
                        classDetailsData.name !== "Invalid Image" ? (
                            <button
                                onClick={() => setisOpenInfoModal(true)}
                                className="bg-yellow-500 rounded-md font-bold p-2 text-white hover:opacity-75">
                                <FontAwesomeIcon icon={faExclamationCircle}/> Info
                            </button>

                        ): null
                    }

                    
                </div>

            </div>

            { isLoading && (
                <div className="flex justify-center mt-12">
                    <h1 className="text-2xl font-semibold">Loading Images....</h1> 
                </div>
            )}

            { image && image.image_data && (
                <ImagePagination 
                    datasetImages={image.image_data} 
                    itemsPerPage={10} 
                    class_id={classDetailsData.class_id}
                    datasetClass={classDetailsData.name}
                /> 
            )}


        </div>
                        
    )
}

export default DataSetsPage;
