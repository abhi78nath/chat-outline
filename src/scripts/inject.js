// This script runs in the page context to intercept fetch calls
(function () {
    const originalFetch = window.fetch;

    // Inclusive pattern for both chatgpt.com and chat.openai.com
    const apiPattern = /https:\/\/(?:chatgpt\.com|chat\.openai\.com)\/backend-api(?:\/[^\/]*)?\/conversation(?:\/[0-9a-f-]+)?$/;

    window.fetch = async function (...args) {
        const [resource, config] = args;
        const url = resource instanceof Request ? resource.url : resource;
        const method = resource instanceof Request ? resource.method : (config?.method || 'GET');

        // Log all intercepted fetch calls for debugging
        console.log('[AI Chat TOC] Intercepted Fetch:', method, url);

        let requestData = null;
        if (resource instanceof Request) {
            try {
                const clonedRequest = resource.clone();
                if (clonedRequest.headers.get('content-type')?.includes('application/json')) {
                    const text = await clonedRequest.text();
                    try {
                        requestData = JSON.parse(text);
                    } catch {
                        requestData = text;
                    }
                }
            } catch (e) {
                console.error('[AI Chat TOC] Error reading request body:', e);
            }
        } else if (config && config.body) {
            try {
                if (typeof config.body === 'string') {
                    try {
                        requestData = JSON.parse(config.body);
                    } catch {
                        requestData = config.body;
                    }
                } else {
                    requestData = config.body;
                }
            } catch (e) {
                requestData = config.body;
            }
        }

        const isChatApi = apiPattern.test(url);
        if (isChatApi) {
            console.log('[AI Chat TOC] Matched ChatGPT API URL!');
            if (method === 'POST' && requestData) {
                console.log('[AI Chat TOC] Sending CHAT_API_REQUEST to Content Script');
                window.postMessage({
                    type: 'CHAT_API_REQUEST',
                    url,
                    method,
                    requestData
                }, '*');
            }
        }

        try {
            const response = await originalFetch.apply(this, args);
            if (isChatApi) {
                const clone = response.clone();
                clone.text().then(body => {
                    let responseData;
                    try {
                        responseData = JSON.parse(body);
                    } catch {
                        responseData = body;
                    }
                    console.log('[AI Chat TOC] Intercepted Response Body:', responseData);
                    console.log('[AI Chat TOC] Sending CHAT_API_RESPONSE to Content Script');
                    // Notify the content script
                    window.postMessage({
                        type: 'CHAT_API_RESPONSE',
                        url,
                        method,
                        requestData,
                        responseData
                    }, '*');
                }).catch(err => {
                    console.error('[AI Chat TOC] Error reading response:', err.message);
                });
            }

            return response;
        } catch (error) {
            throw error;
        }
    };
    console.log('[AI Chat TOC] Fetch Interceptor Injected Successfully');
})();
