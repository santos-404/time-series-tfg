import "./index.css";

import { Navbar } from './components/layout/Navbar';
import { Footer } from './components/layout/Footer';

export const App: React.FC = () => (
  <div className="flex flex-col min-h-screen">
    <Navbar />
    <main className="flex-grow">
      {/* Tu contenido */}
    </main>
    <Footer />
  </div>
);
