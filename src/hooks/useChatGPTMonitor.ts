import { useState, useEffect } from 'react';

export interface UserMessage {
    id: string;
    text: string;
}

export const useChatGPTMonitor = () => {
    const [userMessages, setUserMessages] = useState<Record<string, string>>({});
    const [conversationContext, setConversationContext] = useState<string>('');
    const [currentConversationId, setCurrentConversationId] = useState<string | null>(null);

    useEffect(() => {
        const handleMessage = (event: MessageEvent) => {
            if (event.source !== window) return;

            if (event.data?.type === 'CHAT_API_RESPONSE') {
                console.log('[AI Chat TOC] Hook received CHAT_API_RESPONSE', event.data);
            } else {
                return;
            }

            const { requestData, responseData } = event.data;

            // Handle detection of conversation switch or new chat
            const newConvId = responseData?.conversation_id || requestData?.conversation_id;
            const isNewChat = requestData && !requestData.conversation_id;

            if (isNewChat || (newConvId && newConvId !== currentConversationId)) {
                console.log('[AI Chat TOC] Conversation changed or new chat started. Cleaning state.');
                setUserMessages({});
                setConversationContext('');
                setCurrentConversationId(newConvId || null);
            }

            // Handle new message in current chat
            if (requestData?.messages?.[0]) {
                const messageId = requestData.messages[0].id;
                const text = requestData.messages[0].content?.parts?.[0];
                if (messageId && text) {
                    setUserMessages(prev => ({ ...prev, [messageId]: text }));
                }
            }

            // Handle full conversation mapping (load/history)
            if (responseData?.mapping) {
                const newMessages: Record<string, string> = {};
                const conversationLog: { user: string; assistant: string }[] = [];

                for (const [id, node] of Object.entries(responseData.mapping) as any) {
                    if (node.message?.author?.role === 'user' && node.message?.content?.parts?.[0]) {
                        newMessages[id] = node.message.content.parts[0];
                    }
                    if (node.message?.author?.role === 'assistant' && node.message?.content?.parts?.[0]) {
                        const assistantText = node.message.content.parts[0];
                        const parentId = node.parent;
                        const parentNode = responseData.mapping[parentId];
                        if (parentNode && parentNode.message?.author?.role === 'user' && parentNode.message?.content?.parts?.[0]) {
                            const userText = parentNode.message.content.parts[0];
                            conversationLog.push({ user: userText, assistant: assistantText });
                        }
                    }
                }
                if (conversationLog.length > 0) {
                    const plainTextLog = conversationLog.map(entry => `USER:\n${entry.user}\n\nASSISTANT:\n${entry.assistant}`).join('\n\n---\n\n');
                    console.log("[USER-BOT MESSAGES]", plainTextLog);
                    setConversationContext(plainTextLog);
                }
                setUserMessages(prev => ({ ...prev, ...newMessages }));
            }
        };

        window.addEventListener('message', handleMessage);
        return () => window.removeEventListener('message', handleMessage);
    }, [currentConversationId]);

    // Monitor URL changes to clear state on "New Chat" pages
    useEffect(() => {
        const checkUrl = () => {
            const path = window.location.pathname;
            // Patterns like / or /?model=... OR /c/ (if empty? unlikely but safe)
            // If it's just chatgpt.com/ or chatgpt.com/?..., and not /c/[uuid]
            const isConversationPage = /^\/c\/[a-f0-9-]/.test(path);
            const isNewChatPage = path === '/' || path === '/chat' || (!isConversationPage && path.startsWith('/?'));

            if (isNewChatPage && currentConversationId !== null) {
                console.log('[AI Chat TOC] URL indicates New Chat. Cleaning state.');
                setUserMessages({});
                setConversationContext('');
                setCurrentConversationId(null);
            }
        };

        // Check on mount and on every extension periodic check if needed, 
        // but popstate/pushState are better for SPAs.
        window.addEventListener('popstate', checkUrl);

        // Since ChatGPT is a complex SPA, we might need a small interval as fallback 
        // because they often use internal routing that might not trigger popstate on all transitions
        const interval = setInterval(checkUrl, 1000);

        checkUrl(); // Initial check

        return () => {
            window.removeEventListener('popstate', checkUrl);
            clearInterval(interval);
        };
    }, [currentConversationId]);

    const scrollToMessage = (messageId: string) => {
        const element = document.querySelector(`[data-message-id="${messageId}"]`);
        if (element) {
            element.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
    };

    useEffect(() => {
        if (Object.keys(userMessages).length > 0) {
            console.log('[AI Chat TOC] Updated User Messages:', userMessages);
        }
    }, [userMessages]);

    return { userMessages, scrollToMessage, conversationContext };
};
