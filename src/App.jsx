import { useState, useRef, useCallback, useEffect } from 'react';
import ControlPanel from './components/ControlPanel';
import PatternCanvas from './components/PatternCanvas';
import './App.css';

import * as flowField from './patterns/flow-field';
import * as wave from './patterns/wave';
import * as topo from './patterns/topo';
import * as dotMatrix from './patterns/dot-matrix';
import * as network from './patterns/network';
import * as voronoi from './patterns/voronoi';
import * as hatch from './patterns/hatch';
import * as depthTopo from './patterns/depth-topo';

const PATTERN_MODULES = {
  flow: flowField,
  wave: wave,
  topo: topo,
  dots: dotMatrix,
  net: network,
  voronoi: voronoi,
  hatch: hatch,
  depthtopo: depthTopo,
};

function buildDefaultParams(mod) {
  const params = {};
  for (const ctrl of mod.controls) {
    params[ctrl.id] = ctrl.defaultValue;
  }
  if (mod.extraControls) {
    for (const ctrl of mod.extraControls) {
      params[ctrl.id] = ctrl.defaultValue;
    }
  }
  return params;
}

function buildAllDefaults() {
  const all = {};
  for (const [key, mod] of Object.entries(PATTERN_MODULES)) {
    all[key] = buildDefaultParams(mod);
  }
  return all;
}

export default function App() {
  const [activeTab, setActiveTab] = useState('flow');
  const [allParams, setAllParams] = useState(buildAllDefaults);
  const [style, setStyle] = useState({ strokeColor: '#ffffff', bgColor: '#1a4d5c', canvasSize: 700 });
  const [svgContent, setSvgContent] = useState('');
  const [undoState, setUndoState] = useState(null);

  // Depth topo state
  const [depthStatusText, setDepthStatusText] = useState('No image selected');
  const depthImageRef = useRef(null);
  const depthImageDataRef = useRef(null);
  const depthMapDataRef = useRef(null);
  const depthImageUrlRef = useRef(null);
  const depthPipelineRef = useRef(null);
  const depthPipelineLoadingRef = useRef(false);

  const canvasRef = useRef(null);
  const canvasOriginalRef = useRef(null);
  const canvasDepthRef = useRef(null);
  const canvasTopoRef = useRef(null);

  const patternModule = PATTERN_MODULES[activeTab];
  const params = allParams[activeTab];

  const captureState = useCallback(() => ({
    tab: activeTab,
    svgContent,
    params: { ...allParams[activeTab] },
    style: { ...style },
  }), [activeTab, svgContent, allParams, style]);

  const regenerate = useCallback(() => {
    if (activeTab === 'depthtopo') {
      generateDepthTopo();
      return;
    }

    const canvas = canvasRef.current;
    if (!canvas) return;

    canvas.width = style.canvasSize;
    canvas.height = style.canvasSize;

    const svg = patternModule.generate(canvas, params, style);
    setSvgContent(svg);
  }, [activeTab, params, style, patternModule]);

  const generateDepthTopo = useCallback(() => {
    const dtParams = allParams.depthtopo;

    if (!depthImageRef.current || !depthMapDataRef.current) {
      // Draw placeholders
      const canvasIds = [canvasOriginalRef, canvasDepthRef, canvasTopoRef];
      const labels = ['Upload an image', 'Depth map preview', 'Topo result'];
      canvasIds.forEach((ref, index) => {
        const canvas = ref.current;
        if (!canvas) return;
        canvas.width = 300;
        canvas.height = 300;
        const ctx = canvas.getContext('2d');
        ctx.fillStyle = '#1a1a1a';
        ctx.fillRect(0, 0, 300, 300);
        ctx.strokeStyle = '#333';
        ctx.lineWidth = 2;
        ctx.setLineDash([8, 8]);
        ctx.strokeRect(20, 20, 260, 260);
        ctx.setLineDash([]);
        ctx.fillStyle = '#444';
        ctx.font = '12px -apple-system, sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText(labels[index], 150, 150);
      });
      setSvgContent('');
      return;
    }

    const width = depthImageDataRef.current.width;
    const height = depthImageDataRef.current.height;

    // Original
    const co = canvasOriginalRef.current;
    co.width = width;
    co.height = height;
    co.getContext('2d').drawImage(depthImageRef.current, 0, 0, width, height);

    // Topo result
    const ct = canvasTopoRef.current;
    ct.width = width;
    ct.height = height;

    const result = depthTopo.generate(ct, dtParams, depthMapDataRef.current, width, height);

    // Depth map viz
    const cd = canvasDepthRef.current;
    cd.width = width;
    cd.height = height;
    depthTopo.drawDepthMapVisualization(cd.getContext('2d'), result.processedDepthMap, width, height);

    setSvgContent(result.svg);
  }, [allParams]);

  // Re-render on param/style change
  useEffect(() => {
    regenerate();
  }, [regenerate]);

  // Init depth pipeline on mount
  useEffect(() => {
    async function initDepthPipeline() {
      if (depthPipelineLoadingRef.current || depthPipelineRef.current) return;
      depthPipelineLoadingRef.current = true;
      try {
        const { pipeline, env } = await import('https://cdn.jsdelivr.net/npm/@xenova/transformers@2.17.2');
        env.allowLocalModels = false;
        depthPipelineRef.current = await pipeline('depth-estimation', 'Xenova/depth-anything-small-hf');
      } catch (error) {
        console.error('Failed to load depth model:', error);
        depthPipelineLoadingRef.current = false;
      }
    }
    setTimeout(initDepthPipeline, 2000);
  }, []);

  const handleTabChange = useCallback((tab) => {
    setUndoState(captureState());
    setActiveTab(tab);
  }, [captureState]);

  const handleParamChange = useCallback((id, value) => {
    setUndoState(captureState());
    setAllParams(prev => ({
      ...prev,
      [activeTab]: { ...prev[activeTab], [id]: value },
    }));
  }, [activeTab, captureState]);

  const handleDepthTopoParamChange = useCallback((id, value) => {
    setUndoState(captureState());
    setAllParams(prev => ({
      ...prev,
      depthtopo: { ...prev.depthtopo, [id]: value },
    }));
  }, [captureState]);

  const handleStyleChange = useCallback((key, value) => {
    setUndoState(captureState());
    setStyle(prev => ({ ...prev, [key]: value }));
  }, [captureState]);

  const handlePresetApply = useCallback((name) => {
    setUndoState(captureState());
    const preset = patternModule.presets[name];
    setAllParams(prev => ({
      ...prev,
      [activeTab]: { ...prev[activeTab], ...preset },
    }));
  }, [activeTab, patternModule, captureState]);

  const handleRandomize = useCallback(() => {
    if (activeTab === 'depthtopo') return;
    setUndoState(captureState());
    const newSeed = Math.floor(Math.random() * 9999);
    setAllParams(prev => ({
      ...prev,
      [activeTab]: { ...prev[activeTab], seed: newSeed },
    }));
  }, [activeTab, captureState]);

  const handleUndo = useCallback(() => {
    if (!undoState) return;
    setActiveTab(undoState.tab);
    setAllParams(prev => ({
      ...prev,
      [undoState.tab]: undoState.params,
    }));
    setStyle(undoState.style);
    setSvgContent(undoState.svgContent);
    setUndoState(null);
  }, [undoState]);

  useEffect(() => {
    const handler = (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'z') {
        e.preventDefault();
        handleUndo();
      }
    };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [handleUndo]);

  const handleExportSVG = useCallback(() => {
    if (!svgContent) return;
    const blob = new Blob([svgContent], { type: 'image/svg+xml' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${activeTab}-pattern-${Date.now()}.svg`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }, [svgContent, activeTab]);

  const handleExportPNG = useCallback(() => {
    const canvas = activeTab === 'depthtopo' ? canvasTopoRef.current : canvasRef.current;
    if (!canvas) return;
    const url = canvas.toDataURL('image/png');
    const a = document.createElement('a');
    a.href = url;
    a.download = `${activeTab}-pattern-${Date.now()}.png`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  }, [activeTab]);

  const handleCopySVG = useCallback(() => {
    if (!svgContent) return;
    const textarea = document.createElement('textarea');
    textarea.value = svgContent;
    textarea.style.position = 'fixed';
    textarea.style.left = '-9999px';
    document.body.appendChild(textarea);
    textarea.focus();
    textarea.select();
    try {
      document.execCommand('copy');
    } catch (err) {
      console.error('Failed to copy:', err);
    }
    document.body.removeChild(textarea);
  }, [svgContent]);

  const handleDepthImageUpload = useCallback(async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    setDepthStatusText('Loading image...');

    const reader = new FileReader();
    reader.onload = async (e) => {
      depthImageUrlRef.current = e.target.result;
      const img = new Image();
      img.onload = async () => {
        depthImageRef.current = img;

        const maxDim = 500;
        let width = img.width;
        let height = img.height;
        if (width > maxDim || height > maxDim) {
          const s = maxDim / Math.max(width, height);
          width = Math.floor(width * s);
          height = Math.floor(height * s);
        }

        const tempCanvas = document.createElement('canvas');
        tempCanvas.width = width;
        tempCanvas.height = height;
        const tempCtx = tempCanvas.getContext('2d');
        tempCtx.drawImage(img, 0, 0, width, height);
        depthImageDataRef.current = tempCtx.getImageData(0, 0, width, height);

        if (depthPipelineRef.current) {
          setDepthStatusText('Generating AI depth map...');
          try {
            const depthResult = await depthPipelineRef.current(depthImageUrlRef.current);
            depthMapDataRef.current = depthTopo.convertDepthResultToMap(depthResult, width, height);
            setDepthStatusText(file.name + ' (AI depth)');
          } catch (error) {
            console.error('AI depth failed, using luminance:', error);
            depthMapDataRef.current = depthTopo.computeDepthMap(depthImageDataRef.current);
            setDepthStatusText(file.name + ' (luminance fallback)');
          }
        } else {
          depthMapDataRef.current = depthTopo.computeDepthMap(depthImageDataRef.current);
          setDepthStatusText(file.name + ' (loading AI...)');
        }

        // Trigger re-render
        setAllParams(prev => ({ ...prev }));
      };
      img.src = e.target.result;
    };
    reader.readAsDataURL(file);
  }, []);

  const handleRegenerateAI = useCallback(async () => {
    if (!depthImageUrlRef.current || !depthImageRef.current) {
      setDepthStatusText('Upload an image first');
      return;
    }
    if (!depthPipelineRef.current) {
      setDepthStatusText('AI model still loading...');
      return;
    }

    setDepthStatusText('Generating AI depth map...');
    try {
      const depthResult = await depthPipelineRef.current(depthImageUrlRef.current);
      const width = depthImageDataRef.current.width;
      const height = depthImageDataRef.current.height;
      depthMapDataRef.current = depthTopo.convertDepthResultToMap(depthResult, width, height);
      setDepthStatusText('AI depth generated');
      setAllParams(prev => ({ ...prev }));
    } catch (error) {
      console.error('AI depth failed:', error);
      setDepthStatusText('AI depth failed - check console');
    }
  }, []);

  const isDepthTopo = activeTab === 'depthtopo';
  const [isPanelOpen, setIsPanelOpen] = useState(true);

  return (
    <>
      <div className="canvas-area">
        {!isDepthTopo && (
          <PatternCanvas
            ref={canvasRef}
            size={style.canvasSize}
            bgColor={style.bgColor}
          />
        )}

        {isDepthTopo && (
          <div className={`triple-canvas-view${isDepthTopo ? ' active' : ''}`}>
            <div className="canvas-preview-item">
              <div className="canvas-label">Original</div>
              <canvas ref={canvasOriginalRef} />
            </div>
            <div className="canvas-preview-item">
              <div className="canvas-label">Depth Map</div>
              <canvas ref={canvasDepthRef} />
            </div>
            <div className="canvas-preview-item">
              <div className="canvas-label">Topo Result</div>
              <canvas ref={canvasTopoRef} />
            </div>
          </div>
        )}
      </div>

      <ControlPanel
        isOpen={isPanelOpen}
        onToggle={() => setIsPanelOpen(prev => !prev)}
        activeTab={activeTab}
        onTabChange={handleTabChange}
        patternModule={patternModule}
        params={params}
        onParamChange={handleParamChange}
        onPresetApply={handlePresetApply}
        style={style}
        onStyleChange={handleStyleChange}
        onRandomize={handleRandomize}
        onUndo={handleUndo}
        onExportSVG={handleExportSVG}
        onExportPNG={handleExportPNG}
        onCopySVG={handleCopySVG}
        onDepthImageUpload={handleDepthImageUpload}
        onRegenerateAI={handleRegenerateAI}
        depthStatusText={depthStatusText}
        depthTopoParams={allParams.depthtopo}
        onDepthTopoParamChange={handleDepthTopoParamChange}
      />
    </>
  );
}
