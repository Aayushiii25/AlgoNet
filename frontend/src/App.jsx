import { useState } from 'react';
import { useSimulator } from './hooks/useSimulator';
import NetworkCanvas from './components/NetworkCanvas';
import ControlPanel from './components/ControlPanel';
import RoutingTable from './components/RoutingTable';
import StatsPanel from './components/StatsPanel';
import PacketLog from './components/PacketLog';

export default function App() {
  const sim = useSimulator();
  const [selectedRouter, setSelectedRouter] = useState(null);
  const [rightPanel, setRightPanel] = useState('routing'); // 'routing' | 'stats'

  const handleRouterClick = (id) => {
    setSelectedRouter((prev) => (prev === id ? null : id));
  };

  return (
    <div className="h-screen flex flex-col bg-dark-900 text-gray-200 overflow-hidden">
      {/* Header */}
      <header className="flex-shrink-0 h-12 border-b border-white/5 bg-dark-800/80 backdrop-blur-md flex items-center justify-between px-5">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-cyber-500 to-cyber-700 flex items-center justify-center text-sm">
              ⬡
            </div>
            <h1 className="text-sm font-semibold tracking-wide">
              <span className="text-cyber-400">Algo</span>
              <span className="text-gray-300">Net</span>
            </h1>
          </div>
          <div className="h-4 w-px bg-white/10" />
          <span className="text-xs text-gray-500 font-mono">Network Routing Simulator</span>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5 text-xs text-gray-500">
            <span className={`w-1.5 h-1.5 rounded-full ${sim.useBackend ? 'bg-green-400' : 'bg-amber-400'}`} />
            {sim.useBackend ? 'Backend Connected' : 'Standalone Mode'}
          </div>
          {sim.error && (
            <div className="text-xs text-red-400 bg-red-900/20 px-3 py-1 rounded-lg border border-red-500/20 max-w-xs truncate">
              {sim.error}
            </div>
          )}
        </div>
      </header>

      {/* Main Content */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left Sidebar - Control Panel */}
        <aside className="w-72 flex-shrink-0 border-r border-white/5 bg-dark-800/40 flex flex-col">
          <ControlPanel
            topology={sim.topology}
            onLoadPreset={sim.loadPreset}
            onAddRouter={sim.addRouter}
            onAddLink={sim.addLink}
            onFindRoute={sim.findRoute}
            onSimulatePacket={sim.simulatePacket}
            onToggleRouter={sim.toggleRouter}
            isLoading={sim.isLoading}
            selectedRouter={selectedRouter}
            useBackend={sim.useBackend}
            onToggleBackend={() => sim.setUseBackend(!sim.useBackend)}
          />
        </aside>

        {/* Center - Network Canvas */}
        <main className="flex-1 relative">
          <NetworkCanvas
            topology={sim.topology}
            routeResult={sim.routeResult}
            animatingPacket={sim.animatingPacket}
            onAnimationEnd={() => sim.setAnimatingPacket(null)}
            onRouterClick={handleRouterClick}
            onUpdatePosition={sim.updateRouterPosition}
          />
        </main>

        {/* Right Sidebar - Info Panel */}
        <aside className="w-80 flex-shrink-0 border-l border-white/5 bg-dark-800/40 flex flex-col overflow-hidden">
          {/* Panel tabs */}
          <div className="flex border-b border-white/5 flex-shrink-0">
            <button
              onClick={() => setRightPanel('routing')}
              className={`flex-1 px-3 py-2.5 text-xs font-medium transition-all ${
                rightPanel === 'routing'
                  ? 'text-cyber-400 border-b-2 border-cyber-400 bg-cyber-400/5'
                  : 'text-gray-500 hover:text-gray-300'
              }`}
            >
              Routing Table
            </button>
            <button
              onClick={() => setRightPanel('stats')}
              className={`flex-1 px-3 py-2.5 text-xs font-medium transition-all ${
                rightPanel === 'stats'
                  ? 'text-cyber-400 border-b-2 border-cyber-400 bg-cyber-400/5'
                  : 'text-gray-500 hover:text-gray-300'
              }`}
            >
              Stats & Log
            </button>
          </div>

          <div className="flex-1 overflow-y-auto p-3 space-y-3">
            {rightPanel === 'routing' ? (
              <RoutingTable routeResult={sim.routeResult} topology={sim.topology} />
            ) : (
              <>
                <StatsPanel stats={sim.stats} />
                <PacketLog packets={sim.packetLog} topology={sim.topology} />
              </>
            )}
          </div>
        </aside>
      </div>
    </div>
  );
}
