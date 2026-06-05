export const CAMPUS_LOCATIONS = [
  { id: '', name: '📍 Auto Detect' },
  { id: 'library', name: 'Library' },
  { id: 'admin_block', name: 'Admin Block' },
  { id: 'cse_department', name: 'CS Department' },
  { id: 'canteen', name: 'Canteen' },
  { id: 'sports_complex', name: 'Sports Complex' },
  { id: 'auditorium', name: 'Auditorium' },
  { id: 'hostel_block', name: 'Hostels' },
  { id: 'parking', name: 'Parking' },
];

export const NPC_LIST = {
  maya: { name: 'Maya (Campus Guide)', color: '#4CAF50' },
  professor: { name: 'Professor Mehta', color: '#2196F3' },
  silas: { name: 'Silas (Facilities)', color: '#f44336' },
};

export const API_BASE = import.meta.env.VITE_API_BASE || '';
