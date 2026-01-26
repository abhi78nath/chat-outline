// This script runs in the page context to intercept fetch calls
(function () {
    const originalFetch = window.fetch;

    const apiPattern = /^https:\/\/chatgpt\.com\/backend-api(?:\/[^\/]*)?\/conversation(?:\/[0-9a-f-]+)?$/;

    window.fetch = async function (...args: any[]) {
        const [resource, config] = args;
        const url = resource instanceof Request ? resource.url : resource;
        const method = resource instanceof Request ? resource.method : (config?.method || 'GET');

        let requestData: any = null;
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
                console.error('Error reading request body:', e);
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

        try {
            const response = await originalFetch.apply(this, args as [RequestInfo | URL, RequestInit | undefined]);
            if (isChatApi) {
                const clone = response.clone();
                clone.text().then(body => {
                    let responseData;
                    try {
                        responseData = JSON.parse(body);
                    } catch {
                        responseData = body;
                    }

                    // Notify the content script
                    window.postMessage({
                        type: 'CHAT_API_RESPONSE',
                        url,
                        method,
                        requestData,
                        responseData
                    }, '*');
                }).catch(err => {
                    console.error('Error reading response:', err.message);
                });
            }

            return response;
        } catch (error) {
            throw error;
        }
    };
})();
