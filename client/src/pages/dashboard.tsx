import { useState } from "react";
import { Charts } from "../components/dashboard/charts";
import { SideBar } from "../components/navigation/sidebar";
import { ClamScannerNavBar } from "../components/navbar";


function DashboardPage(){

    const [isSidebarOpen, setisSidebarOpen] = useState<boolean>(false)

    return (
        <div className="h-full w-full">

            { isSidebarOpen && <SideBar setisSidebarOpen={setisSidebarOpen} /> }
            

            <div className="h-full w-full p-8 ">


                <ClamScannerNavBar setisSidebarOpen={setisSidebarOpen} pageName="Dashboard"/>

                
                <div className="h-[165vh] w-full p-5 flex flex-col gap-8 mt-20 rounded-md bg-gray-100">

                    {/* <h1 className="font-bold text-3xl">Clam Scanner Dashboard</h1> */}
                    <Charts />

                </div>   

            </div>

            

        </div>
    );
}

export default DashboardPage