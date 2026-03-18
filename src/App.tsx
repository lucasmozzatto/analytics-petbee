import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Layout from './components/Layout';
import Visao from './pages/Visao';
import Trafego from './pages/Trafego';
import UTMs from './pages/UTMs';
import Funil from './pages/Funil';
import Paginas from './pages/Paginas';
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
          <Route path="/paginas" element={<Paginas />} />
          <Route path="/insights" element={<Insights />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}
