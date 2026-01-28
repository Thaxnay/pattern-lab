export default function PresetBar({ presets, onApply }) {
  return (
    <div className="preset-row">
      {Object.keys(presets).map((name) => (
        <button
          key={name}
          className="preset-btn"
          onClick={() => onApply(name)}
        >
          {name.charAt(0).toUpperCase() + name.slice(1)}
        </button>
      ))}
    </div>
  );
}
