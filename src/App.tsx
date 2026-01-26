import React, { useState } from 'react';
import { useChatGPTMonitor } from './hooks/useChatGPTMonitor';
import { useDraggable } from './hooks/useDraggable';

const App: React.FC = () => {
  const { userMessages, scrollToMessage } = useChatGPTMonitor();
  const { position, onMouseDown, isDragging } = useDraggable();
  const [isOpen, setIsOpen] = useState(false);

  const toggleOpen = () => setIsOpen(!isOpen);

  const messageEntries = Object.entries(userMessages);

  return (
    <div
      style={{
        transform: `translate(${position.x}px, ${position.y}px)`,
        cursor: isDragging ? 'grabbing' : 'auto'
      }}
    >
      {!isOpen && (
        <button
          onClick={toggleOpen}
          onMouseDown={onMouseDown}
          style={{
            padding: '8px 16px',
            backgroundColor: 'black',
            color: 'white',
            border: 'none',
            borderRadius: '5px',
            cursor: isDragging ? 'grabbing' : 'pointer',
            fontSize: '14px',
            boxShadow: '0 2px 10px rgba(0,0,0,0.2)'
          }}
        >
          Show Messages
        </button>
      )}

      {isOpen && (
        <div
          style={{
            backgroundColor: 'rgba(0, 0, 0, 0.85)',
            backdropFilter: 'blur(10px)',
            WebkitBackdropFilter: 'blur(10px)',
            padding: '10px',
            paddingBottom: '35px',
            border: '1px solid rgb(49, 49, 49)',
            borderRadius: '8px',
            boxShadow: '0 4px 15px rgba(0,0,0,0.3)',
            width: '320px',
            color: 'white',
            position: 'relative'
          }}
        >
          <div
            onMouseDown={onMouseDown}
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: '10px',
              paddingBottom: '5px',
              borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
              cursor: isDragging ? 'grabbing' : 'move'
            }}
          >
            <span style={{ fontWeight: 600, fontSize: '14px' }}>User Messages</span>
            <button
              onClick={toggleOpen}
              style={{
                background: 'transparent',
                border: 'none',
                color: 'white',
                fontSize: '20px',
                cursor: 'pointer',
                padding: '0 5px'
              }}
            >
              ×
            </button>
          </div>

          <div style={{ maxHeight: '400px', overflowY: 'auto', paddingRight: '5px' }}>
            {messageEntries.length === 0 ? (
              <div style={{ fontSize: '13px', color: '#ccc', textAlign: 'center', padding: '20px 0' }}>
                No messages detected yet.
              </div>
            ) : (
              messageEntries.map(([id, text]) => (
                <button
                  key={id}
                  onClick={() => scrollToMessage(id)}
                  style={{
                    display: 'block',
                    width: '100%',
                    textAlign: 'left',
                    background: 'transparent',
                    border: 'none',
                    borderBottom: '1px solid rgba(255, 255, 255, 0.05)',
                    color: '#eee',
                    padding: '8px 4px',
                    fontSize: '13px',
                    cursor: 'pointer',
                    transition: 'background 0.2s',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap'
                  }}
                  onMouseOver={(e) => (e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.05)')}
                  onMouseOut={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
                  title={text}
                >
                  {text}
                </button>
              ))
            )}
          </div>

          <a
            href="https://github.com/mdsaban/chatgpt-boost/issues/new"
            target="_blank"
            rel="noopener noreferrer"
            style={{
              position: 'absolute',
              bottom: '8px',
              right: '10px',
              fontSize: '11px',
              color: '#888',
              textDecoration: 'none'
            }}
          >
            Report an issue
          </a>
        </div>
      )}
    </div>
  );
};

export default App;
