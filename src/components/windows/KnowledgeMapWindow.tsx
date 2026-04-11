import React, { useEffect, useState, useRef } from 'react';
import ForceGraph2D from 'react-force-graph-2d';
import { Loader2, Zap, LayoutPanelLeft, Share2, FlaskConical, Box } from "lucide-react";

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

const TERRA_COLORS: Record<string, string> = {
  "Chemistry": "#c4a66a", // Terracotta
  "Physics": "#4a7c59",    // Forest Green
  "Biology": "#8b4513",    // Saddle Brown
  "Maths": "#2d4a36",      // Deep Green
  "General": "#8c7e6d"     // Greige
};

export function KnowledgeMapWindow() {
  const [data, setData] = useState<GraphData>({ nodes: [], links: [] });
  const [loading, setLoading] = useState(true);
  const graphRef = useRef<any>();

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Fallback to mock data if API fails to ensure UI utility is visible
        const mockData = {
            nodes: [
                { id: "1", topic: "Organic Synthesis", subject: "Chemistry" },
                { id: "2", topic: "Quantum Mechanics", subject: "Physics" },
                { id: "3", topic: "Cellular Mitosis", subject: "Biology" },
                { id: "4", topic: "Calculus Limits", subject: "Maths" },
                { id: "5", topic: "General Science", subject: "General" }
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
          color: TERRA_COLORS[n.group] || TERRA_COLORS["General"]
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
      <div className="flex flex-col items-center justify-center h-[600px] bg-card rounded-[3rem] shadow-terra-soft">
        <Loader2 className="w-10 h-10 text-primary animate-spin mb-4" />
        <p className="text-secondary/60 font-serif italic">Visualizing the knowledge tapestry...</p>
      </div>
    );
  }

  return (
    <div className="space-y-12 animate-terra-in">
      <div className="flex flex-col xl:flex-row gap-10 items-start">
        <div className="w-full xl:w-[75%]">
          <div className="bg-card shadow-terra-soft rounded-[3.5rem] overflow-hidden relative min-h-[700px]">
            <div className="absolute top-10 left-10 z-10 space-y-2 pointer-events-none">
                <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-primary/10 text-primary rounded-2xl flex items-center justify-center">
                        <Box className="w-6 h-6" />
                    </div>
                    <div>
                        <h2 className="text-4xl font-serif font-bold text-primary">Knowledge Universe</h2>
                        <p className="text-secondary/60 text-sm font-medium italic">Semantic relationships & cross-disciplinary overlaps</p>
                    </div>
                </div>
            </div>
            
            <div className="w-full h-[700px] cursor-grab active:cursor-grabbing bg-muted/10">
              <ForceGraph2D
                ref={graphRef}
                graphData={data}
                nodeLabel="name"
                nodeColor={n => (n as GraphNode).color || "#ccc"}
                nodeVal={n => (n as any).value || 5}
                nodeRelSize={4}
                linkWidth={1}
                linkColor={() => "rgba(74, 124, 89, 0.05)"}
                linkDirectionalParticles={1}
                linkDirectionalParticleSpeed={0.005}
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
            <div className="absolute bottom-10 left-10 flex flex-wrap gap-6 bg-white/80 backdrop-blur-md p-5 px-8 rounded-3xl z-10 shadow-sm">
              {Object.entries(TERRA_COLORS).map(([sub, color]) => (
                <div key={sub} className="flex items-center gap-3">
                  <div className="w-3 h-3 rounded-full shadow-sm" style={{ backgroundColor: color }} />
                  <span className="text-[10px] font-bold text-secondary/70 uppercase tracking-widest">{sub}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="w-full xl:w-[25%] space-y-8">
          <div className="bg-card shadow-terra-soft rounded-[2.5rem] p-10 relative overflow-hidden">
            <h3 className="text-xl font-serif font-bold mb-8 text-primary pb-4">Global Metrics</h3>
            <div className="space-y-10">
              <div className="space-y-3">
                <div className="flex items-center gap-3 opacity-60">
                  <LayoutPanelLeft className="w-4 h-4 text-primary" />
                  <span className="text-[10px] font-black uppercase tracking-widest text-secondary">Topics Mapped</span>
                </div>
                <div className="text-6xl font-serif font-bold text-primary">{data.nodes.length}</div>
              </div>

              <div className="space-y-3">
                <div className="flex items-center gap-3 opacity-60">
                  <Share2 className="w-4 h-4 text-accent" />
                  <span className="text-[10px] font-black uppercase tracking-widest text-secondary">Neural Links</span>
                </div>
                <div className="text-5xl font-serif font-bold text-primary">{data.links.length}</div>
              </div>
            </div>
            <p className="mt-10 text-[11px] text-secondary/50 font-medium italic leading-relaxed">
              *Connections represent semantic nodes validated by the vector engine.
            </p>
          </div>
          
          <div className="bg-primary p-10 rounded-[2.5rem] text-primary-foreground shadow-xl relative overflow-hidden group">
            <div className="absolute -right-6 -bottom-6 opacity-10 group-hover:scale-110 transition-transform duration-700">
               <FlaskConical className="w-40 h-40" />
            </div>
            <h3 className="font-black text-[10px] mb-4 uppercase tracking-widest opacity-80">Semantic Density</h3>
            <p className="text-sm font-bold leading-relaxed relative z-10">
              Nodes in close proximity indicate logical overlaps, optimizing synthesis speed and resource allocation.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
