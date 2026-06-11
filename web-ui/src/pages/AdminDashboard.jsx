import { useState } from 'react';
import NodeEditor from '../components/Admin/NodeEditor';
import EdgeEditor from '../components/Admin/EdgeEditor';
import POIEditor from '../components/Admin/POIEditor';

const TABS = [
  { id: 'nodes', label: 'Nodes' },
  { id: 'edges', label: 'Edges' },
  { id: 'pois', label: 'POIs' },
];

export default function AdminDashboard() {
  const [tab, setTab] = useState('nodes');

  return (
    <div className="admin-dashboard" style={{
      height: '100vh', background: '#0a0a0a', color: '#fff',
      display: 'flex', flexDirection: 'column', fontFamily: 'Segoe UI, sans-serif',
    }}>
      <div style={{
        padding: '12px 16px', background: '#1a1a1a', borderBottom: '1px solid #333',
        display: 'flex', alignItems: 'center', gap: 12,
      }}>
        <h1 style={{ margin: 0, fontSize: 18, color: '#4CAF50' }}>🗺️ Campus Admin</h1>
        <a href="/" style={{ marginLeft: 'auto', color: '#888', textDecoration: 'none', fontSize: 13 }}>
          ← Back to Map
        </a>
      </div>

      <div style={{ display: 'flex', borderBottom: '1px solid #333' }}>
        {TABS.map((t) => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            style={{
              flex: 1, padding: '10px', border: 'none', cursor: 'pointer',
              background: tab === t.id ? '#2a2a2a' : 'transparent',
              color: tab === t.id ? '#4CAF50' : '#888',
              fontWeight: tab === t.id ? 600 : 400,
              fontSize: 14, borderBottom: tab === t.id ? '2px solid #4CAF50' : '2px solid transparent',
            }}
          >{t.label}</button>
        ))}
      </div>

      <div style={{ flex: 1, overflow: 'auto', padding: 16 }}>
        {tab === 'nodes' && <NodeEditor />}
        {tab === 'edges' && <EdgeEditor />}
        {tab === 'pois' && <POIEditor />}
      </div>
    </div>
  );
}
