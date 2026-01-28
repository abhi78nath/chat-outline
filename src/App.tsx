import React, { useState } from 'react';
import { useChatGPTMonitor } from './hooks/useChatGPTMonitor';
import { useGrokMonitor } from './hooks/useGrokMonitor';
import { useDraggable } from './hooks/useDraggable';
import { GripVertical, X, Sparkles } from 'lucide-react';
import { useTheme } from './hooks/useTheme';

const App: React.FC = () => {
  const isGrok = window.location.hostname.includes('grok.com');

  // Conditionally call hooks (React hooks must be called unconditionally, so we call both or use a wrapper)
  // Actually, hooks can't be called conditionally. We'll call both but they will handle their own domain logic or we can create a unified hook.
  // For now, let's just make both hooks safe to run everywhere or call them and pick the results.

  const chatGPT = useChatGPTMonitor();
  const grok = useGrokMonitor();

  const { userMessages, scrollToMessage, conversationContext } = isGrok ? grok : chatGPT;

  const { position, onMouseDown, isDragging } = useDraggable();
  const theme = useTheme();
  const [isOpen, setIsOpen] = useState(false);

  const isLight = theme === 'light';
  const styles = {
    bg: isLight ? 'rgba(255, 255, 255, 0.6)' : 'rgba(0, 0, 0, 0.2)',
    text: isLight ? '#171717' : 'white',
    textMuted: isLight ? 'rgba(0, 0, 0, 0.4)' : 'rgba(255, 255, 255, 0.4)',
    border: isLight ? 'rgba(0, 0, 0, 0.1)' : 'rgba(255, 255, 255, 0.1)',
    scrollbarThumb: isLight ? 'rgba(0, 0, 0, 0.1)' : 'rgba(255, 255, 255, 0.1)',
    scrollbarThumbHover: isLight ? 'rgba(0, 0, 0, 0.2)' : 'rgba(255, 255, 255, 0.2)',
    buttonBg: isLight ? 'rgba(0, 0, 0, 0.05)' : 'rgba(255, 255, 255, 0.05)',
    buttonBgHover: isLight ? 'rgba(0, 0, 0, 0.1)' : 'rgba(255, 255, 255, 0.1)',
    shadow: isLight ? '0 8px 32px rgba(0,0,0,0.1)' : '0 8px 32px rgba(0,0,0,0.4)',
  };

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

    if (isGrok) {
      const grokEditor = document.querySelector('textarea, [contenteditable="true"]') as HTMLTextAreaElement | HTMLDivElement | null;
      if (!grokEditor) {
        alert("Grok input field not found.");
        return;
      }
      grokEditor.focus();
      if (grokEditor.tagName === 'TEXTAREA') {
        (grokEditor as HTMLTextAreaElement).value = promptText;
        // Trigger input event for React-based sites
        grokEditor.dispatchEvent(new Event('input', { bubbles: true }));
      } else {
        document.execCommand("selectAll", false);
        document.execCommand("delete", false);
        document.execCommand("insertText", false, promptText);
      }

      setTimeout(() => {
        // Grok send button selector - might need adjustment but usually it's a sibling or child of the input area
        const sendButton = document.querySelector('button[aria-label*="Send"], button[type="submit"]') as HTMLButtonElement | null;
        if (sendButton) {
          sendButton.click();
        }
      }, 100);
      return;
    }

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
            backgroundColor: styles.bg,
            color: styles.text,
            border: `1px solid ${styles.border}`,
            borderRadius: '6px',
            boxShadow: styles.shadow,
            backdropFilter: 'blur(8px)',
            WebkitBackdropFilter: 'blur(8px)',
            transition: 'background-color 0.2s',
            padding: '2px',
            width: "12.5rem"
          }}
          onMouseOver={(e) => (e.currentTarget.style.backgroundColor = isLight ? 'rgba(255, 255, 255, 0.8)' : 'rgba(0, 0, 0, 0.3)')}
          onMouseOut={(e) => (e.currentTarget.style.backgroundColor = styles.bg)}
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
              color: styles.textMuted,
              transition: 'color 0.2s',
            }}
            onMouseOver={(e) => (e.currentTarget.style.color = isLight ? 'rgba(0, 0, 0, 0.8)' : 'rgba(255, 255, 255, 0.9)')}
            onMouseOut={(e) => (e.currentTarget.style.color = styles.textMuted)}
          >
            <GripVertical size={16} />
          </div>

          <button
            onClick={toggleOpen}
            style={{
              padding: '6px 10px 6px 4px',
              backgroundColor: 'transparent',
              color: styles.text,
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
            backgroundColor: styles.bg,
            backdropFilter: 'blur(10px)',
            WebkitBackdropFilter: 'blur(10px)',
            padding: '12px',
            paddingBottom: '12px',
            border: `1px solid ${styles.border}`,
            borderRadius: '10px',
            boxShadow: styles.shadow,
            width: '320px',
            color: styles.text,
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
                background: ${styles.scrollbarThumb};
                border-radius: 10px;
              }
              .custom-scrollbar::-webkit-scrollbar-thumb:hover {
                background: ${styles.scrollbarThumbHover};
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
              borderBottom: `1px solid ${styles.border}`,
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
                  color: styles.textMuted,
                  transition: 'color 0.2s',
                }}
                onMouseOver={(e) => (e.currentTarget.style.color = isLight ? 'rgba(0, 0, 0, 0.8)' : 'rgba(255, 255, 255, 0.9)')}
                onMouseOut={(e) => (e.currentTarget.style.color = styles.textMuted)}
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
                color: styles.textMuted,
                fontSize: '20px',
                cursor: 'pointer',
                padding: '0 5px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                transition: 'color 0.2s',
              }}
              onMouseOver={(e) => (e.currentTarget.style.color = styles.text)}
              onMouseOut={(e) => (e.currentTarget.style.color = styles.textMuted)}
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
              scrollbarColor: `${styles.scrollbarThumb} transparent`
            }}
          >
            {messageEntries.length === 0 ? (
              <div style={{ fontSize: '13px', color: styles.textMuted, textAlign: 'center', padding: '20px 0' }}>
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
                    background: isLight ? 'rgba(0, 0, 0, 0.03)' : 'rgba(255, 255, 255, 0.03)',
                    border: `1px solid ${isLight ? 'rgba(0, 0, 0, 0.05)' : 'rgba(255, 255, 255, 0.05)'}`,
                    borderRadius: '6px',
                    color: isLight ? '#404040' : '#eee',
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
                    e.currentTarget.style.backgroundColor = isLight ? 'rgba(0, 0, 0, 0.08)' : 'rgba(255, 255, 255, 0.08)';
                    e.currentTarget.style.borderColor = isLight ? 'rgba(0, 0, 0, 0.15)' : 'rgba(255, 255, 255, 0.15)';
                    e.currentTarget.style.color = isLight ? '#000' : 'white';
                  }}
                  onMouseOut={(e) => {
                    e.currentTarget.style.backgroundColor = isLight ? 'rgba(0, 0, 0, 0.03)' : 'rgba(255, 255, 255, 0.03)';
                    e.currentTarget.style.borderColor = isLight ? 'rgba(0, 0, 0, 0.05)' : 'rgba(255, 255, 255, 0.05)';
                    e.currentTarget.style.color = isLight ? '#404040' : '#eee';
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
                backgroundColor: styles.buttonBg,
                color: conversationContext ? styles.text : styles.textMuted,
                border: `1px solid ${styles.border}`,
                borderRadius: '6px',
                fontSize: '12px',
                fontWeight: 500,
                cursor: conversationContext ? 'pointer' : 'not-allowed',
                transition: 'all 0.2s',
              }}
              onMouseOver={(e) => conversationContext && (e.currentTarget.style.backgroundColor = styles.buttonBgHover)}
              onMouseOut={(e) => conversationContext && (e.currentTarget.style.backgroundColor = styles.buttonBg)}
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
