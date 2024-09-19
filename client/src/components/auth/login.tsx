import { useForm } from "react-hook-form";
import { classNames } from "../../utils/style"
import { AdminLogin } from "../../http/post/auth";
import { InputType, adminLoginCredentials } from "../../types/account";
import { useRef } from "react";
import Swal from "sweetalert2";

const login_input: InputType[] = [
    { label: "email", type: "email", placeholder: "Enter Email" },
    { label: "password", type: "password", placeholder: "Enter Password" }
]


export function LoginForm(){

    const { register, handleSubmit, reset } = useForm<adminLoginCredentials>();
    const invalidRef = useRef<HTMLParagraphElement>(null)

    const onSubmit = async (loginCredentials: adminLoginCredentials) => {

        Swal.fire({
            title: 'Logging In...',
            icon: 'info',
            allowOutsideClick: false,
            showConfirmButton: false,
            willOpen: () => {
                Swal.showLoading();
            },
        });


        try {
            const isLogin = await AdminLogin(loginCredentials)

            if(isLogin){
                reset();
                Swal.close(); 
                window.location.href = '/dashboard'
            } 

            if(!isLogin){
                if(invalidRef.current){
                    Swal.close(); 
                    invalidRef.current.textContent = "Invalid Email or Password"
                }
            }
                           
        } catch (error) {
            console.error(error)
        }
    }

    
    return(
        
        <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col items-center w-full gap-5">
            <p ref={invalidRef} className="text-red-800 font-bold text-xl"></p>
            {
                login_input.map((data) => (
                    <input 
                       key={data.type}
                       type={data.type} 
                       placeholder={data.placeholder} 
                       className={classNames("rounded-md bg-gray-300 placeholder-gray-500 font-semibold p-2 w-[100%] focus:outline-blue-950")} 
                       {...register(data.label, { required: true})}
                    />
                ))
            }

            <button type="submit" className="text-white font-bold bg-blue-900 w-full rounded-md p-3 hover:opacity-75">Login</button>
        </form>
    )
}