import { useState, useEffect, useRef } from 'react';

export default function ChatOverlay({
  activeNpc, npcDetails, chatHistory,
  isThinking, isPlaying, location, children,
}) {
  const messages = chatHistory.filter((m) => m.npc === activeNpc);
  const [streamed, setStreamed] = useState({});
  const timers = useRef([]);
  const lastAi = messages.filter((m) => m.sender === 'ai').at(-1);

  useEffect(() => {
    timers.current.forEach(clearTimeout);
    timers.current = [];

    if (!lastAi || !isPlaying) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      if (lastAi) setStreamed((p) => ({ ...p, [lastAi.text]: lastAi.text }));
      return;
    }

    const words = lastAi.text.split(' ');
    let i = 0;

    setStreamed((p) => ({ ...p, [lastAi.text]: '' }));

    const next = () => {
      if (i <= words.length) {
        setStreamed((p) => ({ ...p, [lastAi.text]: words.slice(0, i).join(' ') }));
        i++;
        if (i <= words.length) {
          const delay = words[i - 1]?.length > 7 ? 80 : 40;
          timers.current.push(setTimeout(next, delay));
        }
      }
    };

    next();

    return () => timers.current.forEach(clearTimeout);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [lastAi?.text, isPlaying]);

  const activeName = npcDetails[activeNpc]?.name || activeNpc;
  const activeColor = npcDetails[activeNpc]?.color || '#4CAF50';

  return (
    <div className="chat-overlay">
      {location && (
        <div className="location-badge">
          📍 {location.replace('_', ' ').replace(/\b\w/g, (c) => c.toUpperCase())}
        </div>
      )}

      <div className="chat-overlay-messages">
        <div className="messages-container" role="log" aria-label="Chat messages">
          {messages.length === 0 && !isThinking && (
            <div className="empty-state">
              System ready. Awaiting input for {activeName}...
            </div>
          )}

          {messages.map((msg, idx, arr) => {
            const isLastAi = msg.sender === 'ai' && idx === arr.length - 1;
            const display = isLastAi && streamed[msg.text] !== undefined
              ? streamed[msg.text] : msg.text;

            return (
              <div key={msg.id ?? idx} className={`message-bubble ${msg.sender}`}>
                <strong>
                  {msg.sender === 'user' ? 'You' : activeName}
                </strong>
                <span>{display}</span>
                {isLastAi && isPlaying && (
                  <span className="equalizer" style={{ '--eq-color': activeColor }} aria-hidden="true">
                    <span className="equalizer-bar" />
                    <span className="equalizer-bar" />
                    <span className="equalizer-bar" />
                  </span>
                )}
              </div>
            );
          })}

          {isThinking && (
            <div className="message-bubble ai thinking" role="status" aria-label="Processing response">
              Processing neural response...
            </div>
          )}
        </div>
      </div>

      <div className="chat-overlay-controls">{children}</div>
    </div>
  );
}
