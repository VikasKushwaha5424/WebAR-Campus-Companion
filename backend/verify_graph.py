"""
Graph Health-Check Script
Run: python verify_graph.py
Scans the navigation graph for isolated nodes (no connections)
and dead-end nodes (only one connection) that may cause routing failures.
"""
import sys
import os

# Add parent dir so we can import engine modules
sys.path.insert(0, os.path.dirname(__file__))

from engine.graph import get_adjacency, get_node_map, get_pois

def main():
    adj = get_adjacency()
    node_map = get_node_map()
    pois = get_pois()

    # Build reverse lookup: node_id -> POI name
    poi_names = {}
    for poi in pois:
        if poi.get('node_id'):
            poi_names[poi['node_id']] = poi['name']

    isolated = []
    dead_ends = []
    total_nodes = len(node_map)
    total_edges = sum(len(edges) for edges in adj.values()) // 2

    for node_id in sorted(node_map.keys()):
        edges = adj.get(node_id, [])
        node = node_map[node_id]
        label = poi_names.get(node_id, node.get('label', ''))
        loc_str = f"({node.get('lat', '?')}, {node.get('lng', '?')})"

        if len(edges) == 0:
            isolated.append((node_id, label, loc_str))
        elif len(edges) == 1:
            dead_ends.append((node_id, label, loc_str, edges[0]['node']))

    # Disconnected POIs (no node_id assigned)
    disconnected_pois = [p for p in pois if not p.get('node_id')]

    print(f"=== Graph Health Report ===")
    print(f"Total nodes: {total_nodes}")
    print(f"Total edges: {total_edges}")
    print(f"Connected POIs: {len(pois) - len(disconnected_pois)}/{len(pois)}")
    print()

    if isolated:
        print(f"❌ ISOLATED NODES ({len(isolated)}):")
        for nid, label, loc in isolated:
            name_str = f" [{label}]" if label else ""
            print(f"   {nid}{name_str} at {loc}")
        print()

    if dead_ends:
        print(f"⚠️  DEAD-END NODES ({len(dead_ends)}):")
        for nid, label, loc, neighbor in dead_ends:
            name_str = f" [{label}]" if label else ""
            print(f"   {nid}{name_str} at {loc} → only connects to {neighbor}")
        print()

    if disconnected_pois:
        print(f"🚫 DISCONNECTED POIs ({len(disconnected_pois)}):")
        for p in disconnected_pois:
            print(f"   {p['name']} at ({p['lat']}, {p['lng']}) — too far from any road")
        print()

    if not isolated and not disconnected_pois:
        print("✅ All nodes connected. All POIs snapped to roads.")
    
    print("Done.")

if __name__ == '__main__':
    main()
