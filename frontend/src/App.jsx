import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Navbar from './ui/Navbar';
import Footer from './ui/Footer';
import ChatBot from './ui/ChatBot';
import HomePage from './pages/HomePage';
import ReportPage from './pages/ReportPage';
import MapPage from './pages/MapPage';
import AnalyticsPage from './pages/AnalyticsPage';
import AboutPage from './pages/AboutPage';
import AdminPage from './pages/AdminPage';
import './styles/theme.css';
import './App.css';

export default function App() {
  return (
    <BrowserRouter>
      <div className="app-layout">
        <Navbar />
        <main className="app-main">
          <Routes>
            <Route path="/" element={<HomePage />} />
            <Route path="/report" element={<ReportPage />} />
            <Route path="/map" element={<MapPage />} />
            <Route path="/analytics" element={<AnalyticsPage />} />
            <Route path="/about" element={<AboutPage />} />
            <Route path="/admin" element={<AdminPage />} />
          </Routes>
        </main>
        <Footer />
        <ChatBot />
      </div>
    </BrowserRouter>
  );
}
