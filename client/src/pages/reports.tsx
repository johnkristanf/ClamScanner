import { useQueryClient } from "react-query";
import { useEffect, useRef, useState, lazy, Suspense } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faBars, faTimes } from "@fortawesome/free-solid-svg-icons";
import Swal from "sweetalert2";
import { SideBar } from "../components/navigation/sidebar";

const ReportedCases = lazy(() => import("../components/reports/reported"));
const Map = lazy(() => import("../components/reports/map"));

const InitializeWSConnection = (setReports: React.Dispatch<React.SetStateAction<number | undefined>>) => {
    const ws = new WebSocket("ws://localhost:8080/ws/conn");

    ws.onopen = () => console.log("WebSocket Connected");

    ws.onmessage = (event) => {
      const data: number = JSON.parse(event.data);
      setReports(data);
    };

    ws.onclose = () => {
        console.log('WebSocket closed');
        setTimeout(() => InitializeWSConnection(setReports), 2000);
    };
  
    ws.onerror = (error) => {
        console.error('WebSocket error:', error);
        setTimeout(() => InitializeWSConnection(setReports), 2000);
    };
}

const ReportsPage: React.FC = () => {
    const queryClient = useQueryClient();

    const [isSidebarOpen, setisSidebarOpen] = useState<boolean>(false);
    const [OpenReportsModal, setOpenReportsModal] = useState<boolean>(false);

    const [MapCoor, setMapCoor] = useState<number[]>([7.3042, 126.0893]);
    const [Reports, setReports] = useState<number | undefined>();

    const alertRef = useRef<HTMLAudioElement>(null);

    const playAudioLoop = () => {
        if (alertRef.current) {
            alertRef.current.play(); 
        }
    };

    useEffect(() => {
        InitializeWSConnection(setReports);
    }, []);

    useEffect(() => {
        queryClient.invalidateQueries('reported_cases');
        queryClient.invalidateQueries('perCity_reports');
        queryClient.invalidateQueries('perProvince_reports');
        queryClient.invalidateQueries('perMollusk_reports');

        if (Reports && Reports > 0) {
            playAudioLoop();

            Swal.fire({
                title: `Received New Reported Cases`,
                icon: "warning",
                showCancelButton: true,
                confirmButtonColor: "#800000",
                cancelButtonColor: "#000000",
                confirmButtonText: "View Reports"
            }).then((result) => {
                if (result.isConfirmed) setOpenReportsModal(true);
                    
                if (result.isDismissed || result.isDenied) {
                    if (alertRef.current) {
                        alertRef.current.pause();
                        alertRef.current.loop = false; 
                    } 
                }
            });
        } else {
            if (alertRef.current) {
                alertRef.current.pause(); // Pause audio
                alertRef.current.loop = false; // Set loop to false
            }
        }
    }, [Reports]);

    return (
        <div className="flex flex-col h-full w-full">
            <Suspense fallback={<div>Loading...</div>}>
                {OpenReportsModal && (
                    <> 
                        <div className="bg-gray-950 fixed top-0 w-full h-full opacity-75" style={{zIndex: 6000}}></div>
                        <div className="flex fixed top-0 flex-col w-full h-full rounded-md p-5 gap-8" style={{zIndex: 7000}}>
                            <div className="flex flex-col gap-5 h-full w-full">
                                <div className="flex justify-between items-center">
                                    <h1 className="text-white font-bold text-3xl">Reported Cases</h1>
                                    <button onClick={() => setOpenReportsModal(false)} className="bg-blue-900 rounded-md p-3 text-white font-bold flex items-center gap-2 hover:opacity-75 hover:cursor-pointer">
                                        <FontAwesomeIcon className="text-white" icon={faTimes}/> Close Reports
                                    </button>
                                </div>
                                <ReportedCases setMapCoor={setMapCoor} setOpenReportsModal={setOpenReportsModal} />
                            </div>
                        </div>
                    </>
                )}
            </Suspense>

                {isSidebarOpen && <SideBar setisSidebarOpen={setisSidebarOpen} />}

                <div className="h-full w-full flex flex-col items-start p-8">
                    <FontAwesomeIcon
                        onClick={() => setisSidebarOpen(true)} 
                        icon={faBars} 
                        className="font-bold text-3xl hover:opacity-75 hover:cursor-pointer"
                    />
                    <audio ref={alertRef} controls style={{display: 'none'}}>
                        <source src="/public/Drop.mp3" type="audio/mpeg" />
                        Your browser does not support the audio element.
                    </audio>
                    <Suspense fallback={
                        <div className="w-full h-screen flex justify-center items-center ">
                            <div className="text-4xl font-bold">Loading Reports Map....</div>
                        </div>
                    }
                    >

                     <Map setMapCoor={setMapCoor} MapCoor={MapCoor} setOpenReportsModal={setOpenReportsModal} />
                    </Suspense>

                </div>
        </div>
    );
}

export default ReportsPage;
