import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Layout from './components/Layout';
import Visao from './pages/Visao';
import Trafego from './pages/Trafego';
import UTMs from './pages/UTMs';
import Funil from './pages/Funil';
import Paginas from './pages/Paginas';
import Blog from './pages/Blog';
import Onboarding from './pages/Onboarding';
import Dispositivos from './pages/Dispositivos';
import Horarios from './pages/Horarios';
import Geografia from './pages/Geografia';
import Insights from './pages/Insights';

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route element={<Layout />}>
          <Route path="/" element={<Navigate to="/visao-geral" />} />
          <Route path="/visao-geral" element={<Visao />} />
          <Route path="/trafego" element={<Trafego />} />
          <Route path="/utms" element={<UTMs />} />
          <Route path="/funil" element={<Funil />} />
          <Route path="/onboarding" element={<Onboarding />} />
          <Route path="/paginas" element={<Paginas />} />
          <Route path="/blog" element={<Blog />} />
          <Route path="/dispositivos" element={<Dispositivos />} />
          <Route path="/horarios" element={<Horarios />} />
          <Route path="/geografia" element={<Geografia />} />
          <Route path="/insights" element={<Insights />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}
