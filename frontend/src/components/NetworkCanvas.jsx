import { useRef, useEffect, useCallback, useState } from 'react';

const NODE_RADIUS = 22;
const COLORS = {
  bg: '#0a0e17',
  node: '#00a2a5',
  nodeStroke: '#00F0FF',
  nodeInactive: '#4a5568',
  nodeInactiveStroke: '#718096',
  edge: 'rgba(0, 240, 255, 0.15)',
  edgeWeight: 'rgba(0, 240, 255, 0.6)',
  pathEdge: '#39FF14',
  pathNode: '#39FF14',
  packet: '#FF10F0',
  text: '#e2e8f0',
  textDark: '#94a3b8',
  highlight: '#00F0FF',
};

export default function NetworkCanvas({
  topology,
  routeResult,
  animatingPacket,
  onAnimationEnd,
  onRouterClick,
  onUpdatePosition,
}) {
  const canvasRef = useRef(null);
  const animRef = useRef(null);
  const dragRef = useRef(null);
  const packetAnimRef = useRef({ progress: 0, pathIndex: 0 });
  const [dimensions, setDimensions] = useState({ width: 800, height: 600 });

  // Resize handler
  useEffect(() => {
    const container = canvasRef.current?.parentElement;
    if (!container) return;
    const resize = () => {
      const rect = container.getBoundingClientRect();
      setDimensions({ width: rect.width, height: rect.height });
    };
    resize();
    const observer = new ResizeObserver(resize);
    observer.observe(container);
    return () => observer.disconnect();
  }, []);

  const getRouterAt = useCallback(
    (x, y) => {
      if (!topology?.routers) return null;
      for (let i = topology.routers.length - 1; i >= 0; i--) {
        const r = topology.routers[i];
        const dx = x - r.x;
        const dy = y - r.y;
        if (dx * dx + dy * dy <= NODE_RADIUS * NODE_RADIUS * 1.5) {
          return r;
        }
      }
      return null;
    },
    [topology]
  );

  // Mouse handlers for dragging
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const getPos = (e) => {
      const rect = canvas.getBoundingClientRect();
      return { x: e.clientX - rect.left, y: e.clientY - rect.top };
    };

    const onMouseDown = (e) => {
      const pos = getPos(e);
      const router = getRouterAt(pos.x, pos.y);
      if (router) {
        dragRef.current = { id: router.id, startX: pos.x, startY: pos.y, origX: router.x, origY: router.y };
        canvas.style.cursor = 'grabbing';
      }
    };

    const onMouseMove = (e) => {
      const pos = getPos(e);
      if (dragRef.current) {
        const dx = pos.x - dragRef.current.startX;
        const dy = pos.y - dragRef.current.startY;
        onUpdatePosition?.(dragRef.current.id, dragRef.current.origX + dx, dragRef.current.origY + dy);
      } else {
        const router = getRouterAt(pos.x, pos.y);
        canvas.style.cursor = router ? 'pointer' : 'crosshair';
      }
    };

    const onMouseUp = (e) => {
      if (dragRef.current) {
        const pos = getPos(e);
        const dx = Math.abs(pos.x - dragRef.current.startX);
        const dy = Math.abs(pos.y - dragRef.current.startY);
        if (dx < 3 && dy < 3) {
          onRouterClick?.(dragRef.current.id);
        }
        dragRef.current = null;
        canvas.style.cursor = 'crosshair';
      }
    };

    canvas.addEventListener('mousedown', onMouseDown);
    canvas.addEventListener('mousemove', onMouseMove);
    canvas.addEventListener('mouseup', onMouseUp);
    canvas.addEventListener('mouseleave', onMouseUp);
    return () => {
      canvas.removeEventListener('mousedown', onMouseDown);
      canvas.removeEventListener('mousemove', onMouseMove);
      canvas.removeEventListener('mouseup', onMouseUp);
      canvas.removeEventListener('mouseleave', onMouseUp);
    };
  }, [getRouterAt, onRouterClick, onUpdatePosition]);

  // Packet animation
  useEffect(() => {
    if (animatingPacket?.path?.length > 1) {
      packetAnimRef.current = { progress: 0, pathIndex: 0 };
    }
  }, [animatingPacket]);

  // Main render loop
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const dpr = window.devicePixelRatio || 1;
    canvas.width = dimensions.width * dpr;
    canvas.height = dimensions.height * dpr;
    ctx.scale(dpr, dpr);

    const pathSet = new Set();
    const pathEdges = new Set();
    if (routeResult?.reachable && routeResult.path) {
      routeResult.path.forEach((id) => pathSet.add(id));
      for (let i = 0; i < routeResult.path.length - 1; i++) {
        const a = Math.min(routeResult.path[i], routeResult.path[i + 1]);
        const b = Math.max(routeResult.path[i], routeResult.path[i + 1]);
        pathEdges.add(`${a}-${b}`);
      }
    }

    let packetPos = null;

    const draw = () => {
      ctx.clearRect(0, 0, dimensions.width, dimensions.height);

      // Background grid
      ctx.strokeStyle = 'rgba(0, 240, 255, 0.03)';
      ctx.lineWidth = 1;
      for (let x = 0; x < dimensions.width; x += 40) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, dimensions.height);
        ctx.stroke();
      }
      for (let y = 0; y < dimensions.height; y += 40) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(dimensions.width, y);
        ctx.stroke();
      }

      if (!topology?.routers) {
        animRef.current = requestAnimationFrame(draw);
        return;
      }

      const routerMap = {};
      topology.routers.forEach((r) => (routerMap[r.id] = r));

      // Draw edges
      if (topology.links) {
        topology.links.forEach((link) => {
          const from = routerMap[link.from];
          const to = routerMap[link.to];
          if (!from || !to) return;

          const a = Math.min(link.from, link.to);
          const b = Math.max(link.from, link.to);
          const isPath = pathEdges.has(`${a}-${b}`);

          ctx.beginPath();
          ctx.moveTo(from.x, from.y);
          ctx.lineTo(to.x, to.y);

          if (isPath) {
            ctx.strokeStyle = COLORS.pathEdge;
            ctx.lineWidth = 3;
            ctx.shadowColor = COLORS.pathEdge;
            ctx.shadowBlur = 10;
          } else {
            ctx.strokeStyle = COLORS.edge;
            ctx.lineWidth = 1.5;
            ctx.shadowBlur = 0;
          }
          ctx.stroke();
          ctx.shadowBlur = 0;

          // Weight label
          const mx = (from.x + to.x) / 2;
          const my = (from.y + to.y) / 2;
          ctx.font = '11px "JetBrains Mono", monospace';
          ctx.fillStyle = isPath ? COLORS.pathEdge : COLORS.edgeWeight;
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';

          // Background for weight
          const weightText = link.weight.toString();
          const tw = ctx.measureText(weightText).width + 8;
          ctx.fillStyle = COLORS.bg;
          ctx.fillRect(mx - tw / 2, my - 8, tw, 16);
          ctx.fillStyle = isPath ? COLORS.pathEdge : COLORS.edgeWeight;
          ctx.fillText(weightText, mx, my);
        });
      }

      // Draw nodes
      topology.routers.forEach((router) => {
        const isOnPath = pathSet.has(router.id);
        const isActive = router.active !== false;

        // Glow effect for path nodes
        if (isOnPath) {
          const gradient = ctx.createRadialGradient(router.x, router.y, NODE_RADIUS, router.x, router.y, NODE_RADIUS * 2.5);
          gradient.addColorStop(0, 'rgba(57, 255, 20, 0.2)');
          gradient.addColorStop(1, 'rgba(57, 255, 20, 0)');
          ctx.beginPath();
          ctx.arc(router.x, router.y, NODE_RADIUS * 2.5, 0, Math.PI * 2);
          ctx.fillStyle = gradient;
          ctx.fill();
        }

        // Node circle
        ctx.beginPath();
        ctx.arc(router.x, router.y, NODE_RADIUS, 0, Math.PI * 2);

        if (!isActive) {
          ctx.fillStyle = COLORS.nodeInactive;
          ctx.strokeStyle = COLORS.nodeInactiveStroke;
        } else if (isOnPath) {
          ctx.fillStyle = 'rgba(57, 255, 20, 0.2)';
          ctx.strokeStyle = COLORS.pathNode;
        } else {
          ctx.fillStyle = 'rgba(0, 162, 165, 0.3)';
          ctx.strokeStyle = COLORS.nodeStroke;
        }

        ctx.fill();
        ctx.lineWidth = 2;
        ctx.stroke();

        // Router icon (simplified network icon)
        ctx.fillStyle = isActive ? (isOnPath ? COLORS.pathNode : COLORS.highlight) : COLORS.nodeInactiveStroke;
        ctx.font = 'bold 12px "JetBrains Mono", monospace';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(router.id.toString(), router.x, router.y);

        // Label
        ctx.font = '11px Inter, sans-serif';
        ctx.fillStyle = isActive ? COLORS.text : COLORS.textDark;
        ctx.fillText(router.name, router.x, router.y + NODE_RADIUS + 14);

        if (!isActive) {
          ctx.font = '9px Inter, sans-serif';
          ctx.fillStyle = '#ef4444';
          ctx.fillText('OFFLINE', router.x, router.y + NODE_RADIUS + 26);
        }
      });

      // Animate packet
      if (animatingPacket?.path?.length > 1) {
        const pa = packetAnimRef.current;
        pa.progress += 0.02;

        const totalSegments = animatingPacket.path.length - 1;
        const globalProgress = pa.progress;
        const segIndex = Math.min(Math.floor(globalProgress * totalSegments), totalSegments - 1);
        const segProgress = (globalProgress * totalSegments) - segIndex;

        if (globalProgress >= 1) {
          packetPos = null;
          onAnimationEnd?.();
        } else {
          const fromId = animatingPacket.path[segIndex];
          const toId = animatingPacket.path[segIndex + 1];
          const from = routerMap[fromId];
          const to = routerMap[toId];
          if (from && to) {
            const px = from.x + (to.x - from.x) * segProgress;
            const py = from.y + (to.y - from.y) * segProgress;
            packetPos = { x: px, y: py };
          }
        }
      }

      // Draw packet
      if (packetPos) {
        // Trail
        const trailGrad = ctx.createRadialGradient(packetPos.x, packetPos.y, 2, packetPos.x, packetPos.y, 30);
        trailGrad.addColorStop(0, 'rgba(255, 16, 240, 0.4)');
        trailGrad.addColorStop(1, 'rgba(255, 16, 240, 0)');
        ctx.beginPath();
        ctx.arc(packetPos.x, packetPos.y, 30, 0, Math.PI * 2);
        ctx.fillStyle = trailGrad;
        ctx.fill();

        // Packet dot
        ctx.beginPath();
        ctx.arc(packetPos.x, packetPos.y, 6, 0, Math.PI * 2);
        ctx.fillStyle = COLORS.packet;
        ctx.shadowColor = COLORS.packet;
        ctx.shadowBlur = 15;
        ctx.fill();
        ctx.shadowBlur = 0;

        // Outer ring
        ctx.beginPath();
        ctx.arc(packetPos.x, packetPos.y, 10, 0, Math.PI * 2);
        ctx.strokeStyle = 'rgba(255, 16, 240, 0.5)';
        ctx.lineWidth = 1.5;
        ctx.stroke();
      }

      animRef.current = requestAnimationFrame(draw);
    };

    draw();
    return () => {
      if (animRef.current) cancelAnimationFrame(animRef.current);
    };
  }, [topology, routeResult, animatingPacket, onAnimationEnd, dimensions]);

  return (
    <div className="relative w-full h-full overflow-hidden">
      <canvas
        ref={canvasRef}
        style={{ width: dimensions.width, height: dimensions.height }}
        className="block"
      />
      {/* Legend */}
      <div className="absolute bottom-4 left-4 glass-panel p-3 text-xs space-y-1.5">
        <div className="flex items-center gap-2">
          <span className="w-3 h-3 rounded-full bg-cyber-500 inline-block" />
          <span className="text-gray-400">Active Router</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="w-3 h-3 rounded-full bg-gray-600 inline-block" />
          <span className="text-gray-400">Inactive Router</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="w-3 h-0.5 bg-green-400 inline-block" />
          <span className="text-gray-400">Shortest Path</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="w-3 h-3 rounded-full inline-block" style={{ background: '#FF10F0' }} />
          <span className="text-gray-400">Packet</span>
        </div>
      </div>
      {/* Hint */}
      <div className="absolute top-4 left-4 text-xs text-gray-500 font-mono">
        Click to select · Drag to move · Right panel to control
      </div>
    </div>
  );
}
