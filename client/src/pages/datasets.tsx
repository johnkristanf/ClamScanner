import { useState } from "react";
import { SideBar } from "../components/navigation/sidebar";
import { AddNewDatasetModal, InfoDatasetModal, UploadModal } from "../components/modal/datasets";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faBars, faExclamationCircle, faPlusCircle, faArrowLeft, faUpload} from "@fortawesome/free-solid-svg-icons";
import { useMutation, useQuery, useQueryClient } from "react-query";
import { FetchDatasetClasses } from "../http/get/datasets";
import Swal from "sweetalert2";
import { DeleteDatasetClass } from "../http/delete/dataset";
import { DatasetClassTypes } from "../types/datasets";
import ChatBot from "../components/chat/chatbot";



function DataSetsPage() {

    const queryClient = useQueryClient();

    const [isSidebarOpen, setisSidebarOpen] = useState<boolean>(false)
    const [datasetDetails, setDatasetDetails] = useState<boolean>(false);

    const [isOpenAddModal, setIsOpenAddModal] = useState<boolean>(false);
    const [isOpenUpload, setisOpenUpload] = useState<boolean>(false);
    const [isOpenInfoModal, setisOpenInfoModal] = useState<boolean>(false);

    const [classDetailsData, setclassDetailsData] = useState<DatasetClassTypes>()

    const dataset_query = useQuery("dataset_classes", FetchDatasetClasses);
    const datasets: DatasetClassTypes[] = dataset_query.data?.data;

    const mutate = useMutation(DeleteDatasetClass, {

        onSuccess: () => {
          queryClient.invalidateQueries('dataset_classes');
    
          Swal.fire({
            title: "Deleted!",
            text: "Class Deleted Successfully",
            icon: "success",
            confirmButtonColor: "#3085d6",
          });
    
        }
    });

    
    const DeleteDatasetClassPopup = (class_id: number, className:string) => {
    
        Swal.fire({
          title: "Are you sure?",
          text: "All uploaded images will be deleted",
          icon: "warning",
          showCancelButton: true,
          confirmButtonColor: "#800000",
          cancelButtonColor: "#3085d6",
          confirmButtonText: "Yes, delete it!"
    
        }).then((result) => {
          if (result.isConfirmed) mutate.mutate({class_id: class_id, className: className})
        });
    
    };

    const handleDetailsData = (data: DatasetClassTypes) => {
        setDatasetDetails(true)
        setclassDetailsData(data)
    }

    return (
        <div className="w-full h-full flex flex-col">

            { isSidebarOpen && <SideBar setisSidebarOpen={setisSidebarOpen} /> }

            <div className="h-full w-full p-8">

                <FontAwesomeIcon
                    onClick={() => setisSidebarOpen(true)} 
                    icon={faBars} 
                    className="font-bold text-3xl hover:opacity-75 hover:cursor-pointer"
                />

                <div className="h-full w-full p-5 bg-gray-600 flex flex-col items-center gap-8 mt-12 rounded-md">

                            {isOpenAddModal && (
                                <>
                                    <div className="bg-gray-950 fixed top-0 w-full h-full opacity-75" style={{ zIndex: 6000 }}></div>
                                    <AddNewDatasetModal setisOpenAddModal={setIsOpenAddModal} />
                                </>
                            )}

                            { isOpenUpload && classDetailsData ? (
                                        <UploadModal 
                                                className={classDetailsData?.name}
                                                class_id={classDetailsData?.class_id} 
                                                setisOpenUpload={setisOpenUpload}
                                                />
                                        ): null
                            }


                            {
                                isOpenInfoModal && classDetailsData ? (
                                    <>
                                        <div className="bg-gray-950 fixed top-0 w-full h-full opacity-75" style={{ zIndex: 6000 }}></div>
                                        <InfoDatasetModal 
                                            classDetailsData={classDetailsData} 
                                            setisOpenInfoModal={setisOpenInfoModal} 
                                        />
                                    </>
                                ): null
                            }

                            

                            {!datasetDetails && (

                                        <div className="flex justify-between w-full">
                                            <h1 className="text-white font-bold text-2xl">Clam Scanner Dataset Classes</h1>
                                            <button
                                                onClick={() => setIsOpenAddModal(true)}
                                                className="bg-blue-900 rounded-md font-bold p-2 text-white hover:opacity-75">
                                                <FontAwesomeIcon icon={faPlusCircle}/> Add New Class
                                            </button>
                                        </div>
                            )}

                           

                            <div className="flex gap-16 w-full h-full flex-wrap">

                                    {datasetDetails && classDetailsData ? (

                                        <DataSetDetails 
                                            classDetailsData={classDetailsData}
                                            setDatasetDetails={setDatasetDetails} 
                                            setisOpenUpload={setisOpenUpload}
                                            setisOpenInfoModal={setisOpenInfoModal}
                                        />

                                    ) : null}

                                    {datasets?.map((data) => (

                                        <div key={data.class_id}>


                                            {!datasetDetails && ( 

                                                <div className="rounded-md h-[8%] w-[30%] bg-white">

                                                    <table className="text-sm text-left w-full text-gray-800 font-semibold dark:text-gray-400 h-full">
                                                        <thead className="text-md text-gray-700 uppercase bg-gray-50 dark:bg-gray-700 dark:text-gray-400 font-bold">
                                                            <tr>
                                                                <th scope="col" className="py-3 px-6">Class</th>
                                                                <th scope="col" className="py-3 px-6">Actions</th>
                                                            </tr>
                                                        </thead>
                                                        
                                                        <tbody>
                                                            <tr className="bg-white border-b dark:bg-gray-800 dark:border-gray-700">
                                                                <td className="py-4 px-6">{data.name}</td>
                                                                <td className="py-4 px-6 flex gap-3">
                                                                    <button
                                                                        onClick={() => handleDetailsData(data)}
                                                                        className="bg-blue-900 rounded-md font-bold p-2 text-white hover:opacity-75" >
                                                                        Details
                                                                    </button>

                                                                    <button
                                                                        onClick={() => DeleteDatasetClassPopup(data.class_id, data.name)}
                                                                        className="bg-red-800 rounded-md font-bold p-2 text-white hover:opacity-75" >
                                                                        Delete
                                                                    </button>
                                                                </td>
                                                            </tr>
                                                        </tbody>
                                                    </table>
                                                </div>
                                            )}
                                        </div>
                                ))}
                            </div>


                   

                </div>
            </div>

            <ChatBot />
        </div>
    );
}


// const proccessImageBytes = (imgSrc: string) => {
//     const binary = atob(imgSrc);
//     const binaryArray = new Uint8Array(binary.length)

//     for (let index = 0; index < binaryArray.length; index++) {
//         binaryArray[index] = binary.charCodeAt(index)
//     }

//     const blob = new Blob([binaryArray], { type: 'image/jpeg' })
//     return URL.createObjectURL(blob)

// }


function DataSetDetails({classDetailsData, setDatasetDetails, setisOpenUpload, setisOpenInfoModal}: {
    classDetailsData: DatasetClassTypes 
    setDatasetDetails: React.Dispatch<React.SetStateAction<boolean>>,
    setisOpenUpload: React.Dispatch<React.SetStateAction<boolean>>
    setisOpenInfoModal: React.Dispatch<React.SetStateAction<boolean>>,
}){



    // const [imagesURL, setImagesURLs] = useState<string[]>();
    // const classFolderName = classDetailsData.name;
    // const imagesQuery = useQuery(["datasetImages", classFolderName], () => FetchDatasetClassImages(classFolderName));
    // const datasetImages: string[] = imagesQuery.data?.data;
    // console.log("datasetImages", datasetImages)


    // useEffect(() => {

    //     const fetchData = async () => {
    //         try {

    //             const imageData = await FetchDatasetClassImages(classFolderName);
    //             setImagesURLs(imageData)
    //             console.log("imageData", imageData)

    //             const urlArray: string[] = []

    //             imageData.images.map((data: string) => {
    //                 const url = proccessImageBytes(data)
    //                 urlArray.push(url)
    //             })

    //             setImagesURLs(urlArray)

    //             console.log("urlArray", urlArray)

    //         } catch (error) {
    //             console.error(error);
    //         }
    //     };
    
    //     fetchData();
    // }, [classFolderName]);



    return(
        <div className="flex flex-col w-full h-full">

            <div className="flex justify-between items-end w-full">
                                    
                <div className="flex flex-col gap-6  items-start">

                    <h1 
                        onClick={() => setDatasetDetails(false)}
                        className="flex items-center gap-2 text-white font-bold text-2xl hover:text-black hover:cursor-pointer"
                        >

                        <FontAwesomeIcon 
                            icon={faArrowLeft} 
                            className="text-3xl" 
                        />

                        Back
                    </h1>

                    <div className="flex flex-col mb-2">
                        <h1 className="text-white font-bold text-4xl">{classDetailsData?.name}</h1>
                        <h1 className="text-white font-semibold text-md" >Dataset Images: {classDetailsData?.count}</h1>
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

            {/* { imagesURL && <ImagePagination datasetImages={imagesURL} itemsPerPage={5} /> } */}


        </div>
                        
    )
}

export default DataSetsPage;
