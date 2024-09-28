import React, { useEffect, useState } from 'react';
import { ModelTable } from '../components/models/model_table';
import { SideBar } from '../components/navigation/sidebar';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faBars, faRobot } from '@fortawesome/free-solid-svg-icons';
// import { ModelDetailsModal } from '../components/modal/models';
import { useMutation } from 'react-query';
import Swal from 'sweetalert2';
import { Chart } from 'react-google-charts';
// import { FetchModelType } from '../types/datasets';
import { TrainModel } from '../http/post/train';

const socket = new WebSocket('wss://clamscanner.com/py/ws');

socket.onopen = () => {
  console.log('WebSocket Connected');
};

socket.onerror = (error) => {
  console.error('WebSocket error:', error);
};

interface TrainingMetrics {
  epochs: number[];
  accuracy: number[];
  val_accuracy: number[];
  loss: number[];
  val_loss: number[];
  class_names: string[]
}

const ModelsPage: React.FC = () => {
  const [isSidebarOpen, setisSidebarOpen] = useState<boolean>(false);
  // const [isModelDetailsModalOpen, setIsModelDetailsModalOpen] = useState<boolean>(false);
  // const [modelDetails, setModelDetails] = useState<FetchModelType>();
  const [numberOfTrainedModels, setNumberOfTrainedModels] = useState<number | undefined>(undefined);
  const [trainingMetrics, setTrainingMetrics] = useState<TrainingMetrics>({
    epochs: [],
    accuracy: [],
    val_accuracy: [],
    loss: [],
    val_loss: [],
    class_names: []
  });

  const [isTrainingComplete, setIsTrainingComplete] = useState<boolean>(false); 
  const [hasTrainingError, setHasTrainingError] = useState<boolean>(false); 

  useEffect(() => {
    socket.onmessage = (event) => {
      const data = JSON.parse(event.data);

      console.log("ws reponse data:", data)

      if(data.completion_message){
        setIsTrainingComplete(true); 
        setHasTrainingError(false); 
      }

      setTrainingMetrics((prevMetrics) => ({
        epochs: [...prevMetrics.epochs, data.epoch],
        accuracy: [...prevMetrics.accuracy, data.accuracy],
        val_accuracy: [...prevMetrics.val_accuracy, data.val_accuracy],
        loss: [...prevMetrics.loss, data.loss],
        val_loss: [...prevMetrics.val_loss, data.val_loss],
        class_names: data.class_names
      }));
    };
  }, []);

  const { mutate } = useMutation(TrainModel, {
    onMutate: () => {
      Swal.fire({
        title: 'Training will take several moments to finish!',
        allowOutsideClick: false,
        allowEscapeKey: false,
        position: 'top-end',
        backdrop: false,
        width: '500px',
        didOpen: () => {
          Swal.showLoading();
        },
      });
    },
    
    onError: (error) => {
      console.error('Training error:', error);
      setIsTrainingComplete(true); 
      setHasTrainingError(true); 

      Swal.fire({
        icon: 'error',
        title: 'Training Failed',
        text: 'There was an error during the training process. Please try again.',
      });
    },
  });

  useEffect(() => {
    if(isTrainingComplete){

      Swal.fire({
        icon: "success",
        title: "Training Has Completed",
      });

      trainingMetrics.epochs.length = 0
      setIsTrainingComplete(false)
      setHasTrainingError(false)
    } 

  }, [isTrainingComplete])


  const newModelVersion = numberOfTrainedModels != undefined ? (numberOfTrainedModels + 1).toString() : '1';

  let chartData: (string | number)[][] = [];

  if (trainingMetrics.epochs.length > 0) {
    chartData = trainingMetrics.epochs.map((epoch, index) => ([
      epoch + 1,
      trainingMetrics.accuracy[index],
      trainingMetrics.val_accuracy[index],
      trainingMetrics.loss[index],
      trainingMetrics.val_loss[index],
    ]));
    
    chartData.unshift(['Epoch', 'Accuracy', 'Val Accuracy', 'Loss', 'Val Loss']);
  }

  console.log("trainingMetrics: ", trainingMetrics);

  return (
    <div className="flex flex-col h-full w-full">
      {isSidebarOpen && <SideBar setisSidebarOpen={setisSidebarOpen} />}

      {/* {isModelDetailsModalOpen && modelDetails && (
        <ModelDetailsModal setisModelDetailsOpen={setIsModelDetailsModalOpen} modelDetails={modelDetails} />
      )} */}

      <div className="h-full w-full flex flex-col items-start p-8">
          <FontAwesomeIcon
            onClick={() => setisSidebarOpen(true)} 
            icon={faBars} 
            className="fixed top-3 font-bold text-3xl hover:opacity-75 hover:cursor-pointer bg-black text-white p-2 rounded-md"
          />

        <div className="w-full flex justify-center">
          <div className="w-[80%] bg-gray-600 rounded-md p-5 flex flex-col gap-5">
            <div className="flex justify-between">
              <h1 className="text-white font-bold text-3xl">Clam Scanner Models</h1>
              <button
                onClick={() => mutate(newModelVersion)}
                className="bg-blue-900 rounded-md p-3 text-white font-bold flex items-center gap-2 hover:opacity-75 hover:cursor-pointer"
              >
                <FontAwesomeIcon icon={faRobot} /> Train New Model
              </button>
            </div>

            {trainingMetrics && trainingMetrics.epochs.length > 0 && !hasTrainingError && !isTrainingComplete && (
              <div className="w-full bg-white p-5 rounded-md">
                <Chart
                  width="100%"
                  height="400px"
                  chartType="ComboChart"
                  loader={<div>Loading Chart</div>}
                  data={chartData}
                  options={{
                    title: 'Training Metrics per Epoch',
                    seriesType: 'bars',
                    series: {
                      0: { targetAxisIndex: 0 },
                      1: { targetAxisIndex: 0 },
                      2: { targetAxisIndex: 1 },
                      3: { targetAxisIndex: 1 },
                    },
                    vAxes: {
                      0: { title: 'Accuracy/Loss', minValue: 0 },
                      1: { title: 'Accuracy/Loss', minValue: 0 },
                    },
                    hAxis: { title: 'Epoch', format: '0' }, 
                    legend: { position: 'bottom' },
                  }}
                />
              </div>
            )}

            {trainingMetrics.epochs.length == 0 && (
              <ModelTable
                setNumberOfTrainedModels={setNumberOfTrainedModels}
              />
            )}
          </div>
        </div>
      </div>

    </div>
  );
};

export default ModelsPage;
