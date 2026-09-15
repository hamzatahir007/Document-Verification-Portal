import React from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import LoginPage from "./pages/LoginPage";
import EsahulatQueuePage from "./pages/EsahulatQueuePage";
import EsahulatRequestDetailPage from "./pages/EsahulatRequestDetailPage";
import ProtectedRoute from "./components/ProtectedRoute";
import LoginProtectedRoute from "./components/LoginProtectedRoute.jsx";

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
          path="/requests"
          element={
            <ProtectedRoute>
              <EsahulatQueuePage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/requests/:id"
          element={
            <ProtectedRoute>
              <EsahulatRequestDetailPage />
            </ProtectedRoute>
          }
        />
        <Route path="*" element={<Navigate to="/requests" />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
