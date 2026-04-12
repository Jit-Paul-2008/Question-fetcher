import React, { useEffect, useState, useRef } from 'react';
import ForceGraph2D from 'react-force-graph-2d';
import { Loader2, Zap, Activity, Share2, Cpu, Box, Terminal, Database } from "lucide-react";

interface GraphNode {
  id: string;
  name: string;
  group: string;
  color?: string;
}

interface GraphLink {
  source: string;
  target: string;
  value: number;
}

interface GraphData {
  nodes: GraphNode[];
  links: GraphLink[];
}

const NEON_COLORS: Record<string, string> = {
  "Chemistry": "#00fff2", // Neon Cyan
  "Physics": "#b870ff",    // Neon Violet
  "Biology": "#00ff88",    // Neon Green
  "Maths": "#ff0088",      // Neon Pink
  "General": "#ffffff"     // White
};

export function KnowledgeMapWindow() {
  const [data, setData] = useState<GraphData>({ nodes: [], links: [] });
  const [loading, setLoading] = useState(true);
  const graphRef = useRef<any>();

  useEffect(() => {
    const fetchData = async () => {
      try {
        const mockData = {
            nodes: [
                { id: "1", name: "Organic Synthesis", group: "Chemistry" },
                { id: "2", name: "Quantum Mechanics", group: "Physics" },
                { id: "3", name: "Cellular Mitosis", group: "Biology" },
                { id: "4", name: "Calculus Limits", group: "Maths" },
                { id: "5", name: "General Science", group: "General" }
            ],
            links: [
                { source: "1", target: "5", value: 1 },
                { source: "2", target: "5", value: 1 },
                { source: "3", target: "5", value: 1 },
                { source: "4", target: "5", value: 1 }
            ]
        };

        const res = await fetch('/api/graph-data').catch(() => null);
        const json = res ? await res.json() : mockData;
        
        const enhancedNodes = json.nodes.map((n: any) => ({
          ...n,
          color: NEON_COLORS[n.group] || NEON_COLORS["General"]
        }));

        setData({ nodes: enhancedNodes, links: json.links });
      } catch (err) {
        console.error("Failed to fetch graph data", err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-[600px] synth-glass rounded-[3rem] border border-white/5 mx-auto max-w-7xl">
        <div className="relative">
            <Loader2 className="w-12 h-12 text-neon-cyan animate-spin mb-4" />
            <div className="absolute inset-0 bg-neon-cyan/20 blur-xl rounded-full" />
        </div>
        <p className="text-white/40 text-[10px] font-black uppercase tracking-[0.5em] animate-pulse">Initializing Neural Link...</p>
      </div>
    );
  }

  return (
    <div className="space-y-10 animate-in fade-in slide-in-from-bottom-4 duration-1000 max-w-7xl mx-auto">
      <div className="flex flex-col xl:flex-row gap-8 items-stretch">
        <div className="w-full xl:w-[75%]">
          <div className="synth-glass rounded-[2.5rem] border border-white/5 overflow-hidden relative min-h-[750px] bg-zinc-900/10 shadow-2xl">
            {/* Overlay UI */}
            <div className="absolute top-10 left-10 z-20 space-y-2 pointer-events-none">
                <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-white/5 border border-white/10 text-white rounded-2xl flex items-center justify-center shadow-2xl group">
                        <Box className="w-6 h-6 group-hover:text-neon-cyan transition-colors" />
                    </div>
                    <div>
                        <h2 className="text-3xl font-black text-white italic tracking-tight uppercase">Knowledge Universe</h2>
                        <div className="flex items-center gap-2">
                             <div className="w-1.5 h-1.5 rounded-full bg-neon-cyan shadow-[0_0_8px_rgba(0,255,242,0.8)]" />
                             <p className="text-white/30 text-[9px] font-black uppercase tracking-[0.2em]">Semantic_Neural_Network_v4.2</p>
                        </div>
                    </div>
                </div>
            </div>
            
            <div className="w-full h-[750px] cursor-grab active:cursor-grabbing bg-[#050505]/50">
              <ForceGraph2D
                ref={graphRef}
                graphData={data}
                nodeLabel="name"
                nodeColor={n => (n as GraphNode).color || "#ccc"}
                nodeVal={() => 5}
                nodeRelSize={5}
                linkWidth={1}
                linkColor={() => "rgba(255, 255, 255, 0.03)"}
                linkDirectionalParticles={2}
                linkDirectionalParticleSpeed={0.005}
                linkDirectionalParticleWidth={2}
                linkDirectionalParticleColor={() => "rgba(0, 255, 242, 0.2)"}
                backgroundColor="transparent"
                cooldownTicks={100}
                onNodeClick={(node: any) => {
                  if (graphRef.current) {
                    graphRef.current.centerAt(node.x, node.y, 800);
                    graphRef.current.zoom(4, 800);
                  }
                }}
              />
            </div>
            
            {/* Legend */}
            <div className="absolute bottom-10 left-10 right-10 flex flex-wrap gap-5 bg-black/40 backdrop-blur-xl p-6 px-10 rounded-2xl z-20 border border-white/5 shadow-2xl justify-center xl:justify-start">
              {Object.entries(NEON_COLORS).map(([sub, color]) => (
                <div key={sub} className="flex items-center gap-3">
                  <div className="w-2.5 h-2.5 rounded-full shadow-[0_0_10px_rgba(var(--color),0.5)]" style={{ backgroundColor: color }} />
                  <span className="text-[10px] font-black text-white/40 uppercase tracking-[0.2em]">{sub}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="w-full xl:w-[25%] flex flex-col gap-8">
          <div className="synth-glass rounded-[2rem] border border-white/5 p-10 relative overflow-hidden bg-white/5 flex-grow group">
             <div className="absolute top-0 right-0 w-32 h-32 bg-neon-cyan/5 blur-3xl opacity-0 group-hover:opacity-100 transition-opacity" />
            
            <div className="flex items-center gap-3 mb-10 border-b border-white/5 pb-6">
                <Activity className="w-4 h-4 text-neon-cyan" />
                <h3 className="text-[10px] font-black text-white/40 uppercase tracking-[0.3em]">Map Core Metrics</h3>
            </div>

            <div className="space-y-12">
              <div className="space-y-3">
                <div className="flex items-center gap-3 text-white/20">
                  <Cpu className="w-4 h-4" />
                  <span className="text-[9px] font-black uppercase tracking-widest">Active_Nodes</span>
                </div>
                <div className="text-6xl font-black text-white italic tracking-tighter">{data.nodes.length}</div>
              </div>

              <div className="space-y-3">
                <div className="flex items-center gap-3 text-white/20">
                  <Share2 className="w-4 h-4" />
                  <span className="text-[9px] font-black uppercase tracking-widest">Logic_Links</span>
                </div>
                <div className="text-5xl font-black text-white/60 italic tracking-tighter">{data.links.length}</div>
              </div>
            </div>

            <div className="mt-auto pt-12 space-y-4">
                 <div className="p-4 bg-black/40 rounded-xl border border-white/5 text-[9px] font-mono text-white/20 leading-relaxed uppercase tracking-wider italic">
                    *Density nodes indicate semantic proximity within the vector space.
                 </div>
            </div>
          </div>
          
          <div className="relative group overflow-hidden rounded-[2rem] p-1 shadow-2xl">
            <div className="absolute inset-0 bg-gradient-to-br from-neon-cyan via-neon-violet to-neon-cyan animate-spin-slow opacity-20" />
            <div className="bg-black rounded-[23px] p-10 relative z-10 space-y-4 flex flex-col items-center text-center">
                 <div className="p-4 bg-white/5 rounded-2xl border border-white/10 mb-2">
                    <Database className="w-6 h-6 text-neon-cyan" />
                 </div>
                 <h4 className="text-[11px] font-black text-white uppercase tracking-[0.3em]">Cluster Sync</h4>
                 <p className="text-[10px] text-white/40 font-bold leading-relaxed italic">
                    Real-time synchronization with the decentralized knowledge repository.
                 </p>
                 <div className="w-full h-1.5 bg-white/5 rounded-full overflow-hidden mt-4">
                    <div className="w-[85%] h-full bg-neon-cyan shadow-[0_0_10px_rgba(0,255,242,0.8)]" />
                 </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

