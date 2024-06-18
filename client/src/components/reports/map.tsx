import { MapContainer, TileLayer, Tooltip, useMap, Marker, CircleMarker } from "react-leaflet";
import L from 'leaflet';

import '/public/map.css'
import "leaflet/dist/leaflet.css"

import { FetchReports } from "../../http/get/reports";
import { useQuery } from "react-query";
import { ReportedCasesTypes } from "../../types/reported";

const redIcon = new L.Icon({
  iconUrl: 'https://cdn.rawgit.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-red.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  tooltipAnchor: [16, -28],
  shadowSize: [41, 41]
});

const greenIcon = new L.Icon({
  iconUrl: 'https://cdn.rawgit.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-green.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  tooltipAnchor: [16, -28],
  shadowSize: [41, 41]
});

const redCircleOptions = {
  color: 'red', 
  fillColor: 'transparent', 
  fillOpacity: 0,
  weight: 1 
}

const greenCircleOptions = {
  color: 'green', 
  fillColor: 'transparent', 
  fillOpacity: 0,
  weight: 1 
}

function SetViewOnClick({ MapCoor }: any) {
  const map = useMap();
  map.setView(MapCoor, map.getZoom());

  return null;
}
function Map({ setMapCoor, MapCoor, setOpenReportsModal }: any) {

  const reports_query = useQuery("reported_cases", FetchReports)
  const reports = reports_query.data?.data

  return (
    <div className="h-screen w-full mt-10 pb-20">
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-gray-700 font-bold text-3xl">Clam Scanner Reported Mollusk Map</h1>
        
        <div className="flex items-end justify-center gap-5 w-1/2">

          <div className="flex flex-col justify-center w-1/2 gap-2">
            <h1 className="font-bold text-center">Filter Reports by</h1>
            <div className="flex gap-5">
              <select className="bg-blue-900 text-white font-bold rounded-md focus:outline-none p-2">
                <option>January</option>
                <option>February</option>
                <option>March</option>
                <option>April</option>
                <option>May</option>
                <option>June</option>
                <option>July</option>
                <option>August</option>
                <option>September</option>
                <option>October</option>
                <option>November</option>
                <option>December</option>
              </select>
              <select className="bg-blue-900 text-white font-bold rounded-md focus:outline-none p-2">
                <option>Giant Clam</option>
                <option>Giant Morum</option>
                <option>Tiger Cowrie</option>
                <option>BullMouth Helmet</option>
              </select>
            </div>
          </div>
          <button onClick={() => setOpenReportsModal(true)} className="rounded-md p-2 text-white font-bold bg-blue-900 w-full hover:opacity-75 hover:cursor-pointer">
            View Reported Cases
          </button>
        </div>
      </div>

      <div className="relative w-full h-full flex justify-center z-10">
        <MapContainer center={ MapCoor } zoom={9} scrollWheelZoom={false} attributionControl={false} className="w-full h-full">

          <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"/>

          <SetViewOnClick MapCoor={MapCoor} />

          {reports ? reports.map((data: ReportedCasesTypes) => {
            const icon = data.status === "Resolved" ? greenIcon : redIcon;

            const circleOptions = data.status === "Resolved" ? greenCircleOptions : redCircleOptions;
            
            return (

              <div key={data.report_id}>
                <Marker
                  position={[data.latitude, data.longitude]}
                  eventHandlers={{
                    click: () => setMapCoor([data.latitude, data.longitude])
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
                >
                </CircleMarker>

              </div>
            )
          }) : null}
        </MapContainer>

        <div className="absolute top-4 right-4 bg-white p-4 rounded-lg shadow-lg" style={{zIndex: 9999}}>
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

export default Map