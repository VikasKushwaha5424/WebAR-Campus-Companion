import { useEffect, useRef, useState } from 'react';
import MayaCharacter from './MayaCharacter';
import NavigationArrow from './NavigationArrow';
import ARTrail from './ARTrail';
import { CAMPUS_LOCATIONS } from '../data/config';
import { AR_TARGETS } from '../data/targets';
import { calculateBearing } from '../utils/navigation';

const TARGETS_URL = `${import.meta.env.BASE_URL}targets/campus-targets.mind`;

export default function MindARScene({ onTargetDetected, onTargetLost, isSpeaking, onReady, destination, location, trailPoints }) {
  const sceneRef = useRef(null);
  const [arReady, setArReady] = useState(false);
  const [error, setError] = useState(null);

  const getLocData = (id) => CAMPUS_LOCATIONS.find((l) => l.id === id);
  const originData = getLocData(location);
  const destData = getLocData(destination);
  const arrowBearing = originData && destData
    ? calculateBearing(originData.lat, originData.lng, destData.lat, destData.lng) - (originData.posterHeading || 0)
    : 0;

  useEffect(() => {
    const scene = sceneRef.current;
    if (!scene) return;

    const handleTargetFound = (e) => {
      const el = e.target.closest('[mindar-image-target]');
      if (!el) return;
      const raw = el.getAttribute('mindar-image-target') || '';
      const match = raw.match(/targetIndex:\s*(\d+)/);
      if (!match) return;
      const idx = parseInt(match[1]);
      const loc = AR_TARGETS.find((t) => t.index === idx);
      if (loc) onTargetDetected?.(loc.id);
    };

    const handleTargetLost = () => onTargetLost?.();

    const attach = () => {
      const targets = scene.querySelectorAll('[mindar-image-target]');
      targets.forEach((el) => {
        el.addEventListener('targetFound', handleTargetFound);
        el.addEventListener('targetLost', handleTargetLost);
      });
      return targets;
    };

    const t1 = setTimeout(() => {
      const targets = attach();
      if (targets.length > 0) {
        setArReady(true);
        onReady?.();
      } else {
        const t2 = setTimeout(() => {
          const retry = attach();
          if (retry.length > 0) {
            setArReady(true);
            onReady?.();
          } else {
            setError('AR targets not found. MindAR may not have loaded.');
          }
        }, 3000);
        return () => clearTimeout(t2);
      }
    }, 1500);

    return () => {
      clearTimeout(t1);
      const targets = scene?.querySelectorAll('[mindar-image-target]');
      targets?.forEach((el) => {
        el.removeEventListener('targetFound', handleTargetFound);
        el.removeEventListener('targetLost', handleTargetLost);
      });
    };
  }, []);

  return (
    <>
      {!arReady && !error && (
        <div className="ar-loading-overlay">
          <div className="loading-spinner" />
          <p>{error || 'Starting AR Camera...'}</p>
        </div>
      )}
      {error && (
        <div className="ar-loading-overlay">
          <p style={{ color: '#f44336', fontSize: 14 }}>{error}</p>
          <p style={{ color: '#888', fontSize: 12, marginTop: 8 }}>
            Make sure campus-targets.mind is in <code>public/targets/</code>
          </p>
          <p style={{ color: '#888', fontSize: 11, marginTop: 4 }}>
            See <code>public/targets/COMPILE.md</code> to generate it from the SVG posters
          </p>
          <p style={{ color: '#555', fontSize: 11, marginTop: 12 }}>
            Tip: Use the ARScene (desktop mode) to test without MindAR targets
          </p>
        </div>
      )}
      <a-scene
        ref={sceneRef}
        mindar-image={`imageTargetSrc: ${TARGETS_URL}; showStats: false; autoStart: true;`}
        embedded
        vr-mode-ui="enabled: false"
        renderer="colorManagement: true;"
        style={{
          position: 'fixed', top: 0, left: 0,
          width: '100%', height: '100%', zIndex: 0,
        }}
      >
        <a-camera position="0 0 0" look-controls="enabled: false" far="100" />

        {AR_TARGETS.map((loc) => (
          <a-entity
            key={loc.index}
            mindar-image-target={`targetIndex: ${loc.index}`}
          >
            <MayaCharacter
              id={`mindar-${loc.id}`}
              position="0 0 0"
              scale="0.7 0.7 0.7"
              color="maya"
              name="Maya"
              isSpeaking={isSpeaking}
              showLabel={false}
              bobAnimation={false}
              disableShadows
            />
            {location === loc.id && destination && (
              <NavigationArrow
                rotationY={arrowBearing}
                visible={true}
                color="#FF8C00"
              />
            )}
            {location === loc.id && originData && (
              <ARTrail
                points={trailPoints}
                originLat={originData.lat}
                originLng={originData.lng}
                originHeading={originData.posterHeading || 0}
                maxRadius={30}
              />
            )}
          </a-entity>
        ))}
      </a-scene>
    </>
  );
}
