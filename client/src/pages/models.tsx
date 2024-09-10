import React, { useEffect, useState } from 'react';
import { ModelTable } from '../components/models/model_table';
import { SideBar } from '../components/navigation/sidebar';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faBars, faRobot } from '@fortawesome/free-solid-svg-icons';
import { ModelDetailsModal } from '../components/modal/models';
import { useMutation, useQueryClient } from 'react-query';
import Swal from 'sweetalert2';
import { Chart } from 'react-google-charts';
import { FetchModelType } from '../types/datasets';
import { TrainModel } from '../http/post/train';
import ChatBot from '../components/chat/chatbot';

const socket = new WebSocket('ws://localhost:5000/ws');

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
  const [isSidebarOpen, setIsSidebarOpen] = useState<boolean>(false);

  const [isModelDetailsModalOpen, setIsModelDetailsModalOpen] = useState<boolean>(false);
  const [modelDetails, setModelDetails] = useState<FetchModelType>();

  const [numberOfTrainedModels, setNumberOfTrainedModels] = useState<number | undefined>(undefined);
  const [trainingMetrics, setTrainingMetrics] = useState<TrainingMetrics>({
    epochs: [],
    accuracy: [],
    val_accuracy: [],
    loss: [],
    val_loss: [],
    class_names: []
  });

  useEffect(() => {
    socket.onmessage = (event) => {
      const data = JSON.parse(event.data);
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

  const queryClient = useQueryClient();

  const { isLoading, mutate } = useMutation(TrainModel, {
    onSuccess: () => {
      queryClient.invalidateQueries('train_model');
    },
    onError: (error) => {
      console.error('Training error:', error);
    },
  });

  useEffect(() => {

    if (isLoading) {

      Swal.fire({
        title: 'Training will take a several moments to finish!',
        allowOutsideClick: false,
        allowEscapeKey: false,

        position: 'top-end',
        backdrop: false,
        width: '500px',
        didOpen: () => {
          Swal.showLoading();
        },

      });

    }

  }, [isLoading]);

  const newModelVersion = numberOfTrainedModels !== undefined ? (numberOfTrainedModels + 1).toString() : '1';

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

  console.log("trainingMetrics: ", trainingMetrics)

  return (
    <div className="flex flex-col h-full w-full">
      {isSidebarOpen && <SideBar setisSidebarOpen={setIsSidebarOpen} />}

      {isModelDetailsModalOpen && modelDetails && (
        <ModelDetailsModal setisModelDetailsOpen={setIsModelDetailsModalOpen} modelDetails={modelDetails} />
      )}

      <div className="h-full w-full flex flex-col items-start p-8">
        <FontAwesomeIcon
          onClick={() => setIsSidebarOpen(true)}
          icon={faBars}
          className="font-bold text-3xl hover:opacity-75 hover:cursor-pointer"
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

            {
              trainingMetrics.class_names.length > 0 && (
                <div className="w-full text-white font-bold flex gap-3 text-lg">
                  <h1>Dataset Class Names:</h1>
                  {trainingMetrics.class_names.join(', ')}
                </div>
              )
            }

          

            <ModelTable
              setisModelDetailsModal={setIsModelDetailsModalOpen}
              setModelDetails={setModelDetails}
              setNumberOfTrainedModels={setNumberOfTrainedModels}
            />

            {trainingMetrics.epochs.length > 0 && (
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
          </div>
        </div>
      </div>

      <ChatBot />
    </div>
  );
};

export default ModelsPage;
