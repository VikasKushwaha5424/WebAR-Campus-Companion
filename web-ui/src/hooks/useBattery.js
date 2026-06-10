import { useState, useEffect } from 'react';

export default function useBattery() {
  const [level, setLevel] = useState(1);
  const [charging, setCharging] = useState(true);
  const [supported, setSupported] = useState(false);

  useEffect(() => {
    if (!navigator.getBattery) {
      setSupported(false);
      return;
    }

    let battery = null;

    const update = (b) => {
      setLevel(b.level);
      setCharging(b.charging);
      setSupported(true);
    };

    navigator.getBattery().then((b) => {
      battery = b;
      update(b);
      b.addEventListener('levelchange', () => update(b));
      b.addEventListener('chargingchange', () => update(b));
    });

    return () => {
      if (battery) {
        battery.removeEventListener('levelchange', () => update(battery));
        battery.removeEventListener('chargingchange', () => update(battery));
      }
    };
  }, []);

  return { level, charging, isLow: level < 0.2 && !charging, supported };
}
