import { Link } from "react-router-dom";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faBars, faRightFromBracket } from "@fortawesome/free-solid-svg-icons";
import { classNames } from "../../utils/style";
import { useEffect, useState } from "react";
import { AdminData } from "../../types/account";
import { FetchAdminData, SignOut } from "../../http/get/accounts";

interface SideBarProps {
  setisSidebarOpen: React.Dispatch<React.SetStateAction<boolean>>;
}

export const SideBar: React.FC<SideBarProps> = ({ setisSidebarOpen }) => {

    return (

      <div className="w-[25%] h-full fixed left-0 bg-black flex flex-col justify-around p-5" style={{zIndex: 5000}}>

        <FontAwesomeIcon
          onClick={() => setisSidebarOpen(false)} 
          icon={faBars} 
          className="font-bold text-4xl hover:opacity-75 hover:cursor-pointer fixed top-2 left-2 text-white"
        />

        <Logo/>  


        <NavLinks />

        <UserInfo />

      </div>
    );
}

function Logo(){
  return(
    <div className="flex items-center gap-4 w-full mt-6">
      <img src="/img/clam_logo.png" width={60} alt="ClamScanner Nav Logo" />
      <h1 className="text-white font-bold text-3xl">Clam Scanner</h1>
    </div>
  )
  
}




function NavLinks() {

  const navLinks = [
    { name: "Dashboard", to: "/dashboard" },
    { name: "Reports Map", to: "/reports" },
    { name: "Datasets", to: "/datasets" },
    { name: "Models", to: "/models" },
    { name: "Personnel Accounts", to: "/accounts" },
  ];

  
  return (

    <div className="flex flex-col gap-8 text-white w-full">

      { navLinks.map((item) => (

            <Link
              key={item.name}  
              to={item.to}
              replace={true}
              className={classNames("font-bold hover:opacity-75 text-xl")}
            >

              {item.name}

            </Link>
      ))}

    </div>
  );
}

export default NavLinks;


function UserInfo(){

  const [adminData, setAdminData] = useState<AdminData>()

  useEffect(() => {
    FetchAdminData().then(data => {
      setAdminData(data)
    })
  }, [])


  return(
      <div className="flex flex-col items-center gap-3">
          <h1 className="text-white font-bold text-xl hover:opacity-75 hover:cursor-pointer">{ adminData?.email }</h1>
          <button onClick={() => SignOut()} className="bg-gray-700 rounded-md p-2 text-white font-bold w-full hover:opacity-75">
            Sign Out
            &nbsp; <FontAwesomeIcon icon={faRightFromBracket}/>  
          </button>

      </div>
  )
}