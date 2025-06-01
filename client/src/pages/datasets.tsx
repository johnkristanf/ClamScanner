import { SetStateAction, useMemo, useState } from 'react'
import { SideBar } from '../components/navigation/sidebar'
import { AddNewDatasetModal, InfoDatasetModal, UploadModal } from '../components/modal/datasets'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import {
    faExclamationCircle,
    faPlusCircle,
    faArrowLeft,
    faUpload,
    faChevronRight,
} from '@fortawesome/free-solid-svg-icons'
import { useMutation, useQuery, useQueryClient } from 'react-query'
import { FetchDatasetClasses, FetchDatasetClassImages } from '../http/get/datasets'
import Swal from 'sweetalert2'
import { DeleteDatasetClass } from '../http/delete/dataset'
import { DatasetClassTypes } from '../types/datasets'
import ImagePagination from '../components/datasets/pagination'
import ModelsPage from './models'
import { ClamScannerNavBar } from '../components/navbar'

import '../../public/scrollStyle.css'

function DataSetsPage() {
    const queryClient = useQueryClient()

    const [isSidebarOpen, setisSidebarOpen] = useState<boolean>(false)
    const [datasetDetails, setDatasetDetails] = useState<boolean>(false)
    const [isOpenAddModal, setIsOpenAddModal] = useState<boolean>(false)
    const [isOpenUpload, setisOpenUpload] = useState<boolean>(false)
    const [isOpenInfoModal, setisOpenInfoModal] = useState<boolean>(false)
    const [classDetailsData, setclassDetailsData] = useState<DatasetClassTypes>()

    const [trainingTableSwitch, setTrainingTableSwitch] = useState<string>('dataset')

    const { data: dataset_query, isLoading } = useQuery('dataset_classes', FetchDatasetClasses)
    const datasets: DatasetClassTypes[] = dataset_query?.data

    const mutate = useMutation(DeleteDatasetClass, {
        onSuccess: () => {
            queryClient.invalidateQueries('dataset_classes')
            Swal.fire({
                title: 'Deleted!',
                text: 'Class Deleted Successfully',
                icon: 'success',
                confirmButtonColor: '#3085d6',
            })
        },
        onMutate: () => {
            Swal.fire({
                title: 'Deleting...',
                text: 'Please wait while the dataset class is being deleted.',
                icon: 'info',
                allowOutsideClick: false,
                showConfirmButton: false,
                willOpen: () => {
                    Swal.showLoading()
                },
            })
        },
    })

    const DeleteDatasetClassPopup = (class_id: number, className: string) => {
        // Static password - replace with your desired password
        const ADMIN_PASSWORD = 'admin123'

        Swal.fire({
            title: 'Enter password to proceed with deletion',
            html: `
            <p style="margin-bottom: 15px; color: #666;">
                You are about to delete "<strong>${className}</strong>". 
                This action cannot be undone.
            </p>
            <p style="margin-bottom: 10px; color: #666;">
                Please enter your password to confirm:
            </p>
        `,
            input: 'password',
            inputPlaceholder: 'Enter password',
            inputAttributes: {
                autocapitalize: 'off',
                autocomplete: 'off',
            },
            showCancelButton: true,
            confirmButtonText: 'Delete',
            confirmButtonColor: '#d33',
            cancelButtonText: 'Cancel',
            showLoaderOnConfirm: true,
            preConfirm: async (password) => {
                try {
                    // Validate password
                    if (!password) {
                        return Swal.showValidationMessage('Password is required')
                    }

                    if (password !== ADMIN_PASSWORD) {
                        return Swal.showValidationMessage('Incorrect password. Please try again.')
                    }

                    // Password is correct, return success
                    return { success: true }
                } catch (error) {
                    Swal.showValidationMessage(`Validation failed: ${error}`)
                }
            },
            allowOutsideClick: () => !Swal.isLoading(),
        }).then((result) => {
            if (result.isConfirmed && result.value?.success) {
                mutate.mutate({ class_id: class_id, className: className })
            }
        })
    }

    const handleDetailsData = (data: DatasetClassTypes) => {
        setDatasetDetails(true)
        setclassDetailsData(data)
    }

    const [currentPage, setCurrentPage] = useState(1)
    const [itemsPerPage, setItemsPerPage] = useState(10)

    // Calculate pagination
    const totalItems = datasets ? datasets.length : 0
    const totalPages = Math.ceil(totalItems / itemsPerPage)

    const paginatedData = useMemo(() => {
        if (!datasets) return []
        const startIndex = (currentPage - 1) * itemsPerPage
        const endIndex = startIndex + itemsPerPage
        return datasets.slice(startIndex, endIndex)
    }, [datasets, currentPage, itemsPerPage])

    // Pagination handlers
    const goToPage = (page: number) => {
        setCurrentPage(Math.max(1, Math.min(page, totalPages)))
    }

    const goToNextPage = () => {
        if (currentPage < totalPages) {
            setCurrentPage(currentPage + 1)
        }
    }

    const goToPrevPage = () => {
        if (currentPage > 1) {
            setCurrentPage(currentPage - 1)
        }
    }

    const handleItemsPerPageChange = (newItemsPerPage: SetStateAction<number>) => {
        setItemsPerPage(newItemsPerPage)
        setCurrentPage(1) // Reset to first page
    }

    // Generate page numbers for pagination
    const getPageNumbers = () => {
        const pages = []
        const maxPagesToShow = 5

        if (totalPages <= maxPagesToShow) {
            for (let i = 1; i <= totalPages; i++) {
                pages.push(i)
            }
        } else {
            if (currentPage <= 3) {
                for (let i = 1; i <= 4; i++) {
                    pages.push(i)
                }
                pages.push('...')
                pages.push(totalPages)
            } else if (currentPage >= totalPages - 2) {
                pages.push(1)
                pages.push('...')
                for (let i = totalPages - 3; i <= totalPages; i++) {
                    pages.push(i)
                }
            } else {
                pages.push(1)
                pages.push('...')
                for (let i = currentPage - 1; i <= currentPage + 1; i++) {
                    pages.push(i)
                }
                pages.push('...')
                pages.push(totalPages)
            }
        }

        return pages
    }

    return (
        <div className="w-full h-full flex flex-col">
            {isSidebarOpen && <SideBar setisSidebarOpen={setisSidebarOpen} />}

            <div className="h-full w-full p-8">
                <ClamScannerNavBar setisSidebarOpen={setisSidebarOpen} pageName="Training" />

                {trainingTableSwitch === 'dataset' && (
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
                                    <div
                                        className="bg-gray-950 fixed top-0 w-full h-full opacity-75"
                                        style={{ zIndex: 6000 }}
                                    ></div>
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
                                        className="bg-blue-900 rounded-md font-bold p-2 text-white hover:opacity-75"
                                    >
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
                                    <div className="w-full flex flex-col justify-center">
                                        {!datasetDetails && (
                                            <>
                                                {/* Items per page selector */}
                                                <div className="mb-4 flex justify-between items-center">
                                                    <div className="flex items-center gap-2">
                                                        <span className="text-sm text-gray-600">
                                                            Show:
                                                        </span>
                                                        <select
                                                            value={itemsPerPage}
                                                            onChange={(e) =>
                                                                handleItemsPerPageChange(
                                                                    Number(e.target.value)
                                                                )
                                                            }
                                                            className="border border-gray-300 rounded px-2 py-1 text-sm"
                                                        >
                                                            <option value={5}>5</option>
                                                            <option value={10}>10</option>
                                                            <option value={20}>20</option>
                                                            <option value={50}>50</option>
                                                        </select>
                                                        <span className="text-sm text-gray-600">
                                                            entries
                                                        </span>
                                                    </div>

                                                    <div className="text-sm text-gray-600">
                                                        Showing{' '}
                                                        {(currentPage - 1) * itemsPerPage + 1} to{' '}
                                                        {Math.min(
                                                            currentPage * itemsPerPage,
                                                            totalItems
                                                        )}{' '}
                                                        of {totalItems} entries
                                                    </div>
                                                </div>

                                                {/* Table */}
                                                <div className="rounded-md bg-white max-h-[350px] overflow-y-auto scrollable-container">
                                                    <table className="text-sm text-left w-full text-gray-800 font-semibold dark:text-gray-400 h-full">
                                                        <thead className="text-md text-gray-700 uppercase bg-gray-50 dark:bg-gray-700 dark:text-gray-400 font-bold sticky top-0">
                                                            <tr>
                                                                <th
                                                                    scope="col"
                                                                    className="py-3 px-6"
                                                                >
                                                                    Name
                                                                </th>
                                                                <th
                                                                    scope="col"
                                                                    className="py-3 px-6"
                                                                >
                                                                    Status
                                                                </th>
                                                                <th
                                                                    scope="col"
                                                                    className="py-3 px-6"
                                                                >
                                                                    Actions
                                                                </th>
                                                            </tr>
                                                        </thead>

                                                        <tbody>
                                                            {paginatedData &&
                                                                paginatedData.map((data) => (
                                                                    <tr
                                                                        key={data.class_id}
                                                                        className="bg-white border-b dark:bg-gray-800 dark:border-gray-700"
                                                                    >
                                                                        <td className="py-4 px-6">
                                                                            {data.name}
                                                                        </td>
                                                                        <td className="py-4 px-6">
                                                                            {data.status}
                                                                        </td>
                                                                        <td className="py-4 px-6 flex gap-3">
                                                                            <button
                                                                                onClick={() =>
                                                                                    handleDetailsData(
                                                                                        data
                                                                                    )
                                                                                }
                                                                                className="bg-blue-900 rounded-md font-bold p-2 text-white hover:opacity-75"
                                                                            >
                                                                                Details
                                                                            </button>

                                                                            <button
                                                                                onClick={() =>
                                                                                    DeleteDatasetClassPopup(
                                                                                        data.class_id,
                                                                                        data.name
                                                                                    )
                                                                                }
                                                                                className="bg-red-800 rounded-md font-bold p-2 text-white hover:opacity-75"
                                                                            >
                                                                                Delete
                                                                            </button>
                                                                        </td>
                                                                    </tr>
                                                                ))}

                                                            {/* Empty state */}
                                                            {(!paginatedData ||
                                                                paginatedData.length === 0) && (
                                                                <tr>
                                                                    <td
                                                                        colSpan={3}
                                                                        className="py-8 px-6 text-center text-gray-500"
                                                                    >
                                                                        No data available
                                                                    </td>
                                                                </tr>
                                                            )}
                                                        </tbody>
                                                    </table>
                                                </div>

                                                {/* Pagination Controls */}
                                                {totalPages > 1 && (
                                                    <div className="mt-4 flex justify-between items-center">
                                                        <div className="flex items-center gap-2">
                                                            <button
                                                                onClick={goToPrevPage}
                                                                disabled={currentPage === 1}
                                                                className="px-3 py-1 text-sm border border-gray-300 rounded hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                                                            >
                                                                Previous
                                                            </button>

                                                            <div className="flex gap-1">
                                                                {getPageNumbers().map(
                                                                    (page, index) => (
                                                                        <button
                                                                            key={index}
                                                                            onClick={() =>
                                                                                typeof page ===
                                                                                'number'
                                                                                    ? goToPage(page)
                                                                                    : null
                                                                            }
                                                                            disabled={
                                                                                page === '...'
                                                                            }
                                                                            className={`px-3 py-1 text-sm border rounded ${
                                                                                page === currentPage
                                                                                    ? 'bg-blue-500 text-white border-blue-500'
                                                                                    : page === '...'
                                                                                    ? 'border-transparent cursor-default'
                                                                                    : 'border-gray-300 hover:bg-gray-50'
                                                                            }`}
                                                                        >
                                                                            {page}
                                                                        </button>
                                                                    )
                                                                )}
                                                            </div>

                                                            <button
                                                                onClick={goToNextPage}
                                                                disabled={
                                                                    currentPage === totalPages
                                                                }
                                                                className="px-3 py-1 text-sm border border-gray-300 rounded hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                                                            >
                                                                Next
                                                            </button>
                                                        </div>

                                                        <div className="text-sm text-gray-600">
                                                            Page {currentPage} of {totalPages}
                                                        </div>
                                                    </div>
                                                )}
                                            </>
                                        )}
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* TRAINED MODELS TABLE */}
                    </div>
                )}

                {trainingTableSwitch === 'models' && <ModelsPage />}

                <div className="w-full flex justify-end font-semibold text-lg">
                    <h1
                        className="hover:opacity-75 hover:cursor-pointer flex items-center gap-2"
                        onClick={() =>
                            setTrainingTableSwitch(
                                trainingTableSwitch === 'dataset' ? 'models' : 'dataset'
                            )
                        }
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
    )
}

function DataSetDetails({
    classDetailsData,
    setDatasetDetails,
    setisOpenUpload,
    setisOpenInfoModal,
}: {
    classDetailsData: DatasetClassTypes
    setDatasetDetails: React.Dispatch<React.SetStateAction<boolean>>
    setisOpenUpload: React.Dispatch<React.SetStateAction<boolean>>
    setisOpenInfoModal: React.Dispatch<React.SetStateAction<boolean>>
}) {
    const { isLoading, data: images_query } = useQuery(
        ['dataset_images', classDetailsData.name],
        () => FetchDatasetClassImages(classDetailsData.name),
        {
            enabled: !!classDetailsData.name,
            refetchOnWindowFocus: false,
        }
    )

    const image = images_query?.data

    console.log('image: ', image)

    return (
        <div className="flex flex-col w-full h-full">
            <div className="flex justify-between items-end w-full">
                <div className="flex flex-col gap-6  items-start">
                    <h1
                        onClick={() => setDatasetDetails(false)}
                        className="flex items-center gap-2 font-bold text-2xl hover:text-black hover:cursor-pointer"
                    >
                        <FontAwesomeIcon icon={faArrowLeft} className="text-3xl" />
                        Back
                    </h1>

                    <div className="flex flex-col mb-2">
                        <h1 className=" font-bold text-4xl">{classDetailsData?.name}</h1>
                        <h1 className=" font-semibold text-md">
                            {' '}
                            Status: {classDetailsData.status}{' '}
                        </h1>
                    </div>
                </div>

                <div className="flex gap-4 mb-6">
                    <button
                        onClick={() => setisOpenUpload(true)}
                        className="bg-blue-900 rounded-md font-bold p-2 text-white hover:opacity-75"
                    >
                        <FontAwesomeIcon icon={faUpload} /> Upload
                    </button>

                    {classDetailsData.name !== 'Invalid Image' ? (
                        <button
                            onClick={() => setisOpenInfoModal(true)}
                            className="bg-yellow-500 rounded-md font-bold p-2 text-white hover:opacity-75"
                        >
                            <FontAwesomeIcon icon={faExclamationCircle} /> Info
                        </button>
                    ) : null}
                </div>
            </div>

            {isLoading && (
                <div className="flex justify-center mt-12">
                    <h1 className="text-2xl font-semibold">Loading Images....</h1>
                </div>
            )}

            {image && image.image_data && (
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

export default DataSetsPage
