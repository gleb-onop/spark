import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import TabBar from './components/TabBar';
import SegmentedVideosPage from './pages/SegmentedVideosPage';
import SegmentedVideoPage from './pages/SegmentedVideoPage';
import SegmentPage from './pages/SegmentPage';
import AddPage from './pages/AddPage';
import EditPage from './pages/EditPage';
import './index.css';

function App() {
  return (
    <BrowserRouter>
      <div className="max-w-[390px] mx-auto min-h-screen relative flex flex-col bg-background selection:bg-accent/30">
        <main className="flex-1 pb-24">
          <Routes>
            <Route path="/" element={<Navigate to="/segmented-videos" replace />} />
            <Route path="/segmented-videos" element={<SegmentedVideosPage />} />
            <Route path="/segmented-videos/new" element={<AddPage />} />
            <Route path="/segmented-videos/:segmentedVideoId" element={<SegmentedVideoPage />} />
            <Route path="/segmented-videos/:segmentedVideoId/segments/new" element={<AddPage />} />
            <Route path="/segmented-videos/:segmentedVideoId/segments/:segmentId" element={<SegmentPage />} />
            <Route path="/segmented-videos/:segmentedVideoId/segments/:segmentId/edit" element={<EditPage />} />
          </Routes>
        </main>
        <TabBar />
      </div>
    </BrowserRouter>
  );
}

export default App;
