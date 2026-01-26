import { useState, useEffect } from 'react';

export interface UserMessage {
    id: string;
    text: string;
}

export const useChatGPTMonitor = () => {
    const [userMessages, setUserMessages] = useState<Record<string, string>>({});

    useEffect(() => {
        const handleMessage = (event: MessageEvent) => {
            if (event.source !== window) return;

            if (event.data?.type === 'CHAT_API_RESPONSE') {
                console.log('[AI Chat TOC] Hook received CHAT_API_RESPONSE', event.data);
            } else {
                return;
            }

            const { requestData, responseData } = event.data;

            // Handle new chat (initial request)
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
                for (const [id, node] of Object.entries(responseData.mapping) as any) {
                    if (node.message?.author?.role === 'user' && node.message?.content?.parts?.[0]) {
                        newMessages[id] = node.message.content.parts[0];
                    }
                }
                setUserMessages(prev => ({ ...prev, ...newMessages }));
            }

            // Handle clearing on new chat/delete
            const isNewChat = requestData && !requestData.conversation_id;
            if (isNewChat) {
                // Optionally keep or clear. Original code cleared them sometimes.
                // Let's follow original logic if possible.
            }
        };

        window.addEventListener('message', handleMessage);
        return () => window.removeEventListener('message', handleMessage);
    }, []);

    const scrollToMessage = (messageId: string) => {
        const element = document.querySelector(`[data-message-id="${messageId}"]`);
        if (element) {
            element.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
    };

    return { userMessages, scrollToMessage };
};
