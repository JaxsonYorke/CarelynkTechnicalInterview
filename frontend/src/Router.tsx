/**
 * React Router Configuration
 * Defines all routes for the Carelynk Homecare MVP application
 */

import React from 'react';
import {
  createBrowserRouter,
  RouterProvider,
  Outlet,
} from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';

// Page Components - Auth & Landing
import Landing from './pages/Landing';
import CaregiverSignup from './pages/auth/CaregiverSignup';
import CaregiverLogin from './pages/auth/CaregiverLogin';
import SeekerSignup from './pages/auth/SeekerSignup';
import SeekerLogin from './pages/auth/SeekerLogin';

// Page Components - Caregiver Portal
import CaregiverDashboard from './pages/caregiver/CaregiverDashboard';
import CaregiverOnboarding from './pages/caregiver/CaregiverOnboarding';
import CaregiverProfile from './pages/caregiver/CaregiverProfile';
import CaregiverAcceptedJobs from './pages/caregiver/CaregiverAcceptedJobs';
import CaregiverLayout from './pages/caregiver/CaregiverLayout';

// Page Components - Seeker Portal
import SeekerDashboard from './pages/seeker/SeekerDashboard';
import SeekerProfile from './pages/seeker/SeekerProfile';
import CreateJobRequest from './pages/seeker/CreateJobRequest';
import MyJobs from './pages/seeker/MyJobs';
import MatchedCaregivers from './pages/seeker/MatchedCaregivers';
import SeekerLayout from './pages/seeker/SeekerLayout';

// Other Components
import ProtectedRoute from './components/ProtectedRoute';
import NotFound from './pages/NotFound';

/**
 * Root Layout Component
 * Wraps all routes and provides AuthProvider context
 */
const RootLayout: React.FC = () => {
  return (
    <AuthProvider>
      <Outlet />
    </AuthProvider>
  );
};

/**
 * Create router configuration with nested routes
 * Organized by portal (caregiver, seeker) and access level (public, protected)
 */
const router = createBrowserRouter([
  {
    element: <RootLayout />,
    children: [
      // Public Routes
      {
        path: '/',
        element: <Landing />,
      },

      // Auth Routes - Caregiver
      {
        path: '/auth/caregiver/signup',
        element: <CaregiverSignup />,
      },
      {
        path: '/auth/caregiver/login',
        element: <CaregiverLogin />,
      },

      // Auth Routes - Seeker
      {
        path: '/auth/seeker/signup',
        element: <SeekerSignup />,
      },
      {
        path: '/auth/seeker/login',
        element: <SeekerLogin />,
      },

      // Caregiver Portal Routes (Protected)
      {
        path: '/caregiver',
        element: (
          <ProtectedRoute requiredRole="caregiver">
            <CaregiverLayout />
          </ProtectedRoute>
        ),
        children: [
          {
            path: 'dashboard',
            element: <CaregiverDashboard />,
          },
          {
            path: 'profile',
            element: <CaregiverProfile />,
          },
          {
            path: 'onboarding',
            element: <CaregiverOnboarding />,
          },
          {
            path: 'accepted-jobs',
            element: <CaregiverAcceptedJobs />,
          },
        ],
      },

      // Seeker Portal Routes (Protected)
      {
        path: '/seeker',
        element: (
          <ProtectedRoute requiredRole="care_seeker">
            <SeekerLayout />
          </ProtectedRoute>
        ),
        children: [
          {
            path: 'dashboard',
            element: <SeekerDashboard />,
          },
          {
            path: 'profile',
            element: <SeekerProfile />,
          },
          {
            path: 'create-job',
            element: <CreateJobRequest />,
          },
          {
            path: 'jobs/:jobId/edit',
            element: <CreateJobRequest />,
          },
          {
            path: 'my-jobs',
            element: <MyJobs />,
          },
          {
            path: 'matches/:jobId',
            element: <MatchedCaregivers />,
          },
        ],
      },

      // 404 - Catch all invalid routes
      {
        path: '*',
        element: <NotFound />,
      },
    ],
  },
]);

/**
 * Router Component
 * Main export for the application router
 */
const Router: React.FC = () => {
  return <RouterProvider router={router} />;
};

export default Router;
