import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import axios from 'axios';
import ChatOverlay from './components/ChatOverlay';
import ChatInput from './components/ChatInput';
import HoldToTalk from './components/HoldToTalk';
import CampusMap from './components/CampusMap';
import FloorPlanView from './components/FloorPlanView';
import SettingsPanel from './components/SettingsPanel';
import RoutePreview from './components/RoutePreview';
import ETAOverlay from './components/ETAOverlay';
import ClassStatus from './components/ClassStatus';
import useTimetable from './hooks/useTimetable';
import useGeolocation from './hooks/useGeolocation';
import useRouteRecalculation from './hooks/useRouteRecalculation';
import { API_BASE, CAMPUS_LOCATIONS, CAMPUS_POI } from './data/config';
import { hasFloorPlan } from './data/floorplans';
import './App.css';

function App() {
  const [chatHistory, setChatHistory] = useState([]);
  const [isThinking, setIsThinking] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);

  const [location, setLocation] = useState('');
  const [destination, setDestination] = useState(null);
  const [mapVisible, setMapVisible] = useState(false);
  const [showFloorPlan, setShowFloorPlan] = useState(false);

  const [currentRoute, setCurrentRoute] = useState(null);
  const [routeStatus, setRouteStatus] = useState('idle');
  const [routeDistance, setRouteDistance] = useState(0);
  const [routeSteps, setRouteSteps] = useState([]);
  const [showRoutePreview, setShowRoutePreview] = useState(false);
  const [routeFilters, setRouteFilters] = useState({ noStairs: false, wheelchair: false, noKeycard: false });
  const [settingsVisible, setSettingsVisible] = useState(false);

  const gpsLocatedRef = useRef(false);
  const recoveredRef = useRef(false);

  const timetable = useTimetable();
  const { currentClass, nextClass, minsToNext, autoDestination } = timetable;
  const { latitude, longitude, permissionDenied } = useGeolocation();
  const currentCoords = useMemo(() => ({ latitude, longitude }), [latitude, longitude]);

  const sessionIdRef = useRef(null);

  const requestRoute = useCallback(async (fromNode, toNode) => {
    try {
      const res = await axios.post(`${API_BASE}/api/route`, {
        from_node: fromNode, to_node: toNode,
        from_lat: latitude, from_lng: longitude,
      }, { timeout: 10000 });
      const data = res.data;
      if (data.path?.length >= 2) {
        setCurrentRoute(data.path);
        setRouteDistance(data.distance || 0);
        setRouteSteps(data.steps || []);
        setRouteStatus('preview');
        setShowRoutePreview(true);
        setMapVisible(true);
        return data;
      }
    } catch (err) {
      console.error('Route fetch failed:', err);
    }
    return null;
  }, [latitude, longitude]);

  useEffect(() => {
    const init = async () => {
      try {
        const res = await axios.get(`${API_BASE}/init-session`, { timeout: 5000 });
        sessionIdRef.current = res.data.session_id;
      } catch {
        sessionIdRef.current = 'fallback_' + Date.now();
      }
    };
    init();
  }, []);

  useEffect(() => {
    if (latitude === null || longitude === null || gpsLocatedRef.current) return;
    gpsLocatedRef.current = true;
    (async () => {
      try {
        const res = await axios.post(`${API_BASE}/api/nearest`, { lat: latitude, lng: longitude }, { timeout: 5000 });
        const data = res.data;
        if (data.poi_name) {
          setLocation(data.node_id);
        }
      } catch {
        // GPS auto-detect failed; user can select manually
      }
    })();
  }, [latitude, longitude]);

  useEffect(() => {
    if (recoveredRef.current) return;
    recoveredRef.current = true;
    try {
      const saved = localStorage.getItem('maya_nav_state');
      if (saved) {
        const state = JSON.parse(saved);
        const age = Date.now() - state.timestamp;
        if (age < 30 * 60 * 1000 && state.routeStatus === 'active' && state.currentRoute) {
          /* eslint-disable react-hooks/set-state-in-effect */
          setDestination(state.destination);
          setCurrentRoute(state.currentRoute);
          setRouteDistance(state.routeDistance);
          setRouteSteps(state.routeSteps);
          setRouteStatus('active');
          setMapVisible(true);
          /* eslint-enable react-hooks/set-state-in-effect */
        } else {
          localStorage.removeItem('maya_nav_state');
        }
      }
    } catch {
      // Corrupted localStorage entry; ignore
    }
  }, []);

  useEffect(() => {
    if (!autoDestination || routeStatus !== 'idle') return;
    setDestination(autoDestination);
    setMapVisible(true);
    requestRoute(location || '', autoDestination);
  }, [autoDestination, location, routeStatus, requestRoute]);

  const handleSendText = useCallback(async (text) => {
    if (!text?.trim()) return;

    if ('speechSynthesis' in window) {
      const unlock = new SpeechSynthesisUtterance('');
      unlock.volume = 0;
      window.speechSynthesis.speak(unlock);
    }
    const userMsg = { id: Date.now(), sender: 'user', text, npc: 'maya' };
    setChatHistory((prev) => [...prev, userMsg]);
    setIsThinking(true);

    try {
      const res = await axios.post(`${API_BASE}/generate`, {
        text,
        session_id: sessionIdRef.current || 'default',
        location: location || '',
        user_lat: latitude,
        user_lng: longitude,
      }, { timeout: 15000 });

      const data = typeof res.data === 'string' ? JSON.parse(res.data) : res.data;
      const reply = data.text_response || data.text || '';

      setChatHistory((prev) => [...prev, { id: Date.now() + 1, sender: 'ai', text: reply, npc: 'maya' }]);

      if (reply && 'speechSynthesis' in window) {
        window.speechSynthesis.cancel();
        const utterance = new SpeechSynthesisUtterance(reply);
        utterance.rate = 1.0;
        utterance.onstart = () => setIsPlaying(true);
        utterance.onend = () => setIsPlaying(false);
        window.speechSynthesis.speak(utterance);
      }

      if (data.route?.coordinates?.length >= 2) {
        const pathData = data.route.coordinates.map((c, i) => ({
          lat: c[0], lng: c[1],
          label: data.route.steps?.[i] || `Step ${i + 1}`,
          id: `wp_${i}`,
        }));
        setCurrentRoute(pathData);
        setRouteDistance(data.route.distance || 0);
        setRouteSteps(data.route.steps || []);
        setRouteStatus('preview');
        setMapVisible(true);
      }

      setIsThinking(false);
    } catch (err) {
      setIsThinking(false);
      const errMsg = err.response?.status === 429
        ? 'AI Quota Exhausted. Using offline mode.'
        : 'Connection error. Is the backend running?';
      setChatHistory((prev) => [...prev, { id: Date.now(), sender: 'ai', text: errMsg, npc: 'maya' }]);
    }
  }, [location, latitude, longitude]);

  const handleVoiceResult = useCallback(async (result) => {
    if (typeof result === 'string') {
      handleSendText(result);
      return;
    }
    try {
      const fd = new FormData();
      fd.append('file', result, 'recording.webm');
      const res = await axios.post(`${API_BASE}/transcribe`, fd, { timeout: 15000 });
      const transcript = res.data.transcript;
      if (transcript && transcript !== '[Error transcribing audio]') {
        handleSendText(transcript);
      }
    } catch (err) {
      console.error('Transcribe error:', err);
    }
  }, [handleSendText]);

  const handleStartNavigation = useCallback(() => {
    setRouteStatus('active');
    setShowRoutePreview(false);
    const state = { destination, currentRoute, routeDistance, routeSteps, routeStatus: 'active', timestamp: Date.now() };
    try { localStorage.setItem('maya_nav_state', JSON.stringify(state)); } catch { /* localStorage unavailable */ }
  }, [destination, currentRoute, routeDistance, routeSteps]);

  const handleCancelRoute = useCallback(() => {
    setCurrentRoute(null);
    setRouteDistance(0);
    setRouteSteps([]);
    setRouteStatus('idle');
    setShowRoutePreview(false);
    setDestination(null);
    try { localStorage.removeItem('maya_nav_state'); } catch { /* localStorage unavailable */ }
  }, []);

  const handleClassNavigate = useCallback((locId) => {
    setDestination(locId);
    setMapVisible(true);
    requestRoute(location || '', locId);
  }, [location, requestRoute]);

  const handleRecalculate = useCallback(async (dist) => {
    if (!destination) return;
    const msg = {
      id: Date.now(),
      sender: 'ai',
      text: `You've wandered ${Math.round(dist)}m off the route. I've recalculated directions from your current position.`,
      npc: 'maya',
    };
    setChatHistory((prev) => [...prev, msg]);
    const result = await requestRoute(location || '', destination);
    if (result) {
      setRouteStatus('active');
      setShowRoutePreview(false);
      const state = { destination, currentRoute: result.path, routeDistance: result.distance, routeSteps: result.steps, routeStatus: 'active', timestamp: Date.now() };
      try { localStorage.setItem('maya_nav_state', JSON.stringify(state)); } catch { /* localStorage unavailable */ }
    }
  }, [location, destination, requestRoute]);

  useRouteRecalculation({
    currentRoute,
    currentCoords,
    routeStatus,
    onRecalculate: handleRecalculate,
  });

  useEffect(() => {
    if (routeStatus === 'active' && destination && currentRoute) {
      const state = { destination, currentRoute, routeDistance, routeSteps, routeStatus, timestamp: Date.now() };
      try { localStorage.setItem('maya_nav_state', JSON.stringify(state)); } catch { /* localStorage unavailable */ }
    }
  }, [routeStatus, destination, currentRoute, routeDistance, routeSteps]);

  return (
    <div className="app-container">
      {permissionDenied && (
        <div className="gps-permission-banner">
          <span>📍 Location access denied.</span>
          <span>Please select your starting point from the dropdown.</span>
        </div>
      )}

      <div className="top-bar">
        <select
          className="location-select"
          value={location}
          onChange={(e) => setLocation(e.target.value)}
        >
          {CAMPUS_LOCATIONS.map((loc) => (
            <option key={loc.id} value={loc.id}>{loc.name}</option>
          ))}
        </select>

        {routeStatus !== 'idle' && (
          <button className="stop-nav-btn" onClick={handleCancelRoute}>✕ Nav</button>
        )}

        <button
          className="map-toggle"
          onClick={() => setMapVisible((v) => !v)}
          title="Toggle campus map"
        >🗺️</button>

        {hasFloorPlan(location) && (
          <button
            className={`floorplan-toggle ${showFloorPlan ? 'active' : ''}`}
            onClick={() => setShowFloorPlan((v) => !v)}
            title="Show floor plan"
          >🏛️</button>
        )}

        <button
          className="settings-toggle"
          onClick={() => setSettingsVisible((v) => !v)}
          title="Route preferences"
        >♿</button>
      </div>

      <CampusMap
        currentId={location}
        destinationId={destination}
        locations={CAMPUS_LOCATIONS}
        pois={CAMPUS_POI}
        visible={mapVisible}
        onClose={() => setMapVisible(false)}
        currentRoute={currentRoute}
        currentCoords={currentCoords}
      />

      <FloorPlanView
        locationId={location}
        visible={showFloorPlan}
        onClose={() => setShowFloorPlan(false)}
      />

      {routeStatus === 'active' && currentRoute && (
        <ETAOverlay visible currentRoute={currentRoute} />
      )}

      <ChatOverlay
        activeNpc="maya"
        npcDetails={{ maya: { name: 'Maya (Campus Guide)', color: '#4CAF50' } }}
        chatHistory={chatHistory}
        isThinking={isThinking}
        isPlaying={isPlaying}
        location={location}
      >
        <div className="input-row">
          <ChatInput onSendText={handleSendText} isThinking={isThinking} />
        </div>
        <HoldToTalk onVoiceResult={handleVoiceResult} />
      </ChatOverlay>

      {currentClass && (
        <ClassStatus
          currentClass={currentClass}
          nextClass={nextClass}
          minsToNext={minsToNext}
          onNavigate={handleClassNavigate}
          onDismiss={() => {}}
        />
      )}

      {showRoutePreview && currentRoute && (
        <RoutePreview
          currentRoute={currentRoute}
          totalDistance={routeDistance}
          steps={routeSteps}
          onStart={handleStartNavigation}
          onCancel={handleCancelRoute}
        />
      )}

      {settingsVisible && (
        <SettingsPanel
          filters={routeFilters}
          onToggle={(key) => setRouteFilters((prev) => ({ ...prev, [key]: !prev[key] }))}
          onClose={() => setSettingsVisible(false)}
        />
      )}
    </div>
  );
}

export default App;
