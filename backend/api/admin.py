import json, os, shutil
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import Optional, List
from engine.graph import reload as reload_graph
from engine.poi_search import reload as reload_pois

router = APIRouter(prefix='/admin')

DATA_DIR = os.path.join(os.path.dirname(__file__), '..', 'data')

def _read_json(filename):
    path = os.path.join(DATA_DIR, filename)
    with open(path, 'r', encoding='utf-8') as f:
        return json.load(f)

def _write_json(filename, data):
    path = os.path.join(DATA_DIR, filename)
    tmp = path + '.tmp'
    with open(tmp, 'w', encoding='utf-8') as f:
        json.dump(data, f, indent=2, ensure_ascii=False)
    shutil.move(tmp, path)

class NodeModel(BaseModel):
    id: str
    label: str
    type: str = 'waypoint'
    lat: float
    lng: float

class EdgeModel(BaseModel):
    source: str
    target: str
    distance: float = 10
    isStairs: bool = False
    requiresKeycard: bool = False
    hasRamp: bool = True
    hasElevator: bool = False

class POIModel(BaseModel):
    name: str
    aliases: List[str] = []
    node_id: str
    category: str = 'academic'
    hours: Optional[str] = None
    description: Optional[str] = None

@router.get('/nodes')
async def get_nodes():
    return _read_json('nodes.json')

@router.post('/nodes')
async def add_node(node: NodeModel):
    nodes = _read_json('nodes.json')
    if any(n['id'] == node.id for n in nodes):
        raise HTTPException(400, f'Node {node.id} already exists')
    nodes.append(node.model_dump())
    _write_json('nodes.json', nodes)
    reload_graph()
    return {'ok': True}

@router.put('/nodes/{node_id}')
async def update_node(node_id: str, node: NodeModel):
    nodes = _read_json('nodes.json')
    for i, n in enumerate(nodes):
        if n['id'] == node_id:
            nodes[i] = node.model_dump()
            _write_json('nodes.json', nodes)
            reload_graph()
            return {'ok': True}
    raise HTTPException(404, f'Node {node_id} not found')

@router.delete('/nodes/{node_id}')
async def delete_node(node_id: str):
    nodes = _read_json('nodes.json')
    nodes = [n for n in nodes if n['id'] != node_id]
    _write_json('nodes.json', nodes)
    edges = _read_json('edges.json')
    edges = [e for e in edges if e['source'] != node_id and e['target'] != node_id]
    _write_json('edges.json', edges)
    reload_graph()
    return {'ok': True}

@router.get('/edges')
async def get_edges():
    return _read_json('edges.json')

@router.post('/edges')
async def add_edge(edge: EdgeModel):
    edges = _read_json('edges.json')
    edges.append(edge.model_dump())
    _write_json('edges.json', edges)
    reload_graph()
    return {'ok': True}

@router.delete('/edges')
async def delete_edge(source: str, target: str):
    edges = _read_json('edges.json')
    edges = [e for e in edges if not (
        (e['source'] == source and e['target'] == target) or
        (e['source'] == target and e['target'] == source)
    )]
    _write_json('edges.json', edges)
    reload_graph()
    return {'ok': True}

@router.get('/pois')
async def get_pois():
    return _read_json('poi.json')

@router.post('/pois')
async def add_poi(poi: POIModel):
    pois = _read_json('poi.json')
    pois.append(poi.model_dump())
    _write_json('poi.json', pois)
    reload_pois()
    return {'ok': True}

@router.put('/pois/{name}')
async def update_poi(name: str, poi: POIModel):
    pois = _read_json('poi.json')
    for i, p in enumerate(pois):
        if p['name'] == name:
            pois[i] = poi.model_dump()
            _write_json('poi.json', pois)
            reload_pois()
            return {'ok': True}
    raise HTTPException(404, f'POI {name} not found')

@router.delete('/pois/{name}')
async def delete_poi(name: str):
    pois = _read_json('poi.json')
    pois = [p for p in pois if p['name'] != name]
    _write_json('poi.json', pois)
    reload_pois()
    return {'ok': True}
