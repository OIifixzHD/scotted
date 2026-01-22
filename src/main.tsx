import '@/lib/errorReporter';
import { enableMapSet } from "immer";
enableMapSet();
import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import {
  createBrowserRouter,
  RouterProvider,
  Outlet
} from "react-router-dom";
import { ErrorBoundary } from '@/components/ErrorBoundary';
import { RouteErrorBoundary } from '@/components/RouteErrorBoundary';
import '@/index.css'
import { HomePage } from '@/pages/HomePage'
import { DiscoverPage } from '@/pages/DiscoverPage'
import { UploadPage } from '@/pages/UploadPage'
import { ProfilePage } from '@/pages/ProfilePage'
import { MessagesPage } from '@/pages/MessagesPage'
import { SignUpPage } from '@/pages/SignUpPage'
import { LoginPage } from '@/pages/LoginPage'
import { NotFoundPage } from '@/pages/NotFoundPage'
import { Toaster } from '@/components/ui/sonner'
import { AuthProvider } from '@/context/AuthContext'
import { ProtectedRoute } from '@/components/ProtectedRoute'
import { RootLayout } from '@/components/layout/RootLayout'
const router = createBrowserRouter([
  {
    element: <Outlet />,
    errorElement: <RouteErrorBoundary />,
    children: [
      // Public Routes (No Sidebar)
      {
        path: "/signup",
        element: <SignUpPage />,
      },
      {
        path: "/login",
        element: <LoginPage />,
      },
      // Protected/App Routes (With Sidebar & Transitions)
      {
        element: <RootLayout />,
        children: [
          {
            path: "/",
            element: <HomePage />,
          },
          {
            path: "/discover",
            element: <DiscoverPage />,
          },
          {
            path: "/upload",
            element: (
              <ProtectedRoute>
                <UploadPage />
              </ProtectedRoute>
            ),
          },
          {
            path: "/messages",
            element: (
              <ProtectedRoute>
                <MessagesPage />
              </ProtectedRoute>
            ),
          },
          {
            path: "/profile/:id",
            element: <ProfilePage />,
          },
        ]
      },
      // 404 Catch-all
      {
        path: "*",
        element: <NotFoundPage />
      }
    ]
  }
]);
createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ErrorBoundary>
      <AuthProvider>
        <RouterProvider router={router} />
        <Toaster richColors closeButton theme="dark" />
      </AuthProvider>
    </ErrorBoundary>
  </StrictMode>,
)