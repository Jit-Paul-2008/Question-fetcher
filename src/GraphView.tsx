import React, { useEffect, useState, useRef } from 'react';
import ForceGraph2D from 'react-force-graph-2d';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Loader2, Zap, LayoutPanelLeft, Share2 } from "lucide-react";

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
  "Chemistry": "#f59e0b", // Amber
  "Physics": "#3b82f6",    // Blue
  "Biology": "#10b981",    // Green
  "Maths": "#8b5cf6",      // Purple
  "General": "#6b7280"     // Gray
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
      <div className="flex flex-col items-center justify-center h-[600px] bg-claude-ivory rounded-claude-2xl border border-claude-border-cream">
        <Loader2 className="w-10 h-10 text-claude-terracotta animate-spin mb-4" />
        <p className="text-claude-olive-gray font-medium">Visualizing your database...</p>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-6 duration-1000">
      <div className="flex flex-col xl:flex-row gap-8 items-start">
        <div className="w-full xl:w-[78%]">
          <Card className="premium-card border-none shadow-claude-whisper bg-white/50 backdrop-blur-sm rounded-claude-3xl overflow-hidden relative min-h-[650px] border border-white/40">
            <CardHeader className="absolute top-0 left-0 z-10 p-10 bg-gradient-to-b from-white via-white/40 to-transparent w-full pointer-events-none">
              <CardTitle className="flex items-center gap-4 text-4xl font-serif pointer-events-auto text-gradient">
                <Zap className="w-8 h-8 text-primary shadow-primary/20" />
                Knowledge Universe
              </CardTitle>
              <CardDescription className="text-muted-foreground text-base max-w-xl mt-2 pointer-events-auto leading-relaxed">
                A globally shared semantic map of all human knowledge discovered on ChemScan. 
                Connected nodes share deep logical relationships and cross-disciplinary overlaps.
              </CardDescription>
            </CardHeader>
            
            <div className="w-full h-[650px] cursor-grab active:cursor-grabbing">
              <ForceGraph2D
                ref={graphRef}
                graphData={data}
                nodeLabel="topic"
                nodeColor={n => (n as GraphNode).color || "#ccc"}
                nodeRelSize={9}
                linkWidth={2}
                linkColor={() => "#d1563122"}
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
            <div className="absolute bottom-8 left-8 flex flex-wrap gap-6 glass p-4 rounded-2xl z-10">
              {Object.entries(SUBJECT_COLORS).map(([sub, color]) => (
                <div key={sub} className="flex items-center gap-2.5">
                  <div className="w-4 h-4 rounded-full shadow-lg" style={{ backgroundColor: color }} />
                  <span className="text-[11px] font-bold text-foreground/70 uppercase tracking-[0.1em]">{sub}</span>
                </div>
              ))}
            </div>
          </Card>
        </div>

        <div className="w-full xl:w-[22%] space-y-8">
          <Card className="premium-card border-none shadow-claude-whisper bg-white rounded-claude-3xl p-8 border border-white/60">
            <h3 className="text-2xl font-serif font-medium mb-6 text-foreground">Global Insights</h3>
            <div className="space-y-6">
              <div className="space-y-2">
                <div className="flex items-center gap-3">
                  <LayoutPanelLeft className="w-5 h-5 text-primary" />
                  <span className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Total Entities</span>
                </div>
                <div className="text-5xl font-serif font-medium text-foreground">{data.nodes.length}</div>
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
          
          <div className="glass bg-primary p-8 rounded-claude-3xl text-white shadow-2xl relative overflow-hidden group">
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
