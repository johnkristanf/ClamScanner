import  { Suspense, lazy } from "react";
import { useQuery } from "react-query";
import { ThreeCircles } from 'react-loader-spinner';
import { FetchDatasetClassesDashboard } from "../../http/get/datasets";
import { FetchReportsPerMollusk, FetchYearlyReportsPerCity, FetchYearlyReportsPerProvince } from "../../http/get/reports";
import { ReportsPerMollusk, YearlyReportPerCity, YearlyReportPerProvince } from "../../types/reported";
import { DatasetClassTypes } from "../../types/datasets";

const Chart = lazy(() => import("react-google-charts").then(module => ({ default: module.Chart })));

export function Charts() {
    return (
        <>
            <div className="flex gap-5 h-full w-full">

                <Suspense fallback={<ThreeCircles color="#E53E3E" height={80} width={80} />}>
                    <ReportedPerProvince />
                </Suspense>

                <Suspense fallback={<ThreeCircles color="#E53E3E" height={80} width={80} />}>
                    <ReportedPerCity />
                </Suspense>
            </div>

            <div className="flex gap-5 h-full w-full">

                <Suspense fallback={<ThreeCircles color="#E53E3E" height={80} width={80} />}>
                    <RedListedMollusk />
                </Suspense>

                <Suspense fallback={<ThreeCircles color="#E53E3E" height={80} width={80} />}>
                    <DatasetClasses />
                </Suspense>
            </div>
        </>
    );
}

function ReportedPerCity() {
    const reports_query = useQuery("perCity_reports", FetchYearlyReportsPerCity);
    const reports: YearlyReportPerCity[] = Array.isArray(reports_query.data?.data) ? reports_query.data.data : [];
  
    const cities = Array.from(new Set(reports && reports.map(report => report.city)));
  
    const data: (string | number)[][] = [["Year", ...cities]];
  
    const reportsMap: { [year: string]: { [city: string]: number } } = {};
  
    reports.forEach((report) => {
        if (!reportsMap[report.year]) {
            reportsMap[report.year] = {};
        }
        reportsMap[report.year][report.city] = report.reports_count;
    });
  
    Object.keys(reportsMap).forEach((year) => {
        const row: (string | number)[] = [year];
        cities.forEach((city) => {
            row.push(reportsMap[year][city] || 0);
        });
        data.push(row);
    });
  
    const options = {
        chart: {
            title: "Reported Red Listed Mollusk Per City",
            subtitle: "Yearly Reported Cases",
        },

    };

    return (
        <div className="rounded-md bg-white p-4 h-full w-full">
            <h1 className="text-gray-600 font-bold text-3xl mb-4">Reported Red Listed Per City</h1>

            {reports_query.isLoading ? (
                <div className="h-[70%] w-full flex items-center justify-center">
                    <ThreeCircles color="#E53E3E" height={80} width={80} />
                </div>
            ) : (
                <>
                    {reports.length === 0 ? (
                        <div className="h-[70%] w-full flex items-center justify-center">
                            <div className="text-red-800 font-bold text-xl text-red-800 text-center">No reported cases yet</div>
                        </div>
                        
                    ) : (
                        <Chart
                            chartType="Bar"
                            width="100%"
                            height="90%"
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
    const reports: YearlyReportPerProvince[] = Array.isArray(reports_query.data?.data) ? reports_query.data.data : [];
    
    const provinces = Array.from(new Set(reports && reports.map(report => report.province)));
  
    const data: (string | number)[][] = [["Year", ...provinces]];
  
    const reportsMap: { [year: string]: { [province: string]: number } } = {};
  
    reports.forEach((report) => {
        if (!reportsMap[report.year]) {
            reportsMap[report.year] = {};
        }
        reportsMap[report.year][report.province] = report.reports_count;
    });
  
    Object.keys(reportsMap).forEach((year) => {
        const row: (string | number)[] = [year];
        provinces.forEach((province) => {
            row.push(reportsMap[year][province] || 0);
        });
        data.push(row);
    });
  
    const options = {
        chart: {
            title: "Reported Red Listed Mollusk Per Province",
            subtitle: "Yearly Reported Cases",
        },

    };

    return (
        <div className="rounded-md bg-white p-4 h-full w-full">
            <h1 className="text-gray-600 font-bold text-3xl mb-4">Reported Red Listed Per Province</h1>
            
            {reports_query.isLoading ? (
                <div className="h-[70%] w-full flex items-center justify-center">
                    <ThreeCircles color="#E53E3E" height={80} width={80} />
                </div>
            ) : (
                <>
                    {reports.length === 0 ? (
                        <div className="h-[70%] w-full flex items-center justify-center">
                            <div className="text-red-800 font-bold text-xl text-red-800 text-center">No reported cases yet</div>
                        </div>
                    ) : (
                        <Chart
                            chartType="Bar"
                            width="100%"
                            height="90%"
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

    const data = [
        ["Mollusk Type", "Report Count"]
    ];

    if (reports.length > 0) {
        reports.forEach((item) => {
            data.push([item.mollusk_type, item.mollusk_count.toString()]);
        });
    }

    const options = {
        legend: { position: "none" }, 
        colors: ["#FF5733", "#33B5FF", "#33FF57", "#FFC133", "#B533FF"], 

    };

    return (
        <div className="rounded-md bg-white p-4 h-[90%] w-full"> 
            <h1 className="text-gray-600 font-bold text-3xl mb-4">Reported Red Listed Mollusk Types</h1>

             {reports_query.isLoading ? (
                <div className="h-[70%] w-full flex items-center justify-center">
                    <ThreeCircles color="#E53E3E" height={80} width={80} />
                </div>
            ) : (
                <>
                    {reports.length === 0 ? (
                        <div className="h-[70%] w-full flex items-center justify-center">
                            <div className="text-red-800 font-bold text-xl text-red-800 text-center">No reported cases yet</div>
                        </div>
                    ) : (
                        <Chart
                            chartType="Bar"
                            width="100%"
                            height="90%"
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

    const options = {
        is3D: true,
    };

    return (
        <div className="rounded-md bg-white p-4 h-[90%] w-full"> 
            <h1 className="text-gray-600 font-bold text-3xl mb-4">Dataset Class Images</h1>

             {datasets_query.isLoading ? (
                <div className="h-[70%] w-full flex items-center justify-center">
                    <ThreeCircles color="#E53E3E" height={80} width={80} />
                </div>
            ) : (
                <>
                    {datasetclasses.length === 0 ? (
                        <div className="h-[70%] w-full flex items-center justify-center">
                            <div className="text-red-800 font-bold text-xl text-red-800 text-center">No dataset class images yet</div>
                        </div>
                    ) : (
                        <Chart
                            chartType="PieChart"
                            width="100%"
                            height="90%"
                            data={data}
                            options={options}
                        />
                    )}
                </>
            )}

        </div>
    );
}
