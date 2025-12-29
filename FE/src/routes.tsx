import { createBrowserRouter, Navigate } from 'react-router-dom';
import { MainLayout } from './layouts/MainLayout';
import { Dashboard } from './pages/Dashboard';
import { LandingPage } from './pages/LandingPage';
import { WorkflowDesigner } from './pages/WorkflowDesigner';
import { DocumentationPage } from './pages/DocumentationPage';

export const router = createBrowserRouter([
    {
        path: '/',
        element: <LandingPage />
    },
    {
        path: '/documentation',
        element: <DocumentationPage />
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
