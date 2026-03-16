export default function StatsPanel({ stats }) {
  const statItems = [
    {
      label: 'Packets Sent',
      value: stats.totalPacketsSent,
      color: 'text-cyber-400',
      icon: '📨',
    },
    {
      label: 'Delivered',
      value: stats.packetsDelivered,
      color: 'text-green-400',
      icon: '✅',
    },
    {
      label: 'Dropped',
      value: stats.packetsDropped,
      color: 'text-red-400',
      icon: '❌',
    },
    {
      label: 'Delivery Rate',
      value: `${stats.deliveryRate?.toFixed(1) || 0}%`,
      color: stats.deliveryRate >= 90 ? 'text-green-400' : stats.deliveryRate >= 50 ? 'text-yellow-400' : 'text-red-400',
      icon: '📊',
    },
    {
      label: 'Avg Latency',
      value: `${stats.averageLatency?.toFixed(1) || 0}ms`,
      color: 'text-purple-400',
      icon: '⏱',
    },
    {
      label: 'Avg Hops',
      value: stats.averageHops?.toFixed(1) || '0',
      color: 'text-amber-400',
      icon: '🔀',
    },
  ];

  return (
    <div className="glass-panel p-4">
      <h3 className="text-xs font-medium uppercase tracking-wider text-gray-400 mb-3 flex items-center gap-2">
        <span className="text-cyber-400">◈</span> Simulation Stats
      </h3>
      <div className="grid grid-cols-3 gap-2">
        {statItems.map((item) => (
          <div
            key={item.label}
            className="bg-dark-800/50 rounded-lg p-2.5 text-center transition-all duration-300 hover:bg-dark-700/50"
          >
            <div className="text-sm mb-0.5">{item.icon}</div>
            <div className={`text-base font-mono font-bold ${item.color}`}>
              {item.value}
            </div>
            <div className="text-[10px] text-gray-500 mt-0.5">{item.label}</div>
          </div>
        ))}
      </div>
      {/* Network info */}
      <div className="flex items-center justify-between mt-3 px-1 text-[10px] text-gray-600">
        <span>Routers: {stats.totalRouters}</span>
        <span>Links: {stats.totalLinks}</span>
      </div>
    </div>
  );
}
