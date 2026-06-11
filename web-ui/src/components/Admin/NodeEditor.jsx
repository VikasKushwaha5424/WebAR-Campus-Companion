import { useState, useEffect } from 'react';
import { API_BASE } from '../../data/config';

export default function NodeEditor() {
  const [nodes, setNodes] = useState([]);
  const [form, setForm] = useState({ id: '', label: '', type: 'waypoint', lat: '', lng: '' });
  const [editId, setEditId] = useState(null);
  const [msg, setMsg] = useState('');

  useEffect(() => { fetchNodes(); }, []);

  const fetchNodes = async () => {
    try {
      const res = await fetch(`${API_BASE}/admin/nodes`);
      setNodes(await res.json());
    } catch {}
  };

  const save = async () => {
    const body = { ...form, lat: parseFloat(form.lat), lng: parseFloat(form.lng) };
    const url = editId ? `${API_BASE}/admin/nodes/${editId}` : `${API_BASE}/admin/nodes`;
    const method = editId ? 'PUT' : 'POST';
    try {
      const res = await fetch(url, { method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
      const data = await res.json();
      if (data.ok) {
        setMsg(editId ? 'Updated!' : 'Added!');
        setForm({ id: '', label: '', type: 'waypoint', lat: '', lng: '' });
        setEditId(null);
        fetchNodes();
      }
    } catch (e) { setMsg('Error: ' + e.message); }
  };

  const deleteNode = async (id) => {
    if (!confirm(`Delete node ${id}?`)) return;
    try {
      await fetch(`${API_BASE}/admin/nodes/${id}`, { method: 'DELETE' });
      fetchNodes();
    } catch {}
  };

  const edit = (n) => {
    setForm({ id: n.id, label: n.label, type: n.type, lat: String(n.lat), lng: String(n.lng) });
    setEditId(n.id);
  };

  const style = { marginBottom: 8, padding: '6px 10px', background: '#2a2a2a', border: '1px solid #444', borderRadius: 4, color: '#fff', fontSize: 13, width: '100%', boxSizing: 'border-box' };

  return (
    <div>
      <h2 style={{ margin: '0 0 12px', fontSize: 16, color: '#aaa' }}>
        {editId ? `Edit: ${editId}` : 'Add Node'}
      </h2>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: 8 }}>
        <input placeholder="id (e.g. node_new_building)" value={form.id} onChange={(e) => setForm({ ...form, id: e.target.value })} style={style} disabled={!!editId} />
        <input placeholder="label (e.g. New Building)" value={form.label} onChange={(e) => setForm({ ...form, label: e.target.value })} style={style} />
        <input placeholder="lat (e.g. 17.782)" value={form.lat} onChange={(e) => setForm({ ...form, lat: e.target.value })} style={style} />
        <input placeholder="lng (e.g. 83.377)" value={form.lng} onChange={(e) => setForm({ ...form, lng: e.target.value })} style={style} />
      </div>
      <select value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value })} style={{ ...style, marginBottom: 8 }}>
        <option value="anchor">Anchor</option>
        <option value="waypoint">Waypoint</option>
      </select>
      <div style={{ display: 'flex', gap: 8 }}>
        <button onClick={save} style={{ padding: '8px 20px', background: '#4CAF50', border: 'none', borderRadius: 4, color: '#fff', cursor: 'pointer' }}>
          {editId ? 'Update' : 'Add'}
        </button>
        {editId && <button onClick={() => { setEditId(null); setForm({ id: '', label: '', type: 'waypoint', lat: '', lng: '' }); }} style={{ padding: '8px 20px', background: '#555', border: 'none', borderRadius: 4, color: '#fff', cursor: 'pointer' }}>Cancel</button>}
      </div>
      {msg && <p style={{ color: '#4CAF50', fontSize: 12 }}>{msg}</p>}

      <h3 style={{ margin: '20px 0 8px', fontSize: 14, color: '#aaa' }}>Existing Nodes ({nodes.length})</h3>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
        {nodes.map((n) => (
          <div key={n.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '6px 10px', background: '#1a1a1a', borderRadius: 4, fontSize: 13 }}>
            <span><strong>{n.id}</strong> — {n.label} <span style={{ color: '#666' }}>({n.lat}, {n.lng})</span></span>
            <div style={{ display: 'flex', gap: 4 }}>
              <button onClick={() => edit(n)} style={{ padding: '2px 8px', background: '#2196F3', border: 'none', borderRadius: 3, color: '#fff', cursor: 'pointer', fontSize: 11 }}>Edit</button>
              <button onClick={() => deleteNode(n.id)} style={{ padding: '2px 8px', background: '#f44336', border: 'none', borderRadius: 3, color: '#fff', cursor: 'pointer', fontSize: 11 }}>Del</button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
