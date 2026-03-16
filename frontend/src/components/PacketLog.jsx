export default function PacketLog({ packets, topology }) {
  const routerMap = {};
  (topology?.routers || []).forEach((r) => (routerMap[r.id] = r));

  if (!packets || packets.length === 0) {
    return (
      <div className="glass-panel p-4">
        <h3 className="text-xs font-medium uppercase tracking-wider text-gray-400 mb-3 flex items-center gap-2">
          <span className="text-cyber-400">▤</span> Packet Log
        </h3>
        <p className="text-gray-500 text-xs text-center py-4">
          No packets sent yet. Use the Routing tab to simulate.
        </p>
      </div>
    );
  }

  return (
    <div className="glass-panel p-4">
      <h3 className="text-xs font-medium uppercase tracking-wider text-gray-400 mb-3 flex items-center gap-2">
        <span className="text-cyber-400">▤</span> Packet Log
        <span className="ml-auto badge-info text-[10px]">{packets.length}</span>
      </h3>
      <div className="space-y-1.5 max-h-48 overflow-y-auto">
        {packets.map((pkt, i) => (
          <div
            key={`${pkt.id}-${i}`}
            className="flex items-center gap-2 px-2.5 py-2 bg-dark-800/40 rounded-lg text-xs animate-slide-up"
            style={{ animationDelay: `${i * 30}ms` }}
          >
            <span
              className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${
                pkt.status === 'delivered' ? 'bg-green-400' : 'bg-red-400'
              }`}
            />
            <span className="font-mono text-gray-400 w-6">#{pkt.id}</span>
            <span className="font-mono text-gray-300 flex-1 truncate">
              {routerMap[pkt.source]?.name || pkt.source} → {routerMap[pkt.destination]?.name || pkt.destination}
            </span>
            <span
              className={
                pkt.status === 'delivered' ? 'badge-success' : 'badge-danger'
              }
            >
              {pkt.status}
            </span>
            {pkt.status === 'delivered' && (
              <span className="text-gray-500 font-mono whitespace-nowrap">
                {pkt.hops}h · {pkt.latency?.toFixed(1)}ms
              </span>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
