import { useState } from 'react';

const PRESETS = [
  { id: 'mesh', name: 'Mesh', icon: '◆' },
  { id: 'ring', name: 'Ring', icon: '○' },
  { id: 'star', name: 'Star', icon: '✦' },
  { id: 'tree', name: 'Tree', icon: '▼' },
];

export default function ControlPanel({
  topology,
  onLoadPreset,
  onAddRouter,
  onAddLink,
  onFindRoute,
  onSimulatePacket,
  onToggleRouter,
  isLoading,
  selectedRouter,
  useBackend,
  onToggleBackend,
}) {
  const [activeTab, setActiveTab] = useState('topology');
  const [routerName, setRouterName] = useState('');
  const [linkFrom, setLinkFrom] = useState('');
  const [linkTo, setLinkTo] = useState('');
  const [linkWeight, setLinkWeight] = useState('1');
  const [routeSource, setRouteSource] = useState('');
  const [routeDest, setRouteDest] = useState('');
  const [payload, setPayload] = useState('DATA');

  const routers = topology?.routers || [];

  const tabs = [
    { id: 'topology', label: 'Topology', icon: '⬡' },
    { id: 'routing', label: 'Routing', icon: '⤳' },
    { id: 'settings', label: 'Settings', icon: '⚙' },
  ];

  return (
    <div className="w-full h-full flex flex-col">
      {/* Tab bar */}
      <div className="flex border-b border-white/5">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex-1 px-3 py-2.5 text-xs font-medium transition-all duration-200 ${
              activeTab === tab.id
                ? 'text-cyber-400 border-b-2 border-cyber-400 bg-cyber-400/5'
                : 'text-gray-500 hover:text-gray-300 hover:bg-white/[0.02]'
            }`}
          >
            <span className="mr-1">{tab.icon}</span>
            {tab.label}
          </button>
        ))}
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {/* TOPOLOGY TAB */}
        {activeTab === 'topology' && (
          <>
            {/* Preset Selector */}
            <div>
              <label className="block text-xs text-gray-400 mb-2 font-medium uppercase tracking-wider">
                Preset Topologies
              </label>
              <div className="grid grid-cols-2 gap-2">
                {PRESETS.map((preset) => (
                  <button
                    key={preset.id}
                    onClick={() => onLoadPreset(preset.id)}
                    disabled={isLoading}
                    className="btn-secondary flex items-center justify-center gap-2 text-xs"
                  >
                    <span className="text-cyber-400">{preset.icon}</span>
                    {preset.name}
                  </button>
                ))}
              </div>
            </div>

            <hr className="border-white/5" />

            {/* Add Router */}
            <div>
              <label className="block text-xs text-gray-400 mb-2 font-medium uppercase tracking-wider">
                Add Router
              </label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={routerName}
                  onChange={(e) => setRouterName(e.target.value)}
                  placeholder="Router name"
                  className="input-field flex-1"
                />
                <button
                  onClick={() => {
                    const x = 100 + Math.random() * 500;
                    const y = 80 + Math.random() * 400;
                    onAddRouter(routerName || `R${routers.length}`, x, y);
                    setRouterName('');
                  }}
                  disabled={isLoading}
                  className="btn-primary whitespace-nowrap"
                >
                  + Add
                </button>
              </div>
            </div>

            <hr className="border-white/5" />

            {/* Add Link */}
            <div>
              <label className="block text-xs text-gray-400 mb-2 font-medium uppercase tracking-wider">
                Add Link
              </label>
              <div className="space-y-2">
                <div className="grid grid-cols-2 gap-2">
                  <select
                    value={linkFrom}
                    onChange={(e) => setLinkFrom(e.target.value)}
                    className="select-field"
                  >
                    <option value="">From</option>
                    {routers.map((r) => (
                      <option key={r.id} value={r.id}>
                        {r.name} (#{r.id})
                      </option>
                    ))}
                  </select>
                  <select
                    value={linkTo}
                    onChange={(e) => setLinkTo(e.target.value)}
                    className="select-field"
                  >
                    <option value="">To</option>
                    {routers.map((r) => (
                      <option key={r.id} value={r.id}>
                        {r.name} (#{r.id})
                      </option>
                    ))}
                  </select>
                </div>
                <div className="flex gap-2">
                  <input
                    type="number"
                    value={linkWeight}
                    onChange={(e) => setLinkWeight(e.target.value)}
                    placeholder="Weight"
                    min="1"
                    className="input-field flex-1"
                  />
                  <button
                    onClick={() => {
                      if (linkFrom !== '' && linkTo !== '' && linkFrom !== linkTo) {
                        onAddLink(Number(linkFrom), Number(linkTo), Number(linkWeight) || 1);
                        setLinkFrom('');
                        setLinkTo('');
                        setLinkWeight('1');
                      }
                    }}
                    disabled={isLoading || linkFrom === '' || linkTo === '' || linkFrom === linkTo}
                    className="btn-primary whitespace-nowrap"
                  >
                    Link
                  </button>
                </div>
              </div>
            </div>

            <hr className="border-white/5" />

            {/* Router List */}
            <div>
              <label className="block text-xs text-gray-400 mb-2 font-medium uppercase tracking-wider">
                Routers ({routers.length})
              </label>
              <div className="space-y-1 max-h-40 overflow-y-auto">
                {routers.map((r) => (
                  <div
                    key={r.id}
                    className={`flex items-center justify-between px-3 py-2 rounded-lg text-xs transition-all duration-200 ${
                      selectedRouter === r.id
                        ? 'bg-cyber-400/10 border border-cyber-400/30'
                        : 'bg-dark-800/50 hover:bg-dark-700/50'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <span
                        className={`w-2 h-2 rounded-full ${r.active ? 'bg-green-400' : 'bg-red-400'}`}
                      />
                      <span className="font-mono">
                        #{r.id} {r.name}
                      </span>
                    </div>
                    <button
                      onClick={() => onToggleRouter(r.id)}
                      className={`text-xs px-2 py-0.5 rounded ${
                        r.active
                          ? 'text-red-400 hover:bg-red-900/30'
                          : 'text-green-400 hover:bg-green-900/30'
                      }`}
                    >
                      {r.active ? 'Disable' : 'Enable'}
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </>
        )}

        {/* ROUTING TAB */}
        {activeTab === 'routing' && (
          <>
            <div>
              <label className="block text-xs text-gray-400 mb-2 font-medium uppercase tracking-wider">
                Find Shortest Path
              </label>
              <div className="space-y-2">
                <div className="grid grid-cols-2 gap-2">
                  <select
                    value={routeSource}
                    onChange={(e) => setRouteSource(e.target.value)}
                    className="select-field"
                  >
                    <option value="">Source</option>
                    {routers.filter((r) => r.active).map((r) => (
                      <option key={r.id} value={r.id}>
                        {r.name} (#{r.id})
                      </option>
                    ))}
                  </select>
                  <select
                    value={routeDest}
                    onChange={(e) => setRouteDest(e.target.value)}
                    className="select-field"
                  >
                    <option value="">Destination</option>
                    {routers.filter((r) => r.active).map((r) => (
                      <option key={r.id} value={r.id}>
                        {r.name} (#{r.id})
                      </option>
                    ))}
                  </select>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => {
                      if (routeSource !== '' && routeDest !== '' && routeSource !== routeDest) {
                        onFindRoute(Number(routeSource), Number(routeDest));
                      }
                    }}
                    disabled={
                      isLoading || routeSource === '' || routeDest === '' || routeSource === routeDest
                    }
                    className="btn-primary flex-1"
                  >
                    🔍 Find Route
                  </button>
                </div>
              </div>
            </div>

            <hr className="border-white/5" />

            <div>
              <label className="block text-xs text-gray-400 mb-2 font-medium uppercase tracking-wider">
                Simulate Packet
              </label>
              <div className="space-y-2">
                <input
                  type="text"
                  value={payload}
                  onChange={(e) => setPayload(e.target.value)}
                  placeholder="Payload"
                  className="input-field"
                />
                <button
                  onClick={() => {
                    if (routeSource !== '' && routeDest !== '' && routeSource !== routeDest) {
                      onSimulatePacket(Number(routeSource), Number(routeDest), payload);
                    }
                  }}
                  disabled={
                    isLoading || routeSource === '' || routeDest === '' || routeSource === routeDest
                  }
                  className="btn-primary w-full flex items-center justify-center gap-2"
                >
                  <span>📡</span> Send Packet
                </button>
              </div>
            </div>

            <hr className="border-white/5" />

            {/* Quick actions */}
            <div>
              <label className="block text-xs text-gray-400 mb-2 font-medium uppercase tracking-wider">
                Quick Simulate
              </label>
              <p className="text-xs text-gray-500 mb-2">
                Select source & destination above, then click buttons below.
              </p>
              <div className="grid grid-cols-2 gap-2">
                {routers.length >= 2 && (
                  <>
                    <button
                      onClick={() => {
                        const src = routers[0].id;
                        const dst = routers[routers.length - 1].id;
                        setRouteSource(String(src));
                        setRouteDest(String(dst));
                        onFindRoute(src, dst);
                      }}
                      className="btn-secondary text-xs"
                    >
                      First → Last
                    </button>
                    <button
                      onClick={() => {
                        const src = routers[0].id;
                        const dst = routers[routers.length - 1].id;
                        setRouteSource(String(src));
                        setRouteDest(String(dst));
                        onSimulatePacket(src, dst, 'PING');
                      }}
                      className="btn-secondary text-xs"
                    >
                      Ping First→Last
                    </button>
                  </>
                )}
              </div>
            </div>
          </>
        )}

        {/* SETTINGS TAB */}
        {activeTab === 'settings' && (
          <>
            <div>
              <label className="block text-xs text-gray-400 mb-2 font-medium uppercase tracking-wider">
                Backend Connection
              </label>
              <div
                className={`flex items-center justify-between p-3 rounded-lg border transition-all ${
                  useBackend
                    ? 'bg-green-900/20 border-green-500/30'
                    : 'bg-dark-800/50 border-white/5'
                }`}
              >
                <div>
                  <div className="text-sm font-medium">
                    {useBackend ? 'Connected' : 'Standalone'}
                  </div>
                  <div className="text-xs text-gray-500">
                    {useBackend
                      ? 'Using C++ backend on :8080'
                      : 'Running client-side Dijkstra'}
                  </div>
                </div>
                <button
                  onClick={onToggleBackend}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                    useBackend
                      ? 'bg-green-900/40 text-green-400 hover:bg-green-900/60'
                      : 'bg-dark-600 text-gray-400 hover:bg-dark-500'
                  }`}
                >
                  {useBackend ? 'ON' : 'OFF'}
                </button>
              </div>
              <p className="text-xs text-gray-600 mt-2">
                The frontend works standalone with a built-in Dijkstra implementation.
                Enable the backend to use the C++ server.
              </p>
            </div>

            <hr className="border-white/5" />

            <div>
              <label className="block text-xs text-gray-400 mb-2 font-medium uppercase tracking-wider">
                About
              </label>
              <div className="text-xs text-gray-500 space-y-1">
                <p><span className="text-cyber-400">AlgoNet</span> v1.0.0</p>
                <p>Network Routing Simulator</p>
                <p>Dijkstra's Shortest Path Algorithm</p>
                <p className="pt-2 text-gray-600">
                  Built with C++17 · React · Tailwind CSS
                </p>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
