import { useForm } from "react-hook-form";
import { classNames } from "../../utils/style";
import { SignupCredentials, validEmail } from "../../types/account";
import { SignupValidation } from "../../validator/auth";
import { Signup } from "../../http/post/auth";
import { InputData } from "../../types/account";
import { useMutation, useQueryClient } from "react-query";
import Swal from "sweetalert2";

const signup_input: InputData[] = [
  { label: "fullname", type: "text", placeholder: "Enter Full Name" },
  { label: "address", type: "text", placeholder: "Enter Address" },
  { label: "email", type: "email", placeholder: "Enter Email", pattern: validEmail },
  { label: "password", type: "password", placeholder: "Enter Password", minLength: 8 },
];


export function SignupForm({setisOpen}: any) {

  const { register, handleSubmit, reset, formState: { errors } } = useForm<SignupCredentials>();

  const queryClient = useQueryClient();

  const mutate = useMutation(Signup, {
      onSuccess: () => {

        Swal.fire({
          title: "Added!",
          text: "Account Added Successfully",
          icon: "success",
          confirmButtonColor: "#3085d6",
        });

        queryClient.invalidateQueries("personnel_accounts");
        reset();
        setisOpen(false);
        Swal.close();
        
      },

      onMutate: () => {
        setisOpen(false);

        Swal.fire({
            title: 'Adding...',
            text: 'Please wait while the personnel account is being added.',
            icon: 'info',
            allowOutsideClick: false,
            showConfirmButton: false,
            willOpen: () => {
                Swal.showLoading();
            },
        });
    },

      onError: (error: any) => {
        console.error("Signup error:", error);
      },
      
    })


  async function onSubmit(signupCredentials: SignupCredentials) {

    signupCredentials.role = "personnel"

    const formData = new FormData();
    for(const [key, value] of Object.entries(signupCredentials)){
      formData.append(key, String(value))
    }
      
    mutate.mutate(formData);
  }



  return (
    <>
    <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col items-center w-full gap-5">

      { SignupValidation(errors) }

        
        {
            signup_input.map((data) => (
                <input 
                  key={data.label} 
                  type={data.type} 
                  placeholder={data.placeholder} 
                  className={classNames("rounded-md bg-gray-300 placeholder-gray-500 font-semibold p-2 w-[100%] focus:outline-blue-950")} 
                  {...register(data.label, { required: true, minLength: data.minLength, pattern: data.pattern })}
                />
            ))
        }

      <button type="submit" className="text-white font-bold bg-blue-900 w-full rounded-md p-3 hover:opacity-75">Add Account</button>
      
    </form>

      <button 
          onClick={() => setisOpen(false)}
          className="bg-black w-full rounded text-white rounded-md font-bold p-3 mt-3 hover:opacity-75">
          Cancel
      </button>

    </>
  );
}
