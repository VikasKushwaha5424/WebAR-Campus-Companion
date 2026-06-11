import { useState, useEffect } from 'react';
import { API_BASE } from '../../data/config';

export default function POIEditor() {
  const [pois, setPois] = useState([]);
  const [nodes, setNodes] = useState([]);
  const [form, setForm] = useState({ name: '', aliases: '', node_id: '', category: 'academic', hours: '', description: '' });
  const [editName, setEditName] = useState(null);
  const [msg, setMsg] = useState('');

  useEffect(() => { fetchPois(); fetchNodes(); }, []);

  const fetchPois = async () => {
    try { setPois(await (await fetch(`${API_BASE}/admin/pois`)).json()); } catch {}
  };
  const fetchNodes = async () => {
    try { setNodes(await (await fetch(`${API_BASE}/admin/nodes`)).json()); } catch {}
  };

  const save = async () => {
    const body = {
      ...form,
      aliases: form.aliases.split(',').map((a) => a.trim()).filter(Boolean),
    };
    const url = editName ? `${API_BASE}/admin/pois/${encodeURIComponent(editName)}` : `${API_BASE}/admin/pois`;
    const method = editName ? 'PUT' : 'POST';
    try {
      const res = await fetch(url, { method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
      const data = await res.json();
      if (data.ok) {
        setMsg(editName ? 'Updated!' : 'Added!');
        setForm({ name: '', aliases: '', node_id: '', category: 'academic', hours: '', description: '' });
        setEditName(null);
        fetchPois();
      }
    } catch (e) { setMsg('Error: ' + e.message); }
  };

  const del = async (name) => {
    if (!confirm(`Delete POI "${name}"?`)) return;
    try {
      await fetch(`${API_BASE}/admin/pois/${encodeURIComponent(name)}`, { method: 'DELETE' });
      fetchPois();
    } catch {}
  };

  const edit = (p) => {
    setForm({ name: p.name, aliases: (p.aliases || []).join(', '), node_id: p.node_id, category: p.category || 'academic', hours: p.hours || '', description: p.description || '' });
    setEditName(p.name);
  };

  const st = { marginBottom: 8, padding: '6px 10px', background: '#2a2a2a', border: '1px solid #444', borderRadius: 4, color: '#fff', fontSize: 13, width: '100%', boxSizing: 'border-box' };

  return (
    <div>
      <h2 style={{ margin: '0 0 12px', fontSize: 16, color: '#aaa' }}>{editName ? `Edit: ${editName}` : 'Add POI'}</h2>
      <input placeholder="Name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} style={st} disabled={!!editName} />
      <input placeholder="Aliases (comma separated)" value={form.aliases} onChange={(e) => setForm({ ...form, aliases: e.target.value })} style={st} />
      <select value={form.node_id} onChange={(e) => setForm({ ...form, node_id: e.target.value })} style={st}>
        <option value="">Select node</option>
        {nodes.map((n) => <option key={n.id} value={n.id}>{n.id} — {n.label}</option>)}
      </select>
      <select value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })} style={st}>
        <option value="academic">Academic</option>
        <option value="administrative">Administrative</option>
        <option value="amenity">Amenity</option>
        <option value="residential">Residential</option>
        <option value="transport">Transport</option>
        <option value="entry">Entry</option>
      </select>
      <input placeholder="Hours (e.g. 8:00 AM - 8:00 PM)" value={form.hours} onChange={(e) => setForm({ ...form, hours: e.target.value })} style={st} />
      <input placeholder="Description" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} style={st} />
      <div style={{ display: 'flex', gap: 8 }}>
        <button onClick={save} style={{ padding: '8px 20px', background: '#4CAF50', border: 'none', borderRadius: 4, color: '#fff', cursor: 'pointer' }}>
          {editName ? 'Update' : 'Add'}
        </button>
        {editName && <button onClick={() => { setEditName(null); setForm({ name: '', aliases: '', node_id: '', category: 'academic', hours: '', description: '' }); }} style={{ padding: '8px 20px', background: '#555', border: 'none', borderRadius: 4, color: '#fff', cursor: 'pointer' }}>Cancel</button>}
      </div>
      {msg && <p style={{ color: '#4CAF50', fontSize: 12 }}>{msg}</p>}

      <h3 style={{ margin: '20px 0 8px', fontSize: 14, color: '#aaa' }}>Existing POIs ({pois.length})</h3>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
        {pois.map((p, i) => (
          <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '6px 10px', background: '#1a1a1a', borderRadius: 4, fontSize: 13 }}>
            <span><strong>{p.name}</strong> → {p.node_id} <span style={{ color: '#666' }}>[{p.category}]</span></span>
            <div style={{ display: 'flex', gap: 4 }}>
              <button onClick={() => edit(p)} style={{ padding: '2px 8px', background: '#2196F3', border: 'none', borderRadius: 3, color: '#fff', cursor: 'pointer', fontSize: 11 }}>Edit</button>
              <button onClick={() => del(p.name)} style={{ padding: '2px 8px', background: '#f44336', border: 'none', borderRadius: 3, color: '#fff', cursor: 'pointer', fontSize: 11 }}>Del</button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
