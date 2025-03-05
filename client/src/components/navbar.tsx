import { faBars } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";

export function ClamScannerNavBar({ setisSidebarOpen, pageName }: {
    setisSidebarOpen: React.Dispatch<React.SetStateAction<boolean>>,
    pageName: string
}){
    return (
        <div className="fixed bg-white z-[80] top-0 left-0 w-full flex justify-between items-center p-3 px-8 border-b-2 border-gray-200 mb-5">
                            <FontAwesomeIcon
                                onClick={() => setisSidebarOpen(true)} 
                                icon={faBars} 
                                className="font-bold text-3xl hover:opacity-75 hover:cursor-pointer  p-2 rounded-md"
                            />
         
                            <div className="flex items-center gap-3 text-2xl font-semibold">
                                <img src="/img/clam_logo.png" alt="ClamScanner Logo" width={50}/>
                                <h1>Clam Scanner {pageName}</h1>
                            </div>
                        </div>
    );
}