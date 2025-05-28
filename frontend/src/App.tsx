import "./index.css";

import { Navbar } from './components/layout/navbar';
import { Footer } from './components/layout/footer';
import TimeSeriesDashboard from "./components/dashboard/TimeSeriesDashboard";

export const App: React.FC = () => (
  <div className="flex flex-col min-h-screen">
    <Navbar />
    <main className="flex-grow">
      <TimeSeriesDashboard />
    </main>
    <Footer />
  </div>
);
