import { useQuery, useQueryClient } from "react-query";
import { useEffect, useRef, useState, lazy, Suspense, useCallback } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faTimes } from "@fortawesome/free-solid-svg-icons";
import Swal from "sweetalert2";
import { SideBar } from "../components/navigation/sidebar";
import { monthNames } from "../utils/list-months";
import { ReportedCasesTypes } from "../types/reported";
import { FetchMapReports } from "../http/get/reports";
import { ClamScannerNavBar } from "../components/navbar";
import { handleGenerateReport } from "../utils/generate-report";

const ReportedCases = lazy(() => import("../components/reports/reported"));
const Map = lazy(() => import("../components/reports/map"));

const InitializeWSConnection = (setReports: React.Dispatch<React.SetStateAction<number | undefined>>) => {
    let ws: WebSocket | null = null;

    const connect = () => {
        const productionWSurl = 'wss://clamscanner.com/go/ws/conn';
        // const developmentWSurl = 'ws://localhost:8080/ws/conn';

        ws = new WebSocket(productionWSurl);

        ws.onopen = () => {
            console.log("Golang WebSocket Connected");
        };

        ws.onmessage = (event) => {
            const data: number = JSON.parse(event.data);
            setReports(data);
        };

        ws.onclose = (event) => {
            console.log(`WebSocket closed: ${event.reason}`);
            setTimeout(connect, 2000);
        };

        ws.onerror = (error) => {
            console.error('WebSocket error:', error);
            if (ws) ws.close();
            
            setTimeout(connect, 2000);
        };
    };

    connect();
};





const ReportsPage: React.FC = () => {
    const queryClient = useQueryClient();

    const [isSidebarOpen, setisSidebarOpen] = useState<boolean>(false);
    const [OpenReportsModal, setOpenReportsModal] = useState<boolean>(false);

    const [MapCoor, setMapCoor] = useState<number[]>([7.3042, 126.0893]);
    const [Reports, setReports] = useState<number | undefined>();

    const [selectedMonth, setSelectedMonth] = useState<string>("All");
    const [selectedMollusk, setSelectedMollusk] = useState<string>("All");
    const [selectedStatus, setSelectedStatus] = useState<string>("All");

    const alertRef = useRef<HTMLAudioElement>(null);

    // const playAudioLoop = () => {
    //     if (alertRef.current && alertRef.current.paused) {
    //         alertRef.current.play().catch(error => {
    //             console.error('Error playing the audio:', error);
    //         });
    //     }
    // };
    
    // const stopAudioLoop = () => {
    //     if (alertRef.current && !alertRef.current.paused) {
    //         alertRef.current.pause();
    //         alertRef.current.loop = false;
    //     }
    // };

    useEffect(() => {
        InitializeWSConnection(setReports);
    }, []);


    const setShowAllReportsMap = () => {
        setSelectedMonth("All");
        setSelectedMollusk("All");
        setSelectedStatus("All");
    }


    const refetchStaleCacheReports = useCallback(() => {
        queryClient.invalidateQueries('reported_cases');
        queryClient.invalidateQueries('perCity_reports');
        queryClient.invalidateQueries('perProvince_reports');
        queryClient.invalidateQueries('perMollusk_reports');
        queryClient.invalidateQueries('perYear_reports');
        queryClient.invalidateQueries('perYear_ResolvedReports');
    }, [queryClient]);

    useEffect(() => {

        if (Reports && Reports > 0) {
            // playAudioLoop();
            Swal.close();
            
            Swal.fire({
                title: `Received New Reported Cases`,
                icon: "warning",
                showCancelButton: true,
                confirmButtonColor: "#800000",
                cancelButtonColor: "#000000",
                confirmButtonText: "View Reports"
            }).then((result) => {
                if (result.isConfirmed) {
                    refetchStaleCacheReports();
                    setOpenReportsModal(true);
                } 
                    
                if (result.isDismissed || result.isDenied) {
                    refetchStaleCacheReports();
                    setOpenReportsModal(true);
                }
            });
        } 
    }, [Reports, refetchStaleCacheReports]);


    const reports_query = useQuery(
        ['reported_cases', selectedMonth, selectedMollusk, selectedStatus],
        () => FetchMapReports({ month: selectedMonth, mollusk: selectedMollusk, status: selectedStatus }),
        {
          onSuccess: () => {
            Swal.close(); 
          },
          onError: () => {
            Swal.close(); 
            Swal.fire({
              icon: 'error',
              title: 'Error',
              text: 'Failed to fetch reports!',
            });
          },
        }
      );

    
    
    
    const reports: ReportedCasesTypes[] = Array.isArray(reports_query.data?.data) ? reports_query.data.data : [];
    

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

                                    <div className="flex items-center gap-8">

                                        <div className="flex gap-2">

                                            <button
                                                className="rounded-md p-2 text-white font-bold bg-blue-900 flex-1 hover:opacity-75 hover:cursor-pointer min-w-[120px] text-center"
                                                onClick={handleGenerateReport}
                                            >
                                                Generate Reports
                                            </button>

                                            <button
                                                className="rounded-md p-2 text-white font-bold bg-blue-900 flex-1 hover:opacity-75 hover:cursor-pointer min-w-[120px] text-center"
                                                onClick={() => setShowAllReportsMap()}
                                            >
                                                All Reports
                                            </button>

                                            <select
                                                className="bg-blue-900 text-white font-bold rounded-md focus:outline-none p-2 flex-1 min-w-[120px] text-center"
                                                value={selectedStatus}
                                                onChange={(e) => setSelectedStatus(e.target.value)}
                                            >
                                                <option value="All" disabled>All</option>

                                                <option>In Progress</option>
                                                <option>Resolved</option>
                                            </select>

                                            <select
                                                className="bg-blue-900 text-white font-bold rounded-md focus:outline-none p-2 flex-1 min-w-[120px] text-center"
                                                value={selectedMonth}
                                                onChange={(e) => setSelectedMonth(e.target.value)}
                                            >
                                                <option value="All" disabled>All</option>

                                                {monthNames.map((month) => (
                                                    <option key={month} value={month}>
                                                    {month}
                                                    </option>
                                                ))}
                                            </select>

                                            <select
                                                className="bg-blue-900 text-white font-bold rounded-md focus:outline-none p-2 flex-1 min-w-[120px] text-center"
                                                value={selectedMollusk}
                                                onChange={(e) => setSelectedMollusk(e.target.value)}
                                            >

                                                <option value="All" disabled>All</option>

                                                <option>Scaly Clam</option>
                                                <option>Tiger Cowrie</option>
                                                <option>BullMouth Helmet</option>
                                            </select>
                                        </div>
                                        
                                        <button onClick={() => setOpenReportsModal(false)} className="bg-blue-900 rounded-md p-3 text-white font-bold flex items-center gap-2 hover:opacity-75 hover:cursor-pointer">
                                            <FontAwesomeIcon className="text-white" icon={faTimes}/> Close Reports
                                        </button>

                                    </div>

                                    


                                </div>
                                <ReportedCases 
                                    reports={reports}
                                    setMapCoor={setMapCoor} 
                                    setOpenReportsModal={setOpenReportsModal} 
                                />
                            </div>
                        </div>
                    </>
                )}
            </Suspense>

                {isSidebarOpen && <SideBar setisSidebarOpen={setisSidebarOpen} />}

                <div className="h-full w-full flex flex-col items-start p-8">
                    <ClamScannerNavBar setisSidebarOpen={setisSidebarOpen} pageName="Reports Map"/>

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
