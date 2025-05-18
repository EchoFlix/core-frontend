import { useState, useRef, useEffect } from 'react'
import './App.css'

interface TorrentStatus {
  progress: number;
  download_rate: number;
  upload_rate: number;
  num_peers: number;
}

function App() {
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [status, setStatus] = useState<TorrentStatus | null>(null);
  const [videoReady, setVideoReady] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const statusInterval = useRef<number>();

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const formData = new FormData();
    formData.append('file', file);

    try {
      const response = await fetch('http://localhost:8000/upload', {
        method: 'POST',
        body: formData,
      });
      const data = await response.json();
      setSessionId(data.session_id);
      setVideoReady(false);
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
      const response = await fetch('http://localhost:8000/seed', {
        method: 'POST',
        body: formData,
      });
      const data = await response.json();
      setSessionId(data.session_id);
      setVideoReady(false);
      startStatusPolling(data.session_id);
    } catch {
      alert('Failed to seed torrent. Is the backend running?');
    }
  };

  const startStatusPolling = (sid: string) => {
    if (statusInterval.current) {
      clearInterval(statusInterval.current);
    }
    statusInterval.current = window.setInterval(async () => {
      try {
        const response = await fetch(`http://localhost:8000/status/${sid}`);
        const data = await response.json();
        setStatus(data);
        if (data.progress > 0 && !videoReady && videoRef.current) {
          videoRef.current.src = `http://localhost:8000/stream/${sid}`;
          setVideoReady(true);
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
      }
    };
  }, []);

  const downloadTorrent = async () => {
    if (!sessionId) return;
    window.location.href = `http://localhost:8000/download/${sessionId}`;
  };

  return (
    <div className="container">
      <h1>EchoFlix - Decentralized Video Streaming</h1>
      
      <div className="upload-section">
        <input
          type="file"
          accept="video/*"
          onChange={handleFileUpload}
          className="file-input"
        />
        <br /><br />
        <input
          type="file"
          accept=".torrent"
          onChange={handleTorrentUpload}
          className="file-input"
        />
        <div style={{ fontSize: '0.9em', color: '#888' }}>
          (Upload a .torrent file to stream a video from the network)
        </div>
      </div>

      {status && (
        <div className="status-section">
          <h3>Stream Status</h3>
          <p>Progress: {status.progress.toFixed(2)}%</p>
          <p>Download Rate: {(status.download_rate / 1024).toFixed(2)} KB/s</p>
          <p>Upload Rate: {(status.upload_rate / 1024).toFixed(2)} KB/s</p>
          <p>Peers: {status.num_peers}</p>
        </div>
      )}

      <div className="video-section">
        <video
          ref={videoRef}
          controls
          className="video-player"
        />
      </div>

      {sessionId && (
        <button onClick={downloadTorrent} className="download-button">
          Download Torrent File
        </button>
      )}
    </div>
  )
}

export default App
