import { MousePointer, Pencil, Eraser, Square, Circle, Minus, ArrowRight, Type } from 'lucide-react'

const TOOLS = [
  { id: 'select', icon: MousePointer, label: 'Select' },
  { id: 'pen', icon: Pencil, label: 'Pen' },
  { id: 'eraser', icon: Eraser, label: 'Erase' },
  { id: 'rectangle', icon: Square, label: 'Rect' },
  { id: 'circle', icon: Circle, label: 'Circle' },
  { id: 'line', icon: Minus, label: 'Line' },
  { id: 'arrow', icon: ArrowRight, label: 'Arrow' },
  { id: 'text', icon: Type, label: 'Text' },
]

const STROKE_SIZES = [6, 10, 16] // small, medium, large
const COLORS = ['#000000', '#EF4444', '#3B82F6', '#10B981', '#F59E0B', '#FFFFFF', '#A855F7', '#F97316']

export default function MobileToolbar({ tool, setTool, color, setColor, strokeWidth, setStrokeWidth }) {
  const handleTouch = (e, callback) => {
    if (e.cancelable) {
      e.preventDefault();
    }
    callback();
  }

  return (
    <div style={{
      position: 'fixed',
      bottom: 0,
      left: 0,
      right: 0,
      zIndex: 50,
      backgroundColor: '#0F0F1A',
      borderTop: '1px solid rgba(255, 255, 255, 0.1)',
      paddingBottom: 'env(safe-area-inset-bottom, 0px)'
    }}>
      {/* First Row */}
      <div style={{
        display: 'flex',
        flexDirection: 'row',
        justifyContent: 'space-around',
        alignItems: 'center',
        height: '56px',
        width: '100%'
      }}>
        {TOOLS.map(({ id, icon: Icon, label }) => {
          const isActive = tool === id;
          return (
            <button
              key={id}
              onClick={() => setTool(id)}
              onTouchEnd={(e) => handleTouch(e, () => setTool(id))}
              style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                width: '44px',
                height: '44px',
                borderRadius: '10px',
                cursor: 'pointer',
                border: isActive ? '1px solid rgba(124, 58, 237, 0.5)' : 'none',
                background: isActive ? 'rgba(124, 58, 237, 0.25)' : 'transparent',
                color: isActive ? '#FFFFFF' : 'rgba(255, 255, 255, 0.8)',
                padding: 0
              }}
            >
              <Icon size={22} color={isActive ? '#FFFFFF' : 'rgba(255, 255, 255, 0.8)'} />
              <span style={{
                fontSize: '8px',
                marginTop: '2px',
                color: isActive ? '#FFFFFF' : 'rgba(255, 255, 255, 0.6)',
                fontWeight: '500'
              }}>
                {label}
              </span>
            </button>
          )
        })}
      </div>

      {/* Second Row */}
      <div style={{
        display: 'flex',
        flexDirection: 'row',
        alignItems: 'center',
        height: '56px',
        width: '100%',
        borderTop: '1px solid rgba(255, 255, 255, 0.08)',
        padding: '0 16px',
        gap: '12px'
      }}>
        {/* Stroke Sizes */}
        <div style={{ display: 'flex', gap: '16px', alignItems: 'center', marginRight: '16px' }}>
          {STROKE_SIZES.map(size => {
            const isActive = strokeWidth === size;
            return (
              <div
                key={size}
                onClick={() => setStrokeWidth(size)}
                onTouchEnd={(e) => handleTouch(e, () => setStrokeWidth(size))}
                style={{
                  width: `${size}px`,
                  height: `${size}px`,
                  borderRadius: '50%',
                  background: '#FFFFFF',
                  cursor: 'pointer',
                  outline: isActive ? '2px solid purple' : 'none',
                  outlineOffset: isActive ? '2px' : '0px'
                }}
              />
            )
          })}
        </div>

        {/* Vertical Divider */}
        <div style={{ width: '1px', height: '24px', background: 'rgba(255, 255, 255, 0.08)' }} />

        {/* Colors */}
        <div style={{ display: 'flex', gap: '12px', alignItems: 'center', overflowX: 'auto', padding: '4px 0', marginLeft: '4px' }}>
          {COLORS.map(c => {
            const isActive = color === c;
            return (
              <div
                key={c}
                onClick={() => setColor(c)}
                onTouchEnd={(e) => handleTouch(e, () => setColor(c))}
                style={{
                  width: '24px',
                  height: '24px',
                  borderRadius: '50%',
                  background: c,
                  cursor: 'pointer',
                  flexShrink: 0,
                  outline: isActive ? '2px solid white' : 'none',
                  outlineOffset: isActive ? '2px' : '0px'
                }}
              />
            )
          })}
        </div>
      </div>
    </div>
  )
}
