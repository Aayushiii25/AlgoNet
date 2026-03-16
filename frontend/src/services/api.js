const API_BASE = '/api';

async function request(endpoint, options = {}) {
  const url = `${API_BASE}${endpoint}`;
  const config = {
    headers: { 'Content-Type': 'application/json' },
    ...options,
  };

  try {
    const response = await fetch(url, config);
    if (!response.ok) {
      const error = await response.json().catch(() => ({ error: 'Request failed' }));
      throw new Error(error.error || `HTTP ${response.status}`);
    }
    return await response.json();
  } catch (error) {
    if (error.message === 'Failed to fetch') {
      throw new Error('Cannot connect to AlgoNet server. Make sure the C++ backend is running on port 8080.');
    }
    throw error;
  }
}

export const api = {
  // Topology
  getTopology: () => request('/topology'),

  loadPreset: (preset) =>
    request('/topology/preset', {
      method: 'POST',
      body: JSON.stringify({ preset }),
    }),

  clearTopology: () =>
    request('/topology/clear', { method: 'POST' }),

  // Routers
  addRouter: (name, x, y) =>
    request('/router', {
      method: 'POST',
      body: JSON.stringify({ name, x, y }),
    }),

  toggleRouter: (id) =>
    request('/router/toggle', {
      method: 'POST',
      body: JSON.stringify({ id }),
    }),

  // Links
  addLink: (from, to, weight, bandwidth = 100) =>
    request('/link', {
      method: 'POST',
      body: JSON.stringify({ from, to, weight, bandwidth }),
    }),

  // Routing
  findRoute: (source, destination) =>
    request('/route', {
      method: 'POST',
      body: JSON.stringify({ source, destination }),
    }),

  // Simulation
  simulatePacket: (source, destination, payload = 'DATA') =>
    request('/simulate', {
      method: 'POST',
      body: JSON.stringify({ source, destination, payload }),
    }),

  // Stats
  getStats: () => request('/stats'),

  // Packets
  getPackets: () => request('/packets'),
};
