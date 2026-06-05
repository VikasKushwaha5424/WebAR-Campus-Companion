import { useEffect, useRef } from 'react';
import MayaCharacter from './MayaCharacter';

export default function ARScene({ onCharacterClick, isSpeaking }) {
  const sceneRef = useRef(null);

  useEffect(() => {
    const scene = sceneRef.current;
    if (!scene) return;

    const handleClick = (e) => {
      if (e.target.closest('#maya-desktop')) {
        onCharacterClick?.();
      }
    };

    scene.addEventListener('click', handleClick);
    scene.addEventListener('touchstart', handleClick);

    return () => {
      scene.removeEventListener('click', handleClick);
      scene.removeEventListener('touchstart', handleClick);
    };
  }, [onCharacterClick]);

  return (
    <a-scene
      ref={sceneRef}
      embedded
      vr-mode-ui="enabled: false"
      ar-mode-ui="enabled: false"
      style={{
        position: 'fixed', top: 0, left: 0,
        width: '100%', height: '100%', zIndex: 0,
      }}
    >
      <a-entity
        environment="preset: forest; dressingAmount: 3; groundColor: #5a7a3a; grid: none"
      />

      <a-circle
        position="0 -0.01 0" radius="8"
        rotation="-90 0 0" color="#6B8E23"
        shadow="receive: true"
      />

      <MayaCharacter
        id="maya-desktop"
        position="0 0 -4"
        color="maya"
        name="Maya"
        isSpeaking={isSpeaking}
      />

      <a-light type="ambient" color="#889" intensity="0.6" />
      <a-light
        type="directional" intensity="0.8"
        position="5 8 -3" cast-shadow="true"
      />

      <a-camera
        position="0 1.6 2"
        look-controls="enabled: true"
        wasd-controls="enabled: true"
      />
    </a-scene>
  );
}
