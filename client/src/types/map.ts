export interface SetViewOnClickProps {
    MapCoor: [number, number];
}

export interface MapProps {
    setMapCoor: React.Dispatch<React.SetStateAction<[number, number]>>;
    MapCoor: [number, number];
    setOpenReportsModal: React.Dispatch<React.SetStateAction<boolean>>;
}
  

export interface FetchMapReportsParams {
    month: string;
    mollusk: string;
    status: string;
}
