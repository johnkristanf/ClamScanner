import React from 'react';
import ReactDOM from 'react-dom/client';
import '../public/tailwind.css';

import { RouterProvider } from 'react-router-dom';
import { ROUTER } from './routes/route';

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <RouterProvider router={ROUTER}/>
  </React.StrictMode>,
)
