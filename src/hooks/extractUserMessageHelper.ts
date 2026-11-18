
export const extractContent = (content: any): string => {
    if (!content) return '';

    const parts = content.parts || [];

    // Regular text messages
    if (content.content_type === 'text') {
        return parts
            .filter((part: any) => typeof part === 'string')
            .join('\n');
    }

    // Multimodal messages
    if (content.content_type === 'multimodal_text') {
        const extractedParts: string[] = [];

        for (const part of parts) {
            if (typeof part === 'string') {
                extractedParts.push(part);
                continue;
            }

            if (typeof part !== 'object' || !part) continue;

            // Image
            if (
                part.content_type === 'image' ||
                part.image_url ||
                part.asset_pointer ||
                part.image
            ) {
                extractedParts.push('[IMAGE]');
                continue;
            }

            // Audio
            if (
                part.content_type?.includes('audio') ||
                part.audio ||
                part.audio_url
            ) {
                extractedParts.push('[AUDIO]');
                continue;
            }

            // Video
            if (
                part.content_type === 'video' ||
                part.video ||
                part.video_url
            ) {
                extractedParts.push('[VIDEO]');
                continue;
            }

            // File / document
            if (
                part.content_type === 'file' ||
                part.file ||
                part.file_id
            ) {
                extractedParts.push('[FILE]');
            }
        }

        return extractedParts.join(' ');
    }

    // Fallback for other content types
    return parts
        .filter((part: any) => typeof part === 'string')
        .join('\n');
};

export const extractUserMessages = (responseData: any): Record<string, string> => {
    const newMessages: Record<string, string> = {};

    const processMessage = (msg: any, id: string) => {
        if (msg?.author?.role !== 'user') return;

        const text = extractContent(msg.content);

        if (id && text) {
            newMessages[id] = text;
        }
    };

    // Array-based response
    if (Array.isArray(responseData?.messages)) {
        for (const msg of responseData.messages) {
            processMessage(msg, msg.id);
        }
    }

    // Mapping-based response
    if (responseData?.mapping) {
        for (const [id, node] of Object.entries(responseData.mapping) as any) {
            const msg = node?.message ?? node?.messages;
            processMessage(msg, msg?.id || id);
        }
    }

    return newMessages;
};
