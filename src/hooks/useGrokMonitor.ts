import { useState, useEffect } from 'react';

export const useGrokMonitor = () => {
    const [userMessages, setUserMessages] = useState<Record<string, string>>({});
    const [conversationContext, setConversationContext] = useState<string>('');

    const indexRequests = () => {
        // Grok user messages often are in div.items-end .message-bubble
        // Assistant messages are usually in div.items-start
        const userMessagesElements = document.querySelectorAll('div.items-end .message-bubble');
        const newMessages: Record<string, string> = {};
        const conversationLog: { user: string; assistant: string }[] = [];

        userMessagesElements.forEach((msg, index) => {
            const customId = `ext-grok-request-${index}`;
            if (!msg.id) {
                msg.id = customId;
            }

            const textElement = msg.querySelector('div.response-content-markdown p') || msg;
            const text = (textElement.textContent || '').trim().replace(/\s+/g, ' ');

            if (text) {
                newMessages[msg.id] = text;
            }
        });

        // For context, we need to find pairs of user and assistant messages
        // This is a bit more complex with DOM scraping. 
        // Let's try to find all message containers and pair them up.
        const allMessages = document.querySelectorAll('.message-bubble');
        let lastUserText = '';

        allMessages.forEach((msg) => {
            const isUser = msg.closest('.items-end');
            const contentElement = msg.querySelector('div.response-content-markdown') || msg;
            const text = (contentElement.textContent || '').trim();

            if (isUser) {
                lastUserText = text;
            } else if (lastUserText && text) {
                conversationLog.push({ user: lastUserText, assistant: text });
                lastUserText = ''; // Reset to find next pair
            }
        });

        if (conversationLog.length > 0) {
            const plainTextLog = conversationLog.map(entry => `USER:\n${entry.user}\n\nASSISTANT:\n${entry.assistant}`).join('\n\n---\n\n');
            setConversationContext(plainTextLog);
        }

        setUserMessages(newMessages);
    };

    useEffect(() => {
        // Initial indexing
        indexRequests();

        // Observe DOM changes
        const chatContainer = document.querySelector('.chat-container') || document.querySelector('div.relative') || document.body;
        const observer = new MutationObserver(() => {
            indexRequests();
        });

        observer.observe(chatContainer, { childList: true, subtree: true });

        return () => observer.disconnect();
    }, []);

    const scrollToMessage = (messageId: string) => {
        const element = document.getElementById(messageId);
        if (element) {
            element.scrollIntoView({ behavior: 'smooth', block: 'center' });
            // Optional: add a brief highlight effect
            const originalBg = (element as HTMLElement).style.backgroundColor;
            (element as HTMLElement).style.transition = 'background-color 0.5s';
            (element as HTMLElement).style.backgroundColor = 'rgba(224, 247, 250, 0.3)';
            setTimeout(() => {
                (element as HTMLElement).style.backgroundColor = originalBg;
            }, 1000);
        }
    };

    return { userMessages, scrollToMessage, conversationContext };
};
