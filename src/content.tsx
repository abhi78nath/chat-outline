import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App'

function injectScript() {
    const script = document.createElement('script');
    script.src = chrome.runtime.getURL('src/scripts/inject.ts');
    (document.head || document.documentElement).appendChild(script);
    script.onload = () => script.remove();
}

const mountApp = () => {
    const root = document.createElement('div');
    root.id = 'ai-chat-toc-root';
    document.body.appendChild(root);

    // We use Shadow DOM to prevent style leaking
    const shadow = root.attachShadow({ mode: 'open' });
    const shadowRoot = document.createElement('div');
    shadow.appendChild(shadowRoot);

    // Inject basic styles into shadow dom to ensure consistency and isolation
    const style = document.createElement('style');
    style.textContent = `
        :host {
            all: initial;
            position: fixed;
            top: 70px;
            right: 10px;
            z-index: 10000;
        }
        * {
            box-sizing: border-box;
            font-family: system-ui, -apple-system, sans-serif;
        }
    `;
    shadow.appendChild(style);

    const reactRoot = ReactDOM.createRoot(shadowRoot);
    reactRoot.render(
        <React.StrictMode>
            <App />
        </React.StrictMode>
    );
};

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        injectScript();
        mountApp();
    });
} else {
    injectScript();
    mountApp();
}
