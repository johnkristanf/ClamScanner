import { FontAwesomeIcon } from "@fortawesome/react-fontawesome"
import { SideBar } from "../components/navigation/sidebar"
import { faBars, faPlus } from "@fortawesome/free-solid-svg-icons"

import { AddAccountModal } from "../components/modal/account"
import { useState } from "react"
import { QueryClient, QueryClientProvider, useMutation, useQuery, useQueryClient } from "react-query"
import { FetchPersonnelAccounts } from "../http/get/accounts"
import { PersonnelAccounts } from "../types/account"

import { DeleteAccount } from "../http/delete/accounts"

import Swal from "sweetalert2"

function AccountsPage(){

    const AccountsNewQueryClient = new QueryClient();
    const [isSidebarOpen, setisSidebarOpen] = useState<boolean>(false)

    return(
        <div className="flex flex-col h-full w-full">
            
            { isSidebarOpen && <SideBar setisSidebarOpen={setisSidebarOpen} /> }

            <QueryClientProvider client={AccountsNewQueryClient}>
               <AccountsCardsList setisSidebarOpen={setisSidebarOpen} />
            </QueryClientProvider>

        </div>
    )
}

function AccountsCardsList({ setisSidebarOpen }: { setisSidebarOpen: React.Dispatch<React.SetStateAction<boolean>> }){

    const [isOpen, setisOpen] = useState<boolean>(false);

    return(

        <>
            { isOpen ? <AddAccountModal setisOpen={setisOpen} /> : null }

            <div className="flex flex-col items-start gap-3  h-full w-full p-8">

                <FontAwesomeIcon
                    onClick={() => setisSidebarOpen(true)} 
                    icon={faBars} 
                    className="fixed top-3 font-bold text-3xl hover:opacity-75 hover:cursor-pointer bg-black text-white p-2 rounded-md"
                />

                <div className="flex flex-col bg-gray-600 rounded-md h-full w-full p-5 gap-5">

                <h1 className="text-white font-bold text-3xl">Personnel Accounts</h1>

                <button 
                        onClick={() => setisOpen(true)}
                        className="text-white font-bold bg-blue-900 w-[23%] rounded-md p-2 hover:opacity-75">
                        { <FontAwesomeIcon icon={faPlus} /> } Add New Personnel Account
                    </button>

                    <Cards />


                </div>
            </div>
        </>
    )
}


function Cards() {


    const queryClient = useQueryClient()
    const accounts_query = useQuery("personnel_accounts", FetchPersonnelAccounts)
    const personnel_accounts = accounts_query.data?.data

    const mutate = useMutation(DeleteAccount, {
        onSuccess: () => {
            queryClient.invalidateQueries("personnel_accounts")
            
            Swal.fire({
                title: "Deleted!",
                text: "Account Deleted Successfully",
                icon: "success",
                confirmButtonColor: "#3085d6",
            });
        },

        onMutate: () => {
            Swal.fire({
                title: 'Deleting...',
                text: 'Please wait while the personnel account is being deleted.',
                icon: 'info',
                allowOutsideClick: false,
                showConfirmButton: false,
                willOpen: () => {
                    Swal.showLoading();
                },
            });
        },
    })

    const DeleteReportPopup = (account_id: number) => {
        Swal.fire({
            title: "Are you sure?",
            text: "On Deleting this Account",
            icon: "warning",
            showCancelButton: true,
            confirmButtonColor: "#800000",
            cancelButtonColor: "#000000",
            confirmButtonText: "Yes, delete it!"
        }).then((result) => {
            if (result.isConfirmed) mutate.mutate(account_id)
        });
    }

    if (accounts_query.isLoading) {
        return <div className="text-white text-md font-bold">Loading Personnel Accounts....</div>
    }

    return (
        <div className="flex gap-16 w-full h-full flex-wrap mt-3">

            {
                personnel_accounts ? personnel_accounts.map((data: PersonnelAccounts) => (

                    <div key={data.user_id} className="bg-white rounded-md p-3 flex flex-col items-center gap-3 font-bold">

                        <h1>{data.fullname}</h1>
                        <h1>{data.email}</h1>
                        <h1>{data.address}</h1>

                        <div className="flex gap-4 mt-3 text-white w-full">

                            <button 
                                onClick={() => DeleteReportPopup(data.user_id)}
                                className="bg-red-800 rounded-md p-2 hover:opacity-75 w-full" >
                                    Delete Account
                            </button>
                            
                        </div>

                    </div>
                )) : null
            }
        </div>
    )
}


export default AccountsPage