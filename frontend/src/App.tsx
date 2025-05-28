import "./index.css";

import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { Navbar } from '@/components/layout/navbar';
import { Footer } from '@/components/layout/footer';
import NotFound from "@/components/ui/notFound";
import TimeSeriesDashboard from "@/screens/dashboard/TimeSeriesDashboard";

export const App: React.FC = () => (
  <Router>
    <div className="flex flex-col min-h-screen">
      <Navbar />
      <main className="flex-grow">
        <Routes>
          <Route path="/" element={<TimeSeriesDashboard />} />
          <Route path="/dashboard" element={<TimeSeriesDashboard />} />

          <Route path="/predict" element={<TimeSeriesDashboard />} />

          <Route path="/*" element={<NotFound />} />
        </Routes>
      </main>
      <Footer />
    </div>
  </Router>
);
