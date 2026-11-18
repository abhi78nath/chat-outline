
import { useState, useEffect } from 'react';
import { extractContent, extractUserMessages } from './extractUserMessageHelper';

export interface UserMessage {
    id: string;
    text: string;
}

export const useChatGPTMonitor = () => {
    const [userMessages, setUserMessages] = useState<Record<string, string>>({});
    const [conversationContext, setConversationContext] = useState<string>('');
    const [url, setUrl] = useState(window.location.href);

    // Extract current chat ID from URL
    const chatId = url.match(/\/c\/([^/?]+)/)?.[1] ?? null;

    // Monitor URL changes, including pushState navigation
    useEffect(() => {
        const handleNavigation = () => {
            setUrl(window.location.href);
        };

        window.addEventListener('popstate', handleNavigation);

        const interval = setInterval(() => {
            if (window.location.href !== url) {
                handleNavigation();
            }
        }, 500);

        return () => {
            window.removeEventListener('popstate', handleNavigation);
            clearInterval(interval);
        };
    }, [url]);

    // Reset conversation data whenever chat ID changes
    useEffect(() => {
        console.log('[AI Chat TOC] Chat ID changed:', chatId);

        setUserMessages({});
        setConversationContext('');
    }, [chatId]);

    useEffect(() => {
        const handleMessage = (event: MessageEvent) => {
            if (event.source !== window) return;

            const { type, requestData, responseData } = event.data || {};

            if (type === 'CHAT_API_REQUEST') {
                console.log('[AI Chat TOC] Live request received:', requestData);

                const messages = Array.isArray(requestData?.messages)
                    ? requestData.messages
                    : requestData?.message
                        ? [requestData.message]
                        : [];

                const userMessage = [...messages]
                    .reverse()
                    .find((msg: any) => msg.author?.role === 'user');

                if (userMessage) {
                    const messageId = userMessage.id;
                    const text = extractContent(userMessage.content);

                    if (messageId && text) {
                        setUserMessages(prev => ({
                            ...prev,
                            [messageId]: text
                        }));

                        console.log('[AI Chat TOC] Added live message:', messageId, text);
                    }
                }

                return;
            }

            if (type !== 'CHAT_API_RESPONSE') return;

            console.log('[AI Chat TOC] Hook received CHAT_API_RESPONSE', responseData);

            // Extract user messages from response
            const newMessages = extractUserMessages(responseData);

            if (Object.keys(newMessages).length > 0) {
                setUserMessages(prev => ({
                    ...prev,
                    ...newMessages
                }));
            }

            // Handle conversation history mapping
            if (responseData?.mapping && chatId) {
                const mappedMessages: Record<string, string> = {};
                const conversationLog: { user: string; assistant: string }[] = [];

                for (const [id, node] of Object.entries(responseData.mapping) as any) {
                    if (
                        node.messages?.author?.role === 'user' &&
                        node.messages?.content?.parts?.[0]
                    ) {
                        mappedMessages[id] = node.messages.content.parts[0];
                    }

                    if (
                        node.messages?.author?.role === 'assistant' &&
                        node.messages?.content?.parts?.[0]
                    ) {
                        const parentId = node.parent;
                        const parentNode = responseData.mapping?.[parentId];

                        if (
                            parentNode &&
                            parentNode.messages?.author?.role === 'user' &&
                            parentNode.messages?.content?.parts?.[0]
                        ) {
                            conversationLog.push({
                                user: parentNode.messages.content.parts[0],
                                assistant: node.messages.content.parts[0]
                            });
                        }
                    }
                }

                if (conversationLog.length > 0) {
                    const plainTextLog = conversationLog
                        .map(entry =>
                            `USER:\n${entry.user}\n\nASSISTANT:\n${entry.assistant}`
                        )
                        .join('\n\n---\n\n');

                    setConversationContext(plainTextLog);
                }

                setUserMessages(mappedMessages);
            }
        };

        window.addEventListener('message', handleMessage);

        return () => window.removeEventListener('message', handleMessage);
    }, [chatId]);

    const scrollToMessage = (messageId: string) => {
        const element = document.querySelector(
            `[data-chatgpt-search-message-ids="${messageId}"]`
        );
        console.log(messageId, element, 'SCROLLLL')

        if (element) {
            element.scrollIntoView({
                behavior: 'auto',
                block: 'start'
            });
        }
    };

    return {
        userMessages,
        scrollToMessage,
        conversationContext
    };
};
