import { LoginForm } from "../components/auth/login"
import '/public/auth.css'

export default function LoginPage(){

    return(
        <div className="auth_bg h-screen flex justify-around items-center">

            <div>
                <div className="flex gap-3">
                  <img src="/img/clam_logo.png" width={70}/>

                  <div className="flex flex-col">
                    <h1 className="font-bold text-white text-5xl">Welcome to Clam Scanner</h1>
                    <p className="font-semibold text-white text-md opacity-75">Explore the depths of marine biodiversity 
                       effortlessly with ClamScanner.
                    </p>
                  </div>
                  
                </div>
                
            </div>

            <div className="w-[35%] h-[50%] bg-white rounded-md p-5 flex flex-col items-center">
                <h1 className="font-bold text-slate-950 text-3xl pb-5">Login</h1>
                <LoginForm />
            </div>
        </div>
    )
}

