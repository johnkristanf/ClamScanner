import { useQuery } from 'react-query'
import { FetchModels } from '../../http/get/model'
import { FetchModelType } from '../../types/datasets'
import { SetStateAction, useMemo, useState } from 'react'

export function ModelTable({
    setNumberOfTrainedModels,
}: {
    setNumberOfTrainedModels: React.Dispatch<React.SetStateAction<number | undefined>>
}) {
    const models_query = useQuery('models', FetchModels)
    const models: FetchModelType[] = models_query.data?.data
    if (models) setNumberOfTrainedModels(models.length)

    console.log('models: ', models)

    // const openModelModal = (data: FetchModelType) => {
    //     setisModelDetailsModal(true)
    //     setModelDetails(data)
    // }

    const [currentPage, setCurrentPage] = useState(1)
    const [itemsPerPage, setItemsPerPage] = useState(10)

    // Calculate pagination
    const totalItems = models ? models.length : 0
    const totalPages = Math.ceil(totalItems / itemsPerPage)

    const paginatedModels = useMemo(() => {
        if (!models) return []
        const startIndex = (currentPage - 1) * itemsPerPage
        const endIndex = startIndex + itemsPerPage
        return models.slice(startIndex, endIndex)
    }, [models, currentPage, itemsPerPage])

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
        <div className="h-full w-full flex flex-col">
            {/* Items per page selector */}
            <div className="mb-4 flex justify-between items-center bg-white p-4 rounded-t-md">
                <div className="flex items-center gap-2">
                    <span className="text-sm text-gray-600">Show:</span>
                    <select
                        value={itemsPerPage}
                        onChange={(e) => handleItemsPerPageChange(Number(e.target.value))}
                        className="border border-gray-300 rounded px-2 py-1 text-sm"
                    >
                        <option value={5}>5</option>
                        <option value={10}>10</option>
                        <option value={20}>20</option>
                        <option value={50}>50</option>
                    </select>
                    <span className="text-sm text-gray-600">entries</span>
                </div>

                <div className="text-sm text-gray-600">
                    Showing {totalItems > 0 ? (currentPage - 1) * itemsPerPage + 1 : 0} to{' '}
                    {Math.min(currentPage * itemsPerPage, totalItems)} of {totalItems} entries
                </div>
            </div>

            {/* Table Container */}
            <div className="flex-1 overflow-auto scrollable-container">
                <div className="rounded-md h-full w-full">
                    <table className="text-sm text-left w-full text-gray-800 font-semibold dark:text-gray-400 bg-white">
                        <thead className="text-md text-gray-700 uppercase bg-gray-50 dark:bg-gray-700 dark:text-gray-400 font-bold sticky top-0">
                            <tr>
                                <th scope="col" className="py-3 px-6">
                                    Versions
                                </th>
                                <th scope="col" className="py-3 px-6">
                                    Accuracy
                                </th>
                                <th scope="col" className="py-3 px-6">
                                    Loss
                                </th>
                                <th scope="col" className="py-3 px-6">
                                    Trained At
                                </th>
                                {/* <th scope="col" className="py-3 px-6">Actions</th> */}
                            </tr>
                        </thead>
                        <tbody>
                            {paginatedModels &&
                                paginatedModels.map((item) => (
                                    <tr
                                        key={item.model_id}
                                        className="text-black font-bold border-b hover:bg-gray-50"
                                    >
                                        <td scope="col" className="py-3 px-6">
                                            {item.version}
                                        </td>
                                        <td scope="col" className="py-3 px-6">
                                            {(item.train_acc * 100).toFixed(2)}%
                                        </td>
                                        <td scope="col" className="py-3 px-6">
                                            {(item.train_loss * 100).toFixed(2)}%
                                        </td>
                                        <td scope="col" className="py-3 px-6">
                                            {item.trained_at}
                                        </td>
                                        {/* <td scope="col" className="py-3 px-6 text-white flex gap-3">
                                        <button 
                                            onClick={() => openModelModal(item)}
                                            className="bg-blue-900 rounded-md p-2 hover:opacity-75">
                                            Train Details
                                        </button>
                                    </td> */}
                                    </tr>
                                ))}

                            {/* Empty state */}
                            {(!paginatedModels || paginatedModels.length === 0) && (
                                <tr>
                                    <td colSpan={4} className="py-8 px-6 text-center text-gray-500">
                                        No models available
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Pagination Controls */}
            {totalPages > 1 && (
                <div className="mt-4 bg-white p-4 rounded-b-md flex justify-between items-center">
                    <div className="flex items-center gap-2">
                        <button
                            onClick={goToPrevPage}
                            disabled={currentPage === 1}
                            className="px-3 py-1 text-sm border border-gray-300 rounded hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            Previous
                        </button>

                        <div className="flex gap-1">
                            {getPageNumbers().map((page, index) => (
                                <button
                                    key={index}
                                    onClick={() =>
                                        typeof page === 'number' ? goToPage(page) : null
                                    }
                                    disabled={page === '...'}
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
                            ))}
                        </div>

                        <button
                            onClick={goToNextPage}
                            disabled={currentPage === totalPages}
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
        </div>
    )
}
