export default function RoutingTable({ routeResult, topology }) {
  if (!routeResult) {
    return (
      <div className="glass-panel p-4 h-full flex items-center justify-center">
        <p className="text-gray-500 text-sm text-center">
          Select source & destination to compute the shortest path
        </p>
      </div>
    );
  }

  const routerMap = {};
  (topology?.routers || []).forEach((r) => (routerMap[r.id] = r));

  return (
    <div className="glass-panel p-4 h-full flex flex-col overflow-hidden">
      <h3 className="text-xs font-medium uppercase tracking-wider text-gray-400 mb-3 flex items-center gap-2">
        <span className="text-cyber-400">⤳</span> Routing Result
      </h3>

      {routeResult.reachable ? (
        <div className="space-y-3 flex-1 overflow-y-auto">
          {/* Path display */}
          <div className="flex items-center gap-1 flex-wrap">
            {routeResult.path.map((id, i) => (
              <div key={id} className="flex items-center gap-1">
                <span className="px-2 py-1 bg-green-900/30 text-green-400 rounded text-xs font-mono border border-green-500/20">
                  {routerMap[id]?.name || `#${id}`}
                </span>
                {i < routeResult.path.length - 1 && (
                  <span className="text-gray-600 text-xs">→</span>
                )}
              </div>
            ))}
          </div>

          {/* Metrics */}
          <div className="grid grid-cols-2 gap-2">
            <div className="bg-dark-800/50 rounded-lg p-2.5">
              <div className="text-xs text-gray-500">Total Cost</div>
              <div className="text-lg font-mono font-bold text-cyber-400">
                {routeResult.totalCost.toFixed(1)}
              </div>
            </div>
            <div className="bg-dark-800/50 rounded-lg p-2.5">
              <div className="text-xs text-gray-500">Hops</div>
              <div className="text-lg font-mono font-bold text-cyber-400">
                {routeResult.path.length - 1}
              </div>
            </div>
          </div>

          {/* Distance table */}
          {routeResult.distances && (
            <div>
              <h4 className="text-xs text-gray-500 mb-2 font-medium">Distance Table</h4>
              <div className="bg-dark-800/30 rounded-lg overflow-hidden">
                <table className="w-full text-xs">
                  <thead>
                    <tr className="border-b border-white/5">
                      <th className="text-left p-2 text-gray-500 font-medium">Router</th>
                      <th className="text-right p-2 text-gray-500 font-medium">Distance</th>
                    </tr>
                  </thead>
                  <tbody>
                    {Object.entries(routeResult.distances)
                      .sort(([, a], [, b]) => a - b)
                      .map(([id, dist]) => (
                        <tr key={id} className="border-b border-white/[0.03] hover:bg-white/[0.02]">
                          <td className="p-2 font-mono text-gray-300">
                            {routerMap[Number(id)]?.name || `#${id}`}
                          </td>
                          <td className="p-2 text-right font-mono text-cyber-400">
                            {dist === Infinity ? '∞' : dist.toFixed(1)}
                          </td>
                        </tr>
                      ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      ) : (
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <div className="text-3xl mb-2">🚫</div>
            <p className="text-red-400 text-sm font-medium">No Path Found</p>
            <p className="text-gray-500 text-xs mt-1">
              Destination is unreachable from the source
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
