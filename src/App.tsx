import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import Layout from "@/components/layout/Layout";
import Dashboard from "@/pages/Dashboard";
import RawMaterial from "@/pages/RawMaterial";
import Grinding from "@/pages/Grinding";
import Preheater from "@/pages/Preheater";
import Kiln from "@/pages/Kiln";
import Cooler from "@/pages/Cooler";
import Production from "@/pages/Production";
import Quality from "@/pages/Quality";

export default function App() {
  return (
    <Router>
      <Layout>
        <Routes>
          <Route path="/" element={<Navigate to="/dashboard" replace />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/raw-material" element={<RawMaterial />} />
          <Route path="/grinding" element={<Grinding />} />
          <Route path="/preheater" element={<Preheater />} />
          <Route path="/kiln" element={<Kiln />} />
          <Route path="/cooler" element={<Cooler />} />
          <Route path="/production" element={<Production />} />
          <Route path="/quality" element={<Quality />} />
          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Routes>
      </Layout>
    </Router>
  );
}
