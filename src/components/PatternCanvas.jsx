import { useRef, useEffect, forwardRef, useImperativeHandle } from 'react';

const PatternCanvas = forwardRef(function PatternCanvas({ size, bgColor }, ref) {
  const canvasRef = useRef(null);

  useImperativeHandle(ref, () => canvasRef.current);

  useEffect(() => {
    const canvas = canvasRef.current;
    canvas.width = size;
    canvas.height = size;
  }, [size]);

  return (
    <div id="canvas-container">
      <canvas ref={canvasRef} />
    </div>
  );
});

export default PatternCanvas;
