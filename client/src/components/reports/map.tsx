import { useEffect, useState } from 'react';
import { MapContainer, TileLayer, Tooltip, useMap, Marker, CircleMarker } from 'react-leaflet';
import L from 'leaflet';
import '/public/map.css';
import 'leaflet/dist/leaflet.css';

import { FetchMapReports } from '../../http/get/reports';
import { useQuery } from 'react-query';
import { ReportedCasesTypes } from '../../types/reported';
import { SetViewOnClickProps } from '../../types/map';
import Swal from 'sweetalert2';

const redIcon = new L.Icon({
  iconUrl: 'https://cdn.rawgit.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-red.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  tooltipAnchor: [16, -28],
  shadowSize: [41, 41],
});

const greenIcon = new L.Icon({
  iconUrl: 'https://cdn.rawgit.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-green.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  tooltipAnchor: [16, -28],
  shadowSize: [41, 41],
});

const redCircleOptions: L.CircleMarkerOptions = {
  color: 'red',
  fillColor: 'transparent',
  fillOpacity: 0,
  weight: 1,
};

const greenCircleOptions: L.CircleMarkerOptions = {
  color: 'green',
  fillColor: 'transparent',
  fillOpacity: 0,
  weight: 1,
};

function SetViewOnClick({ MapCoor }: SetViewOnClickProps) {
  const map = useMap();
  map.setView(MapCoor, map.getZoom());

  return null;
}

const monthNames = [
  'January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'
];

function Map({ setMapCoor, MapCoor, setOpenReportsModal }: any) {
  const currentMonth = new Date().getMonth();
  const [selectedMonth, setSelectedMonth] = useState<string>(monthNames[currentMonth]);
  const [selectedMollusk, setSelectedMollusk] = useState<string>('Scaly Clam');
  const [selectedStatus, setSelectedStatus] = useState<string>('In Progress');

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

  useEffect(() => {
    if (reports_query.isFetching) {
      Swal.fire({
        title: 'Loading reports...',
        allowOutsideClick: false,
        didOpen: () => {
          Swal.showLoading();
        },
      });
    } else {
      Swal.close();
    }
  }, [reports_query.isFetching]);

  console.log("reports map data: ", reports);
  console.log("reports_query ", reports_query);

  return (
    <div className="h-screen w-full mt-10 pb-20">
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-gray-700 font-bold text-3xl">Clam Scanner Reported Mollusk Map</h1>

        <div className="flex items-end justify-center gap-5 w-1/2">
          <div className="flex flex-col justify-center w-full gap-2">
            <h1 className="font-bold text-center">Filter Reports by</h1>

            <div className="flex gap-2">

              <select
                className="bg-blue-900 text-white font-bold rounded-md focus:outline-none p-2"
                value={selectedStatus}
                onChange={(e) => setSelectedStatus(e.target.value)}
              >
                <option>In Progress</option>
                <option>Resolved</option>
              </select>

              <select
                className="bg-blue-900 text-white font-bold rounded-md focus:outline-none p-2"
                value={selectedMonth}
                onChange={(e) => setSelectedMonth(e.target.value)}
              >
                {monthNames.map((month) => (
                  <option key={month} value={month}>
                    {month}
                  </option>
                ))}
              </select>

              <select
                className="bg-blue-900 text-white font-bold rounded-md focus:outline-none p-2"
                value={selectedMollusk}
                onChange={(e) => setSelectedMollusk(e.target.value)}
              >
                <option>Scaly Clam</option>
                <option>Tiger Cowrie</option>
                <option>BullMouth Helmet</option>
              </select>
            </div>
          </div>
          <button onClick={() => setOpenReportsModal(true)} className="rounded-md p-2 text-white font-bold bg-blue-900 w-full hover:opacity-75 hover:cursor-pointer">
            All Reported Cases
          </button>
        </div>
      </div>

      <div className="relative w-full h-full flex justify-center z-10">
        <MapContainer center={MapCoor} zoom={9} scrollWheelZoom={false} attributionControl={false} className="w-full h-full">
          <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
          <SetViewOnClick MapCoor={MapCoor} />

          {reports?.map((data) => {
            const icon = data.status === 'Resolved' ? greenIcon : redIcon;
            const circleOptions = data.status === 'Resolved' ? greenCircleOptions : redCircleOptions;

            return (
              <div key={data.report_id}>
                <Marker
                  position={[data.latitude, data.longitude]}
                  eventHandlers={{
                    click: () => setMapCoor([data.latitude, data.longitude]),
                  }}
                  icon={icon}
                >
                  <Tooltip>
                    {data.reporter_name} <br />
                    {data.mollusk_type} <br />
                    {data.city}{data.district}, {data.province} <br />
                    {data.reportedAt} <br />
                    {data.latitude}° N, {data.longitude}° E
                  </Tooltip>
                </Marker>

                <CircleMarker
                  center={[data.latitude, data.longitude]}
                  pathOptions={circleOptions}
                  radius={8}
                />
              </div>
            );
          })}
        </MapContainer>

        <div className="absolute top-4 right-4 bg-white p-4 rounded-lg shadow-lg" style={{ zIndex: 9999 }}>
          <div className="flex flex-col gap-2">
            <div className="flex items-center gap-2">
              <img src="/img/red_marker.png" width={20} height={30} />
              <h1 className="text-sm">In Progress Cases</h1>
            </div>

            <div className="flex items-center gap-2">
              <img src="/img/green_marker.png" width={20} height={30} />
              <h1 className="text-sm">Resolved Cases</h1>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Map;
