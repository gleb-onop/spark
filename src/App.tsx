import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Header from './components/Header';
import TabBar from './components/TabBar';
import PlaylistsPage from './pages/PlaylistsPage';
import PlaylistDetailsPage from './pages/PlaylistDetailsPage';
import VideoPage from './pages/VideoPage';
import AddPage from './pages/AddPage';
import EditPage from './pages/EditPage';
import './index.css';

function App() {
  return (
    <BrowserRouter>
      <div className="max-w-[390px] mx-auto min-h-screen relative flex flex-col">
        <Header />
        <main className="flex-1 pb-20">
          <Routes>
            <Route path="/" element={<Navigate to="/playlists" replace />} />
            <Route path="/playlists" element={<PlaylistsPage />} />
            <Route path="/playlist/:playlistId" element={<PlaylistDetailsPage />} />
            <Route path="/video/:videoId" element={<VideoPage />} />
            <Route path="/add" element={<AddPage />} />
            <Route path="/edit/:videoId" element={<EditPage />} />
          </Routes>
        </main>
        <TabBar />
      </div>
    </BrowserRouter>
  );
}

export default App;
