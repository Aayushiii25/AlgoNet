import { useState, useCallback, useRef } from 'react';
import { api } from '../services/api';

const DEMO_TOPOLOGIES = {
  mesh: {
    routers: [
      { id: 0, name: 'Router-A', x: 400, y: 100, active: true },
      { id: 1, name: 'Router-B', x: 573, y: 200, active: true },
      { id: 2, name: 'Router-C', x: 573, y: 400, active: true },
      { id: 3, name: 'Router-D', x: 400, y: 500, active: true },
      { id: 4, name: 'Router-E', x: 227, y: 400, active: true },
      { id: 5, name: 'Router-F', x: 227, y: 200, active: true },
    ],
    links: [
      { from: 0, to: 1, weight: 2, bandwidth: 100 },
      { from: 0, to: 2, weight: 4, bandwidth: 100 },
      { from: 0, to: 5, weight: 7, bandwidth: 100 },
      { from: 1, to: 2, weight: 1, bandwidth: 100 },
      { from: 1, to: 3, weight: 5, bandwidth: 100 },
      { from: 2, to: 3, weight: 3, bandwidth: 100 },
      { from: 2, to: 4, weight: 6, bandwidth: 100 },
      { from: 3, to: 4, weight: 2, bandwidth: 100 },
      { from: 3, to: 5, weight: 4, bandwidth: 100 },
      { from: 4, to: 5, weight: 3, bandwidth: 100 },
    ],
  },
  ring: {
    routers: Array.from({ length: 8 }, (_, i) => ({
      id: i,
      name: `Node-${i}`,
      x: 400 + 200 * Math.cos((2 * Math.PI * i) / 8 - Math.PI / 2),
      y: 300 + 200 * Math.sin((2 * Math.PI * i) / 8 - Math.PI / 2),
      active: true,
    })),
    links: Array.from({ length: 8 }, (_, i) => ({
      from: i,
      to: (i + 1) % 8,
      weight: 1 + Math.floor(Math.random() * 5),
      bandwidth: 100,
    })),
  },
  star: {
    routers: [
      { id: 0, name: 'Hub', x: 400, y: 300, active: true },
      ...Array.from({ length: 7 }, (_, i) => ({
        id: i + 1,
        name: `Leaf-${i}`,
        x: 400 + 220 * Math.cos((2 * Math.PI * i) / 7 - Math.PI / 2),
        y: 300 + 220 * Math.sin((2 * Math.PI * i) / 7 - Math.PI / 2),
        active: true,
      })),
    ],
    links: Array.from({ length: 7 }, (_, i) => ({
      from: 0,
      to: i + 1,
      weight: 2 + Math.floor(Math.random() * 4),
      bandwidth: 100,
    })),
  },
  tree: {
    routers: [
      { id: 0, name: 'Root', x: 400, y: 80, active: true },
      { id: 1, name: 'L1-A', x: 250, y: 200, active: true },
      { id: 2, name: 'L1-B', x: 550, y: 200, active: true },
      { id: 3, name: 'L2-A', x: 150, y: 350, active: true },
      { id: 4, name: 'L2-B', x: 350, y: 350, active: true },
      { id: 5, name: 'L2-C', x: 450, y: 350, active: true },
      { id: 6, name: 'L2-D', x: 650, y: 350, active: true },
    ],
    links: [
      { from: 0, to: 1, weight: 3, bandwidth: 100 },
      { from: 0, to: 2, weight: 4, bandwidth: 100 },
      { from: 1, to: 3, weight: 2, bandwidth: 100 },
      { from: 1, to: 4, weight: 5, bandwidth: 100 },
      { from: 2, to: 5, weight: 3, bandwidth: 100 },
      { from: 2, to: 6, weight: 2, bandwidth: 100 },
    ],
  },
};

export function useSimulator() {
  const [topology, setTopology] = useState(DEMO_TOPOLOGIES.mesh);
  const [routeResult, setRouteResult] = useState(null);
  const [packetLog, setPacketLog] = useState([]);
  const [stats, setStats] = useState({
    totalPacketsSent: 0,
    packetsDelivered: 0,
    packetsDropped: 0,
    averageLatency: 0,
    averageHops: 0,
    totalRouters: 6,
    totalLinks: 10,
    deliveryRate: 0,
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [animatingPacket, setAnimatingPacket] = useState(null);
  const [useBackend, setUseBackend] = useState(false);
  const nextIdRef = useRef(100);
  const nextPacketIdRef = useRef(0);

  // ---- Frontend-only Dijkstra implementation ----
  const dijkstraLocal = useCallback((routers, links, sourceId, destId) => {
    const dist = {};
    const prev = {};
    const visited = {};
    routers.forEach((r) => {
      dist[r.id] = Infinity;
      prev[r.id] = -1;
      visited[r.id] = false;
    });
    dist[sourceId] = 0;

    const adj = {};
    routers.forEach((r) => (adj[r.id] = []));
    links.forEach((l) => {
      adj[l.from]?.push({ to: l.to, w: l.weight });
      adj[l.to]?.push({ to: l.from, w: l.weight });
    });

    for (let i = 0; i < routers.length; i++) {
      let u = -1;
      let minD = Infinity;
      for (const r of routers) {
        if (!visited[r.id] && dist[r.id] < minD) {
          minD = dist[r.id];
          u = r.id;
        }
      }
      if (u === -1) break;
      visited[u] = true;
      const router = routers.find((r) => r.id === u);
      if (u !== sourceId && u !== destId && router && !router.active) continue;
      for (const edge of adj[u] || []) {
        const nb = routers.find((r) => r.id === edge.to);
        if (visited[edge.to]) continue;
        if (nb && !nb.active && edge.to !== destId) continue;
        const nd = dist[u] + edge.w;
        if (nd < dist[edge.to]) {
          dist[edge.to] = nd;
          prev[edge.to] = u;
        }
      }
    }

    if (dist[destId] === Infinity) {
      return { reachable: false, totalCost: Infinity, path: [], distances: dist, previous: prev };
    }
    const path = [];
    let cur = destId;
    while (cur !== -1) {
      path.unshift(cur);
      cur = prev[cur];
    }
    return { reachable: true, totalCost: dist[destId], path, distances: dist, previous: prev };
  }, []);

  const loadPreset = useCallback(
    async (preset) => {
      setIsLoading(true);
      setError(null);
      setRouteResult(null);
      setAnimatingPacket(null);
      try {
        if (useBackend) {
          const data = await api.loadPreset(preset);
          setTopology(data);
        } else {
          const topo = DEMO_TOPOLOGIES[preset] || DEMO_TOPOLOGIES.mesh;
          setTopology(JSON.parse(JSON.stringify(topo)));
          nextIdRef.current = Math.max(...topo.routers.map((r) => r.id)) + 1;
        }
        setPacketLog([]);
        setStats((s) => ({
          ...s,
          totalPacketsSent: 0,
          packetsDelivered: 0,
          packetsDropped: 0,
          averageLatency: 0,
          averageHops: 0,
        }));
      } catch (err) {
        setError(err.message);
      }
      setIsLoading(false);
    },
    [useBackend]
  );

  const addRouter = useCallback(
    async (name, x, y) => {
      setError(null);
      try {
        if (useBackend) {
          const data = await api.addRouter(name, x, y);
          setTopology(data);
        } else {
          const id = nextIdRef.current++;
          setTopology((prev) => ({
            ...prev,
            routers: [...prev.routers, { id, name: name || `R${id}`, x, y, active: true }],
          }));
        }
      } catch (err) {
        setError(err.message);
      }
    },
    [useBackend]
  );

  const addLink = useCallback(
    async (from, to, weight, bandwidth = 100) => {
      setError(null);
      try {
        if (useBackend) {
          const data = await api.addLink(from, to, weight, bandwidth);
          setTopology(data);
        } else {
          setTopology((prev) => ({
            ...prev,
            links: [...prev.links.filter((l) => !((l.from === from && l.to === to) || (l.from === to && l.to === from))), { from, to, weight, bandwidth }],
          }));
        }
      } catch (err) {
        setError(err.message);
      }
    },
    [useBackend]
  );

  const toggleRouter = useCallback(
    async (id) => {
      setError(null);
      try {
        if (useBackend) {
          const data = await api.toggleRouter(id);
          setTopology(data);
        } else {
          setTopology((prev) => ({
            ...prev,
            routers: prev.routers.map((r) => (r.id === id ? { ...r, active: !r.active } : r)),
          }));
        }
      } catch (err) {
        setError(err.message);
      }
    },
    [useBackend]
  );

  const findRoute = useCallback(
    async (source, destination) => {
      setIsLoading(true);
      setError(null);
      setAnimatingPacket(null);
      try {
        let result;
        if (useBackend) {
          result = await api.findRoute(source, destination);
        } else {
          result = dijkstraLocal(topology.routers, topology.links, source, destination);
        }
        setRouteResult(result);
        return result;
      } catch (err) {
        setError(err.message);
        return null;
      } finally {
        setIsLoading(false);
      }
    },
    [useBackend, topology, dijkstraLocal]
  );

  const simulatePacket = useCallback(
    async (source, destination, payload = 'DATA') => {
      setIsLoading(true);
      setError(null);
      try {
        let result;
        if (useBackend) {
          result = await api.simulatePacket(source, destination, payload);
          const statsData = await api.getStats();
          setStats(statsData);
        } else {
          const route = dijkstraLocal(topology.routers, topology.links, source, destination);
          const pktId = nextPacketIdRef.current++;
          result = {
            id: pktId,
            source,
            destination,
            payload,
            status: route.reachable ? 'delivered' : 'dropped',
            latency: route.reachable ? route.totalCost : 0,
            hops: route.reachable ? route.path.length - 1 : 0,
            path: route.path,
            timestamp: Date.now(),
          };
          setRouteResult(route);

          setStats((prev) => {
            const newDelivered = prev.packetsDelivered + (route.reachable ? 1 : 0);
            const newDropped = prev.packetsDropped + (route.reachable ? 0 : 1);
            const newTotal = prev.totalPacketsSent + 1;
            const totalLatency = prev.averageLatency * prev.packetsDelivered + (route.reachable ? route.totalCost : 0);
            const totalHops = prev.averageHops * prev.packetsDelivered + (route.reachable ? route.path.length - 1 : 0);
            return {
              totalPacketsSent: newTotal,
              packetsDelivered: newDelivered,
              packetsDropped: newDropped,
              averageLatency: newDelivered > 0 ? totalLatency / newDelivered : 0,
              averageHops: newDelivered > 0 ? totalHops / newDelivered : 0,
              totalRouters: topology.routers.length,
              totalLinks: topology.links.length,
              deliveryRate: newTotal > 0 ? (100 * newDelivered) / newTotal : 0,
            };
          });
        }

        setPacketLog((prev) => [result, ...prev].slice(0, 50));

        // Animate packet along path
        if (result.path && result.path.length > 1) {
          setAnimatingPacket(result);
        }

        return result;
      } catch (err) {
        setError(err.message);
        return null;
      } finally {
        setIsLoading(false);
      }
    },
    [useBackend, topology, dijkstraLocal]
  );

  const updateRouterPosition = useCallback((id, x, y) => {
    setTopology((prev) => ({
      ...prev,
      routers: prev.routers.map((r) => (r.id === id ? { ...r, x, y } : r)),
    }));
  }, []);

  return {
    topology,
    routeResult,
    packetLog,
    stats,
    isLoading,
    error,
    animatingPacket,
    setAnimatingPacket,
    useBackend,
    setUseBackend,
    loadPreset,
    addRouter,
    addLink,
    toggleRouter,
    findRoute,
    simulatePacket,
    updateRouterPosition,
    setRouteResult,
  };
}
