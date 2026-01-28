import { useState, useEffect } from 'react';

export interface UserMessage {
    id: string;
    text: string;
}

export const useChatGPTMonitor = () => {
    const [userMessages, setUserMessages] = useState<Record<string, string>>({});
    const [conversationContext, setConversationContext] = useState<string>('');
    const [url, setUrl] = useState(window.location.href);

    useEffect(() => {
        const handlePopState = () => setUrl(window.location.href);
        window.addEventListener('popstate', handlePopState);

        // Also check on an interval because pushState doesn't trigger popstate
        const interval = setInterval(() => {
            if (window.location.href !== url) {
                setUrl(window.location.href);
            }
        }, 500);

        return () => {
            window.removeEventListener('popstate', handlePopState);
            clearInterval(interval);
        };
    }, [url]);

    const currentURLSegments = url.split("/");
    const newChat = currentURLSegments[3] === "" || currentURLSegments[3] === undefined;

    useEffect(() => {
        const handleMessage = (event: MessageEvent) => {
            if (event.source !== window) return;

            const { type, requestData, responseData } = event.data || {};

            if (type === 'CHAT_API_REQUEST') {
                console.log('[AI Chat TOC] Hook received CHAT_API_REQUEST', event.data);
                if (requestData?.messages?.[0]) {
                    const messageId = requestData.messages[0].id;
                    const text = requestData.messages[0].content?.parts?.[0];
                    if (messageId && text) {
                        setUserMessages(prev => ({ ...prev, [messageId]: text }));
                    }
                }
                return;
            }

            if (type !== 'CHAT_API_RESPONSE') return;
            console.log('[AI Chat TOC] Hook received CHAT_API_RESPONSE', event.data);

            // Handle new chat (initial request) - captured in response for some cases/history
            if (requestData?.messages?.[0]) {
                const messageId = requestData.messages[0].id;
                const text = requestData.messages[0].content?.parts?.[0];
                if (messageId && text && !newChat) {
                    setUserMessages(prev => ({ ...prev, [messageId]: text }));
                } else if (newChat) {
                    setUserMessages({});
                }
            }

            // Handle full conversation mapping (load/history)
            if (responseData?.mapping && !newChat) {
                const newMessages: Record<string, string> = {};
                const conversationLog: { user: string; assistant: string }[] = [];

                for (const [id, node] of Object.entries(responseData.mapping) as any) {
                    if (node.message?.author?.role === 'user' && node.message?.content?.parts?.[0]) {
                        newMessages[id] = node.message.content.parts[0];
                    }
                    if (node.message?.author?.role === 'assistant' && node.message?.content?.parts?.[0]) {
                        const assistantText = node.message.content.parts[0];
                        const parentId = node.parent;
                        const parentNode = responseData.mapping?.[parentId];
                        if (parentNode && parentNode.message?.author?.role === 'user' && parentNode.message?.content?.parts?.[0]) {
                            const userText = parentNode.message.content.parts[0];
                            conversationLog.push({ user: userText, assistant: assistantText });
                        }
                    }
                }
                if (conversationLog.length > 0) {
                    const plainTextLog = conversationLog.map(entry => `USER:\n${entry.user}\n\nASSISTANT:\n${entry.assistant}`).join('\n\n---\n\n');
                    setConversationContext(plainTextLog);
                }
                setUserMessages(prev => ({ ...prev, ...newMessages }));
            }
        };

        window.addEventListener('message', handleMessage);
        return () => window.removeEventListener('message', handleMessage);
    }, [newChat]);



    useEffect(() => {
        console.log(newChat, "NEWCHAT")
        if (newChat) {
            setUserMessages({});
            setConversationContext('');
        }
    }, [newChat]);

    console.log(userMessages, "USERMESSAGES")

    const scrollToMessage = (messageId: string) => {
        const element = document.querySelector(`[data-message-id="${messageId}"]`);
        if (element) {
            element.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
    };

    return { userMessages, scrollToMessage, conversationContext };
};
