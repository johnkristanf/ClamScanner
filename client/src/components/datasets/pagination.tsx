import React, { useState } from 'react';

interface ImagePaginationProps {
  datasetImages: any;
  itemsPerPage: number;
}

const ImagePagination: React.FC<ImagePaginationProps> = ({
  datasetImages,
  itemsPerPage,
}) => {

  const [currentPage, setCurrentPage] = useState(1);
  const [loadedImages, setLoadedImages] = useState(itemsPerPage);

  const totalPages = Math.ceil(datasetImages.length / itemsPerPage);

  const handleLoadMore = () => {
    setLoadedImages((prev) => {
      const newLoadedImages = prev + itemsPerPage;
      setCurrentPage(Math.ceil(newLoadedImages / itemsPerPage));
      return newLoadedImages;
    });
  };

  const handleShowLess = () => {
    setLoadedImages(itemsPerPage);
    setCurrentPage(1);
  };

  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = Math.min(startIndex + loadedImages, datasetImages.length);
  const paginatedImages = datasetImages.slice(startIndex, endIndex);
  

  return (

    <div>

        <div className='flex flex-wrap items-center justify-around'>

            {paginatedImages.map((imageSrc: string, index: number) => (

              <div key={index}>

                <h1> {index} </h1>
                  <img
                    src={`data:image/png;base64,${imageSrc}`}
                    style={{ width: 200, height: 200, margin: 10 }}
                  />
              </div>

            ))}

        </div>

        <div className="flex justify-end gap-5 mt-4">

            {loadedImages < datasetImages.length && (
                <button
                    onClick={handleLoadMore}
                    className='p-2 rounded-md font-bold bg-blue-900 text-white hover:opacity-75'
                >
                    Load More ({currentPage} / {totalPages})
                </button>
            )}

            {loadedImages > itemsPerPage && (
                <button
                    onClick={handleShowLess}
                    className='p-2 rounded-md font-bold bg-red-800 text-white'
                >
                    Show Less
                </button>
            )}

        </div>

       

    </div>
  );
};

export default ImagePagination;
