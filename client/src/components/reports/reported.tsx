import { useMutation, useQueryClient } from "react-query";
import { ReportedCasesTypes } from "../../types/reported";
import { DeleteReport } from "../../http/delete/report";
import Swal from 'sweetalert2';
import '/public/scrollStyle.css';
import { useState } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faArrowLeft, faArrowRight } from "@fortawesome/free-solid-svg-icons";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function ReportedCases({ reports, setMapCoor, setOpenReportsModal }: any) {

  const queryClient = useQueryClient();

  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  // const reports_query = useQuery("reported_cases", FetchReports);
  // const reports = reports_query.data?.data;

  console.log("reports table: ", reports);
  


  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = currentPage * itemsPerPage;

  const paginatedReports = reports ? reports.slice(startIndex, endIndex) : [];

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  const renderPagination = () => {

    if (!reports) return null;
    const totalPages = Math.ceil(reports.length / itemsPerPage);

    return (

      <div className="flex justify-center items-center space-x-2 mt-2 p-1 rounded-md bg-black w-[12%]">

        <button
          onClick={() => handlePageChange(currentPage - 1)} 
          disabled={currentPage === 1} 
          className="text-white text-3xl font-bold disabled:opacity-50"
        >
          <FontAwesomeIcon icon={faArrowLeft}/>

        </button>

        <span 
            className="text-white text-xl font-bold disabled:opacity-50">
            {currentPage} / {totalPages} 
        </span> 

        <button
          onClick={() => handlePageChange(currentPage + 1)}
          disabled={currentPage === totalPages} 
          className="text-white text-3xl font-bold disabled:opacity-50"
        >
          <FontAwesomeIcon icon={faArrowRight}/>

        </button>
        
      </div>
    );
  };

  const renderTableRows = () => {

    return paginatedReports && paginatedReports.map((data: ReportedCasesTypes) => (

      <tr key={data.report_id} className="bg-white border-b dark:bg-gray-800 dark:border-gray-700">


        <td className="py-4 px-6">{data.reporter_name}</td>
        <td className="py-4 px-6">{data.reporter_address}</td>
        <td className="py-4 px-6">
          {data.city} {data.district}, {data.province}
        </td>
        
        <td className="py-4 px-6">{data.mollusk_type}</td>
        <td className="py-4 px-6">{data.status}</td>
        <td className="py-4 px-6">{data.reportedAt}</td>

        <td className="py-4 px-6 flex gap-3">

          <button
            onClick={() => viewMap(data.latitude, data.longitude)}
            className="bg-blue-900 rounded-md font-bold p-2 text-white hover:opacity-75"
          >
            View Map
          </button>

          <button
            onClick={() => DeleteReportPopup(data.report_id, data.mollusk_type, data.province, data.city)}
            className="bg-red-800 rounded-md font-bold p-2 text-white hover:opacity-75"
          >
            Delete
          </button>

        </td>

      </tr>

    ));
  };

  const mutate = useMutation(DeleteReport, {

    onSuccess: () => {
      queryClient.invalidateQueries('reported_cases');
      queryClient.invalidateQueries('perCity_reports');
      queryClient.invalidateQueries('perProvince_reports');
      queryClient.invalidateQueries('perMollusk_reports');
      queryClient.invalidateQueries('perYear_reports');
      queryClient.invalidateQueries('perYear_ResolvedReports');


      Swal.fire({
        title: "Deleted!",
        text: "Report Deleted Successfully",
        icon: "success",
        confirmButtonColor: "#3085d6",
      }).then(result => {
        if (result.isConfirmed || result.isDismissed) setOpenReportsModal(true)
      })

    },

    onMutate: () => {
      Swal.fire({
          title: 'Deleting...',
          text: 'Please wait while the report is being deleted.',
          icon: 'info',
          allowOutsideClick: false,
          showConfirmButton: false,
          willOpen: () => {
              Swal.showLoading();
          },
      });
  },
  });

  const DeleteReportPopup = (report_id: number, molluskName: string, province: string, city: string) => {
    setOpenReportsModal(false)

    Swal.fire({
      title: "Are you sure?",
      text: "On Deleting this Report",
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#800000",
      cancelButtonColor: "#3085d6",
      confirmButtonText: "Yes, delete it!"

    }).then((result) => {
      const reportData = {
        report_id,
        molluskName,
        province,
        city
      }

      if (result.isConfirmed) mutate.mutate(reportData)
    });

  };

  const viewMap = (latitude: number, longitude: number) => {
    setOpenReportsModal(false)
    setMapCoor([latitude, longitude]);
  };

  return (
    <div className="overflow-auto flex items-start justify-center h-full w-full scrollable-container">

      <div className="rounded-md h-full w-full">

        

        <table className="text-sm text-left w-full text-gray-800 font-semibold dark:text-gray-400 h-[50%]">

          <thead className="text-md text-gray-700 uppercase bg-gray-50 dark:bg-gray-700 dark:text-gray-400 font-bold">
            <tr>
              <th scope="col" className="py-3 px-6">Reporter Name</th>
              <th scope="col" className="py-3 px-6">Reporter Address</th>
              <th scope="col" className="py-3 px-6">Reported Place</th>
              <th scope="col" className="py-3 px-6">Mollusk Type</th>
              <th scope="col" className="py-3 px-6">Status</th>
              <th scope="col" className="py-3 px-6">Reported Date</th>
              <th scope="col" className="py-3 px-6">Actions</th>
            </tr>
          </thead>

          <tbody>{renderTableRows()}</tbody>

        </table>

        {renderPagination()}

      </div>

    </div>
  );
}

export default ReportedCases;
