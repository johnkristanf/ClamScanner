import  { Suspense, lazy, useState } from "react";
import { useQuery } from "react-query";
import { ThreeCircles } from 'react-loader-spinner';
import { FetchDatasetClassesDashboard } from "../../http/get/datasets";
import { FetchReportsPerMollusk, FetchReportsPerYear, FetchScanLogs, FetchYearlyReportsPerCity, FetchYearlyReportsPerProvince } from "../../http/get/reports";
import { ReportsPerMollusk, ReportPerCity, ReportPerProvince, ReportsPerYear, ScanLogsData } from "../../types/reported";
import { DatasetClassTypes } from "../../types/datasets";
import ScanLogsDataModal from "./scanLogsModal";
import Swal from "sweetalert2";

const Chart = lazy(() => import("react-google-charts").then(module => ({ default: module.Chart })));

export function Charts() {

    const [OpenScanLogsModal, setOpenScanLogsModal] = useState<boolean>(false);

    const scanlogs_query = useQuery(

            ['scan_logs'],

            () => FetchScanLogs(),

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
        
        const scan_logs: ScanLogsData[] = Array.isArray(scanlogs_query.data?.data) ? scanlogs_query.data.data : [];
        console.log("scan_logs: ", scan_logs);
        
    return (
        <div className="flex flex-col gap-5 h-full w-full">

            <div className="w-full flex justify-end font-semibold">
                <button
                    className="bg-blue-700 rounded-md p-3 text-white hover:opacity-75 hover:cursor-pointer"
                    onClick={() => setOpenScanLogsModal(true)}
                >
                    Scan Logs
                </button>
            </div>

            <div className="flex gap-5 h-full w-full">
                <Suspense fallback={<ThreeCircles color="#E53E3E" height={80} width={80} />}>
                    <ReportedPerYear />
                </Suspense>

                {/* <Suspense fallback={<ThreeCircles color="#E53E3E" height={80} width={80} />}>
                    <ResolvedReportedPerYear />
                </Suspense> */}

                <Suspense fallback={<ThreeCircles color="#E53E3E" height={80} width={80} />}>
                    <ReportedPerProvince />
                </Suspense>

            </div>

            <div className="flex gap-5 h-full w-full ">

                <Suspense fallback={<ThreeCircles color="#E53E3E" height={80} width={80} />}>
                    <ReportedPerCity />
                </Suspense>

                <Suspense fallback={<ThreeCircles color="#E53E3E" height={80} width={80} />}>
                    <RedListedMollusk />
                </Suspense>

                
            </div>


                <Suspense fallback={<ThreeCircles color="#E53E3E" height={80} width={80} />}>
                    <DatasetClasses />
                </Suspense>



            {OpenScanLogsModal && (
                                <> 
                                    <div className="bg-gray-950 fixed top-0 left-0 w-full h-full opacity-75" style={{zIndex: 6000}}></div>
                                    <div className="flex fixed top-0 left-0 flex-col w-full h-full rounded-md p-5 gap-8" style={{zIndex: 7000}}>
                                        <div className="flex flex-col gap-5 h-full w-full">
                                            <div className="flex justify-between items-center">
                                                <h1 className="text-white font-bold text-3xl">Scan Logs</h1>
                                                <button 
                                                    className="bg-blue-700 rounded-md p-3 text-white font-semibold hover:opacity-75"
                                                    onClick={() => setOpenScanLogsModal(false)}
                                                >
                                                    Close Modal
                                                </button>
                                            </div>

                                            <ScanLogsDataModal 
                                                scanLogs={scan_logs}
                                            />
                                        </div>
                                    </div>
                                </>
                            )}

        </div>
    );
}

function ReportedPerCity() {
    const reports_query = useQuery("perCity_reports", FetchYearlyReportsPerCity);
    const reports: ReportPerCity[] = Array.isArray(reports_query.data?.data) ? reports_query.data.data : [];
  
    console.log("reports: ", reports);

    const data: [string, string | number][] = [
        ["Cities", "Total Reports"]
    ];    

    reports.map((item) => {
        data.push([item.city, item.reports_count])
    })
    
    
    const options = {
        legend: { position: "none" }, 
        vAxis: {
           title: 'Reports'
        },

        hAxis: {
            title: "Cities",
        },
       
    };
    

    return (
        <div className="rounded-md bg-white p-4 h-[90%] w-full">
            <h1 className="text-gray-600 font-bold text-xl mb-4">Reported Red Listed Per City</h1>

            {reports_query.isLoading ? (
                <div className="h-[50%] w-full flex items-center justify-center">
                    <ThreeCircles color="#E53E3E" height={80} width={80} />
                </div>
            ) : (
                <>
                    {reports.length === 0 ? (
                        <div className="h-[50%] w-full flex items-center justify-center">
                            <div className="text-red-800 font-bold text-xl  text-center">No reported cases yet</div>
                        </div>
                        
                    ) : (
                        <Chart
                            chartType="ColumnChart"
                            width="100%"
                            height="100%"
                            data={data}
                            options={options}
                        />
                    )}
                </>
            )}
        </div>
    );
}

function ReportedPerProvince() {
    const reports_query = useQuery("perProvince_reports", FetchYearlyReportsPerProvince);
    const reports: ReportPerProvince[] = Array.isArray(reports_query.data?.data) ? reports_query.data.data : [];
    
    console.log("reports: ", reports);

    const data: [string, string | number][] = [
        ["Provinces", "Reports"]
    ];
    
    reports.map((item) => {
        data.push([item.province, item.reports_count])
    })

   
   const options = {
        legend: { position: "none" },
        hAxis: {
            title: "Provinces",
        },
        vAxis: {
            title: "Reports",
        },
       
    };

    return (
        <div className="rounded-md bg-white p-4 h-[90%] w-full">
            <h1 className="text-gray-600 font-bold text-xl mb-4">Reported Red Listed Per Province</h1>
            
            {reports_query.isLoading ? (
                <div className="h-[70%] w-full flex items-center justify-center">
                    <ThreeCircles color="#E53E3E" height={80} width={80} />
                </div>
            ) : (
                <>
                    {reports.length === 0 ? (
                        <div className="h-[90%] w-full flex items-center justify-center">
                            <div className="text-red-800 font-bold text-xl text-center">No reported cases yet</div>
                        </div>
                    ) : (

                        <Chart
                            chartType="ColumnChart"
                            width="100%"
                            height="100%"
                            data={data}
                            options={options}
                        />

                    )}
                </>
            )}

        </div>
    );
}


function RedListedMollusk() {
    const reports_query = useQuery("perMollusk_reports", FetchReportsPerMollusk);
    const reports: ReportsPerMollusk[] = reports_query.data?.data ?? [];

    console.log("reports per mollusk", reports);

    const data: [string, string | number, { role: "style" } | string][] = [
        ["Mollusks", "Total Reports", { role: "style" }]
    ];
    

    if (reports.length > 0) {
        reports.forEach((item) => {

            let color = "#000000"; 
            if (item.mollusk_type === "Scaly Clam") {
                color = "#B87333"; 
            } else if (item.mollusk_type === "Tiger Cowrie") {
                color = "#FFD700"; 
            } else if (item.mollusk_type === "BullMouth Helmet") {
                color = "#1E90FF";
            }
            
            data.push([item.mollusk_type, item.mollusk_count, color]);
        });
    }

    const options = {
        legend: { position: "none" }, 
        vAxis: {
            title: 'Reports',
            minValue: 0,
        },

         hAxis: {
            title: "Mollusk Types",
        },
    };

    return (
        <div className="rounded-md bg-white p-4 h-[90%] w-full"> 
            <h1 className="text-gray-600 font-bold text-xl mb-4">Reported Red Listed Mollusk Types</h1>

             {reports_query.isLoading ? (
                <div className="h-[70%] w-full flex items-center justify-center">
                    <ThreeCircles color="#E53E3E" height={80} width={80} />
                </div>
            ) : (
                <>
                    {reports.length === 0 ? (
                        <div className="h-[70%] w-full flex items-center justify-center">
                            <div className=" font-bold text-xl text-red-800 text-center">No reported cases yet</div>
                        </div>
                    ) : (
                        <Chart
                            chartType="ColumnChart"
                            width="100%"
                            height="100%"
                            data={data}
                            options={options}
                        />
                    )}
                </>
            )}

        </div>
    );
}

function DatasetClasses() {
    const datasets_query = useQuery("dataset_classes", FetchDatasetClassesDashboard);
    const datasetclasses: DatasetClassTypes[] = datasets_query.data?.data ?? [];

    const data = [["Class", "Count"]];

    if (datasetclasses) {
        datasetclasses.forEach((item) => {
            data.push([item.name, item.count]);
        });
    }

    const colors = {
        "Blood Clam": "#8B0000",
        "Mussel": "#006400", 
        "Invalid Image": "#808080", 
        "Oyster": "#A9A9A9", 
        "Tiger Cowrie": "#FFD700", 
        "Horn Snail": "#CD853F",
        "Scaly Clam": "#B87333", 
        "BullMouth Helmet": "#1E90FF", 
    };

    const slices = datasetclasses.map((item) => ({
        color: colors[item.name as keyof typeof colors] || "#008000", 
    }));

    const options = {
        is3D: true,
        slices: slices, 
    };

    return (
        <div className="rounded-md bg-white p-4 h-full w-full">
            <h1 className="text-gray-600 font-bold text-xl mb-4">Dataset Class Images</h1>

            {datasets_query.isLoading ? (
                <div className="h-[70%] w-full flex items-center justify-center">
                    <ThreeCircles color="#E53E3E" height={80} width={80} />
                </div>
            ) : (
                <>
                    {datasetclasses.length === 0 ? (
                        <div className="h-[70%] w-full flex items-center justify-center">
                            <div className="text-red-800 font-bold text-xl text-center">
                                No dataset class images yet
                            </div>
                        </div>
                    ) : (
                        <Chart
                            chartType="PieChart"
                            width="100%"
                            height="100%"
                            data={data}
                            options={options}
                        />
                    )}
                </>
            )}
        </div>
    );
}



function ReportedPerYear() {

    const reports_query = useQuery("perYear_reports", FetchReportsPerYear);
    const reports: ReportsPerYear[] = reports_query.data?.data ?? [];

    console.log("reports per year 123", reports);

    const data: [string, string | number][] = [
        ["Year", "Reports"]
    ];

    if (reports.length > 0) {
        reports.forEach((item) => {
            data.push([item.year, Math.round(Number(item.report_count))]); // Rounds to nearest whole number
        });
    }

    const options = {
        hAxis: {
            title: "Years",
            titleTextStyle: { color: "#333" },
        },
        vAxis: {
            title: "Reports",
           
        },


        series: {
            0: {
                color: "#FF0000",  
            },
        },

        legend: { position: "none" },  // Optional: Hide the legend for simplicity
    };

    return (
        <div className="rounded-md bg-white h-full w-full">
            <h1 className="text-gray-600 font-bold text-xl mb-4">Total Reports Per Year</h1>

            {reports_query.isLoading ? (
                <div className="h-[70%] w-full flex items-center justify-center">
                    <ThreeCircles color="#E53E3E" height={80} width={80} />
                </div>
            ) : (
                <>
                    {reports.length === 0 ? (
                        <div className="h-[50%] w-full flex items-center justify-center">
                            <div className="text-red-800 font-bold text-xl text-center">No reported cases yet</div>
                        </div>
                    ) : (
                        <Chart
                            chartType="LineChart"
                            width="100%"
                            height="100%"
                            data={data}
                            options={options}
                            className="p-8"
                        />
                    )}
                </>
            )}
        </div>
    );
}


// function ResolvedReportedPerYear() {

//     const reports_query = useQuery("perYear_ResolvedReports", FetchResolvedReportsPerYear);
//     const reports: ReportsPerYear[] = reports_query.data?.data ?? [];

//     console.log("reports per year", reports);

//     const data: [string, string | number][] = [
//         ["Year", "Total Reports"]
//     ];

//     if (reports.length > 0) {
//         reports.forEach((item) => {
//             data.push([item.year, Math.round(Number(item.report_count))]); // Rounds to nearest whole number
//         });
//     }

//     const options = {
//         hAxis: {
//             title: "Total Reports",
//             titleTextStyle: { color: "#333" },
//         },

//         vAxis: {
//             minValue: 0,
//             format: "integer",  // Ensure it is formatted as an integer
//             ticks: [0, 2, 4, 6, 8, 10],  // Set ticks to increment by 2
//             gridlines: {
//                 count: 6,  // Adjust the number of gridlines if needed
//             },
//         },

//         chartArea: {
//             top: 50,    // Add padding to the top of the chart
//             left: 50,   // Add padding to the left of the chart
//             bottom: 50, // Add padding to the bottom of the chart
//             right: 50,  // Add padding to the right of the chart
//         },
       
//         series: {
//             0: {
//                 color: "#008000",  
//             },
//         },

//         legend: { position: "none" }, 
//     };

//     return (
//         <div className="rounded-md bg-white p-4 h-full w-full">
//             <h1 className="text-gray-600 font-bold text-xl mb-4">Resolved Reports Per Year</h1>

//             {reports_query.isLoading ? (
//                 <div className="h-[70%] w-full flex items-center justify-center">
//                     <ThreeCircles color="#E53E3E" height={80} width={80} />
//                 </div>
//             ) : (
//                 <>
//                     {reports.length === 0 ? (
//                         <div className="h-[70%] w-full flex items-center justify-center">
//                             <div className="text-red-800 font-bold text-xl text-center">No resolved reported cases yet</div>
//                         </div>
//                     ) : (
//                         <Chart
//                             chartType="BarChart"
//                             width="90%"
//                             height="90%"
//                             data={data}
//                             options={options}
//                             className="p-7"
//                         />
//                     )}
//                 </>
//             )}
//         </div>
//     );
// }