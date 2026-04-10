import React, { useEffect, useState, useRef } from 'react';
import ForceGraph2D from 'react-force-graph-2d';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "./components/ui/card";
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
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <div className="flex flex-col md:flex-row gap-6 items-start">
        <div className="w-full md:w-3/4">
          <Card className="border-none shadow-claude-whisper bg-claude-ivory rounded-claude-2xl overflow-hidden relative min-h-[600px]">
            <CardHeader className="absolute top-0 left-0 z-10 p-6 bg-gradient-to-b from-claude-ivory via-claude-ivory/80 to-transparent w-full pointer-events-none">
              <CardTitle className="flex items-center gap-3 text-2xl pointer-events-auto">
                <Zap className="w-6 h-6 text-amber-500 fill-amber-500" />
                Knowledge Universe
              </CardTitle>
              <CardDescription className="text-claude-olive-gray pointer-events-auto">
                A semantic map of every topic in your database. Connected nodes share deep logical relationships.
              </CardDescription>
            </CardHeader>
            
            <div className="w-full h-[600px] cursor-grab active:cursor-grabbing">
              <ForceGraph2D
                ref={graphRef}
                graphData={data}
                nodeLabel="topic"
                nodeColor={n => (n as GraphNode).color || "#ccc"}
                nodeRelSize={7}
                linkWidth={1.5}
                linkColor={() => "#e5e7eb"}
                linkDirectionalParticles={2}
                linkDirectionalParticleSpeed={0.005}
                backgroundColor="#fdfcfb" // Match claude-ivory
                cooldownTicks={100}
                onNodeClick={(node: any) => {
                  if (graphRef.current) {
                    graphRef.current.centerAt(node.x, node.y, 1000);
                    graphRef.current.zoom(3, 1000);
                  }
                }}
              />
            </div>
            
            {/* Legend */}
            <div className="absolute bottom-4 left-4 flex flex-wrap gap-4 bg-white/80 backdrop-blur-sm p-3 rounded-lg border border-gray-100 shadow-sm z-10">
              {Object.entries(SUBJECT_COLORS).map(([sub, color]) => (
                <div key={sub} className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full" style={{ backgroundColor: color }} />
                  <span className="text-[10px] font-bold text-gray-600 uppercase tracking-wider">{sub}</span>
                </div>
              ))}
            </div>
          </Card>
        </div>

        <div className="w-full md:w-1/4 space-y-6">
          <Card className="border-none shadow-claude-whisper bg-white rounded-claude-2xl p-6">
            <h3 className="text-lg font-serif font-medium mb-4">Database Stats</h3>
            <div className="space-y-4">
              <div className="flex items-center justify-between p-3 bg-claude-parchment rounded-xl">
                <div className="flex items-center gap-3">
                  <LayoutPanelLeft className="w-5 h-5 text-claude-terracotta" />
                  <span className="text-sm font-medium">Total Banks</span>
                </div>
                <span className="text-xl font-bold">{data.nodes.length}</span>
              </div>
              <div className="flex items-center justify-between p-3 bg-claude-parchment rounded-xl">
                <div className="flex items-center gap-3">
                  <Share2 className="w-5 h-5 text-blue-500" />
                  <span className="text-sm font-medium">Connections</span>
                </div>
                <span className="text-xl font-bold">{data.links.length}</span>
              </div>
            </div>
            <p className="mt-6 text-xs text-claude-olive-gray italic leading-relaxed">
              *Connections represent a semantic similarity score of 0.88 or higher between search vectors.
            </p>
          </Card>
          
          <Card className="border-none shadow-claude-whisper bg-claude-terracotta text-white rounded-claude-2xl p-6">
            <h3 className="font-bold text-sm mb-2 uppercase tracking-widest">Semantic Proximity</h3>
            <p className="text-sm opacity-90 leading-relaxed">
              The closer two nodes are, the more likely the AI will reuse cached questions, saving you credits and loading instantly.
            </p>
          </Card>
        </div>
      </div>
    </div>
  );
}
