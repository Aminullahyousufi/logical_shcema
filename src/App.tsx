import React, { useEffect, useState, useCallback } from 'react';
import { Graph } from '@antv/x6';
import 'bootstrap/dist/css/bootstrap.min.css';
import { Container, Row, Col, Modal, Button, Alert } from 'react-bootstrap';
import { useNavigate } from 'react-router-dom';
import Papa from 'papaparse';
import shape from './shape';

// Define TypeScript interfaces for node and edge data
interface LineStyle {
  stroke: string;
  strokeWidth: number;
  strokeDasharray?: string;
}

interface NodeData {
  id: string;
  label: string;
  x: number;
  y: number;
  type: string;
  fill?: string;
  width?: number;
  height?: number;
  stroke?: string;
  strokeWidth?: number;
}

interface EdgeData {
  source: string;
  target: string;
  id?: string;
  name?: string;
  type?: string;
}

const SvgPattern: React.FC = () => (
  <svg width="0" height="0">
    <defs>
      <pattern id="crosshatch-blue" patternUnits="userSpaceOnUse" width="10" height="10">
        <path d="M 0 0 L 10 10 M 10 0 L 0 10" stroke="#3366cc" strokeWidth="2" />
      </pattern>
    </defs>
  </svg>
);

const ArrowLine: React.FC = () => (
  <svg width="50" height="50">
    <defs>
      <marker id="arrowhead" markerWidth="10" markerHeight="7" refX="10" refY="3.5" orient="auto">
        <polygon points="0 0, 10 3.5, 0 7" fill="black" />
      </marker>
    </defs>
    <line x1="0" y1="25" x2="50" y2="25" stroke="black" strokeWidth="2" markerEnd="url(#arrowhead)" />
  </svg>
);

const DashedArrowLine: React.FC = () => (
  <svg width="50" height="50">
    <defs>
      <marker id="dashed-arrowhead" markerWidth="10" markerHeight="7" refX="10" refY="3.5" orient="auto">
        <polygon points="0 0, 10 3.5, 0 7" fill="black" />
      </marker>
    </defs>
    <line x1="0" y1="25" x2="50" y2="25" stroke="black" strokeWidth="2" strokeDasharray="5, 5" markerEnd="url(#dashed-arrowhead)" />
  </svg>
);

const SimpleLine: React.FC = () => (
  <svg width="50" height="50">
    <line x1="0" y1="25" x2="50" y2="25" stroke="black" strokeWidth="2" />
  </svg>
);

const GraphContainer: React.FC<{ graph: Graph | null, onNodeClick: (args: { cell: any }) => void }> = ({ graph, onNodeClick }) => {
  useEffect(() => {
    if (graph) {
      graph.on('node:click', onNodeClick);
    }
    return () => {
      if (graph) {
        graph.off('node:click', onNodeClick);
      }
    };
  }, [graph, onNodeClick]);

  return (
    <div id="graph" style={{ width: '100%', height: '100vh', border: '1px solid #ccc' }}></div>
  );
};

const FileUpload: React.FC<{ onFileUpload: (event: React.ChangeEvent<HTMLInputElement>) => void }> = ({ onFileUpload }) => (
  <input
    type="file"
    accept=".xml,.csv"
    onChange={onFileUpload}
    className="form-control mb-3"
  />
);

const ShapeSample: React.FC<{ type: string, label: string, fill?: string, stroke?: string, strokeWidth?: number }> = ({ type, label, fill, stroke, strokeWidth }) => {
  const width = type === 'circle' ? 50 : 100;
  const height = 50;
  return (
    <div style={{ border: '1px solid #ccc', padding: '10px', marginBottom: '10px', textAlign: 'center' }}>
      <svg width={width} height={height}>
        {type === 'circle' ? (
          <circle cx="25" cy="25" r="25" fill={fill} stroke={stroke} strokeWidth={strokeWidth} />
        ) : (
          <rect width={width} height={height} fill={fill} stroke={stroke} strokeWidth={strokeWidth} />
        )}
      </svg>
      <div>{label}</div>
    </div>
  );
};

const App: React.FC = () => {
  const [graph, setGraph] = useState<Graph | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [selectedNode, setSelectedNode] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    const newGraph = new Graph({
      container: document.getElementById('graph')!,
      grid: true,
      connecting: {
        anchor: 'center',
        connectionPoint: 'boundary',
        snap: { radius: 10 },
        connector: {
          name: 'rounded',
          args: {
            stroke: 'purple',
            strokeWidth: 2,
            targetMarker: {
              name: 'marker',
              args: {
                size: 8,
                fill: 'purple',
                stroke: 'purple',
                shape: 'diamond',
              },
            },
            sourceMarker: {
              name: 'marker',
              args: {
                size: 8,
                fill: 'purple',
                stroke: 'purple',
                shape: 'circle',
              },
            },
          },
        },
      },
    });
    setGraph(newGraph);

    return () => {
      newGraph.dispose();
    };
  }, []);

  const handleNodeClick = useCallback(({ cell }: { cell: any }) => {
    if (graph && cell) {
      const clickedNode = graph.getCellById(cell.id);
      if (clickedNode && clickedNode.isNode()) {
        setSelectedNode(clickedNode.id);
        setShowModal(true);
      }
    }
  }, [graph]);

  const handleCopyNode = useCallback(() => {
    if (graph && selectedNode) {
      const clickedNode = graph.getCellById(selectedNode);
      if (clickedNode && clickedNode.isNode()) {
        const { shape, x, y, width, height, label, attrs } = clickedNode.toJSON();
        const copiedNode = graph.addNode({
          shape,
          x: x + 100,
          y: y + 100,
          width,
          height,
          label,
          attrs,
        });

        graph.addEdge({
          source: { cell: clickedNode.id },
          target: { cell: copiedNode.id },
          attrs: {
            line: {
              stroke: '#000',
              strokeWidth: 2,
              strokeDasharray: '5, 5',
            },
            sourceMarker: {
              name: 'marker',
              args: {
                size: 8,
                fill: 'purple',
                stroke: 'purple',
                shape: 'circle',
              },
            },
            targetMarker: {
              name: 'marker',
              args: {
                size: 8,
                fill: 'purple',
                stroke: 'purple',
                shape: 'diamond',
              },
            },
          },
        });
      }
    }
    setShowModal(false);
  }, [graph, selectedNode]);

  const handleDeleteNode = useCallback(() => {
    if (graph && selectedNode) {
      const cell = graph.getCellById(selectedNode);
      if (cell) {
        graph.removeCell(cell);
      }
    }
    setShowModal(false);
  }, [graph, selectedNode]);

  const processXML = useCallback((xmlContent: string) => {
    try {
      const parser = new DOMParser();
      const xmlDoc = parser.parseFromString(xmlContent, 'application/xml');

      const nodes: NodeData[] = Array.from(xmlDoc.getElementsByTagName('node')).map(node => ({
        id: node.getAttribute('id')!,
        label: node.getAttribute('label')!,
        x: parseInt(node.getAttribute('x')!, 10),
        y: parseInt(node.getAttribute('y')!, 10),
        type: node.getAttribute('type')!,
        fill: node.getAttribute('fill') || '#3366cc',
        width: parseInt(node.getAttribute('width') || '100', 10),
        height: parseInt(node.getAttribute('height') || '100', 10),
        stroke: node.getAttribute('stroke') || '#000',
        strokeWidth: parseInt(node.getAttribute('strokeWidth') || '1', 10),
      }));

      const edges: EdgeData[] = Array.from(xmlDoc.getElementsByTagName('edge')).map(edge => ({
        source: edge.getAttribute('source')!,
        target: edge.getAttribute('target')!,
        id: edge.getAttribute('id') || undefined,
        name: edge.getAttribute('name') || undefined,
        type: edge.getAttribute('type') || 'solid', // Default to solid if type is not provided
      }));

      console.log('Parsed Nodes:', nodes);
      console.log('Parsed Edges:', edges);

      if (graph) {
        graph.clearCells();

        nodes.forEach(node => {
          graph.addNode({
            id: node.id,
            label: node.label,
            x: node.x,
            y: node.y,
            width: node.width,
            height: node.type === 'rectangle' ? 50 : node.height,
            shape: node.type,
            attrs: {
              body: { fill: node.fill, stroke: node.stroke, strokeWidth: node.strokeWidth },
              label: { text: node.label },
            },
          });
        });

        edges.forEach(edge => {
          graph.addEdge({
            source: { cell: edge.source },
            target: { cell: edge.target },
            attrs: {
              line: {
                stroke: '#000',
                strokeWidth: 2,
                strokeDasharray: edge.type === 'dashed' ? '5, 5' : edge.type === 'dotted' ? '2, 2' : undefined,
              },
              sourceMarker: {
                name: 'marker',
                args: {
                  size: 8,
                  fill: 'purple',
                  stroke: 'purple',
                  shape: 'circle',
                },
              },
              targetMarker: {
                name: 'marker',
                args: {
                  size: 8,
                  fill: 'purple',
                  stroke: 'purple',
                  shape: 'diamond',
                },
              },
              label: {
                text: edge.name || '',
                fill: '#333',
                fontSize: 12,
              },
            },
          });
        });
      }
    } catch (error) {
      setError('Error processing the XML file. Please check the file format and try again.');
    }
  }, [graph]);

  const processCSV = useCallback((csvContent: string) => {
    try {
      const [nodesContent, edgesContent] = csvContent.split('---');

      if (!nodesContent || !edgesContent) {
        setError('Invalid CSV format. Please ensure nodes and edges are separated by "---".');
        return;
      }

      const nodesData = Papa.parse<NodeData>(nodesContent.trim(), { header: true, skipEmptyLines: true }).data;
      const edgesData = Papa.parse<EdgeData>(edgesContent.trim(), { header: true, skipEmptyLines: true }).data;

      console.log('Parsed Nodes Data:', nodesData);
      console.log('Parsed Edges Data:', edgesData);

      if (graph) {
        graph.clearCells();

        nodesData.forEach((node) => {
          if (node.id && node.label && node.x !== undefined && node.y !== undefined && node.type) {
            graph.addNode({
              id: node.id,
              label: node.label,
              x: parseFloat(node.x.toString()),
              y: parseFloat(node.y.toString()),
              width: parseFloat(node.width?.toString() || '100'),
              height: node.type === 'rectangle' ? 50 : parseFloat(node.height?.toString() || '100'),
              shape: node.type,
              attrs: {
                body: { fill: node.fill || '#3366cc', stroke: node.stroke, strokeWidth: node.strokeWidth || 1 },
                label: { text: node.label },
              },
            });
          } else {
            console.error('Invalid node data:', node);
          }
        });

        edgesData.forEach((edge) => {
          if (edge.source && edge.target) {
            graph.addEdge({
              source: { cell: edge.source },
              target: { cell: edge.target },
              attrs: {
                line: {
                  stroke: 'purple',
                  strokeWidth: 2,
                  strokeDasharray: edge.type === 'dashed' ? '5, 5' : edge.type === 'dotted' ? '2, 2' : undefined,
                },
                sourceMarker: {
                  name: 'marker',
                  args: {
                    size: 8,
                    fill: 'purple',
                    stroke: 'purple',
                    shape: 'circle',
                  },
                },
                targetMarker: {
                  name: 'marker',
                  args: {
                    size: 8,
                    fill: 'purple',
                    stroke: 'purple',
                    shape: 'diamond',
                  },
                },
              },
            });
          } else {
            console.error('Invalid edge data:', edge);
          }
        });
      }
    } catch (error) {
      console.error('Error processing the CSV files:', error);
      setError('Error processing the CSV files. Please check the file format and try again.');
    }
  }, [graph]);

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        if (event.target?.result) {
          const content = event.target.result as string;
          if (file.type === 'text/xml') {
            processXML(content);
          } else if (file.type === 'text/csv') {
            processCSV(content);
          } else {
            setError('Unsupported file type. Please upload XML or CSV files.');
          }
        }
      };
      reader.onerror = () => {
        setError('Error reading the file. Please try again.');
      };
      reader.readAsText(file);
    }
  };

  const handleOpenArchitecture = useCallback(() => {
    navigate('/data-lake-architecture', { replace: true });
  }, [navigate]);
  return (
    <Container fluid>
      <Row className="mb-3">
        <Col xs={12} className="text-center">
          <h1 className="my-4">Logical Schema</h1>
        </Col>
      </Row>
      <Row>
        <Col xs={12} md={2} className="d-flex flex-column justify-content-start">
          <FileUpload onFileUpload={handleFileUpload} />
          {error && <Alert variant="danger" className="mt-3">{error}</Alert>}
          <Button
            onClick={handleOpenArchitecture}
            className="mb-3 btn-sm"
            variant="primary"
          >
            Architecture
          </Button>
          <ShapeSample type="rectangle" label="Databases" fill="#00008B" stroke="#00008B" strokeWidth={3} />
          <ShapeSample type="rectangle" label="Entities" fill="#ADD8E6" />
          <ShapeSample type="circle" label="Attributes" fill="#ADD8E6" />
          <div style={{ display: 'flex', alignItems: 'center', marginBottom: '10px' }}>
            <span style={{ marginRight: '10px' }}>Edge</span>
            <ArrowLine />
          </div>
          <div style={{ display: 'flex', alignItems: 'center', marginBottom: '10px' }}>
            <span style={{ marginRight: '10px' }}>Join</span>
            <DashedArrowLine />
          </div>
          <div style={{ display: 'flex', alignItems: 'center' }}>
            <span style={{ marginRight: '10px' }}>Simple Line</span>
            <SimpleLine />
          </div>
        </Col>
        <Col xs={12} md={10}>
          <GraphContainer graph={graph} onNodeClick={handleNodeClick} />
          <SvgPattern />
        </Col>
      </Row>
      <Modal show={showModal} onHide={() => setShowModal(false)}>
        <Modal.Header closeButton>
          <Modal.Title>Node Actions</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Button variant="primary" onClick={handleCopyNode} className="me-2">Copy Node</Button>
          <Button variant="danger" onClick={handleDeleteNode}>Delete Node</Button>
        </Modal.Body>
      </Modal>
    </Container>
  );
};
export default App;
