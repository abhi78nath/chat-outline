
(function () {
    const originalFetch = window.fetch;

    // Existing endpoint: conversation history / response
    const responseApiPattern =
        /^https:\/\/(?:chatgpt\.com|chat\.openai\.com)\/backend-api\/conversation(?:s)?\/[0-9a-f-]+(?:\?.*)?$/i;

    // New endpoint: outgoing user message request
    const requestApiPattern =
        /^https:\/\/(?:chatgpt\.com|chat\.openai\.com)\/backend-api\/f\/conversation(?:\?.*)?$/i;

    window.fetch = async function (...args) {
        const [resource, config] = args;

        const url = resource instanceof Request
            ? resource.url
            : String(resource);

        const method = resource instanceof Request
            ? (config?.method || resource.method)
            : (config?.method || 'GET');

        const isRequestApi = requestApiPattern.test(url);
        const isResponseApi = responseApiPattern.test(url);

        console.log('[AI Chat TOC] Intercepted Fetch:', method, url);

        let requestData = null;

        // 1. Capture outgoing message payload from /f/conversation
        if (isRequestApi && method.toUpperCase() === 'POST') {
            try {
                if (resource instanceof Request) {
                    const clonedRequest = resource.clone();
                    const body = await clonedRequest.text();

                    if (body) {
                        requestData = JSON.parse(body);
                    }
                } else if (typeof config?.body === 'string') {
                    requestData = JSON.parse(config.body);
                } else if (config?.body) {
                    requestData = config.body;
                }

                if (requestData) {
                    console.log(
                        '[AI Chat TOC] Captured outgoing user payload:',
                        requestData
                    );

                    window.postMessage({
                        type: 'CHAT_API_REQUEST',
                        url,
                        method,
                        requestData
                    }, '*');
                }
            } catch (error) {
                console.error(
                    '[AI Chat TOC] Request body extraction failed:',
                    error
                );
            }
        }

        // 2. Execute original request
        const response = await originalFetch.apply(this, args);

        // 3. Capture response from the existing conversation endpoint
        if (isResponseApi) {
            const clone = response.clone();

            clone.text().then(body => {
                let responseData;

                try {
                    responseData = JSON.parse(body);
                } catch {
                    responseData = body;
                }

                console.log(
                    '[AI Chat TOC] Intercepted Response Body:',
                    responseData
                );

                window.postMessage({
                    type: 'CHAT_API_RESPONSE',
                    url,
                    method,
                    requestData,
                    responseData
                }, '*');

            }).catch(err => {
                console.error(
                    '[AI Chat TOC] Error reading response:',
                    err.message
                );
            });
        }

        return response;
    };

    console.log('[AI Chat TOC] Fetch Interceptor Injected Successfully');
})();
