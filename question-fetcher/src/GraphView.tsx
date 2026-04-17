import React, { useEffect, useState, useRef } from 'react';
import ForceGraph2D from 'react-force-graph-2d';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Loader2, Zap, LayoutPanelLeft, Share2, FlaskConical } from "lucide-react";
import { Separator } from "@/components/ui/separator";

interface GraphNode {
  id: string;
  topic: string;
  subject: string;
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

const SUBJECT_COLORS: Record<string, string> = {
  "Chemistry": "#d4af37", // Gold
  "Physics": "#34d399",    // Emerald
  "Biology": "#b45309",    // Amber/Bronze
  "Maths": "#6366f1",      // Indigo
  "General": "#94a3b8"     // Slate
};

export default function GraphView() {
  const [data, setData] = useState<GraphData>({ nodes: [], links: [] });
  const [loading, setLoading] = useState(true);
  const graphRef = useRef<any>();

  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await fetch('/api/graph-data');
        const json = await res.json();
        
        // Enhance nodes with colors
        const enhancedNodes = json.nodes.map((n: any) => ({
          ...n,
          color: SUBJECT_COLORS[n.subject] || SUBJECT_COLORS["General"]
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
      <div className="flex flex-col items-center justify-center h-[600px] bg-card rounded-royal-2xl border border-royal-border-gold shadow-inner">
        <Loader2 className="w-10 h-10 text-royal-gold animate-spin mb-4" />
        <p className="text-royal-muted-foreground font-serif italic">Visualizing the knowledge tapestry...</p>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-6 duration-1000">
      <div className="flex flex-col xl:flex-row gap-8 items-start">
        <div className="w-full xl:w-[78%]">
          <Card className="premium-card border-none shadow-royal-glow bg-card backdrop-blur-md rounded-royal-3xl overflow-hidden relative min-h-[650px] border border-royal-border-gold/20">
            <CardHeader className="absolute top-0 left-0 z-10 p-10 bg-gradient-to-b from-card via-card/40 to-transparent w-full pointer-events-none">
              <div className="flex justify-between items-start pointer-events-auto">
                <div>
                  <CardTitle className="flex items-center gap-4 text-4xl font-serif text-gradient">
                    <Zap className="w-8 h-8 text-primary shadow-primary/20" />
                    Knowledge Universe
                  </CardTitle>
                  <CardDescription className="text-muted-foreground text-sm max-w-xl mt-2 leading-relaxed font-serif italic">
                    Connected nodes share deep logical relationships and cross-disciplinary overlaps.
                  </CardDescription>
                </div>
                <div className="calligraphy text-2xl text-royal-gold opacity-60 lowercase pr-4">universal sync</div>
              </div>
            </CardHeader>
            
            <div className="w-full h-[650px] cursor-grab active:cursor-grabbing">
              <ForceGraph2D
                ref={graphRef}
                graphData={data}
                nodeLabel="topic"
                nodeColor={n => (n as GraphNode).color || "#ccc"}
                nodeRelSize={9}
                linkWidth={2}
                linkColor={() => "#d4af3744"}
                linkDirectionalParticles={3}
                linkDirectionalParticleSpeed={0.007}
                backgroundColor="transparent"
                cooldownTicks={150}
                onNodeClick={(node: any) => {
                  if (graphRef.current) {
                    graphRef.current.centerAt(node.x, node.y, 1000);
                    graphRef.current.zoom(3.5, 1000);
                  }
                }}
              />
            </div>
            
            {/* Legend */}
            <div className="absolute bottom-8 left-8 flex flex-wrap gap-6 glass-dark p-4 px-6 rounded-royal-2xl z-10 border border-royal-border-gold/30">
              {Object.entries(SUBJECT_COLORS).map(([sub, color]) => (
                <div key={sub} className="flex items-center gap-2.5">
                  <div className="w-3 h-3 rounded-full shadow-[0_0_8px_rgba(212,175,55,0.3)]" style={{ backgroundColor: color }} />
                  <span className="text-[9px] font-black text-white/70 uppercase tracking-[0.2em]">{sub}</span>
                </div>
              ))}
            </div>
          </Card>
        </div>

        <div className="w-full xl:w-[22%] space-y-8">
          <Card className="premium-card border-none shadow-royal-glow bg-card rounded-royal-3xl p-8 border border-royal-gold/10 relative overflow-hidden">
            <div className="absolute top-0 right-0 p-4 calligraphy text-xl opacity-10">Insights</div>
            <h3 className="text-2xl font-serif font-medium mb-8 text-foreground pb-2 border-b border-royal-gold/20">Global Metrics</h3>
            <div className="space-y-8">
              <div className="space-y-3">
                <div className="flex items-center gap-3">
                  <LayoutPanelLeft className="w-5 h-5 text-royal-gold" />
                  <span className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground">Topics Discovered</span>
                </div>
                <div className="text-6xl font-serif font-medium text-foreground">{data.nodes.length}</div>
              </div>

              <Separator className="bg-border/60" />

              <div className="space-y-2">
                <div className="flex items-center gap-3">
                  <Share2 className="w-5 h-5 text-blue-500" />
                  <span className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Neural Links</span>
                </div>
                <div className="text-5xl font-serif font-medium text-foreground">{data.links.length}</div>
              </div>
            </div>
            <p className="mt-8 text-[11px] text-muted-foreground italic leading-relaxed">
              *Connections represent a cross-user semantic similarity score validated by the vector database.
            </p>
          </Card>
          
          <div className="glass bg-primary p-8 rounded-royal-3xl text-primary-foreground shadow-2xl relative overflow-hidden group">
            <div className="absolute -right-4 -bottom-4 opacity-10 group-hover:scale-110 transition-transform duration-700">
               <FlaskConical className="w-32 h-32" />
            </div>
            <h3 className="font-bold text-xs mb-3 uppercase tracking-[0.2em] opacity-80">Semantic Density</h3>
            <p className="text-base font-medium leading-relaxed">
              The closer two nodes are, the more logical power the AI has to reuse patterns, reducing your token usage and ensuring maximum speed.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
