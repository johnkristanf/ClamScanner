import { faEdit, faX } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { useState } from "react";
import { AddNewDatasetClass, EditDatasetClass, UploadNewImage } from "../../http/post/datasets";
import { DatasetClassTypes } from "../../types/datasets";
import { useMutation, useQueryClient } from "react-query";
import { useForm } from "react-hook-form";
import Swal from "sweetalert2";
import { faTimes } from "@fortawesome/free-solid-svg-icons/faTimes";



export const AddNewDatasetModal = ({setisOpenAddModal}: {
    setisOpenAddModal: React.Dispatch<React.SetStateAction<boolean>>,
}) => {

    const queryClient = useQueryClient();
    const { register, handleSubmit, reset } = useForm<DatasetClassTypes>();


    const { isLoading, mutate } = useMutation(AddNewDatasetClass, {

        onSuccess: () => {
            queryClient.invalidateQueries("dataset_classes");

            Swal.fire({
                title: "Class Added!",
                text: "Add New Dataset Class Successfully",
                icon: "success",
                confirmButtonColor: "#3085d6",
            });

            setisOpenAddModal(false)
            reset();
        
        },
  
        onError: (error: any) => {
          console.error("Signup error:", error);
        },
    })


    const onSubmit = (data: DatasetClassTypes) => mutate(data)
    

    if(isLoading){
        Swal.fire({
            title: 'Adding...',
            text: 'Please wait while the new dataset class is being added.',
            icon: 'info',
            allowOutsideClick: false,
            showConfirmButton: false,
            willOpen: () => {
                Swal.showLoading();
            },
        });

        return;
    }


    return(

        <>
        
        <div className="bg-gray-950 fixed top-0 w-full h-full opacity-75" style={{ zIndex: 6000 }}></div>

        <div className="flex flex-col bg-white rounded-md items-center fixed top-0 w-[40%] p-5" style={{zIndex: 7000}}>
            
            <h1 className="text-black font-bold text-2xl mb-5">Add New Dataset Class</h1>

            <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col items-center w-full gap-5">

                <input 
                    {...register("name", { required: true })}
                    type="text" 
                    placeholder="Name"
                    className="rounded-md bg-gray-300 placeholder-gray-500 font-semibold p-2 w-[60%] focus:outline-blue-950"
                />

                <input 
                    {...register("scientific_name", { required: true })}
                    type="text" 
                    placeholder="Scientific Name"
                    className="rounded-md bg-gray-300 placeholder-gray-500 font-semibold p-2 w-[60%] focus:outline-blue-950"
                />

                <textarea 
                    {...register("description", { required: true })}

                    rows={4} 
                    cols={50} 
                    className="rounded-md bg-gray-300 placeholder-gray-500 font-semibold p-2 w-[60%] focus:outline-blue-950" 
                    placeholder="Description"
                />


                <input 
                    {...register("status", { required: true })}
                    type="text" 
                    placeholder="Status (eg: Endangered, Vulnerable etc..)" 
                    className="rounded-md bg-gray-300 placeholder-gray-500 font-semibold p-2 w-[60%] focus:outline-blue-950"
                />

                <button type="submit" className="text-white font-bold bg-blue-900 w-[60%] rounded-md p-3 hover:opacity-75">Add</button>

            </form>

            <button onClick={() => setisOpenAddModal(false)} className="text-white mt-3 font-bold bg-black w-[60%] rounded-md p-3 hover:opacity-75">Cancel</button>


        </div>

        </>

    )
}



export const InfoDatasetModal = ({ classDetailsData, setisOpenInfoModal }: {
    classDetailsData: DatasetClassTypes,
    setisOpenInfoModal: React.Dispatch<React.SetStateAction<boolean>>
}) => {

    const queryClient = useQueryClient();
    const [readOnly, setReadOnly] = useState(true);
    const [formData, setFormData] = useState<DatasetClassTypes>({
        ...classDetailsData 
    });

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        setFormData(prevState => ({
            ...prevState,
            [name]: value
        }));
    };

    const { isLoading, mutate } = useMutation(EditDatasetClass, {

        onSuccess: () => {
            queryClient.invalidateQueries("dataset_classes");

            Swal.fire({
                title: "Changes Saved",
                text: "Dataset information updated successfully",
                icon: "success",
                confirmButtonColor: "#3085d6",
            }).then(result => {

                const { isConfirmed, isDismissed } = result

                if(isConfirmed || isDismissed){
                    window.location.href = '/datasets'
                }
            })
    
            setReadOnly(true);
            setisOpenInfoModal(false)
        
        },
  
        onError: (error: any) => {
          console.error("Edit Dataset Error:", error);
        },
    })


    const saveChanges = () => mutate(formData)

       
    

    if(isLoading) return <div>Fetching Dataset Clase Information....</div>


    return (
        <div className="flex w-full justify-center items-center">
            <div className="flex flex-col bg-white rounded-md absolute top-8 w-[70%] p-5" style={{ zIndex: 7000 }}>

                <div className="flex w-full justify-between items-center">
                    <h1 className="text-black font-bold text-2xl mb-5">{formData.name}</h1>

                    <div className="flex gap-5">
                        {readOnly ? (
                            <button
                                onClick={() => setReadOnly(!readOnly)}
                                className="text-white font-bold w-full rounded-md p-3 hover:opacity-75 bg-blue-900"
                            >
                                <FontAwesomeIcon icon={faEdit} />
                            </button>
                        ) : (
                            <div className="flex gap-5">
                                <button
                                    onClick={saveChanges}
                                    className="text-white font-bold w-full rounded-md p-3 hover:opacity-75 bg-blue-900"
                                >
                                    Save
                                </button>

                                <button
                                    onClick={() => {
                                        setReadOnly(!readOnly);
                                        // Optionally, reset formData to original values on cancel
                                        // setFormData(classDetailsData);
                                    }}
                                    className="text-white font-bold w-full rounded-md p-3 hover:opacity-75 bg-gray-500"
                                >
                                    Cancel
                                </button>
                            </div>
                        )}

                        <button
                            onClick={() => setisOpenInfoModal(false)}
                            className="text-white font-bold bg-black w-full rounded-md p-3 hover:opacity-75"
                        >
                            <FontAwesomeIcon icon={faX} />
                        </button>
                    </div>
                </div>

                <form className="flex flex-col w-full gap-5">
                    <div className="flex flex-col gap-1">
                        <h1 className="text-gray-500 font-bold text-lg">Description</h1>
                        <textarea
                            readOnly={readOnly}
                            rows={5}
                            className={`rounded-md bg-gray-300 placeholder-gray-500 font-semibold p-2 w-full focus:outline-none ${!readOnly ? 'border-2 border-blue-800' : ''}`}
                            value={formData.description}
                            onChange={handleInputChange}
                            name="description"
                        />
                    </div>

                    <div className="flex flex-col gap-2">
                        <h1 className="text-gray-500 font-bold text-lg">Scientific Name</h1>
                        <input
                            type="text"
                            readOnly={readOnly}
                            value={formData.scientific_name}
                            onChange={handleInputChange}
                            name="scientific_name"
                            className={`rounded-md mb-5 bg-gray-300 placeholder-gray-500 font-semibold p-2 w-full focus:outline-none ${!readOnly ? 'border-2 border-blue-800' : ''}`}
                        />

                        <h1 className="text-gray-500 font-bold text-lg">Status</h1>
                        <input
                            type="text"
                            readOnly={readOnly}
                            value={formData.status}
                            onChange={handleInputChange}
                            name="status"
                            className={`rounded-md bg-gray-300 placeholder-gray-500 font-semibold p-2 w-full focus:outline-none ${!readOnly ? 'border-2 border-blue-800' : ''}`}
                        />
                    </div>
                </form>
            </div>
        </div>
    );
};


export function UploadModal({ className, class_id, setisOpenUpload }: {
    className: string,
    class_id: number,
    setisOpenUpload: React.Dispatch<React.SetStateAction<boolean>>,
}) {

    const queryClient = useQueryClient();

    const [uploadedFiles, setUploadedFiles] = useState<File[]>([]);

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const files = e.target.files;
        if (files) {
            const fileList = Array.from(files);
            setUploadedFiles(fileList);
        }
    };

    const handleRemoveFile = (fileToRemove: File) => {
        const updatedFiles = uploadedFiles.filter(file => file !== fileToRemove);
        setUploadedFiles(updatedFiles);
    };

    const Upload = async () => {
        if (uploadedFiles.length > 0 && className && class_id) {
            setisOpenUpload(false);

            Swal.fire({
                title: 'Uploading...',
                text: 'Please wait while the uploading image is being process.',
                icon: 'info',
                allowOutsideClick: false,
                showConfirmButton: false,
                willOpen: () => {
                    Swal.showLoading();
                },
            });

            const formData = new FormData();
            uploadedFiles.forEach(file => {
                formData.append('images', file);
            });
            formData.append("datasetClass", className);
            formData.append("class_id", String(class_id));

            const isUploaded = await UploadNewImage(formData);

            if (isUploaded) {
                Swal.close();

                Swal.fire({
                    title: "Images Uploaded",
                    text: "New Images Uploaded Successfully",
                    icon: "success",
                    confirmButtonColor: "#3085d6",
                })

                queryClient.invalidateQueries('dataset_images');
                setisOpenUpload(false);
            }
        }
    };

    return (
        <>
            <div className="bg-gray-950 fixed top-0 w-full h-full opacity-75" style={{ zIndex: 6000 }}></div>
            
            <div className="flex w-full justify-center items-center">
                <div className={`flex justify-center w-[35%] ${uploadedFiles.length <= 0 ? "h-[68%]": "h-[80%]" }  bg-white rounded-md fixed top-5`} style={{ zIndex: 7000 }}>
                    
                    <div className="flex flex-col items-center justify-center gap-5">
                        <h1 className="font-semibold text-3xl">Upload New Dataset Images</h1>
                        <p className="font-semibold text-sm ">Unsupported image type and corrupted will get discarded</p>
                        <p className="font-semibold text-sm ">Repeated image will also get discarded</p>

                        <p className="font-semibold text-sm ">Supported Image Type: jpg, jpeg, png</p>

                        {
                            uploadedFiles.length <= 0 && (
                                    <div className="border-2 border-gray-300 border-dashed rounded-md px-6 py-4">
                                        <label htmlFor="fileInput" className="cursor-pointer">
                                            <svg
                                                className="w-12 h-12 text-gray-400 mx-auto"
                                                fill="none"
                                                viewBox="0 0 24 24"
                                                stroke="currentColor"
                                            >
                                                <path
                                                    strokeLinecap="round"
                                                    strokeLinejoin="round"
                                                    strokeWidth={2}
                                                    d="M12 6v6m0 0v6m0-6h6m-6 0H6"
                                                />
                                            </svg>
                                            <p className="text-xs text-gray-500">Drag and drop files here or click to browse</p>
                                            <input
                                                id="fileInput"
                                                type="file"
                                                className="hidden"
                                                accept=".svg, .png, .jpg, .jpeg, .gif"
                                                multiple
                                                onChange={handleFileChange}
                                            />
                                        </label>
                                    </div>
                            )
                        }

                       

                        <div className="flex flex-col gap-2 w-full">

                            <div className="flex flex-col gap-2 w-full">

                                {uploadedFiles.length > 0 && (

                                    <>

                                        <h2 className="text-lg font-semibold">Selected Files:</h2>

                                        <div className="border border-gray-300 rounded-md p-2 h-40 overflow-y-scroll">

                                            {uploadedFiles.map((file, index) => (
                                                <div key={index} className="flex items-center gap-2 mt-2">

                                                    <div className="relative w-full">
                                                        <img
                                                            src={URL.createObjectURL(file)}
                                                            alt={file.name}
                                                            className="h-32 w-full object-cover rounded-md relative"
                                                        />

                                                        <button
                                                            className="text-red-600 hover:text-red-800 absolute top-0 right-2"
                                                            onClick={() => handleRemoveFile(file)}
                                                        >
                                                            <FontAwesomeIcon icon={faTimes} className="text-3xl" />
                                                        </button>
                                                    </div>
                                                  
                                                  

                                                </div>
                                            ))}

                                        </div>

                                    </>
                                )}

                            </div>
                            <button
                                type="submit"
                                onClick={Upload}
                                className={`font-bold rounded-md p-2 w-full hover:opacity-75 bg-blue-900 text-white`}
                            >
                                Upload
                            </button>

                            <button
                                onClick={() => setisOpenUpload(false)}
                                className={`bg-black text-white font-bold rounded-md p-2 w-full hover:opacity-75`}
                            >
                                Cancel
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </>
    );
}