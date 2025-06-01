import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { SideBar } from '../components/navigation/sidebar'
import { faEdit, faPlus, faTrash } from '@fortawesome/free-solid-svg-icons'

import { AddAccountModal } from '../components/modal/account'
import { SetStateAction, useMemo, useState } from 'react'
import {
    QueryClient,
    QueryClientProvider,
    useMutation,
    useQuery,
    useQueryClient,
} from 'react-query'
import { FetchPersonnelAccounts } from '../http/get/accounts'
import { PersonnelAccounts } from '../types/account'

import { DeleteAccount } from '../http/delete/accounts'

import Swal from 'sweetalert2'
import { ClamScannerNavBar } from '../components/navbar'
import { EditAccountModal } from '../components/modal/edit_account'

function AccountsPage() {
    const AccountsNewQueryClient = new QueryClient()
    const [isSidebarOpen, setisSidebarOpen] = useState<boolean>(false)

    return (
        <div className="flex flex-col h-full w-full">
            {isSidebarOpen && <SideBar setisSidebarOpen={setisSidebarOpen} />}

            <QueryClientProvider client={AccountsNewQueryClient}>
                <AccountsCardsList setisSidebarOpen={setisSidebarOpen} />
            </QueryClientProvider>
        </div>
    )
}

function AccountsCardsList({
    setisSidebarOpen,
}: {
    setisSidebarOpen: React.Dispatch<React.SetStateAction<boolean>>
}) {
    const [isOpen, setisOpen] = useState<boolean>(false)

    return (
        <>
            {isOpen ? <AddAccountModal setisOpen={setisOpen} /> : null}

            <div className="flex flex-col items-start gap-3  h-full w-full p-8">
                <ClamScannerNavBar
                    setisSidebarOpen={setisSidebarOpen}
                    pageName="Personnel Accounts"
                />

                <div className="flex flex-col rounded-md h-full w-full p-5 gap-5 mt-20">
                    <div className="flex justify-end items-center w-full">
                        {/* <h1 className="font-bold text-3xl">Personnel Accounts</h1> */}

                        <button
                            onClick={() => setisOpen(true)}
                            className="text-white font-bold bg-blue-900 w-[15%] rounded-md p-2 hover:opacity-75"
                        >
                            {<FontAwesomeIcon icon={faPlus} />} Add Account
                        </button>
                    </div>

                    <Cards />
                </div>
            </div>
        </>
    )
}

function Cards() {
    const queryClient = useQueryClient()
    const accounts_query = useQuery('personnel_accounts', FetchPersonnelAccounts)
    const personnel_accounts = accounts_query.data?.data

    console.log('personnel_accounts: ', personnel_accounts)

    const [openEditAccountModal, setOpenEditAccountModal] = useState<boolean>(false)
    const [personnelAccount, setPersonnelAccount] = useState<PersonnelAccounts>()

    const mutate = useMutation(DeleteAccount, {
        onSuccess: () => {
            queryClient.invalidateQueries('personnel_accounts')

            Swal.fire({
                title: 'Deleted!',
                text: 'Account Deleted Successfully',
                icon: 'success',
                confirmButtonColor: '#3085d6',
            })
        },

        onMutate: () => {
            Swal.fire({
                title: 'Deleting...',
                text: 'Please wait while the personnel account is being deleted.',
                icon: 'info',
                allowOutsideClick: false,
                showConfirmButton: false,
                willOpen: () => {
                    Swal.showLoading()
                },
            })
        },
    })

    const DeleteReportPopup = (account_id: number) => {
        Swal.fire({
            title: 'Are you sure?',
            text: 'On Deleting this Account',
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#800000',
            cancelButtonColor: '#000000',
            confirmButtonText: 'Yes, delete it!',
        }).then((result) => {
            if (result.isConfirmed) mutate.mutate(account_id)
        })
    }

    const onEditAccount = (personnel_id: PersonnelAccounts) => {
        setOpenEditAccountModal(true)
        setPersonnelAccount(personnel_id)
    }

    const [currentPage, setCurrentPage] = useState(1)
    const [itemsPerPage, setItemsPerPage] = useState(10)

    const totalItems = personnel_accounts ? personnel_accounts.length : 0
    const totalPages = Math.ceil(totalItems / itemsPerPage)

    const paginatedPersonnel = useMemo(() => {
        if (!personnel_accounts) return []
        const startIndex = (currentPage - 1) * itemsPerPage
        const endIndex = startIndex + itemsPerPage
        return personnel_accounts.slice(startIndex, endIndex)
    }, [personnel_accounts, currentPage, itemsPerPage])

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
        setCurrentPage(1)
    }

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

    if (accounts_query.isLoading) {
        return <div className="text-white text-md font-bold">Loading Personnel Accounts....</div>
    }

    return (
        <div className="flex gap-16 w-full h-full flex-wrap">
            {openEditAccountModal && (
                <EditAccountModal
                    account={personnelAccount}
                    setOpenEditAccountModal={setOpenEditAccountModal}
                />
            )}

            <div className="h-full w-full flex flex-col">
                <div className="mb-4 flex justify-between items-center bg-gray-100 p-4 rounded-t-md">
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

                <div className="flex-1 overflow-auto scrollable-container">
                    <div className="rounded-md h-full w-full">
                        <table className="text-sm text-left w-full text-gray-800 font-semibold dark:text-gray-400 bg-gray-100">
                            <thead className="text-md text-gray-700 uppercase bg-gray-100 dark:bg-gray-700 dark:text-gray-400 font-bold sticky top-0">
                                <tr>
                                    <th scope="col" className="py-3 px-6">
                                        Full Name
                                    </th>
                                    <th scope="col" className="py-3 px-6">
                                        Email
                                    </th>
                                    <th scope="col" className="py-3 px-6">
                                        Address
                                    </th>
                                    <th scope="col" className="py-3 px-6">
                                        Actions
                                    </th>
                                </tr>
                            </thead>
                            <tbody>
                                {paginatedPersonnel && paginatedPersonnel.length > 0 ? (
                                    paginatedPersonnel.map((data: PersonnelAccounts) => (
                                        <tr
                                            key={data.user_id}
                                            className="text-black font-bold border-b hover:bg-gray-50"
                                        >
                                            <td scope="col" className="py-3 px-6">
                                                {data.full_name}
                                            </td>
                                            <td scope="col" className="py-3 px-6">
                                                {data.email}
                                            </td>
                                            <td scope="col" className="py-3 px-6">
                                                {data.address}
                                            </td>
                                            <td
                                                scope="col"
                                                className="py-3 px-6 text-white flex gap-3"
                                            >
                                                <div className="flex items-center w-full gap-3">
                                                    <button
                                                        onClick={() => onEditAccount(data)}
                                                        className="bg-blue-900 rounded-md p-2 hover:opacity-75 w-[20%]"
                                                    >
                                                        <FontAwesomeIcon icon={faEdit} />
                                                    </button>
                                                    <button
                                                        onClick={() =>
                                                            DeleteReportPopup(data.user_id)
                                                        }
                                                        className="bg-red-800 rounded-md p-2 hover:opacity-75 w-[20%]"
                                                    >
                                                        <FontAwesomeIcon icon={faTrash} />
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))
                                ) : (
                                    <tr>
                                        <td
                                            colSpan={4}
                                            className="py-8 px-6 text-center text-gray-500 text-xl"
                                        >
                                            No Personnel Accounts Available
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>

                {totalPages > 1 && (
                    <div className="mt-4 bg-gray-100 p-4 rounded-b-md flex justify-between items-center">
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
        </div>
    )
}

export default AccountsPage
