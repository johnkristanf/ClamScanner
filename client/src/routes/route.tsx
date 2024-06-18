import { createBrowserRouter, createRoutesFromElements, Navigate, Route } from 'react-router-dom';

import LoginPage from '../pages/login';

import DashboardPage from '../pages/dashboard';
import ReportsPage from '../pages/reports';
import AccountsPage from '../pages/accounts';
import DataSetsPage from '../pages/datasets';
import ModelsPage from '../pages/models';

import QueryProviderWrapper from '../components/QueryClientProvider';



export const ROUTER = createBrowserRouter(
  
    createRoutesFromElements(
      <>
        <Route path='/' element={ <Navigate to="/login" /> } />
        <Route path='login' element={ <LoginPage/> } />

        <Route path='dashboard' element={<QueryProviderWrapper > <DashboardPage /> </QueryProviderWrapper>} />
        
        <Route path='reports' element={ <QueryProviderWrapper > <ReportsPage  /> </QueryProviderWrapper> } />
        <Route path='datasets' element={ <QueryProviderWrapper > <DataSetsPage /> </QueryProviderWrapper> } />
        
        <Route path='models' element={ <QueryProviderWrapper>  <ModelsPage  /> </QueryProviderWrapper> } />
        <Route path='accounts' element={ <AccountsPage  /> } />

      </>
    )
)  