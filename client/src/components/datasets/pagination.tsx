import React, { useState } from 'react';
import { ImageData } from '../../types/datasets';
import { DeleteDatasetImage } from '../../http/post/datasets';
import { useMutation, useQueryClient } from 'react-query';
import Swal from 'sweetalert2';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faCheckDouble, faTrash, faX } from '@fortawesome/free-solid-svg-icons';

interface ImagePaginationProps {
  datasetImages: ImageData[];
  itemsPerPage: number;
  class_id: number;
  datasetClass: string
}

const ImagePagination: React.FC<ImagePaginationProps> = ({
  datasetImages,
  itemsPerPage,
  class_id,
  datasetClass
}) => {

  const queryClient = useQueryClient();

  const [currentPage, setCurrentPage] = useState(1);
  const [selectedKeys, setSelectedKeys] = useState<string[]>([]); // Track selected keys
  const [isSelectAll, setIsSelectAll] = useState(false); // Track select all state

  const totalPages = Math.ceil(datasetImages.length / itemsPerPage);
  const totalImages = datasetImages.length === 0 ? 1 : datasetImages.length;
 

  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = Math.min(startIndex + itemsPerPage, datasetImages.length);

  const paginatedImages = datasetImages.slice(startIndex, endIndex);

  const handleNextPage = () => {
    if (currentPage < totalPages) {
      setCurrentPage((prev) => prev + 1);
    }
  };

  const handlePreviousPage = () => {
    if (currentPage > 1) {
      setCurrentPage((prev) => prev - 1);
    }
  };

  const handleCheckboxChange = (key: string) => {
    setSelectedKeys((prevSelected) =>
      prevSelected.includes(key)
        ? prevSelected.filter((k) => k !== key) // Remove if unchecked
        : [...prevSelected, key] // Add if checked
    );
  };

  const mutate = useMutation(DeleteDatasetImage, {

    onSuccess: () => {
      queryClient.invalidateQueries('dataset_images');

      selectedKeys.length = 0

      Swal.fire({
        title: "Deleted!",
        text: "Dataset Image Deleted Successfully",
        icon: "success",
        confirmButtonColor: "#3085d6",
      })

    },

    onMutate: () => {
      Swal.fire({
        title: 'Deleting...',
        text: 'Please wait while the images are being deleted.',
        icon: 'info',
        allowOutsideClick: false,
        showConfirmButton: false,
        willOpen: () => {
          Swal.showLoading();
        },
      });
    },

    onError: (error) => {
      console.error(error)
      Swal.close();
      Swal.fire({
        title: 'Error!',
        text: 'There was an error deleting the report. Please try again.',
        icon: 'error',
        confirmButtonColor: '#3085d6',
      });
    },
  });

  const handleImageDelete = () => {
    Swal.fire({
      title: "Are you sure?",
      text: "On Deleting this Dataset Image",
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#800000",
      cancelButtonColor: "#3085d6",
      confirmButtonText: "Yes, delete it!"

    }).then((result) => {
      if (result.isConfirmed) {
        mutate.mutate({ selectedKeys, class_id, datasetClass }); 
      }
    });
  } 

  const handleSelectAll = () => {
    if (isSelectAll) {
      setSelectedKeys([]);
    } else {
      const allKeys = datasetImages.map((image) => image.key);
      setSelectedKeys(allKeys); 
    }
    setIsSelectAll(!isSelectAll); 
  };


  console.log("selectedKeys: ", selectedKeys)

  if(paginatedImages.length <= 0){
    return (
      <div className='flex justify-center mt-12 font-semibold text-2xl text-white'>
        <h1>No Dataset Images Available</h1>
      </div>
    )
  }



  return (
    <div>
      <div className='flex flex-wrap items-center justify-around'>

        <div className='w-full ml-6 mt-6 mb-3 flex justify-between'>

          <p className='text-xl font-semibold text-white'>
            {
              datasetImages.length > 1 
                ? `Total Dataset Images: ${totalImages}` 
                : `Total Dataset Image: ${totalImages}`
            }
          </p>

          
          <div className={`flex items-center ${selectedKeys.length == 0 ? "justify-end" : ""} mr-5 gap-3 w-[40%] font-semibold text-white`}>

            {
              selectedKeys.length > 0 ? (
                  <h1 className='w-[50%]'>
                    { selectedKeys.length != 1 ? `${selectedKeys.length} selected images` : `${selectedKeys.length} selected image`}
                  </h1>
                ) : null
            }
              

           
            <div 
              className={`flex ${selectedKeys.length == 0 ? "w-[20%]" : "w-[40%]"} items-center gap-3 hover:opacity-75 hover:cursor-pointer`}
              onClick={handleSelectAll}
            >
              { isSelectAll ? <FontAwesomeIcon icon={faX} />: <FontAwesomeIcon icon={faCheckDouble} /> }
              <h1>{ isSelectAll ? "Unselect All": "Select All" }</h1>
            </div>
                
              
            {
              selectedKeys.length > 0 && (
                <div 
                  className="flex w-[40%] items-center gap-3 hover:opacity-75 hover:cursor-pointer"
                  onClick={handleImageDelete}
                >
                  {<FontAwesomeIcon icon={faTrash} />}
                  <h1>Delete</h1>
                </div>
              )
            }

          </div>
          
        </div>


        {paginatedImages.map((data, index: number) => (

          <div 
            key={index} 
            className='relative hover:cursor-pointer hover:bg-blue-900 rounded-md' 
            onClick={() => handleCheckboxChange(data.key)} 
          >

            <img
              src={data.url}
              style={{ width: 200, height: 200, margin: 7 }}
              alt={`image-${index}`}
              className='rounded-md'
            />

            <input
              type="checkbox"
              className={`absolute top-1 right-1 m-2 ${selectedKeys.length == 0 ? "hidden": ""}`}
              checked={selectedKeys.includes(data.key)}
              onChange={() => handleCheckboxChange(data.key)}
            />
          </div>
        ))}

      </div>

      <div className='flex justify-end gap-5 mt-4'>
        {/* Previous Page Button */}
        {currentPage > 1 && (
          <button
            onClick={handlePreviousPage}
            className='p-2 rounded-md font-bold bg-blue-900 font-semibold text-white hover:opacity-75'
          >
            Previous Page
          </button>
        )}

        {/* Next Page Button */}
        {currentPage < totalPages && (
          <button
            onClick={handleNextPage}
            className='p-2 rounded-md font-bold bg-blue-900 font-semibold text-white hover:opacity-75'
          >
            Next Page
          </button>
        )}
      </div>

      <div className="flex justify-end mt-4 font-semibold text-white px-6">
        <p>Page {currentPage} of {totalPages}</p>
      </div>

    </div>
  );
};

export default ImagePagination;
