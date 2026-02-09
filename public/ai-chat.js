// ai-chat.js - Vanilla JS for non-React use
// Requires: supabaseUrl and supabaseAnonKey set in window.env or similar

function getSupabaseConfig() {
  const supabaseUrl = window.env?.SUPABASE_URL ?? window.env?.VITE_SUPABASE_URL;
  const supabaseAnonKey = window.env?.SUPABASE_ANON_KEY ?? window.env?.VITE_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error("Missing Supabase env. Set SUPABASE_URL and SUPABASE_ANON_KEY in window.env.");
  }

  return { supabaseUrl, supabaseAnonKey };
}

class AiChatBox {
  constructor(containerId, options = {}) {
    this.container = document.getElementById(containerId);
    if (!this.container) throw new Error(`Container ${containerId} not found`);

    this.title = options.title || "EduCareer AI";
    this.placeholder = options.placeholder || "Ask anything…";
    this.maxHeightPx = options.maxHeightPx || 420;

    this.messages = [];
    this.isLoading = false;

    this.initUI();
  }

  initUI() {
    this.container.innerHTML = `
      <div style="width: 100%; max-width: 32rem; margin: 0 auto; border: 1px solid #d1d5db; border-radius: 0.75rem; background: white; box-shadow: 0 1px 3px 0 rgb(0 0 0 / 0.1);">
        <div style="display: flex; align-items: center; justify-content: space-between; border-bottom: 1px solid #d1d5db; padding: 1rem;">
          <div style="min-width: 0;">
            <div style="font-size: 0.875rem; font-weight: 600; color: #111827; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">${this.title}</div>
            <div style="font-size: 0.75rem; color: #6b7280; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">Powered by Supabase Edge Function</div>
          </div>
          <div id="loading" style="font-size: 0.75rem; color: #6b7280; display: none;">Thinking…</div>
        </div>
        <div id="messages" style="padding: 1rem; space-y: 0.75rem; overflow-y: auto; max-height: ${this.maxHeightPx}px;">
          <div style="flex: 1 0 auto;"></div>
        </div>
        <div style="border-top: 1px solid #d1d5db; padding: 1rem;">
          <form id="form" style="display: flex; align-items: end; gap: 0.5rem;">
            <textarea id="input" rows="1" style="min-height: 2.75rem; width: 100%; resize: none; border: 1px solid #d1d5db; border-radius: 0.5rem; background: white; padding: 0.5rem; font-size: 0.875rem; color: #111827; outline: none; focus:border-blue-500;" placeholder="${this.placeholder}"></textarea>
            <button type="submit" id="send" style="height: 2.75rem; flex-shrink: 0; border-radius: 0.5rem; background: #3b82f6; padding: 0 1rem; font-size: 0.875rem; font-weight: 600; color: white; border: none; cursor: pointer; disabled:opacity: 0.6;" disabled>Send</button>
          </form>
          <div style="margin-top: 0.5rem; font-size: 0.75rem; color: #6b7280;">Your OpenAI key stays on the server.</div>
        </div>
      </div>
    `;

    this.messagesEl = this.container.querySelector('#messages');
    this.form = this.container.querySelector('#form');
    this.input = this.container.querySelector('#input');
    this.sendBtn = this.container.querySelector('#send');
    this.loadingEl = this.container.querySelector('#loading');

    this.form.addEventListener('submit', (e) => {
      e.preventDefault();
      this.sendMessage();
    });

    this.input.addEventListener('input', () => this.updateSendBtn());
    this.input.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        this.sendMessage();
      }
    });

    this.addMessage("assistant", "Hi! How can I help you today?");
  }

  updateSendBtn() {
    const content = this.input.value.trim();
    this.sendBtn.disabled = !content || this.isLoading;
  }

  addMessage(role, content) {
    this.messages.push({ role, content });
    const msgEl = document.createElement('div');
    msgEl.style.cssText = role === 'user'
      ? 'display: flex; justify-content: flex-end; margin-bottom: 0.75rem;'
      : 'display: flex; justify-content: flex-start; margin-bottom: 0.75rem;';

    msgEl.innerHTML = `
      <div style="${role === 'user'
        ? 'max-width: 85%; border-radius: 1rem; background: #3b82f6; padding: 0.5rem; font-size: 0.875rem; color: white;'
        : 'max-width: 85%; border-radius: 1rem; background: #f3f4f6; padding: 0.5rem; font-size: 0.875rem; color: #111827;'} white-space: pre-wrap; word-break: break-word;">
        ${content}
      </div>
    `;

    this.messagesEl.appendChild(msgEl);
    this.messagesEl.scrollTop = this.messagesEl.scrollHeight;
  }

  async sendMessage() {
    const content = this.input.value.trim();
    if (!content || this.isLoading) return;

    this.addMessage("user", content);
    this.input.value = "";
    this.updateSendBtn();

    this.isLoading = true;
    this.loadingEl.style.display = 'block';

    try {
      const { supabaseUrl, supabaseAnonKey } = getSupabaseConfig();
      const resp = await fetch(`${supabaseUrl}/functions/v1/ai-chat`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          apikey: supabaseAnonKey,
          Authorization: `Bearer ${supabaseAnonKey}`,
        },
        body: JSON.stringify({ message: content }),
      });

      const text = await resp.text();
      let data;
      try {
        data = JSON.parse(text);
      } catch {
        data = null;
      }

      if (!resp.ok) {
        const msg = data?.error || `Request failed (${resp.status})`;
        throw new Error(msg);
      }

      const reply = data?.reply?.trim();
      if (!reply) {
        throw new Error("AI returned empty response.");
      }

      this.addMessage("assistant", reply);
    } catch (error) {
      const msg = error.message || "Failed to contact AI.";
      const errorEl = document.createElement('div');
      errorEl.style.cssText = 'border-radius: 0.5rem; border: 1px solid #ef4444; background: #fef2f2; padding: 0.75rem; font-size: 0.875rem; color: #dc2626; margin-bottom: 0.75rem;';
      errorEl.textContent = msg;
      this.messagesEl.appendChild(errorEl);
      this.messagesEl.scrollTop = this.messagesEl.scrollHeight;
    } finally {
      this.isLoading = false;
      this.loadingEl.style.display = 'none';
      this.updateSendBtn();
    }
  }
}

// Usage: new AiChatBox('chat-container', { title: 'My AI Chat' });
