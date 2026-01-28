# Chat Outline

**Chat Outline** is a browser extension designed to help you navigate and manage long conversations in ChatGPT and Grok. It automatically generates a clear Table of Contents (ToC) from your questions, allowing for quick auto-scroll navigation and providing a manual summarization tool to summarize a conversation which may be used as a continuation context in a new session or agent.

![Chat Outline Preview](public/icons/icon128.png)

## 🚀 Features

-   **Automatic Table of Contents**: Instantly lists all user questions/prompts in a floating, draggable side panel.
-   **Click-to-Scroll**: Navigate to any part of a long conversation with a single click.
-   **Conversation Summarization**: Manually trigger a concise summary of the current chat,perfect for transferring context to a new session or agent.
-   **Privacy First**: All processing happens locally in your browser. No data is sent to external servers.
-   **Smart Interception**: Uses fetch interception to maintain a real-time list of messages as you chat.

## 🛠 Supported Platforms

-   [ChatGPT](https://chatgpt.com)
-   [Grok](https://grok.com)

## 📦 Installation (Development Mode)

1.  **Clone the repository**:
    ```bash
    git clone https://github.com/your-username/ai-chat-toc.git
    cd ai-chat-toc
    ```

2.  **Install dependencies**:
    ```bash
    bun install
    # or
    npm install
    ```

3.  **Run in development mode**:
    ```bash
    bun run dev
    # or
    npm run dev
    ```

4.  **Load the extension in Chrome**:
    -   Open Chrome and navigate to `chrome://extensions/`.
    -   Enable **Developer mode** (top right).
    -   Click **Load unpacked**.
    -   Select the `dist` folder generated in the project directory.

## 🛠 Technology Stack

-   **Framework**: React 19
-   **Build Tool**: Vite
-   **Styling**: Vanilla CSS with a focus on premium aesthetics.
-   **Icons**: Lucide React
-   **Language**: TypeScript

## License

MIT

**This project is not affiliated with or endorsed by OpenAI or xAI**
