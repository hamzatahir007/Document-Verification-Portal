import React from "react";
import {
  BrowserRouter,
  Routes,
  Route,
  Navigate,
} from "react-router-dom";

import LoginPage from "./pages/LoginPage";
import EsahulatQueuePage from "./pages/EsahulatQueuePage";
import EsahulatRequestDetailPage from "./pages/EsahulatRequestDetailPage";
import HistoryPage from "./pages/HistoryPage.jsx";
import HistoryDetailPage from "./pages/HistoryDetailPage.jsx";
import ProtectedRoute from "./components/ProtectedRoute";
import LoginProtectedRoute from "./components/LoginProtectedRoute.jsx";
import ComplainPage from "./pages/Complain.jsx";
import ComplaintDetailPage from "./pages/ComplainDetails.jsx";

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route
          path="/login"
          element={
            <LoginProtectedRoute>
              <LoginPage />
            </LoginProtectedRoute>
          }
        />

        <Route
          path="/history"
          element={
            <ProtectedRoute requiredIsAssign={false}>
              <HistoryPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/complain"
          element={
            <ProtectedRoute requiredIsAssign={false}>
              <ComplainPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/complain/:id"
          element={
            <ProtectedRoute requiredIsAssign={false}>
              <ComplaintDetailPage />
            </ProtectedRoute>
          }
        />

        <Route
          path="/history/:id"
          element={
            <ProtectedRoute requiredIsAssign={false}>
              <HistoryDetailPage />
            </ProtectedRoute>
          }
        />

        <Route
          path="/requests"
          element={
            <ProtectedRoute requiredIsAssign={true}>
              <EsahulatQueuePage />
            </ProtectedRoute>
          }
        />

        <Route
          path="/requests/:id"
          element={
            <ProtectedRoute requiredIsAssign={true}>
              <EsahulatRequestDetailPage />
            </ProtectedRoute>
          }
        />

        <Route
          path="*"
          element={<Navigate to="/login" replace />}
        />
      </Routes>
    </BrowserRouter>
  );
}

export default App;