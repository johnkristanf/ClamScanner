import { ScanLogsData } from "../../types/reported";
import '/public/scrollStyle.css';
import { useState } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faArrowLeft, faArrowRight } from "@fortawesome/free-solid-svg-icons";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function ScanLogsDataModal({ scanLogs }: any) {

  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  // const reports_query = useQuery("reported_cases", FetchReports);
  // const reports = reports_query.data?.data;

  console.log("scanLogs table: ", scanLogs);
  
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = currentPage * itemsPerPage;

  const paginatedReports = scanLogs ? scanLogs.slice(startIndex, endIndex) : [];

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  const renderPagination = () => {

    if (!scanLogs) return null;
    const totalPages = Math.ceil(scanLogs.length / itemsPerPage);

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

    return paginatedReports && paginatedReports.map((data: ScanLogsData) => (

      <tr key={data.id} className="bg-white border-b dark:bg-gray-800 dark:border-gray-700">


        <td className="py-4 px-6">{data.id}</td>
        {/* <td className="py-4 px-6">{data.email}</td> */}
        
        <td className="py-4 px-6">{data.mollusk_type}</td>
        <td className="py-4 px-6"> {data.address}</td>
        <td className="py-4 px-6"> 
          {new Date(data.reported_at).toLocaleString("en-US", {
            month: "long",
            day: "numeric",
            year: "numeric",
            hour: "numeric",
            minute: "2-digit",
            hour12: true,
          })}
      </td>

      </tr>

    ));
  };




  return (
    <div className="overflow-auto flex items-start justify-center h-full w-full scrollable-container">

      <div className="rounded-md h-full w-full">

        <table className="text-sm text-left w-full text-gray-800 font-semibold dark:text-gray-400 h-[50%]">

          <thead className="text-md text-gray-700 uppercase bg-gray-50 dark:bg-gray-700 dark:text-gray-400 font-bold">
            <tr>
              <th scope="col" className="py-3 px-6">Log ID</th>
              {/* <th scope="col" className="py-3 px-6">Email</th> */}
              <th scope="col" className="py-3 px-6">Mollusk Type</th>
              <th scope="col" className="py-3 px-6">Scan Place</th>
              <th scope="col" className="py-3 px-6">Scan Date</th>
            </tr>
          </thead>

          <tbody>{renderTableRows()}</tbody>

        </table>

        {renderPagination()}

      </div>

    </div>
  );
}

export default ScanLogsDataModal;
