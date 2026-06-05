import { useState, useEffect, useRef, useCallback } from 'react';
import axios from 'axios';
import { useTelemetry } from './hooks/useTelemetry';
import TelemetryHUD from './components/TelemetryHUD';
import ARScene from './components/ARScene';
import MindARScene from './components/MindARScene';
import WebXRScene from './components/WebXRScene';
import ChatOverlay from './components/ChatOverlay';
import HoldToTalk from './components/HoldToTalk';
import DesktopControls from './components/DesktopControls';
import { API_BASE, NPC_LIST, CAMPUS_LOCATIONS } from './data/config';
import './App.css';

function App() {
  const [activeNpc, setActiveNpc] = useState('maya');
  const [inputText, setInputText] = useState('');
  const [chatHistory, setChatHistory] = useState([]);
  const [isThinking, setIsThinking] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [location, setLocation] = useState('');
  const [renderMode, setRenderMode] = useState('loading');
  const [showDebug, setShowDebug] = useState(false);

  const telemetry = useTelemetry();
  const recognitionRef = useRef(null);
  const audioPlayerRef = useRef(new Audio());

  const isDesktop = renderMode === 'desktop';

  useEffect(() => {
    async function detectCapabilities() {
      setRenderMode('loading');
      const hasCamera = !!navigator.mediaDevices?.getUserMedia;
      let webxr = false;
      try {
        webxr = navigator.xr
          ? await navigator.xr.isSessionSupported('immersive-ar')
          : false;
      } catch { webxr = false; }

      if (webxr) setRenderMode('webxr');
      else if (hasCamera && /Mobi|Android|iPhone/i.test(navigator.userAgent))
        setRenderMode('mobile-ar');
      else
        setRenderMode('desktop');
    }
    detectCapabilities();
  }, []);

  const handleSendText = useCallback(
    async (text) => {
      if (!text?.trim()) return;

      const userMsg = { sender: 'user', text, npc: activeNpc };
      setChatHistory((prev) => [...prev, userMsg]);
      setIsThinking(true);
      setInputText('');
      telemetry.setStatus({ state: 'PROCESSING', color: '🔵', text: 'AI Processing...' });

      const startTime = Date.now();

      try {
        const res = await axios.post(
          `${API_BASE}/generate`,
          {
            text,
            npc_id: activeNpc,
            location,
            world_state: { environment: 'campus-ar', user_notes: '' },
            session_id: 'default_user',
          },
          { timeout: 10000, responseType: 'blob' }
        );

        telemetry.setStatus({ state: 'RECEIVING', color: '🟣', text: 'Stream Connected' });

        const blob = res.data;
        if (blob.size === 0) throw new Error('STREAM_EMPTY');

        const raw = res.headers['x-npc-response'] || '';
        const decoded = decodeURIComponent(raw);
        const aiMsg = { sender: 'ai', text: decoded || '[Audio Response]', npc: activeNpc };
        setChatHistory((prev) => [...prev, aiMsg]);

        const url = URL.createObjectURL(blob);
        const player = audioPlayerRef.current;
        player.src = url;

        player.onplay = () => {
          telemetry.updateLatency(Date.now() - startTime);
          telemetry.setStatus({ state: 'SPEAKING', color: '🟢', text: 'Speaker Active' });
          setIsThinking(false);
          setIsPlaying(true);
        };

        player.onended = () => {
          telemetry.setStatus({ state: 'IDLE', color: '🟢', text: 'Ready' });
          URL.revokeObjectURL(url);
          setIsPlaying(false);
        };

        player.play().catch(() => {
          telemetry.setStatus({ state: 'ERROR', color: '🟠', text: 'Playback Blocked' });
          setIsThinking(false);
          setIsPlaying(false);
        });
      } catch (error) {
        setIsThinking(false);
        setIsPlaying(false);
        telemetry.setStatus({ state: 'ERROR', color: '🔴', text: 'API Error' });
        const msg = error.response?.status === 429
          ? 'AI Quota Exhausted. Switching to Offline Mode.'
          : 'Connection error. Is the backend running?';
        setChatHistory((prev) => [...prev, { sender: 'ai', text: msg, npc: activeNpc }]);
      }
    },
    [activeNpc, location, telemetry]
  );

  useEffect(() => {
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SR) return;

    recognitionRef.current?.abort();

    const recognition = new SR();
    recognition.continuous = false;
    recognition.interimResults = false;
    recognition.lang = 'en-US';

    recognition.onstart = () => {
      setIsListening(true);
      telemetry.setStatus({ state: 'LISTENING', color: '🟡', text: 'Mic Active' });
    };

    recognition.onend = () => setIsListening(false);

    recognition.onresult = (e) => {
      const transcript = e.results[0][0].transcript;
      setInputText(transcript);
      handleSendText(transcript);
    };

    recognition.onerror = (e) => {
      telemetry.setStatus({ state: 'ERROR', color: '🔴', text: 'Mic Error' });
      setIsListening(false);
    };

    recognitionRef.current = recognition;

    return () => recognition.abort();
  }, [handleSendText, telemetry]);

  const toggleListen = useCallback(() => {
    const r = recognitionRef.current;
    if (!r) return;
    if (isListening) {
      r.stop();
      telemetry.setStatus({ state: 'IDLE', color: '🟢', text: 'Ready' });
    } else {
      telemetry.setStatus({ state: 'LISTENING', color: '🟡', text: 'Requesting Mic...' });
      r.start();
    }
  }, [isListening, telemetry]);

  const handleAudioBlob = useCallback(
    async (blob) => {
      telemetry.setStatus({ state: 'LISTENING', color: '🟡', text: 'Transcribing...' });
      try {
        const fd = new FormData();
        fd.append('file', blob, 'recording.webm');
        fd.append('location', location);

        const res = await axios.post(`${API_BASE}/transcribe`, fd, { timeout: 15000 });
        const transcript = res.data.transcript;
        if (transcript && transcript !== '[Error transcribing audio]') {
          handleSendText(transcript);
        }
      } catch (err) {
        telemetry.setStatus({ state: 'ERROR', color: '🔴', text: 'Transcribe Error' });
        setIsThinking(false);
      }
    },
    [location, handleSendText, telemetry]
  );

  if (renderMode === 'loading') {
    return (
      <div className="loading-screen">
        <div className="loading-spinner" />
        <p>Initializing Maya...</p>
      </div>
    );
  }

  return (
    <div className="app-container ar-mode">
      {renderMode === 'webxr' ? (
        <WebXRScene
          onCharacterClick={toggleListen}
          isSpeaking={isPlaying}
          onReady={() => telemetry.logEvent('INFO', 'XR', 'WebXR immersive AR active')}
        />
      ) : renderMode === 'mobile-ar' ? (
        <MindARScene
          onTargetDetected={(loc) => setLocation(loc)}
          onTargetLost={() => {}}
          isSpeaking={isPlaying}
          onReady={() => telemetry.logEvent('INFO', 'AR', 'MindAR initialized')}
        />
      ) : (
        <ARScene onCharacterClick={toggleListen} isSpeaking={isPlaying} />
      )}

      <ChatOverlay
        activeNpc={activeNpc}
        npcDetails={NPC_LIST}
        chatHistory={chatHistory}
        isThinking={isThinking}
        isPlaying={isPlaying}
        location={location}
      >
        {isDesktop ? (
          <>
            <div className="input-row">
              <button
                className={`mic-button ${isListening ? 'listening' : ''}`}
                onClick={toggleListen}
                disabled={isThinking}
                aria-label={isListening ? 'Stop listening' : 'Start voice input'}
              >
                {isListening ? '🔴' : '🎤'}
              </button>
              <input
                type="text"
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !isThinking) handleSendText(inputText);
                }}
                placeholder="Type a message or hold Space to speak..."
                disabled={isThinking}
              />
              <button
                onClick={() => handleSendText(inputText)}
                disabled={isThinking || !inputText.trim()}
              >
                Send
              </button>
            </div>
            <DesktopControls
              onRequestMic={toggleListen}
              isListening={isListening}
              isThinking={isThinking}
            />
          </>
        ) : (
          <HoldToTalk onAudioBlob={handleAudioBlob} location={location} />
        )}
      </ChatOverlay>

      <div className="ar-top-bar">
        <select
          className="npc-select"
          value={activeNpc}
          onChange={(e) => setActiveNpc(e.target.value)}
        >
          {Object.entries(NPC_LIST).map(([key, npc]) => (
            <option key={key} value={key}>{npc.name}</option>
          ))}
        </select>

        <select
          className="location-select"
          value={location}
          onChange={(e) => setLocation(e.target.value)}
        >
          {CAMPUS_LOCATIONS.map((loc) => (
            <option key={loc.id} value={loc.id}>{loc.name}</option>
          ))}
        </select>

        <button
          className="debug-toggle"
          onClick={() => setShowDebug((v) => !v)}
          title="Toggle debug panel"
        >
          🛠️
        </button>
      </div>

      {showDebug && (
        <div className="debug-panel">
          <TelemetryHUD
            status={telemetry.status}
            logs={telemetry.logs}
            metrics={telemetry.metrics}
          />
        </div>
      )}
    </div>
  );
}

export default App;
