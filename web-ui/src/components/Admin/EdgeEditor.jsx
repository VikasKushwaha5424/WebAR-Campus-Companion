import { useState, useEffect } from 'react';
import { API_BASE } from '../../data/config';

export default function EdgeEditor() {
  const [edges, setEdges] = useState([]);
  const [nodes, setNodes] = useState([]);
  const [form, setForm] = useState({ source: '', target: '', distance: 10, isStairs: false, requiresKeycard: false, hasRamp: true, hasElevator: false });
  const [msg, setMsg] = useState('');

  useEffect(() => { fetchEdges(); fetchNodes(); }, []);

  const fetchEdges = async () => {
    try { setEdges(await (await fetch(`${API_BASE}/admin/edges`)).json()); } catch {}
  };
  const fetchNodes = async () => {
    try { setNodes(await (await fetch(`${API_BASE}/admin/nodes`)).json()); } catch {}
  };

  const save = async () => {
    try {
      const res = await fetch(`${API_BASE}/admin/edges`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...form, distance: parseFloat(form.distance) }),
      });
      const data = await res.json();
      if (data.ok) {
        setMsg('Added!');
        setForm({ source: '', target: '', distance: 10, isStairs: false, requiresKeycard: false, hasRamp: true, hasElevator: false });
        fetchEdges();
      }
    } catch (e) { setMsg('Error: ' + e.message); }
  };

  const del = async (s, t) => {
    if (!confirm(`Delete edge ${s} → ${t}?`)) return;
    try {
      await fetch(`${API_BASE}/admin/edges?source=${s}&target=${t}`, { method: 'DELETE' });
      fetchEdges();
    } catch {}
  };

  const sel = { marginBottom: 8, padding: '6px 10px', background: '#2a2a2a', border: '1px solid #444', borderRadius: 4, color: '#fff', fontSize: 13, width: '100%', boxSizing: 'border-box' };

  return (
    <div>
      <h2 style={{ margin: '0 0 12px', fontSize: 16, color: '#aaa' }}>Add Edge</h2>
      <select value={form.source} onChange={(e) => setForm({ ...form, source: e.target.value })} style={sel}>
        <option value="">Select source</option>
        {nodes.map((n) => <option key={n.id} value={n.id}>{n.id} — {n.label}</option>)}
      </select>
      <select value={form.target} onChange={(e) => setForm({ ...form, target: e.target.value })} style={sel}>
        <option value="">Select target</option>
        {nodes.map((n) => <option key={n.id} value={n.id}>{n.id} — {n.label}</option>)}
      </select>
      <input placeholder="Distance (meters)" value={form.distance} onChange={(e) => setForm({ ...form, distance: e.target.value })} style={sel} />
      <div style={{ display: 'flex', gap: 16, marginBottom: 8 }}>
        <label style={{ fontSize: 12, color: '#aaa' }}><input type="checkbox" checked={form.isStairs} onChange={(e) => setForm({ ...form, isStairs: e.target.checked })} /> Stairs</label>
        <label style={{ fontSize: 12, color: '#aaa' }}><input type="checkbox" checked={form.requiresKeycard} onChange={(e) => setForm({ ...form, requiresKeycard: e.target.checked })} /> Keycard</label>
        <label style={{ fontSize: 12, color: '#aaa' }}><input type="checkbox" checked={form.hasRamp} onChange={(e) => setForm({ ...form, hasRamp: e.target.checked })} /> Ramp</label>
        <label style={{ fontSize: 12, color: '#aaa' }}><input type="checkbox" checked={form.hasElevator} onChange={(e) => setForm({ ...form, hasElevator: e.target.checked })} /> Elevator</label>
      </div>
      <button onClick={save} style={{ padding: '8px 20px', background: '#4CAF50', border: 'none', borderRadius: 4, color: '#fff', cursor: 'pointer' }}>Add Edge</button>
      {msg && <p style={{ color: '#4CAF50', fontSize: 12 }}>{msg}</p>}

      <h3 style={{ margin: '20px 0 8px', fontSize: 14, color: '#aaa' }}>Existing Edges ({edges.length})</h3>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
        {edges.map((e, i) => (
          <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '6px 10px', background: '#1a1a1a', borderRadius: 4, fontSize: 13 }}>
            <span><strong>{e.source}</strong> → <strong>{e.target}</strong> ({e.distance}m{ e.isStairs ? ' ⚠️Stairs' : '' })</span>
            <button onClick={() => del(e.source, e.target)} style={{ padding: '2px 8px', background: '#f44336', border: 'none', borderRadius: 3, color: '#fff', cursor: 'pointer', fontSize: 11 }}>Del</button>
          </div>
        ))}
      </div>
    </div>
  );
}
