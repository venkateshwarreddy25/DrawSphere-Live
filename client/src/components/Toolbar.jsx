import { IconPencil, IconEraser, IconSquare, IconCircle, IconArrowRight, IconMinus, IconTypography, IconPointer, IconArrowBackUp, IconArrowForwardUp, IconTrash } from '@tabler/icons-react'

const TOOLS = [
  { id: 'select', icon: IconPointer, label: 'Select' },
  { id: 'pen', icon: IconPencil, label: 'Pen' },
  { id: 'eraser', icon: IconEraser, label: 'Eraser' },
  { id: 'rect', icon: IconSquare, label: 'Rectangle' },
  { id: 'circle', icon: IconCircle, label: 'Circle' },
  { id: 'line', icon: IconMinus, label: 'Line' },
  { id: 'arrow', icon: IconArrowRight, label: 'Arrow' },
  { id: 'text', icon: IconTypography, label: 'Text' },
]

const COLORS = ['#111827', '#EF4444', '#3B82F6', '#22C55E', '#EAB308', '#F97316', '#A855F7', '#EC4899']
const STROKE_SIZES = [6, 10, 16]

export default function Toolbar({ tool, setTool, color, setColor, strokeWidth, setStrokeWidth, onUndo, onRedo, onClear, canUndo, canRedo }) {
  return (
    <div className="left-toolbar">
      {/* Tools Group */}
      <div className="toolbar-section tools-section">
        {TOOLS.map(({ id, icon: Icon, label }) => (
          <button key={id} onClick={() => setTool(id)} className={`toolbar-btn ${tool === id ? 'active' : ''}`}>
            <Icon size={24} stroke={2} />
            <div className="toolbar-tooltip desktop-only">
              {label}
            </div>
            <div className="mobile-only mobile-label">{label}</div>
          </button>
        ))}
      </div>
      
      <div className="desktop-only" style={{ width: '32px', height: '1px', background: 'rgba(255,255,255,0.1)', margin: '8px 0' }} />
      <div className="mobile-only" style={{ width: '100%', height: '1px', background: 'rgba(255,255,255,0.1)' }} />
      
      {/* Sizes and Colors Group */}
      <div className="toolbar-section colors-sizes-section">
        <div className="sizes-group">
          {STROKE_SIZES.map(size => (
            <button key={size} onClick={() => setStrokeWidth(size)} className="toolbar-btn">
              <div style={{ 
                borderRadius: '50%', 
                background: '#FFFFFF', 
                width: size, 
                height: size,
                transition: 'all var(--transition)',
                boxShadow: strokeWidth === size ? '0 0 0 2px rgba(10,10,15,0.85), 0 0 0 4px #D916D0' : '0 0 0 1px rgba(0,0,0,0.5)'
              }} />
              <div className="toolbar-tooltip desktop-only">Stroke {size}px</div>
            </button>
          ))}
        </div>
        
        <div style={{ width: '1px', height: '24px', background: 'rgba(255,255,255,0.2)' }} className="mobile-only" />
        <div className="desktop-only" style={{ width: '32px', height: '1px', background: 'rgba(255,255,255,0.1)', margin: '8px 0' }} />
        
        <div className="colors-group">
          {COLORS.map(c => (
            <button 
              key={c} 
              onClick={() => setColor(c)} 
              className="color-btn"
              style={{ 
                background: c, 
                width: '32px', height: '32px', borderRadius: '50%',
                border: 'none', cursor: 'pointer', transition: 'transform 0.2s',
                boxShadow: color === c ? `0 0 0 2px rgba(10,10,15,0.85), 0 0 0 4px ${c}` : 'none',
                transform: color === c ? 'scale(1.1)' : 'scale(1)',
                flexShrink: 0, margin: '6px'
              }} 
              title={c}
            />
          ))}
        </div>
        
        <div className="desktop-only" style={{ width: '32px', height: '1px', background: 'rgba(255,255,255,0.1)', margin: '8px 0' }} />
        
        <div className="actions-group desktop-only" style={{ display: 'flex', flexDirection: 'column', gap: '4px', width: '100%', alignItems: 'center', marginTop: 'auto' }}>
          <button onClick={onUndo} disabled={!canUndo} className="toolbar-btn"><IconArrowBackUp size={24} stroke={2} /><div className="toolbar-tooltip desktop-only">Undo</div></button>
          <button onClick={onRedo} disabled={!canRedo} className="toolbar-btn"><IconArrowForwardUp size={24} stroke={2} /><div className="toolbar-tooltip desktop-only">Redo</div></button>
          <button onClick={onClear} className="toolbar-btn clear-btn" style={{ color: '#EF4444' }}><IconTrash size={24} stroke={2} /><div className="toolbar-tooltip desktop-only">Clear Canvas</div></button>
        </div>
      </div>
    </div>
  )
}
