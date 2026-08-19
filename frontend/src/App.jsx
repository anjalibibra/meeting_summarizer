import React from 'react'
import { BrowserRouter, Navigate, Route, Routes, useLocation } from 'react-router-dom'
import UploadPage from './components/UploadPage'
import StatusPage from './components/StatusPage'
import ResultsPage from './components/ResultsPage'
import Navbar from './components/Navbar'

function AppLayout() {
  const location = useLocation()
  const isUploadPage = location.pathname === '/'

  return (
    <div className="min-h-screen bg-[#FDF5DF] text-[#243447] paper-texture selection:bg-[#F92C85]/30">
      {!isUploadPage && <Navbar />}

      <main>
        <Routes>
          <Route path="/" element={<UploadPage />} />
          <Route path="/status/:jobId" element={<StatusPage />} />
          <Route path="/results/:jobId" element={<ResultsPage />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </main>
    </div>
  )
}

export default function App() {
  return (
    <BrowserRouter>
      <AppLayout />
    </BrowserRouter>
  )
}
