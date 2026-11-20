import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Layout from './components/layout/Layout';
import Dashboard from './pages/Dashboard';
import Playground from './pages/Playground';
import TestLibrary from './pages/TestLibrary';
import PromptLab from './pages/PromptLab';
import Results from './pages/Results';
import TestDetail from './pages/TestDetail';

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route element={<Layout />}>
          <Route path="/" element={<Dashboard />} />
          <Route path="/playground" element={<Playground />} />
          <Route path="/tests" element={<TestLibrary />} />
          <Route path="/prompts" element={<PromptLab />} />
          <Route path="/results" element={<Results />} />
          <Route path="/results/:id" element={<TestDetail />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}
