/*******************************
 * Mula Slack Assistant (V8)  ✱ 2025-05-22 (updated, debugging logs)
 *
 * Option B: doPost just enqueues; time-based triggers do all network calls.
 * – Added detailed status logging in finalizeRuns()
 * – Removed cycle‐limit check (no forced timeout) for debugging
 *******************************/

/***** CONFIG *****/
const PROPS                = PropertiesService.getScriptProperties();
const SLACK_BOT_TOKEN      = PROPS.getProperty('SLACK_BOT_TOKEN');       // xoxb-...
const SLACK_SIGNING_SECRET = PROPS.getProperty('SLACK_SIGNING_SECRET');  // optional
const OPENAI_KEY           = PROPS.getProperty('OPENAI_KEY');            // sk-...
const OPENAI_ASST          = PROPS.getProperty('OPENAI_ASST');           // asst_… (after createAssistantWithSearchTool)
const PINECONE_ENDPOINT    = PROPS.getProperty('PINECONE_ENDPOINT');     // https://<index-id>.svc.us-east1-aws.pinecone.io
const PINECONE_KEY         = PROPS.getProperty('PINECONE_KEY');          // your Pinecone key

/***** HEALTH CHECK ENDPOINT *****/
function doGet(e) {
  return ContentService.createTextOutput('ok').setMimeType(ContentService.MimeType.TEXT);
}

/***** ENTRYPOINT: enqueue only, no UrlFetchApp.fetch calls here *****/
function doPost(e) {
  try {
    const data = JSON.parse(e.postData.contents);
    if (data.command) {
      const req = {
        text:      data.text.trim(),
        channelId: data.channel_id,
        userId:    data.user_id,
        timestamp: Date.now()
      };
      try {
        enqueueSlashCommand(req);
      } catch (err) {
        Logger.log('[Error] enqueueSlashCommand failed: ' + err);
      }
      return ContentService.createTextOutput('ok').setMimeType(ContentService.MimeType.TEXT);
    }
  } catch (err) {
    Logger.log('[Error] doPost failed: ' + err);
  }
  return ContentService.createTextOutput('ok').setMimeType(ContentService.MimeType.TEXT);
}

/***** Helper to append requests into SLASH_QUEUE *****/
function enqueueSlashCommand(obj) {
  const props = PropertiesService.getScriptProperties();
  let queue = [];
  const raw = props.getProperty('SLASH_QUEUE');
  if (raw) {
    try {
      queue = JSON.parse(raw);
      if (!Array.isArray(queue)) queue = [];
    } catch (e) {
      queue = [];
    }
  }
  queue.push(obj);
  props.setProperty('SLASH_QUEUE', JSON.stringify(queue));
}

/***** RUN - Minute Trigger: process newly queued slash commands *****/
function processPendingRequests() {
  const props = PropertiesService.getScriptProperties();
  const raw   = props.getProperty('SLASH_QUEUE');
  if (!raw) return;

  let queue;
  try {
    queue = JSON.parse(raw);
    if (!Array.isArray(queue) || queue.length === 0) {
      props.deleteProperty('SLASH_QUEUE');
      return;
    }
  } catch (e) {
    Logger.log('[Error] Corrupted SLASH_QUEUE JSON: ' + e);
    props.deleteProperty('SLASH_QUEUE');
    return;
  }

  // Clear the queue so future doPost can enqueue fresh items
  props.deleteProperty('SLASH_QUEUE');

  queue.forEach(item => {
    const text      = item.text;
    const channelId = item.channelId;

    // 1) Post "🤖 …thinking…" to Slack
    let placeholderTs;
    try {
      placeholderTs = postToSlack(channelId, null, '🤖 …thinking…');
    } catch (err) {
      Logger.log(`[Error] Could not post "thinking" placeholder in ${channelId}: ${err}`);
      return;
    }

    // 2) Queue the assistant run
    try {
      queueAssistantRun(text, channelId, placeholderTs);
    } catch (err) {
      Logger.log('[Error] queueAssistantRun failed in processPendingRequests: ' + err);
      postToSlack(channelId, null, `⚠️ Failed to start account summary: ${err.message}`);
    }
  });
}

/***** QUEUE A RUN FOR BACKGROUND PROCESSING (unchanged) *****/
function queueAssistantRun(text, channelId, threadTs) {
  let oaThreadId;
  try {
    oaThreadId = getOrCreateThreadId(channelId, threadTs);
  } catch (err) {
    throw new Error('Unable to create/find assistant thread: ' + err.message);
  }

  try {
    postMessageToThread(oaThreadId, 'user', text);
  } catch (err) {
    throw new Error('Failed to post user message to thread: ' + err.message);
  }

  let runId;
  try {
    runId = JSON.parse(Api.post(`/threads/${oaThreadId}/runs`, {
      assistant_id: OPENAI_ASST
    })).id;
    Logger.log(`[Debug] Started runId=${runId} for threadId=${oaThreadId}`);
  } catch (err) {
    throw new Error('OpenAI "start run" API call failed: ' + err.message);
  }

  try {
    storeRun(runId, {
      channelId: channelId,
      ts:        threadTs,
      threadId:  oaThreadId,
      cycles:    0
    });
  } catch (err) {
    throw new Error('Failed to store run metadata: ' + err.message);
  }
}

/***** FINALIZE BACKGROUND JOB (with verbose status logging, no forced timeout) *****/
function finalizeRuns() {
  const props        = PropertiesService.getScriptProperties();
  const activeRunsJs = props.getProperty('ACTIVE_RUNS');
  if (!activeRunsJs) return;

  let activeRuns = [];
  try {
    activeRuns = JSON.parse(activeRunsJs);
  } catch (e) {
    Logger.log('[Error] Corrupted ACTIVE_RUNS JSON: ' + e);
    props.deleteProperty('ACTIVE_RUNS');
    return;
  }

  const stillActive = [];

  activeRuns.forEach(runId => {
    const metaJs = props.getProperty('RUN_META_' + runId);
    if (!metaJs) {
      Logger.log(`[Warning] Missing metadata for runId=${runId}`);
      return;
    }

    let meta;
    try {
      meta = JSON.parse(metaJs);
    } catch (e) {
      Logger.log('[Error] Cannot parse RUN_META_' + runId + ': ' + e);
      props.deleteProperty('RUN_META_' + runId);
      return;
    }
    if (!meta || !meta.channelId || !meta.threadId) {
      props.deleteProperty('RUN_META_' + runId);
      return;
    }

    let runObj;
    try {
      runObj = JSON.parse(Api.get(`/threads/${meta.threadId}/runs/${runId}`));
    } catch (err) {
      Logger.log('[Error] Failed to fetch run status for ' + runId + ': ' + err);
      stillActive.push(runId);
      return;
    }

    // **Verbose logging of every status**
    Logger.log(`[Info] runId=${runId} status="${runObj.status}", cycles=${meta.cycles}`);

    if (runObj.status === 'completed') {
      postAssistantAnswerInSlack(meta.threadId, meta.channelId, meta.ts);
      Logger.log(`[Info] runId=${runId} completed → posted answer.`);
      props.deleteProperty('RUN_META_' + runId);

    } else if (runObj.status === 'waiting_for_tool_outputs') {
      try {
        handleToolCalls(meta.threadId, runId);
        Logger.log(`[Info] runId=${runId} invoked handleToolCalls.`);
        stillActive.push(runId);
      } catch (err) {
        Logger.log('[Error] handleToolCalls failed for ' + runId + ': ' + err);
        postToSlack(meta.channelId, null,
          `⚠️ Failed to complete tool call for run <${runId}>: ${err.message}`
        );
        props.deleteProperty('RUN_META_' + runId);
      }

    } else {
      // status is likely "running" or something else
      meta.cycles = (meta.cycles || 0) + 1;
      Logger.log(`[Debug] runId=${runId} is still "${runObj.status}", incrementing cycles to ${meta.cycles}`);
      // *** No forced timeout during debugging ***
      // Re‐save and keep active so next minute we check again
      props.setProperty('RUN_META_' + runId, JSON.stringify(meta));
      stillActive.push(runId);
    }
  });

  if (stillActive.length > 0) {
    props.setProperty('ACTIVE_RUNS', JSON.stringify(stillActive));
  } else {
    props.deleteProperty('ACTIVE_RUNS');
  }
}

/***** INSTALL TRIGGERS: run these ONCE to wire everything up *****/
function installProcessPendingRequestsTrigger() {
  ScriptApp.newTrigger('processPendingRequests')
    .timeBased()
    .everyMinutes(1)
    .create();
}
function installFinalizeTrigger() {
  ScriptApp.newTrigger('finalizeRuns')
    .timeBased()
    .everyMinutes(1)
    .create();
}

/***** SLACK UTILITY: post a message or update *****/
function postToSlack(channel, thread_ts, text, edit = false) {
  const url = edit
    ? 'https://slack.com/api/chat.update'
    : 'https://slack.com/api/chat.postMessage';
  const payload = edit
    ? { channel, ts: thread_ts, text }
    : thread_ts
      ? { channel, thread_ts, text }
      : { channel, text };

  try {
    const res = UrlFetchApp.fetch(url, {
      method: 'post',
      headers: { Authorization: `Bearer ${SLACK_BOT_TOKEN}` },
      contentType: 'application/json',
      payload: JSON.stringify(payload),
      muteHttpExceptions: true
    });
    const data = JSON.parse(res.getContentText());
    if (!data.ok) {
      Logger.log('[Slack Error] ' + data.error + ' | payload=' + JSON.stringify(payload));
    }
    return data.ts || thread_ts;
  } catch (err) {
    Logger.log('[Error] postToSlack failed: ' + err);
    return null;
  }
}

/***** OPENAI WRAPPER *****/
const Api = {
  get(path) {
    try {
      const res = UrlFetchApp.fetch('https://api.openai.com/v1' + path, {
        headers: {
          Authorization: `Bearer ${OPENAI_KEY}`,
          'OpenAI-Beta': 'assistants=v2'
        },
        muteHttpExceptions: true
      });
      return res.getContentText();
    } catch (err) {
      throw new Error('HTTP GET ' + path + ' failed: ' + err.message);
    }
  },
  post(path, body) {
    try {
      const res = UrlFetchApp.fetch('https://api.openai.com/v1' + path, {
        method: 'post',
        contentType: 'application/json',
        headers: {
          Authorization: `Bearer ${OPENAI_KEY}`,
          'OpenAI-Beta': 'assistants=v2'
        },
        payload: JSON.stringify(body),
        muteHttpExceptions: true
      });
      return res.getContentText();
    } catch (err) {
      throw new Error('HTTP POST ' + path + ' failed: ' + err.message);
    }
  }
};

/***** THREAD CACHE *****/
function getOrCreateThreadId(channelId, threadTs) {
  const cacheKey = `thr:${channelId}:${threadTs}`;
  const c = CacheService.getScriptCache();
  let id = c.get(cacheKey);
  if (id) {
    return id;
  }
  try {
    const resp = Api.post('/threads', {});
    const json = JSON.parse(resp);
    id = json.id;
    c.put(cacheKey, id, 21600); // cache for 6 hours
    return id;
  } catch (err) {
    throw new Error('OpenAI create thread API failed: ' + err.message);
  }
}

function postMessageToThread(threadId, role, content) {
  try {
    Api.post(`/threads/${threadId}/messages`, { role, content });
  } catch (err) {
    throw new Error('Failed to post message to thread ' + threadId + ': ' + err.message);
  }
}

function lastAssistantMessage(threadId) {
  try {
    const resp = Api.get(`/threads/${threadId}/messages`);
    const data = JSON.parse(resp);
    return data.data[0].content[0].text.value;
  } catch (err) {
    throw new Error('Failed to fetch last assistant message: ' + err.message);
  }
}

function postAssistantAnswerInSlack(threadId, channelId, ts) {
  try {
    const answer = lastAssistantMessage(threadId);
    postToSlack(channelId, ts, answer, true);
  } catch (err) {
    Logger.log('[Error] postAssistantAnswerInSlack failed: ' + err);
    postToSlack(channelId, ts, `⚠️ Failed to retrieve assistant response: ${err.message}`, true);
  }
}

/***** TOOL CALLS & PINECONE *****/
function handleToolCalls(threadId, runId) {
  let run;
  try {
    run = JSON.parse(Api.get(`/threads/${threadId}/runs/${runId}`));
  } catch (err) {
    throw new Error('Error fetching run for tool call: ' + err.message);
  }
  if (!run.required_action || !run.required_action.submit_tool_outputs) return;

  const calls = run.required_action.submit_tool_outputs.tool_calls;
  const outs  = [];

  calls.forEach(c => {
    try {
      const queryArg = JSON.parse(c.function.arguments).query;
      const pineRes  = pineconeQuery(queryArg);
      outs.push({
        tool_call_id: c.id,
        output:       JSON.stringify({ results: pineRes })
      });
    } catch (err) {
      throw new Error('Error during pineconeQuery for tool_call_id=' + c.id + ': ' + err.message);
    }
  });

  try {
    Api.post(`/threads/${threadId}/runs/${runId}/submit_tool_outputs`, { tool_outputs: outs });
  } catch (err) {
    throw new Error('Failed to submit tool outputs: ' + err.message);
  }
}

function pineconeQuery(q) {
  let embedRes;
  try {
    const resp = JSON.parse(Api.post('/embeddings', {
      model: 'text-embedding-3-small',
      input: q
    }));
    embedRes = resp.data[0].embedding;
  } catch (err) {
    throw new Error('Embedding API failed: ' + err.message);
  }

  try {
    const resp = UrlFetchApp.fetch(`${PINECONE_ENDPOINT}/query`, {
      method: 'post',
      contentType: 'application/json',
      headers: { 'Api-Key': PINECONE_KEY },
      payload: JSON.stringify({ vector: embedRes, topK: 5, includeMetadata: true }),
      muteHttpExceptions: true
    });
    const pineconeJson = JSON.parse(resp.getContentText());
    return pineconeJson.matches.map(m => ({
      id:        m.id,
      text:      m.metadata.text,
      timestamp: m.metadata.timestamp
    }));
  } catch (err) {
    throw new Error('Pinecone query failed: ' + err.message);
  }
}

/***** RUN-CACHE HELPERS *****/
function storeRun(id, obj) {
  const props = PropertiesService.getScriptProperties();
  let activeRuns = [];
  const raw = props.getProperty('ACTIVE_RUNS');
  if (raw) {
    try {
      activeRuns = JSON.parse(raw);
      if (!Array.isArray(activeRuns)) activeRuns = [];
    } catch (e) {
      Logger.log('[Error] Corrupted ACTIVE_RUNS, resetting: ' + e);
      activeRuns = [];
    }
  }

  if (!activeRuns.includes(id)) activeRuns.push(id);
  props.setProperty('ACTIVE_RUNS', JSON.stringify(activeRuns));

  try {
    props.setProperty('RUN_META_' + id, JSON.stringify(obj));
  } catch (e) {
    throw new Error('Unable to store RUN_META_' + id + ': ' + e.message);
  }
}

/***** CREATE ASSISTANT (run once) *****/
function createAssistantWithSearchTool() {
  const payload = {
    name: 'Account-Summary-Assistant',
    model: 'gpt-4o-mini',   // ← confirm you have access to this model
    description:
      'Fetches publisher context from Pinecone-indexed emails and returns concise summaries.',
    tools: [
      {
        type: 'function',
        function: {
          name: 'search_emails',
          description:
            'Given a query string, returns up to 5 objects {id, text, timestamp} from Pinecone.',
          parameters: {
            type: 'object',
            properties: {
              query: {
                type: 'string',
                description: 'Search keywords to match against email content.'
              }
            },
            required: ['query']
          }
        }
      }
    ],
    instructions: `
You are Account-Summary-Assistant, an AI that helps Mula team members retrieve concise updates for any publisher account using our email archive.

You have exactly one tool available:

  • search_emails(query: string) → returns up to 5 {id, text, timestamp} objects.

HOW TO RESPOND:
1. ALWAYS begin by calling search_emails with the user's exact question.
2. WAIT for the tool to return and inspect the returned array:
   - If it's empty, reply:
       "I didn't find any recent email matches for that query. Could you rephrase or specify a different account?"
     Then STOP.
3. If you get results:
   - Choose the snippet with the most recent timestamp (or explicit metric mention).
   - Compose a 2–3 sentence summary referencing specific dates.
   - If "next steps" are requested, bullet‐point any action phrases ("let's schedule," "please send," etc.).
4. Use plain, professional English.
5. End with: "Anything else you'd like to know about [account name]?"

Example:
  User: "What's the latest RPM data from Brit+Co?"
  Assistant calls: search_emails(query="What's the latest RPM data from Brit+Co?")
  Response:
    "On June 4, 2025 (email from John at Brit+Co), the RPM was $1.05 (↑ 3% WoW). In May it was $0.97 (flat vs. April).

    Next Steps:
    • Schedule a call with Brit+Co's ad ops by June 10.
    • Confirm final creative assets by June 7.

    Anything else you'd like to know about Brit+Co?"
    `.trim()
  };

  let response;
  try {
    response = UrlFetchApp.fetch(
      'https://api.openai.com/v1/assistants',
      {
        method: 'post',
        contentType: 'application/json',
        headers: {
          Authorization: `Bearer ${OPENAI_KEY}`,
          'OpenAI-Beta': 'assistants=v2'
        },
        payload: JSON.stringify(payload),
        muteHttpExceptions: true
      }
    );
  } catch (fetchErr) {
    Logger.log('[Error] HTTP request to /v1/assistants failed: ' + fetchErr);
    throw new Error('Unable to reach OpenAI endpoint. Check your API key.');
  }

  const statusCode = response.getResponseCode();
  const bodyText   = response.getContentText();
  Logger.log(`[/v1/assistants] HTTP ${statusCode} — response body: ${bodyText}`);

  let json;
  try {
    json = JSON.parse(bodyText);
  } catch (parseErr) {
    Logger.log('[Error] Failed to parse JSON: ' + bodyText);
    throw new Error('OpenAI did not return valid JSON; see Logs.');
  }

  if (json.error) {
    Logger.log('[Error] OpenAI returned an error object: ' + JSON.stringify(json.error));
    throw new Error('OpenAI API error: ' + (json.error.message || JSON.stringify(json.error)));
  }

  if (!json.id) {
    Logger.log('[Error] Missing "id" in JSON. Full response: ' + bodyText);
    throw new Error('No assistant ID returned; see Logs.');
  }

  try {
    PROPS.setProperty('OPENAI_ASST', json.id.toString());
    Logger.log('Stored assistant_id as OPENAI_ASST: ' + json.id);
  } catch (propErr) {
    Logger.log('[Error] Failed to save OPENAI_ASST: ' + propErr);
    throw new Error('Could not save assistant ID; see Logs.');
  }
}

/***** setSecrets (no-op placeholder) *****/
function setSecrets() {
  // no-op. Use the Apps Script Project Settings UI to define
  // SLACK_BOT_TOKEN, SLACK_SIGNING_SECRET, OPENAI_KEY, PINECONE_ENDPOINT, PINECONE_KEY.
} 