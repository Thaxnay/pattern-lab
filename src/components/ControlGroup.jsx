export default function ControlGroup({ control, value, onChange }) {
  const { id, label, type, min, max, step, suffix } = control;

  if (type === 'checkbox') {
    return (
      <div className="control-group">
        <label>{label}</label>
        <div className="checkbox-row">
          <input
            type="checkbox"
            checked={!!value}
            onChange={(e) => onChange(id, e.target.checked)}
          />
          <span className="value-display">Flip light/dark mapping</span>
        </div>
      </div>
    );
  }

  if (type === 'color') {
    return (
      <div className="control-group">
        <label>{label}</label>
        <input
          type="color"
          value={value}
          onChange={(e) => onChange(id, e.target.value)}
        />
      </div>
    );
  }

  return (
    <div className="control-group">
      <label>{label}</label>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(id, parseFloat(e.target.value))}
      />
      <div className="value-display">{value}{suffix || ''}</div>
    </div>
  );
}
