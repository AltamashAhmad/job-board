import { Routes, Route } from 'react-router-dom';
import DashboardLayout from './components/layout/DashboardLayout';
import Dashboard from './pages/Dashboard';
import ImportHistory from './pages/ImportHistory';

function AppRoutes() {
  return (
    <DashboardLayout>
      <Routes>
        <Route path="/" element={<Dashboard />} />
        <Route path="/imports" element={<ImportHistory />} />
        <Route path="*" element={<div>404 - Page Not Found</div>} />
      </Routes>
    </DashboardLayout>
  );
}

export default AppRoutes; 