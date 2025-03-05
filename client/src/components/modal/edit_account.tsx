import { PersonnelAccounts } from '../../types/account';
import { EditAccountForm } from '../auth/edit_account';
import '/public/auth.css';

export function EditAccountModal({account, setOpenEditAccountModal}: {
    account: PersonnelAccounts | undefined,
    setOpenEditAccountModal: React.Dispatch<React.SetStateAction<boolean>>
}){

    return(
        <>

        <div className="bg-gray-600 opacity-75 w-full h-full fixed top-0 left-0" style={{zIndex: 6000}}></div>

        <div className="fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2" style={{zIndex: 8000}}>
            <div className="bg-white rounded-md p-5 w-full">

                <h1 className="font-bold text-slate-950 text-3xl pb-5">Edit Personnel Account</h1>
                <EditAccountForm account={account} setOpenEditAccountModal={setOpenEditAccountModal} />

            </div>
        </div>

        </>
    )
}
