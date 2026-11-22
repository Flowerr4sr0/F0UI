export const F0UIMODINFO = {
    name: "Code Block (BUILTIN)",
    author: "F0UI Devs",
    dependencies: ["highlight.js"]
};


const loadHighlightJS = (() => {
  let promise = null;
  return () => {
    if (window.hljs) return Promise.resolve(window.hljs);
    if (!promise) {
      promise = new Promise((resolve, reject) => {
        const script = document.createElement('script');
        script.src = 'https://cdnjs.cloudflare.com/ajax/libs/highlight.js/11.12.0/highlight.min.js';
        script.onload = () => resolve(window.hljs);
        script.onerror = reject;
        document.head.appendChild(script);
      });
    }
    return promise;
  };
})();

class ChatGPTCodeBlock extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: 'open' });
    this.rawCode = '';
  }

  async connectedCallback() {
    const lang = this.getAttribute('lang') || 'text';
    const codefile = this.getAttribute('codefile');
    const hasDl = this.hasAttribute('dl');
    const dlName = this.getAttribute('dlname');

    if (hasDl && (!dlName || !dlName.trim())) {
      console.error('<code-block>: "dlname" attribute is required when "dl" is present.');
    }

    const showDownload = hasDl && Boolean(dlName && dlName.trim());
    this.rawCode = this.textContent.replace(/^\n+|\n+$/g, '');

    this.render(lang, codefile ? 'Loading...' : this.rawCode, showDownload);

    if (codefile) {
      try {
        const response = await fetch(codefile);
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        this.rawCode = await response.text();
        await this.applyHighlighting(lang, this.rawCode);
      } catch (err) {
        this.rawCode = `// Error loading file: ${codefile} (${err.message})`;
        this.shadowRoot.querySelector('code').textContent = this.rawCode;
      }
    } else {
      await this.applyHighlighting(lang, this.rawCode);
    }
  }

  async applyHighlighting(lang, codeText) {
    const codeEl = this.shadowRoot.querySelector('code');
    codeEl.textContent = codeText;

    try {
      const hljs = await loadHighlightJS();
      if (lang && lang !== 'text' && hljs.getLanguage(lang)) {
        codeEl.innerHTML = hljs.highlight(codeText, { language: lang }).value;
      } else {
        codeEl.innerHTML = hljs.highlightAuto(codeText).value;
      }
    } catch {
      codeEl.textContent = codeText;
    }
  }

  render(lang, initialText, showDownload) {
    this.shadowRoot.innerHTML = `
      <style>
        :host {
          display: block;
          width: 100%;
          max-width: 720px;
        }
        .container {
          background-color: #f9f9f9;
          border: 1px solid #e3e3e3;
          border-radius: 8px;
          overflow: hidden;
          font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
        }
        .header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          background-color: #ececec;
          color: #5d5d5d;
          padding: 8px 16px;
          font-size: 12px;
          user-select: none;
        }
        .actions {
          display: flex;
          align-items: center;
          gap: 14px;
        }
        .btn {
          display: inline-flex;
          align-items: center;
          gap: 5px;
          background: none;
          border: none;
          color: #5d5d5d;
          font-size: 12px;
          font-family: inherit;
          cursor: pointer;
          padding: 2px 4px;
          border-radius: 4px;
          transition: color 0.15s ease;
        }
        .btn:hover {
          color: #0d0d0d;
        }
        pre {
          margin: 0;
          padding: 16px;
          overflow-x: auto;
          font-family: "Söhne Mono", Monaco, "Andale Mono", "Ubuntu Mono", monospace;
          font-size: 14px;
          line-height: 1.5;
          color: #0d0d0d;
        }

        /* ChatGPT Light Mode Syntax Palette (Highlight.js tokens) */
        .hljs-comment,
        .hljs-quote { color: #6a737d; font-style: italic; }
        .hljs-keyword,
        .hljs-selector-tag,
        .hljs-subst { color: #005cc5; }
        .hljs-number,
        .hljs-literal,
        .hljs-variable,
        .hljs-template-variable,
        .hljs-tag .hljs-attr { color: #005cc5; }
        .hljs-string,
        .hljs-doctag { color: #032f62; }
        .hljs-title,
        .hljs-section,
        .hljs-selector-id { color: #6f42c1; }
        .hljs-type,
        .hljs-class .hljs-title { color: #6f42c1; }
        .hljs-tag,
        .hljs-name,
        .hljs-attribute { color: #22863a; }
        .hljs-regexp,
        .hljs-link { color: #032f62; }
        .hljs-symbol,
        .hljs-bullet { color: #e36209; }
        .hljs-built_in,
        .hljs-builtin-name { color: #005cc5; }
        .hljs-meta { color: #6a737d; font-weight: 600; }
        .hljs-deletion { background: #ffeef0; color: #b31d28; }
        .hljs-addition { background: #e6ffed; color: #22863a; }
        .hljs-emphasis { font-style: italic; }
        .hljs-strong { font-weight: bold; }
      </style>

      <div class="container">
        <div class="header">
          <span class="lang">${this.escapeHTML(lang)}</span>
          <div class="actions">
            ${showDownload ? `
              <button class="btn dl-btn" type="button" title="Download file">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
                  <polyline points="7 10 12 15 17 10"></polyline>
                  <line x1="12" y1="15" x2="12" y2="3"></line>
                </svg>
                <span>Download</span>
              </button>
            ` : ''}
            <button class="btn copy-btn" type="button" title="Copy code">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect>
                <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path>
              </svg>
              <span>Copy code</span>
            </button>
          </div>
        </div>
        <pre><code class="hljs"></code></pre>
      </div>
    `;

    this.shadowRoot.querySelector('code').textContent = initialText;

    const copyBtn = this.shadowRoot.querySelector('.copy-btn');
    copyBtn.addEventListener('click', () => {
      navigator.clipboard.writeText(this.rawCode).then(() => {
        const label = copyBtn.querySelector('span');
        label.textContent = 'Copied!';
        setTimeout(() => (label.textContent = 'Copy code'), 2000);
      });
    });

    if (showDownload) {
      const dlBtn = this.shadowRoot.querySelector('.dl-btn');
      dlBtn.addEventListener('click', () => {
        const blob = new Blob([this.rawCode], { type: 'text/plain;charset=utf-8' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = this.getAttribute('dlname').trim();
        a.click();
        URL.revokeObjectURL(url);
      });
    }
  }

  escapeHTML(str) {
    return str.replace(/[&<>"']/g, m => ({
      '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
    }[m]));
  }
}

if (!customElements.get('code-block')) {
  customElements.define('code-block', ChatGPTCodeBlock);
}
