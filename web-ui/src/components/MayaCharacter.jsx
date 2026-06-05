const CHARACTER_COLORS = {
  maya: '#4CAF50',
  professor: '#2196F3',
  silas: '#f44336',
};

export default function MayaCharacter({
  position = '0 0 -4',
  scale = '1 1 1',
  color = 'maya',
  name = 'Maya',
  isSpeaking = false,
  showLabel = true,
  bobAnimation = true,
  id = 'character-root',
}) {
  const hexColor = CHARACTER_COLORS[color] || color;

  return (
    <a-entity
      id={id}
      position={position}
      scale={scale}
      animation={
        bobAnimation
          ? `property: position; to: 0 0.08 -4; dur: 2500; dir: alternate; loop: true; easing: easeInOutSine`
          : undefined
      }
    >
      <a-box
        position="0 0.6 0"
        width="0.6"
        height="0.8"
        depth="0.35"
        color={hexColor}
        shadow="cast: true"
      />

      <a-sphere
        position="0 1.35 0"
        radius="0.28"
        color="#FFCC80"
        shadow="cast: true"
      />

      <a-sphere position="-0.1 1.45 0.24" radius="0.04" color="#333" />
      <a-sphere position="0.1 1.45 0.24" radius="0.04" color="#333" />

      <a-torus
        position="0 1.28 0.24"
        radius="0.06"
        radius-tubular="0.015"
        color="#E57373"
        rotation="-10 0 0"
        segments-tubular="16"
        segments-radial="8"
      />

      <a-cylinder
        position="-0.45 0.7 0"
        radius="0.04"
        height="0.5"
        color={hexColor}
        rotation="0 0 20"
      />
      <a-cylinder
        position="0.45 0.7 0"
        radius="0.04"
        height="0.5"
        color={hexColor}
        rotation="0 0 -20"
      />

      {showLabel && (
        <a-text
          value={name}
          position="0 1.8 0"
          align="center"
          color="#FFF"
          width="2"
        />
      )}

      {isSpeaking && (
        <a-ring
          position="0 0.05 0"
          radius-inner="1.2"
          radius-outer="1.5"
          color={hexColor}
          rotation="-90 0 0"
          animation="property: material.opacity; to: 0.3; dur: 800; dir: alternate; loop: true"
        />
      )}
    </a-entity>
  );
}
