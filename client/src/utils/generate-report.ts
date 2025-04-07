import { GenerateReports } from "../http/get/reports";

export const handleGenerateReport = async () => {
        const blob = await GenerateReports();

        if (blob) {
            // Create a Blob URL
            const url = window.URL.createObjectURL(new Blob([blob]));
      
            // Create a temporary <a> element
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', 'reports.xlsx'); // Set the desired filename
            document.body.appendChild(link);
      
            // Programmatically click the link to trigger the download
            link.click();
      
            // Clean up the Blob URL
            document.body.removeChild(link);
            window.URL.revokeObjectURL(url);
      
            console.log('Report downloaded successfully!');
          } else {
            console.error('Failed to generate or retrieve report data.');
          }
}