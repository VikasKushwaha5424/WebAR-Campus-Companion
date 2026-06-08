import { useState } from 'react';

export default function ChatInput({ onSendText, isThinking }) {
  const [text, setText] = useState('');

  const handleSend = () => {
    if (!text.trim() || isThinking) return;
    onSendText(text);
    setText('');
  };

  return (
    <>
      <input
        type="text"
        value={text}
        onChange={(e) => setText(e.target.value)}
        onKeyDown={(e) => { if (e.key === 'Enter') handleSend(); }}
        placeholder="Type a message or hold Space to speak..."
        disabled={isThinking}
      />
      <button onClick={handleSend} disabled={isThinking || !text.trim()}>
        Send
      </button>
    </>
  );
}
