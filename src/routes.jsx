import { Routes, Route, Navigate } from 'react-router-dom'
import Layout from './components/Layout.jsx'
import ProtectedRoute from './components/ProtectedRoute.jsx'

import Login from './pages/Login.jsx'
import DashboardHome from './pages/DashboardHome.jsx'
import Exams from './pages/Exams.jsx'
import ExamDetail from './pages/ExamDetail.jsx'
import Students from './pages/Students.jsx'
import StudentDetail from './pages/StudentDetail.jsx'
import Settings from './pages/Settings.jsx'
import NotFound from './pages/NotFound.jsx'

export default function AppRoutes() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />

      <Route
        element={
          <ProtectedRoute>
            <Layout />
          </ProtectedRoute>
        }
      >
        <Route index element={<Navigate to="/dashboard" replace />} />
        <Route path="dashboard" element={<DashboardHome />} />
        <Route path="exams" element={<Exams />} />
        <Route path="exams/:examId" element={<ExamDetail />} />
        <Route path="students" element={<Students />} />
        <Route path="students/:studentCode" element={<StudentDetail />} />
        <Route path="settings" element={<Settings />} />

        {/* Redirects for old routes */}
        <Route path="branches" element={<Navigate to="/settings" replace />} />
        <Route path="programs" element={<Navigate to="/settings" replace />} />
        <Route path="academic-years" element={<Navigate to="/settings" replace />} />
        <Route path="upload" element={<Navigate to="/settings" replace />} />
      </Route>

      <Route path="*" element={<NotFound />} />
    </Routes>
  )
}
