from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import Optional

from engine.pathfinding import find_path
from engine.poi_search import search, find_by_name, find_node_id, get_all_names

router = APIRouter(prefix='/api')

class RouteRequest(BaseModel):
    from_node: Optional[str] = None
    to_node: str
    from_lat: Optional[float] = None
    from_lng: Optional[float] = None
    filters: dict = {}

class POIQuery(BaseModel):
    q: str

class NearestRequest(BaseModel):
    lat: float
    lng: float

@router.post('/route')
async def get_route(req: RouteRequest):
    from_id = None
    if req.from_node:
        from_id = find_node_id(req.from_node) or req.from_node
    if not from_id and req.from_lat is not None and req.from_lng is not None:
        from engine.graph import find_nearest_node
        nearest = find_nearest_node(req.from_lat, req.from_lng)
        if nearest:
            from_id = nearest['id']
    if not from_id:
        raise HTTPException(400, 'from_node is required (or provide from_lat/from_lng)')

    to_id = find_node_id(req.to_node) or req.to_node

    result = find_path(from_id, to_id, req.filters)
    if not result['path']:
        raise HTTPException(404, f'No route found from {from_id} to {to_id}')
    return result

@router.post('/poi/search')
async def search_poi(query: POIQuery):
    results = search(query.q)
    return {'results': results}

@router.get('/poi/list')
async def list_poi():
    return {'names': get_all_names()}

@router.post('/nearest')
async def nearest_location(req: NearestRequest):
    from engine.graph import find_nearest_node
    from engine.poi_search import load_pois
    node = find_nearest_node(req.lat, req.lng)
    if not node:
        raise HTTPException(404, 'No nearby node found')
    pois = load_pois()
    poi = next((p for p in pois if p['node_id'] == node['id']), None)
    return {
        'node_id': node['id'],
        'label': node.get('label', ''),
        'lat': node['lat'],
        'lng': node['lng'],
        'poi_name': poi['name'] if poi else None,
    }
