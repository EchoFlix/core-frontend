import { useState, useRef, useEffect } from 'react'
import './App.css'

interface TorrentStatus {
  progress: number;
  download_rate: number;
  upload_rate: number;
  num_peers: number;
}

function App() {
  const [file, setFile] = useState<File | null>(null);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [status, setStatus] = useState<TorrentStatus | null>(null);
  const [isBuffering, setIsBuffering] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const statusInterval = useRef<number>();

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setFile(file);
    const formData = new FormData();
    formData.append('file', file);

    try {
      const response = await fetch('http://localhost:8000/upload', {
        method: 'POST',
        body: formData,
        credentials: 'include',
        headers: {
          'Accept': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      setSessionId(data.session_id);
      startStatusPolling(data.session_id);
    } catch (error) {
      console.error('Upload failed:', error);
      alert('Failed to upload file. Please make sure the backend server is running at http://localhost:8000');
    }
  };

  const startStatusPolling = (sid: string) => {
    if (statusInterval.current) {
      clearInterval(statusInterval.current);
    }

    statusInterval.current = window.setInterval(async () => {
      try {
        const response = await fetch(`http://localhost:8000/status/${sid}`, {
          credentials: 'include',
          headers: {
            'Accept': 'application/json',
          },
        });

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();
        setStatus(data);
        
        if (data.progress >= 10 && isBuffering) {
          setIsBuffering(false);
          if (videoRef.current) {
            videoRef.current.src = `http://localhost:8000/stream/${sid}`;
          }
        }
      } catch (error) {
        console.error('Status check failed:', error);
      }
    }, 1000);
  };

  const downloadTorrent = async () => {
    if (!sessionId) return;
    window.location.href = `http://localhost:8000/download/${sessionId}`;
  };

  useEffect(() => {
    return () => {
      if (statusInterval.current) {
        clearInterval(statusInterval.current);
      }
    };
  }, []);

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
          style={{ display: isBuffering ? 'none' : 'block' }}
        />
        {isBuffering && (
          <div className="buffering">
            <p>Buffering... {status?.progress.toFixed(2)}%</p>
          </div>
        )}
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
