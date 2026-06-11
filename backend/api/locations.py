from fastapi import APIRouter
from engine.graph import get_nodes
from engine.poi_search import load_pois

router = APIRouter()

CAMPUS_LOCATIONS = {
    'library': {'name': 'Library', 'lat': 17.782078, 'lng': 83.377342, 'description': 'Knowledge Resource Centre'},
    'admin_block': {'name': 'Admin Block', 'lat': 17.781178, 'lng': 83.379191, 'description': 'C.V. Raman Administrative Block'},
    'cse_department': {'name': 'CS Department', 'lat': 17.780486, 'lng': 83.376235, 'description': 'Computer Science Department (ICT Bhavan)'},
    'canteen': {'name': 'Canteen', 'lat': 17.783407, 'lng': 83.379935, 'description': 'University Canteen'},
    'sports_complex': {'name': 'Sports Complex', 'lat': 17.783211, 'lng': 83.378911, 'description': 'Sports Complex & Cricket Stadium'},
    'auditorium': {'name': 'Auditorium', 'lat': 17.781841, 'lng': 83.377170, 'description': 'Balayogi Kala Pranganam'},
    'hostel_block': {'name': 'Hostels', 'lat': 17.783780, 'lng': 83.378555, 'description': 'Student Hostels'},
    'parking': {'name': 'Parking', 'lat': 17.780280, 'lng': 83.379079, 'description': 'GITAM Central Parking'},
}

@router.get('/locations')
async def get_locations():
    return {
        'locations': [{'id': k, **v} for k, v in CAMPUS_LOCATIONS.items()],
        'nodes': get_nodes(),
        'pois': load_pois(),
    }
