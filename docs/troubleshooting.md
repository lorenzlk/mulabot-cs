# Troubleshooting Guide

This guide helps you diagnose and fix common issues with the Mula Slack Assistant.

## Quick Diagnosis

### Health Check Steps

1. **Test deployment URL** - Should return "ok"
2. **Check Apps Script logs** - Look for recent executions
3. **Verify Slack command** - Test `/mula test` in Slack
4. **Review properties** - Ensure all required keys are set

## Common Issues

### 1. No Response from Slack Command

**Symptoms:**
- Slash command shows "failed to send" 
- No "thinking" message appears
- No logs in Apps Script

**Diagnosis:**
```bash
# Test the deployment URL directly
curl https://script.google.com/macros/s/YOUR_DEPLOYMENT_ID/exec
# Should return: ok
```

**Solutions:**
- Verify deployment URL in Slack app settings
- Check if deployment is active (not disabled)
- Ensure "Anyone" has access to the web app
- Verify Slack app has `commands` scope

### 2. "🤖 …thinking…" Never Updates

**Symptoms:**
- Initial thinking message appears
- Message never gets replaced with answer
- Logs show triggers running but no completion

**Diagnosis:**
Check Apps Script logs for:
- `[Info] runId=xxx status="running"`
- `[Error] Failed to fetch run status`
- `[Error] OpenAI API error`

**Solutions:**

#### A. OpenAI API Issues
```javascript
// Check if assistant exists
function checkAssistant() {
  const assistantId = PropertiesService.getScriptProperties().getProperty('OPENAI_ASST');
  console.log('Assistant ID:', assistantId);
  
  if (!assistantId) {
    console.log('No assistant found - run createAssistantWithSearchTool()');
    return;
  }
  
  try {
    const response = Api.get(`/assistants/${assistantId}`);
    console.log('Assistant found:', JSON.parse(response).name);
  } catch (err) {
    console.log('Assistant error:', err.message);
  }
}
```

#### B. Trigger Issues
```javascript
// Check active triggers
function listTriggers() {
  const triggers = ScriptApp.getProjectTriggers();
  triggers.forEach(trigger => {
    console.log(`Trigger: ${trigger.getHandlerFunction()} - ${trigger.getTriggerSource()}`);
  });
}
```

### 3. "Failed to Complete Tool Call"

**Symptoms:**
- Assistant starts processing
- Error message about tool call failure
- Pinecone-related errors in logs

**Diagnosis:**
```javascript
// Test Pinecone connection
function testPinecone() {
  try {
    const result = pineconeQuery('test query');
    console.log('Pinecone results:', result.length);
  } catch (err) {
    console.log('Pinecone error:', err.message);
  }
}
```

**Solutions:**
- Verify Pinecone endpoint URL format
- Check API key permissions
- Ensure index is active and not paused
- Verify vector dimensions match embedding model

### 4. OpenAI Assistant Creation Fails

**Symptoms:**
- `createAssistantWithSearchTool()` throws errors
- No `OPENAI_ASST` property created
- API permission errors

**Diagnosis:**
```javascript
// Test OpenAI API access
function testOpenAI() {
  try {
    const response = Api.get('/models');
    const models = JSON.parse(response);
    console.log('Available models:', models.data.map(m => m.id));
  } catch (err) {
    console.log('OpenAI error:', err.message);
  }
}
```

**Solutions:**
- Verify OpenAI API key is correct
- Check if account has GPT-4 access
- Try using `gpt-3.5-turbo` instead of `gpt-4o-mini`
- Ensure sufficient API credits

### 5. Triggers Not Running

**Symptoms:**
- No automatic processing
- Queued requests never get processed
- No recent executions in logs

**Diagnosis:**
```javascript
// Check trigger status
function checkTriggers() {
  const triggers = ScriptApp.getProjectTriggers();
  console.log(`Found ${triggers.length} triggers`);
  
  triggers.forEach(trigger => {
    console.log(`${trigger.getHandlerFunction()}: ${trigger.getTriggerSource()}`);
  });
}
```

**Solutions:**
- Delete and recreate triggers
- Check Apps Script quotas and limits
- Verify trigger functions exist and are named correctly
- Ensure no syntax errors in code

### 6. Slack Token Issues

**Symptoms:**
- "invalid_auth" errors
- Cannot post messages to Slack
- Permission denied errors

**Diagnosis:**
```javascript
// Test Slack token
function testSlackToken() {
  try {
    const response = UrlFetchApp.fetch('https://slack.com/api/auth.test', {
      headers: { Authorization: `Bearer ${SLACK_BOT_TOKEN}` }
    });
    const data = JSON.parse(response.getContentText());
    console.log('Slack auth:', data);
  } catch (err) {
    console.log('Slack error:', err.message);
  }
}
```

**Solutions:**
- Regenerate bot token in Slack app
- Verify required scopes are granted
- Reinstall Slack app to workspace
- Check token starts with `xoxb-`

## Performance Issues

### Slow Response Times

**Symptoms:**
- Long delays between command and response
- Multiple minute delays

**Diagnosis:**
- Check OpenAI API response times
- Monitor Pinecone query performance
- Review Google Apps Script execution times

**Solutions:**
- Optimize Pinecone queries (reduce topK)
- Consider caching frequent queries
- Review assistant instructions for efficiency

### Rate Limiting

**Symptoms:**
- 429 errors in logs
- Intermittent failures
- "Rate limit exceeded" messages

**Solutions:**
- Add exponential backoff to API calls
- Reduce trigger frequency during high usage
- Implement request queuing (already built-in)

## Debugging Tools

### Enable Verbose Logging

```javascript
// Add to any function for detailed debugging
function debugFunction() {
  console.log('Starting function...');
  
  try {
    // Your code here
    console.log('Success!');
  } catch (err) {
    console.error('Error details:', {
      message: err.message,
      stack: err.stack,
      name: err.name
    });
    throw err;
  }
}
```

### Test Individual Components

```javascript
// Test all components
function runDiagnostics() {
  console.log('=== Mula Assistant Diagnostics ===');
  
  // 1. Test properties
  const props = PropertiesService.getScriptProperties();
  const requiredProps = ['SLACK_BOT_TOKEN', 'OPENAI_KEY', 'PINECONE_ENDPOINT', 'PINECONE_KEY'];
  
  requiredProps.forEach(prop => {
    const value = props.getProperty(prop);
    console.log(`${prop}: ${value ? 'SET' : 'MISSING'}`);
  });
  
  // 2. Test OpenAI
  try {
    const response = Api.get('/models');
    console.log('OpenAI: CONNECTED');
  } catch (err) {
    console.log('OpenAI: ERROR -', err.message);
  }
  
  // 3. Test Pinecone
  try {
    const result = pineconeQuery('test');
    console.log(`Pinecone: CONNECTED (${result.length} results)`);
  } catch (err) {
    console.log('Pinecone: ERROR -', err.message);
  }
  
  // 4. Test Slack
  try {
    const response = UrlFetchApp.fetch('https://slack.com/api/auth.test', {
      headers: { Authorization: `Bearer ${SLACK_BOT_TOKEN}` }
    });
    const data = JSON.parse(response.getContentText());
    console.log(`Slack: ${data.ok ? 'CONNECTED' : 'ERROR'}`);
  } catch (err) {
    console.log('Slack: ERROR -', err.message);
  }
  
  console.log('=== Diagnostics Complete ===');
}
```

## Emergency Procedures

### Reset Everything

If the system is completely broken:

```javascript
// 1. Clear all active runs
function emergencyReset() {
  const props = PropertiesService.getScriptProperties();
  
  // Delete all run metadata
  const allProps = props.getProperties();
  Object.keys(allProps).forEach(key => {
    if (key.startsWith('RUN_META_') || key === 'ACTIVE_RUNS' || key === 'SLASH_QUEUE') {
      props.deleteProperty(key);
    }
  });
  
  console.log('Emergency reset complete');
}

// 2. Recreate triggers
function recreateTriggers() {
  // Delete existing triggers
  ScriptApp.getProjectTriggers().forEach(trigger => {
    ScriptApp.deleteTrigger(trigger);
  });
  
  // Create new ones
  installProcessPendingRequestsTrigger();
  installFinalizeTrigger();
  
  console.log('Triggers recreated');
}
```

### Rollback Deployment

1. Go to **Deploy** → **Manage Deployments**
2. Create new deployment with previous version
3. Update Slack app with new URL
4. Test functionality

## Getting Help

### Information to Collect

When seeking help, provide:

1. **Error messages** from Apps Script logs
2. **Timestamp** of when issue occurred
3. **Slack command used** that caused the problem
4. **Current property values** (without exposing keys)
5. **Recent execution history**

### Log Export

```javascript
// Export recent logs for support
function exportLogs() {
  const logs = [];
  // Note: This is a simplified version
  // In practice, you'd collect from Stackdriver logs
  console.log('Logs exported - check execution transcript');
}
```

---

Still having issues? Check the [setup guide](setup.md) or contact the development team. 