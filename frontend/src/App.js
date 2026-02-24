import "@/App.css";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { Toaster } from "@/components/ui/sonner";
import DashboardLayout from "@/components/DashboardLayout";
import DashboardPage from "@/pages/DashboardPage";
import SimulatorPage from "@/pages/SimulatorPage";
import AnalyticsPage from "@/pages/AnalyticsPage";
import ComparisonPage from "@/pages/ComparisonPage";
import DataPage from "@/pages/DataPage";

function App() {
  return (
    <BrowserRouter>
      <Toaster position="top-right" />
      <Routes>
        <Route element={<DashboardLayout />}>
          <Route path="/" element={<DashboardPage />} />
          <Route path="/simulator" element={<SimulatorPage />} />
          <Route path="/analytics" element={<AnalyticsPage />} />
          <Route path="/comparison" element={<ComparisonPage />} />
          <Route path="/data" element={<DataPage />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;
