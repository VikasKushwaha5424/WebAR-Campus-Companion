import json, os

DATA_DIR = os.path.join(os.path.dirname(__file__), '..', 'data')

def load_json(filename):
    path = os.path.join(DATA_DIR, filename)
    try:
        with open(path, 'r', encoding='utf-8') as f:
            return json.load(f)
    except FileNotFoundError:
        raise RuntimeError(f"Data file not found: {path}")
    except json.JSONDecodeError as e:
        raise RuntimeError(f"Invalid JSON in {filename}: {e}")

_nodes = None
_edges = None
_adj = None
_node_map = None

def get_nodes():
    global _nodes
    if _nodes is None:
        _nodes = load_json('nodes.json')
    return _nodes

def get_edges():
    global _edges
    if _edges is None:
        _edges = load_json('edges.json')
    return _edges

def get_node_map():
    global _node_map
    if _node_map is None:
        _node_map = {}
        for n in get_nodes():
            _node_map[n['id']] = n
    return _node_map

def get_adjacency():
    global _adj
    if _adj is None:
        _adj = {}
        for e in get_edges():
            _adj.setdefault(e['source'], []).append({
                'node': e['target'], 'distance': e['distance'],
                'isStairs': e.get('isStairs', False),
                'requiresKeycard': e.get('requiresKeycard', False),
                'hasRamp': e.get('hasRamp', False),
                'hasElevator': e.get('hasElevator', False),
            })
            _adj.setdefault(e['target'], []).append({
                'node': e['source'], 'distance': e['distance'],
                'isStairs': e.get('isStairs', False),
                'requiresKeycard': e.get('requiresKeycard', False),
                'hasRamp': e.get('hasRamp', False),
                'hasElevator': e.get('hasElevator', False),
            })
    return _adj

def get_node_by_id(node_id):
    return get_node_map().get(node_id)

def find_nearest_node(lat, lng):
    import math
    best = None
    best_dist = float('inf')
    for n in get_nodes():
        dlat = math.radians(n['lat'] - lat)
        dlng = math.radians(n['lng'] - lng)
        a = math.sin(dlat/2)**2 + math.cos(math.radians(lat)) * math.cos(math.radians(n['lat'])) * math.sin(dlng/2)**2
        d = 6371000 * 2 * math.atan2(math.sqrt(a), math.sqrt(1-a))
        if d < best_dist:
            best_dist = d
            best = n
    return best

def reload():
    global _nodes, _edges, _adj, _node_map
    _nodes = _edges = _adj = _node_map = None
