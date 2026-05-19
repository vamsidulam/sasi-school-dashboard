import { Routes, Route, Navigate } from 'react-router-dom'
import Layout from './components/Layout.jsx'
import ProtectedRoute from './components/ProtectedRoute.jsx'

import Login from './pages/Login.jsx'
import Dashboard from './pages/Dashboard.jsx'
import Branches from './pages/Branches.jsx'
import Programs from './pages/Programs.jsx'
import Exams from './pages/Exams.jsx'
import ExamDetail from './pages/ExamDetail.jsx'
import Students from './pages/Students.jsx'
import StudentDetail from './pages/StudentDetail.jsx'
import Upload from './pages/Upload.jsx'
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
        <Route path="dashboard" element={<Dashboard />} />
        <Route path="branches" element={<Branches />} />
        <Route path="programs" element={<Programs />} />
        <Route path="exams" element={<Exams />} />
        <Route path="exams/:examId" element={<ExamDetail />} />
        <Route path="students" element={<Students />} />
        <Route path="students/:studentCode" element={<StudentDetail />} />
        <Route path="upload" element={<Upload />} />
      </Route>

      <Route path="*" element={<NotFound />} />
    </Routes>
  )
}
