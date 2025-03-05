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

            <div className="relative w-[30%] h-[40%] rounded-md p-5 flex flex-col items-center">
                {/* Background blur layer */}
                <div className="absolute inset-0 bg-white bg-opacity-50 rounded-md backdrop-blur-5xl pointer-events-none"></div>

                {/* Actual content (not blurred) */}
                <div className="relative z-10 w-full h-full flex flex-col items-center">
                    <LoginForm />
                </div>
            </div>


        </div>
    )
}

