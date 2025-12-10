import React from 'react';
import { useRoutes, Navigate } from 'react-router-dom';
import { MainLayout } from './layouts/MainLayout';
import { Dashboard } from './pages/Dashboard';
import { WorkflowDesigner } from './pages/WorkflowDesigner';

export const AppRoutes: React.FC = () => {
    const element = useRoutes([
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

    return element;
};
