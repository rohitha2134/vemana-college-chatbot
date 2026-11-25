/**
 * LetseeAI Autonomous Website Assistant Widget
 * Pure AI Edge Loader: loads /ai-edge/ artifacts and runs client-side intelligence
 * Zero Inlined Company Data - 100% Sourced from /ai-edge/
 */
(function() {
  'use strict';

  var config = window.LetseeAIConfig || {};
  var scriptTag = document.currentScript || (function() {
    var scripts = document.getElementsByTagName('script');
    for (var i = scripts.length - 1; i >= 0; i--) {
      if (scripts[i].src && scripts[i].src.indexOf('widget.js') !== -1) return scripts[i];
    }
    return null;
  })();
  var scriptFolder = '';
  if (scriptTag && scriptTag.src) {
    var lastSlash = scriptTag.src.lastIndexOf('/');
    if (lastSlash !== -1) {
      scriptFolder = scriptTag.src.substring(0, lastSlash);
    }
  }
  var baseUrl = config.baseUrl;
  if (!baseUrl) {
    if (config.publicDemoUrl && config.publicDemoUrl.indexOf('YOUR-DEPLOYED') === -1 && config.publicDemoUrl !== window.location.origin) {
      baseUrl = config.publicDemoUrl;
    } else if (scriptFolder) {
      baseUrl = scriptFolder;
    } else {
      baseUrl = (config.publicDemoUrl || window.location.origin);
    }
  }
  baseUrl = (baseUrl || '').replace(/\/+$/, '');
  var primaryColor = config.primaryColor || '#0F172A';
  var assistantName = config.assistantName || 'Vemana Institute of Technology (Vemana IT) AI Assistant';
  var welcomeMessage = config.welcomeMessage || 'Hello! Welcome to Vemana Institute of Technology (Vemana IT). How may I help you today?';
  var position = config.position || 'bottom-left';
  var widgetLabel = config.widgetLabel || 'Chat Here';

  var runtime = null;
  var history = [];

  // 1. Sequentially load runtime script dependencies
  function loadScript(src) {
    return new Promise(function(resolve, reject) {
      var s = document.createElement('script');
      s.src = src;
      s.onload = resolve;
      s.onerror = reject;
      document.head.appendChild(s);
    });
  }

  function fetchJson(path, fallback) {
    return fetch(baseUrl + path)
      .then(function(r) {
        if (!r.ok) return fallback;
        return r.json().catch(function() { return fallback; });
      })
      .catch(function(err) {
        console.warn('LetseeAI: Could not load JSON from ' + path, err);
        return fallback;
      });
  }

  function fetchText(path, fallback) {
    return fetch(baseUrl + path)
      .then(function(r) {
        if (!r.ok) return fallback;
        return r.text().catch(function() { return fallback; });
      })
      .catch(function(err) {
        console.warn('LetseeAI: Could not load text from ' + path, err);
        return fallback;
      });
  }

  // 2. Fetch all /ai-edge/ artifacts directly
  async function loadAIEdgeArtifacts() {
    try {
      var [
        profileRes,
        factsRes,
        kgRes,
        qaRes,
        semIdxRes,
        entIdxRes,
        intIdxRes,
        cfgRes,
        boundariesRes,
        provRes,
        modelCfgRes,
        sysInstRes,
        reasonPromptRes,
        groundRulesRes
      ] = await Promise.all([
        fetchJson('/ai-edge/knowledge/company-profile.json', {}),
        fetchJson('/ai-edge/knowledge/atomic-facts.json', []),
        fetchJson('/ai-edge/knowledge/knowledge-graph.json', { entities: [], relationships: [] }),
        fetchJson('/ai-edge/knowledge/manual-qa.json', []),
        fetchJson('/ai-edge/index/semantic-index.json', []),
        fetchJson('/ai-edge/index/entity-index.json', []),
        fetchJson('/ai-edge/index/intent-index.json', []),
        fetchJson('/ai-edge/config/ai-edge-config.json', {}),
        fetchJson('/ai-edge/config/answer-boundaries.json', {}),
        fetchJson('/ai-edge/config/source-provenance.json', []),
        fetchJson('/ai-edge/runtime/local-model-config.json', {}),
        fetchText('/ai-edge/prompts/system-instructions.txt', ''),
        fetchText('/ai-edge/prompts/reasoning-prompt.txt', ''),
        fetchText('/ai-edge/prompts/grounding-rules.txt', '')
      ]);

      // Load runtime script modules from /ai-edge/runtime/
      await loadScript(baseUrl + '/ai-edge/runtime/retrieval-engine.js');
      await loadScript(baseUrl + '/ai-edge/runtime/answer-validator.js');
      await loadScript(baseUrl + '/ai-edge/runtime/reasoning-engine.js');
      await loadScript(baseUrl + '/ai-edge/runtime/ai-edge-runtime.js');

      var defaultIntents = [
        { id: 'intent_location', name: 'Location', samplePhrases: ['where is the campus', 'what is the address', 'where is it located', 'location'], relevantPredicates: ['locatedAt'] },
        { id: 'intent_facilities', name: 'Facilities', samplePhrases: ['what facilities do you have', 'computer labs', 'library', 'sports grounds'], relevantPredicates: ['hasFacility'] },
        { id: 'intent_transport', name: 'Transport', samplePhrases: ['does the college provide transportation', 'is bus available', 'school buses', 'transport'], relevantPredicates: ['providesTransportation'] },
        { id: 'intent_programs', name: 'Programs', samplePhrases: ['what courses do you offer', 'academic programs', 'degrees offered'], relevantPredicates: ['offersProgram', 'offersGrades'] },
        { id: 'intent_contact', name: 'Contact', samplePhrases: ['phone number', 'email address', 'how to contact', 'office timings'], relevantPredicates: ['hasPhone', 'hasEmail'] }
      ];

      var resolvedIntents = (Array.isArray(intIdxRes) && intIdxRes.length > 0) ? intIdxRes : defaultIntents;

      var aiEdge = {
        profile: profileRes,
        atomicFacts: factsRes,
        knowledgeGraph: kgRes,
        entities: (kgRes && kgRes.entities) || [],
        relationships: (kgRes && kgRes.relationships) || [],
        manualQA: qaRes,
        semanticIndex: semIdxRes,
        entityIndex: entIdxRes,
        intentIndex: intIdxRes,
        answerBoundaries: boundariesRes,
        provenance: provRes,
        modelConfig: modelCfgRes,
        intents: resolvedIntents
      };

      var prompts = {
        systemInstructions: sysInstRes,
        reasoningPrompt: reasonPromptRes,
        groundingRules: groundRulesRes
      };

      if (window.CompanyAIEdgeRuntime) {
        runtime = new window.CompanyAIEdgeRuntime(aiEdge, prompts);
      }
    } catch(err) {
      console.error('LetseeAI: Failed to load /ai-edge/ artifacts:', err);
    }
  }

  // 3. Mount Clean Widget Interface
  function mountUI() {
    var container = document.createElement('div');
    container.id = 'letsee-ai-root';
    container.className = 'letsee-widget-container pos-' + position;

    container.innerHTML = `
      <div id="letsee-panel" class="letsee-chat-panel letsee-hidden" style="border-top: 4px solid ${primaryColor}">
        <div class="letsee-panel-header" style="background: #0f172a">
          <div class="letsee-header-brand">
            <div class="letsee-avatar">🤖</div>
            <div>
              <div class="letsee-title">${assistantName}</div>
              <div class="letsee-badge-status">● Local Verified AI Edge</div>
            </div>
          </div>
          <button id="letsee-close-btn" class="letsee-close-icon" title="Close chat">✕</button>
        </div>
        <div id="letsee-messages" class="letsee-messages-list">
          <div class="letsee-msg letsee-msg-assistant">
            <div class="letsee-msg-bubble">${welcomeMessage}</div>
          </div>
        </div>
        <div class="letsee-input-bar">
          <input id="letsee-chat-input" type="text" placeholder="Ask a question..." />
          <button id="letsee-send-btn" style="background: ${primaryColor}">Send</button>
        </div>
      </div>
      <button id="letsee-launcher-btn" class="letsee-launcher-button" style="background: ${primaryColor}">
        <span class="letsee-launcher-icon">💬</span>
        <span class="letsee-launcher-label">${widgetLabel}</span>
      </button>
    `;

    document.body.appendChild(container);

    var launcherBtn = document.getElementById('letsee-launcher-btn');
    var closeBtn = document.getElementById('letsee-close-btn');
    var panel = document.getElementById('letsee-panel');
    var sendBtn = document.getElementById('letsee-send-btn');
    var input = document.getElementById('letsee-chat-input');
    var messagesList = document.getElementById('letsee-messages');

    launcherBtn.addEventListener('click', function() {
      panel.classList.toggle('letsee-hidden');
      if (!panel.classList.contains('letsee-hidden')) input.focus();
    });

    closeBtn.addEventListener('click', function() {
      panel.classList.add('letsee-hidden');
    });

    async function handleSend() {
      var text = input.value.trim();
      if (!text) return;
      input.value = '';

      appendMessage('visitor', text);
      var typingEl = appendMessage('assistant', 'Thinking...');

      try {
        if (!runtime) await loadAIEdgeArtifacts();
        var res = runtime ? await runtime.processQuestion(text, history) : null;
        var answerText = (res && res.answer) || "I don't have verified information about that in the current company knowledge base.";
        typingEl.querySelector('.letsee-msg-bubble').textContent = answerText;
        history.push({ role: 'user', text: text });
        history.push({ role: 'assistant', text: answerText });
      } catch(err) {
        typingEl.querySelector('.letsee-msg-bubble').textContent = "I don't have verified information about that in the current company knowledge base.";
      }
    }

    function appendMessage(role, msgText) {
      var item = document.createElement('div');
      item.className = 'letsee-msg letsee-msg-' + role;
      item.innerHTML = '<div class="letsee-msg-bubble">' + msgText + '</div>';
      messagesList.appendChild(item);
      messagesList.scrollTop = messagesList.scrollHeight;
      return item;
    }

    sendBtn.addEventListener('click', handleSend);
    input.addEventListener('keydown', function(e) {
      if (e.key === 'Enter') handleSend();
    });
  }

  async function init() {
    await loadAIEdgeArtifacts();
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', mountUI);
    } else {
      mountUI();
    }
  }

  init();
})();
