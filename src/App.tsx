import React, { useState } from 'react';
import { useChatGPTMonitor } from './hooks/useChatGPTMonitor';
import { useDraggable } from './hooks/useDraggable';
import { GripVertical, X, Sparkles } from 'lucide-react';

const App: React.FC = () => {
  const { userMessages, scrollToMessage, conversationContext } = useChatGPTMonitor();
  const { position, onMouseDown, isDragging } = useDraggable();
  const [isOpen, setIsOpen] = useState(false);

  const toggleOpen = () => setIsOpen(!isOpen);

  const handleSummarize = () => {
    const promptText = `Summarize the following conversation into a concise context snapshot.

Rules:
- User messages define intent and questions
- Assistant messages define conclusions and decisions
- Focus on goals, constraints, and current state
- Use bullet points only
- Max 150 words
`;

    const editor = document.getElementById("prompt-textarea") as HTMLDivElement | null;

    if (!editor) {
      alert("ChatGPT input field not found.");
      return;
    }

    editor.focus();

    // Clear existing content
    document.execCommand("selectAll", false);
    document.execCommand("delete", false);

    // Insert text as if user typed it
    document.execCommand("insertText", false, promptText);

    console.log("[SUMMARIZE] Prompt injected into ProseMirror");

    // Auto-click send button after a small delay to ensure React state sync
    setTimeout(() => {
      const sendButton = document.querySelector('[data-testid="send-button"]') as HTMLButtonElement | null;
      if (sendButton) {
        sendButton.click();
        console.log("[SUMMARIZE] Send button clicked");
      } else {
        console.warn("[SUMMARIZE] Send button not found");
      }
    }, 100);
  };

  const messageEntries = Object.entries(userMessages);

  return (
    <div
      style={{
        transform: `translate(${position.x}px, ${position.y}px)`,
        cursor: isDragging ? 'grabbing' : 'auto'
      }}
    >
      {!isOpen && (
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            backgroundColor: 'rgba(0, 0, 0, 0.1)',
            color: 'white',
            border: '1px solid rgba(255, 255, 255, 0.1)',
            borderRadius: '6px',
            boxShadow: '0 2px 10px rgba(0,0,0,0.3)',
            backdropFilter: 'blur(8px)',
            WebkitBackdropFilter: 'blur(8px)',
            transition: 'background-color 0.2s',
            padding: '2px',
          }}
          onMouseOver={(e) => (e.currentTarget.style.backgroundColor = 'rgba(0, 0, 0, 0.2)')}
          onMouseOut={(e) => (e.currentTarget.style.backgroundColor = 'rgba(0, 0, 0, 0.1)')}
        >
          <div
            onMouseDown={(e) => {
              e.stopPropagation();
              onMouseDown(e);
            }}
            style={{
              cursor: isDragging ? 'grabbing' : 'grab',
              padding: '6px',
              display: 'flex',
              alignItems: 'center',
              color: 'rgba(255, 255, 255, 0.4)',
              transition: 'color 0.2s',
            }}
            onMouseOver={(e) => (e.currentTarget.style.color = 'rgba(255, 255, 255, 0.9)')}
            onMouseOut={(e) => (e.currentTarget.style.color = 'rgba(255, 255, 255, 0.4)')}
          >
            <GripVertical size={16} />
          </div>

          <button
            onClick={toggleOpen}
            style={{
              padding: '6px 10px 6px 4px',
              backgroundColor: 'transparent',
              color: 'white',
              border: 'none',
              cursor: 'pointer',
              fontSize: '14px',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
            }}
          >
            <span style={{ fontWeight: 500, letterSpacing: '0.02em' }}>Conversation Outline</span>
          </button>
        </div>
      )}

      {isOpen && (
        <div
          style={{
            backgroundColor: 'rgba(0, 0, 0, 0.2)',
            backdropFilter: 'blur(10px)',
            WebkitBackdropFilter: 'blur(10px)',
            padding: '12px',
            paddingBottom: '12px',
            border: '1px solid rgba(255, 255, 255, 0.1)',
            borderRadius: '10px',
            boxShadow: '0 8px 32px rgba(0,0,0,0.4)',
            width: '320px',
            color: 'white',
            position: 'relative'
          }}
        >
          <style>
            {`
              .custom-scrollbar::-webkit-scrollbar {
                width: 5px;
              }
              .custom-scrollbar::-webkit-scrollbar-track {
                background: transparent;
              }
              .custom-scrollbar::-webkit-scrollbar-thumb {
                background: rgba(255, 255, 255, 0.1);
                border-radius: 10px;
              }
              .custom-scrollbar::-webkit-scrollbar-thumb:hover {
                background: rgba(255, 255, 255, 0.2);
              }
            `}
          </style>
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: '12px',
              paddingBottom: '8px',
              borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '2px' }}>
              <div
                onMouseDown={onMouseDown}
                style={{
                  cursor: isDragging ? 'grabbing' : 'grab',
                  padding: '4px',
                  display: 'flex',
                  alignItems: 'center',
                  color: 'rgba(255, 255, 255, 0.4)',
                  transition: 'color 0.2s',
                }}
                onMouseOver={(e) => (e.currentTarget.style.color = 'rgba(255, 255, 255, 0.9)')}
                onMouseOut={(e) => (e.currentTarget.style.color = 'rgba(255, 255, 255, 0.4)')}
              >
                <GripVertical size={16} />
              </div>
              <span style={{ fontWeight: 600, fontSize: '14px', letterSpacing: '0.01em' }}>Conversation Outline</span>
            </div>
            <button
              onClick={toggleOpen}
              style={{
                background: 'transparent',
                border: 'none',
                color: 'rgba(255, 255, 255, 0.6)',
                fontSize: '20px',
                cursor: 'pointer',
                padding: '0 5px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                transition: 'color 0.2s',
              }}
              onMouseOver={(e) => (e.currentTarget.style.color = 'white')}
              onMouseOut={(e) => (e.currentTarget.style.color = 'rgba(255, 255, 255, 0.6)')}
            >
              <X size={16} />
            </button>
          </div>



          <div
            className="custom-scrollbar"
            style={{
              maxHeight: '400px',
              overflowY: 'auto',
              paddingRight: '5px',
              scrollbarWidth: 'thin',
              scrollbarColor: 'rgba(255, 255, 255, 0.1) transparent'
            }}
          >
            {messageEntries.length === 0 ? (
              <div style={{ fontSize: '13px', color: '#999', textAlign: 'center', padding: '20px 0' }}>
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
                    background: 'rgba(255, 255, 255, 0.03)',
                    border: '1px solid rgba(255, 255, 255, 0.05)',
                    borderRadius: '6px',
                    color: '#eee',
                    padding: '8px 10px',
                    fontSize: '13px',
                    cursor: 'pointer',
                    transition: 'all 0.2s',
                    marginBottom: '6px',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap',
                    lineHeight: '1.4'
                  }}
                  onMouseOver={(e) => {
                    e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.08)';
                    e.currentTarget.style.borderColor = 'rgba(255,255,255,0.15)';
                    e.currentTarget.style.color = 'white';
                  }}
                  onMouseOut={(e) => {
                    e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.03)';
                    e.currentTarget.style.borderColor = 'rgba(255,255,255,0.05)';
                    e.currentTarget.style.color = '#eee';
                  }}
                  title={text}
                >
                  {text}
                </button>
              ))
            )}
          </div>

          <div style={{ marginTop: '12px', display: 'flex', justifyContent: 'flex-start' }}>
            <button
              onClick={handleSummarize}
              disabled={!conversationContext}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                padding: '6px 12px',
                backgroundColor: conversationContext ? 'rgba(255, 255, 255, 0.05)' : 'rgba(255, 255, 255, 0.02)',
                color: conversationContext ? 'white' : 'rgba(255, 255, 255, 0.3)',
                border: '1px solid rgba(255, 255, 255, 0.1)',
                borderRadius: '6px',
                fontSize: '12px',
                fontWeight: 500,
                cursor: conversationContext ? 'pointer' : 'not-allowed',
                transition: 'all 0.2s',
              }}
              onMouseOver={(e) => conversationContext && (e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.1)')}
              onMouseOut={(e) => conversationContext && (e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.05)')}
            >
              <Sparkles size={14} style={{ color: conversationContext ? '#10a37f' : 'inherit' }} />
              Summarize
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default App;
