import { createBrowserRouter, Navigate } from 'react-router-dom';
import { MainLayout } from './layouts/MainLayout';
import { Dashboard } from './pages/Dashboard';
import { WorkflowDesigner } from './pages/WorkflowDesigner';

export const router = createBrowserRouter([
    {
        path: '/',
        element: <Dashboard />
    },
    {
        path: '/', 
        element: <MainLayout />,
        children: [
          
        ]
    },
    {
        path: '/workflow/:id',
        element: <WorkflowDesigner /> 
    },
    {
        path: '*',
        element: <Navigate to="/" replace />
    }
]);
