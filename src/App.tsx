import { useState, useRef, useEffect } from 'react'
import { API_BASE } from './config'

interface TorrentStatus {
  progress: number;
  download_rate: number;
  upload_rate: number;
  num_peers: number;
}

function App() {
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [status, setStatus] = useState<TorrentStatus | null>(null);
  const videoReady = useRef(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const statusInterval = useRef<number | null>(null);

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const formData = new FormData();
    formData.append('file', file);

    try {
      const response = await fetch(`${API_BASE}/upload`, {
        method: 'POST',
        body: formData,
      });
      const data = await response.json();
      setSessionId(data.session_id);
      videoReady.current = false;
      startStatusPolling(data.session_id);
    } catch {
      console.error('Upload failed');
    }
  };

  // Handler for .torrent file upload
  const handleTorrentUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const formData = new FormData();
    formData.append('file', file);

    try {
      const response = await fetch(`${API_BASE}/seed`, {
        method: 'POST',
        body: formData,
      });
      const data = await response.json();
      setSessionId(data.session_id);
      videoReady.current = false;
      startStatusPolling(data.session_id);
    } catch {
      alert('Failed to seed torrent. Is the backend running?');
    }
  };

  const startStatusPolling = (sid: string) => {
    if (statusInterval.current) {
      clearInterval(statusInterval.current);
      statusInterval.current = null;
    }
    statusInterval.current = window.setInterval(async () => {
      try {
        const response = await fetch(`${API_BASE}/status/${sid}`);
        const data = await response.json();
        setStatus(data);
        if (data.progress >= 100 && !videoReady.current && videoRef.current) {
          videoRef.current.src = `${API_BASE}/stream/${sid}`;
          videoReady.current = true;
        }
      } catch {
        // ignore
      }
    }, 1000);
  };

  useEffect(() => {
    return () => {
      if (statusInterval.current) {
        clearInterval(statusInterval.current);
        statusInterval.current = null;
      }
    };
  }, []);

  const downloadTorrent = async () => {
    if (!sessionId) return;
    window.location.href = `${API_BASE}/download/${sessionId}`;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 to-gray-800 flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-2xl bg-white/90 rounded-2xl shadow-xl p-8 mt-8 mb-8">
        <h1 className="text-4xl font-extrabold text-center text-gray-900 tracking-tight">
          <span className="text-indigo-600">EchoFlix</span> 

        </h1>
        <h1 className="text-4xl font-extrabold text-center text-gray-900 mb-8 tracking-tight">
         <span className="text-gray-700">P2P Video Streaming</span>

        </h1>
        
        <div className="flex flex-col md:flex-row gap-6 md:gap-12 items-center justify-center mb-8">
          <div className="flex-1 w-full">
            <label className="block text-lg font-semibold text-gray-700 mb-2">Upload a Video</label>
            <input
              type="file"
              accept="video/*"
              onChange={handleFileUpload}
              className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-indigo-50 file:text-indigo-700 hover:file:bg-indigo-100 transition"
            />
          </div>
          <div className="flex-1 w-full">
            <label className="block text-lg font-semibold text-gray-700 mb-2">Or Upload a .torrent</label>
            <input
              type="file"
              accept=".torrent"
              onChange={handleTorrentUpload}
              className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-pink-50 file:text-pink-700 hover:file:bg-pink-100 transition"
            />
            <div className="text-xs text-gray-400 mt-1">(Stream a video from the network)</div>
          </div>
        </div>

        {status && (
          <div className="bg-gray-100 rounded-xl p-6 mb-8 shadow-inner flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div className="flex flex-col gap-1">
              <span className="text-lg font-bold text-gray-700">Stream Status</span>
              <span className="text-gray-600">Progress: <span className="font-mono">{status.progress.toFixed(2)}%</span></span>
              <span className="text-gray-600">Download: <span className="font-mono">{(status.download_rate / 1024).toFixed(2)} KB/s</span></span>
              <span className="text-gray-600">Upload: <span className="font-mono">{(status.upload_rate / 1024).toFixed(2)} KB/s</span></span>
              <span className="text-gray-600">Peers: <span className="font-mono">{status.num_peers}</span></span>
            </div>
            <div className="flex flex-col items-center md:items-end">
              {sessionId && (
                <button
                  onClick={downloadTorrent}
                  className="mt-4 md:mt-0 px-6 py-2 rounded-lg bg-indigo-600 text-white font-semibold shadow hover:bg-indigo-700 transition"
                >
                  Download Torrent File
                </button>
              )}
            </div>
          </div>
        )}

        <div className="flex justify-center">
          <div className="w-full max-w-xl aspect-video bg-black rounded-xl shadow-lg overflow-hidden border-4 border-gray-200">
            <video
              ref={videoRef}
              controls
              className="w-full h-full object-contain bg-black"
            />
          </div>
        </div>
      </div>
      <footer className="text-gray-400 text-xs text-center mt-4 mb-2">
        &copy; {new Date().getFullYear()} EchoFlix &mdash; Decentralized Video Streaming via BitTorrent
      </footer>
    </div>
  )
}

export default App
