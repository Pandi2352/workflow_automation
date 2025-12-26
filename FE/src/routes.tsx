import { createBrowserRouter, Navigate } from 'react-router-dom';
import { MainLayout } from './layouts/MainLayout';
import { Dashboard } from './pages/Dashboard';
import { LandingPage } from './pages/LandingPage';
import { WorkflowDesigner } from './pages/WorkflowDesigner';

export const router = createBrowserRouter([
    {
        path: '/',
        element: <LandingPage />
    },
    {
        path: '/dashboard',
        element: <Dashboard />
    },
    {
        path: '/app', 
        element: <MainLayout />,
        children: [
          // Future routes inside the main app layout
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
