import { useForm } from "react-hook-form";
import { PersonnelAccounts, validEmail } from "../../types/account";
import { SignupValidation } from "../../validator/auth";
import { useMutation, useQueryClient } from "react-query";
import Swal from "sweetalert2";
import { EditPersonnelAccount } from "../../http/put/account";

// const signup_input: InputData[] = [
//   { label: "fullname", type: "text", placeholder: "Enter Full Name" },
//   { label: "address", type: "text", placeholder: "Enter Address" },
//   { label: "email", type: "email", placeholder: "Enter Email", pattern: validEmail },
//   { label: "password", type: "password", placeholder: "Enter Password", minLength: 8 },
// ];


export function EditAccountForm({account, setOpenEditAccountModal}: {
    account: PersonnelAccounts | undefined,
    setOpenEditAccountModal: React.Dispatch<React.SetStateAction<boolean>>
}) {

    console.log("personnel_id sa edit form: ", account?.user_id );
    
    const { register, handleSubmit, reset, formState: { errors } } = useForm<PersonnelAccounts>();

    // const account_query = useQuery(
    //         ['edit_account', personnel_id],
    //         () => FetchAccountToEdit(personnel_id),

    //         {
    //             onSuccess: () => {
    //             Swal.close(); 
    //             },

    //             onError: () => {
    //             Swal.close(); 
    //             Swal.fire({
    //                 icon: 'error',
    //                 title: 'Error',
    //                 text: 'Failed to fetch reports!',
    //             });
    //             },
    //         }
    //     );
        
    // const account: PersonnelAccountEdit = account_query.data && account_query.data.data;

    console.log("account sa edit form: ", account);
    
    

    const queryClient = useQueryClient();

    const mutate = useMutation(EditPersonnelAccount, {
      onSuccess: () => {

        Swal.fire({
          title: "Added!",
          text: "Account Edited Successfully",
          icon: "success",
          confirmButtonColor: "#3085d6",
        });

        queryClient.invalidateQueries("personnel_accounts");
        reset();
        setOpenEditAccountModal(false);
        Swal.close();
        
      },

      onMutate: () => {
        setOpenEditAccountModal(false);

        Swal.fire({
            title: 'Editing...',
            text: 'Please wait while the personnel account is being edited.',
            icon: 'info',
            allowOutsideClick: false,
            showConfirmButton: false,
            willOpen: () => {
                Swal.showLoading();
            },
        });
    },

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      onError: (error: any) => {
        console.error("Signup error:", error);
      },
      
    })


    async function onSubmit(data: PersonnelAccounts) {
        console.log("account to edit: ", data);

        if (account?.user_id) {
            data.user_id = account.user_id; // TypeScript knows it's a number here
        }
        
        mutate.mutate(data);
    }



    return (
        <>
            <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col items-center w-full gap-5">
                {SignupValidation(errors)}

                <input 
                    {...register("full_name", { required: true })}
                    placeholder="Enter Full Name"
                    className="rounded-md bg-gray-300 placeholder-gray-500 font-semibold p-2 w-[100%] focus:outline-blue-950"
                    defaultValue={account?.full_name && account?.full_name}
                />

                <input 
                    {...register("address", { required: true })}
                    placeholder="Enter Address"
                    className="rounded-md bg-gray-300 placeholder-gray-500 font-semibold p-2 w-[100%] focus:outline-blue-950"
                    defaultValue={account?.address && account?.address}

                />

                <input 
                    {...register("email", { required: true, pattern: validEmail })}
                    placeholder="Enter Email"
                    className="rounded-md bg-gray-300 placeholder-gray-500 font-semibold p-2 w-[100%] focus:outline-blue-950"
                    defaultValue={account?.email && account?.email}

                />

                <input 
                    {...register("password", { minLength: 8 })}
                    placeholder="Enter Password"
                    type="password"
                    className="rounded-md bg-gray-300 placeholder-gray-500 font-semibold p-2 w-[100%] focus:outline-blue-950"
                />

                <button type="submit" className="text-white font-bold bg-blue-900 w-full rounded-md p-3 hover:opacity-75">
                    Edit Account
                </button>
            </form>


        <button 
            onClick={() => setOpenEditAccountModal(false)}
            className="bg-black w-full rounded text-white rounded-md font-bold p-3 mt-3 hover:opacity-75">
            Cancel
        </button>

        </>
    );
}
