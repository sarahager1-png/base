import React, { useRef, useState, useEffect } from 'react';
import { PenLine, Trash2, Check, X } from 'lucide-react';

export default function DigitalSignature({ onSave, onClose, title = 'חתימה דיגיטלית' }) {
  const canvasRef = useRef(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [isEmpty, setIsEmpty] = useState(true);
  const [lastPos, setLastPos] = useState(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.strokeStyle = '#1e1b4b';
    ctx.lineWidth = 2.5;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
  }, []);

  const getPos = (e, canvas) => {
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    if (e.touches) {
      return {
        x: (e.touches[0].clientX - rect.left) * scaleX,
        y: (e.touches[0].clientY - rect.top) * scaleY,
      };
    }
    return {
      x: (e.clientX - rect.left) * scaleX,
      y: (e.clientY - rect.top) * scaleY,
    };
  };

  const startDraw = (e) => {
    e.preventDefault();
    const canvas = canvasRef.current;
    setIsDrawing(true);
    setIsEmpty(false);
    setLastPos(getPos(e, canvas));
  };

  const draw = (e) => {
    e.preventDefault();
    if (!isDrawing) return;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    const pos = getPos(e, canvas);
    ctx.beginPath();
    ctx.moveTo(lastPos.x, lastPos.y);
    ctx.lineTo(pos.x, pos.y);
    ctx.stroke();
    setLastPos(pos);
  };

  const stopDraw = (e) => {
    e?.preventDefault();
    setIsDrawing(false);
    setLastPos(null);
  };

  const clear = () => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    setIsEmpty(true);
  };

  const save = () => {
    const canvas = canvasRef.current;
    const dataUrl = canvas.toDataURL('image/png');
    onSave(dataUrl);
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[60] flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md" dir="rtl">
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-slate-200">
          <h3 className="font-bold text-slate-800 flex items-center gap-2 text-lg">
            <PenLine className="h-5 w-5 text-purple-600" />
            {title}
          </h3>
          <button onClick={onClose} className="p-1.5 hover:bg-slate-100 rounded-lg">
            <X className="h-5 w-5 text-slate-500" />
          </button>
        </div>

        {/* Canvas */}
        <div className="p-5">
          <p className="text-sm text-slate-500 mb-3 text-center">חתמי בתיבה למטה עם האצבע או העכבר</p>
          <div className="relative border-2 border-dashed border-purple-300 rounded-xl overflow-hidden bg-white"
               style={{ touchAction: 'none' }}>
            <canvas
              ref={canvasRef}
              width={560}
              height={200}
              className="w-full cursor-crosshair"
              style={{ display: 'block' }}
              onMouseDown={startDraw}
              onMouseMove={draw}
              onMouseUp={stopDraw}
              onMouseLeave={stopDraw}
              onTouchStart={startDraw}
              onTouchMove={draw}
              onTouchEnd={stopDraw}
            />
            {isEmpty && (
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                <p className="text-purple-200 text-2xl font-light select-none">חתימה</p>
              </div>
            )}
          </div>
          {/* Baseline */}
          <div className="mx-5 border-b-2 border-slate-300 -mt-0.5" />
          <p className="text-xs text-slate-400 text-center mt-1">קו חתימה</p>
        </div>

        {/* Actions */}
        <div className="flex gap-3 px-5 pb-5">
          <button
            onClick={clear}
            className="flex-1 py-2.5 border border-slate-300 text-slate-600 rounded-xl font-medium hover:bg-slate-50 flex items-center justify-center gap-2 text-sm"
          >
            <Trash2 className="h-4 w-4" />
            נקה
          </button>
          <button
            onClick={save}
            disabled={isEmpty}
            className="flex-1 py-2.5 bg-purple-600 text-white rounded-xl font-bold hover:bg-purple-700 disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2 text-sm"
          >
            <Check className="h-4 w-4" />
            אישור חתימה
          </button>
        </div>
      </div>
    </div>
  );
}
