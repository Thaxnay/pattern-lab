import ControlGroup from './ControlGroup';
import PresetBar from './PresetBar';

const TABS = [
  { id: 'flow', label: 'Flow Field' },
  { id: 'wave', label: 'Wave' },
  { id: 'topo', label: 'Topo' },
  { id: 'dots', label: 'Dots' },
  { id: 'net', label: 'Network' },
  { id: 'voronoi', label: 'Voronoi' },
  { id: 'hatch', label: 'Hatch' },
  { id: 'depthtopo', label: 'Depth Topo' },
];

export default function Sidebar({
  activeTab,
  onTabChange,
  patternModule,
  params,
  onParamChange,
  onPresetApply,
  style,
  onStyleChange,
  onRandomize,
  onUndo,
  onExportSVG,
  onExportPNG,
  onCopySVG,
  // Depth topo specific
  onDepthImageUpload,
  onRegenerateAI,
  depthStatusText,
  depthTopoParams,
  onDepthTopoParamChange,
}) {
  const isDepthTopo = activeTab === 'depthtopo';

  return (
    <div className="controls">
      <h1>Pattern Lab</h1>

      <div className="tabs">
        {TABS.map((tab) => (
          <div
            key={tab.id}
            className={`tab${activeTab === tab.id ? ' active' : ''}`}
            onClick={() => onTabChange(tab.id)}
          >
            {tab.label}
          </div>
        ))}
      </div>

      {isDepthTopo ? (
        <DepthTopoControls
          patternModule={patternModule}
          params={depthTopoParams}
          onParamChange={onDepthTopoParamChange}
          onPresetApply={onPresetApply}
          onDepthImageUpload={onDepthImageUpload}
          onRegenerateAI={onRegenerateAI}
          depthStatusText={depthStatusText}
        />
      ) : (
        <>
          {patternModule && (
            <>
              <PresetBar presets={patternModule.presets} onApply={onPresetApply} />
              {patternModule.controls.map((ctrl) => (
                <ControlGroup
                  key={ctrl.id}
                  control={ctrl}
                  value={params[ctrl.id]}
                  onChange={onParamChange}
                />
              ))}
            </>
          )}
        </>
      )}

      <div className="section-title">Style</div>

      <div className="control-group">
        <label>Stroke Color</label>
        <input
          type="color"
          value={style.strokeColor}
          onChange={(e) => onStyleChange('strokeColor', e.target.value)}
        />
      </div>

      <div className="control-group">
        <label>Background Color</label>
        <input
          type="color"
          value={style.bgColor}
          onChange={(e) => onStyleChange('bgColor', e.target.value)}
        />
      </div>

      <div className="control-group">
        <label>Canvas Size</label>
        <input
          type="range"
          min="400"
          max="1200"
          step="100"
          value={style.canvasSize}
          onChange={(e) => onStyleChange('canvasSize', parseInt(e.target.value))}
        />
        <div className="value-display">{style.canvasSize}</div>
      </div>

      <div className="btn-row">
        <button className="btn secondary" onClick={onRandomize}>Randomize</button>
        <button className="btn secondary" onClick={onUndo}>Undo</button>
      </div>
      <div className="btn-row">
        <button className="btn" onClick={onExportSVG}>Export SVG</button>
        <button className="btn" onClick={onExportPNG}>Export PNG</button>
      </div>
      <button className="btn secondary" onClick={onCopySVG} style={{ width: '100%', marginTop: 8 }}>
        Copy SVG
      </button>
    </div>
  );
}

function DepthTopoControls({ patternModule, params, onParamChange, onPresetApply, onDepthImageUpload, onRegenerateAI, depthStatusText }) {
  return (
    <>
      <div className="control-group">
        <label>Upload Image</label>
        <input
          type="file"
          id="depthtopo-file"
          accept="image/jpeg,image/png,image/webp"
          onChange={onDepthImageUpload}
          style={{ display: 'none' }}
        />
        <button
          className="btn secondary"
          onClick={() => document.getElementById('depthtopo-file').click()}
          style={{ width: '100%', marginBottom: 8 }}
        >
          Choose Image
        </button>
        <div className="value-display">{depthStatusText}</div>
        <button
          className="btn secondary"
          onClick={onRegenerateAI}
          style={{ width: '100%', marginTop: 8, fontSize: 9 }}
        >
          Regenerate with AI
        </button>
      </div>

      {patternModule && (
        <>
          <PresetBar presets={patternModule.presets} onApply={onPresetApply} />
          {patternModule.controls.map((ctrl) => (
            <ControlGroup
              key={ctrl.id}
              control={ctrl}
              value={params[ctrl.id]}
              onChange={onParamChange}
            />
          ))}
          {patternModule.extraControls && (
            <>
              <div className="section-title">Colors</div>
              {patternModule.extraControls.map((ctrl) => (
                <ControlGroup
                  key={ctrl.id}
                  control={ctrl}
                  value={params[ctrl.id]}
                  onChange={onParamChange}
                />
              ))}
            </>
          )}
        </>
      )}
    </>
  );
}
