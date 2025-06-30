# Detailed Setup Guide

This guide provides step-by-step instructions for setting up the Mula Slack Assistant from scratch.

## Prerequisites

Before starting, ensure you have access to:
- Google Account with Apps Script permissions
- Slack workspace with admin privileges
- OpenAI API account with GPT-4 access
- Pinecone account with an active index
- Email data already indexed in Pinecone

## Step 1: Google Apps Script Setup

### 1.1 Create New Project

1. Go to [Google Apps Script](https://script.google.com)
2. Click **New Project**
3. Name your project "Mula Slack Assistant"
4. Delete the default `myFunction()` code

### 1.2 Add the Code

1. Copy the entire contents of `Code.gs` from this repository
2. Paste it into the script editor
3. Save the project (Ctrl+S or Cmd+S)

### 1.3 Configure Project Settings

1. Click the gear icon (Settings) in the left sidebar
2. Under **General settings**:
   - Set **Runtime version** to **V8**
   - Enable **Exception logging** to **Stackdriver**

### 1.4 Set Up Manifest

1. Click **Project Settings** → **Show "appsscript.json" manifest file**
2. Replace the contents with the `appsscript.json` from this repository
3. Save the changes

## Step 2: Environment Variables

### 2.1 Access Script Properties

1. In your Apps Script project, click **Settings** (gear icon)
2. Scroll down to **Script Properties**
3. Click **Add script property**

### 2.2 Add Required Properties

Add each of these properties one by one:

| Property Name | Value | Where to Find |
|---------------|-------|---------------|
| `SLACK_BOT_TOKEN` | `xoxb-your-token` | Slack App → OAuth & Permissions |
| `SLACK_SIGNING_SECRET` | `your-secret` | Slack App → Basic Information |
| `OPENAI_KEY` | `sk-proj-...` | OpenAI Dashboard → API Keys |
| `PINECONE_ENDPOINT` | `https://...` | Pinecone Console → Index Settings |
| `PINECONE_KEY` | `pcsk-...` | Pinecone Console → API Keys |

**Important**: Never commit these values to version control!

## Step 3: Slack App Configuration

### 3.1 Create Slack App

1. Go to [Slack API Dashboard](https://api.slack.com/apps)
2. Click **Create New App**
3. Choose **From scratch**
4. Name: "Mula Assistant"
5. Select your workspace

### 3.2 Configure Bot User

1. Go to **OAuth & Permissions**
2. Under **Scopes** → **Bot Token Scopes**, add:
   - `chat:write`
   - `chat:write.public`
   - `commands`
   - `users:read`

3. Click **Install to Workspace**
4. Copy the **Bot User OAuth Token** (starts with `xoxb-`)
5. Add this to your Apps Script properties as `SLACK_BOT_TOKEN`

### 3.3 Get Signing Secret

1. Go to **Basic Information**
2. Under **App Credentials**, copy the **Signing Secret**
3. Add this to your Apps Script properties as `SLACK_SIGNING_SECRET`

## Step 4: OpenAI Setup

### 4.1 Get API Key

1. Go to [OpenAI Dashboard](https://platform.openai.com/api-keys)
2. Click **Create new secret key**
3. Name it "Mula Slack Assistant"
4. Copy the key (starts with `sk-proj-`)
5. Add this to your Apps Script properties as `OPENAI_KEY`

### 4.2 Verify Model Access

Ensure your OpenAI account has access to `gpt-4o-mini`. If not, you may need to:
- Upgrade your plan
- Or modify the code to use `gpt-3.5-turbo`

## Step 5: Pinecone Setup

### 5.1 Get Connection Details

1. Go to [Pinecone Console](https://app.pinecone.io/)
2. Select your index
3. Copy the **Index URL** (e.g., `https://your-index.svc.us-east1-aws.pinecone.io`)
4. Go to **API Keys** and copy your key
5. Add these to Apps Script properties as `PINECONE_ENDPOINT` and `PINECONE_KEY`

### 5.2 Verify Data

Ensure your Pinecone index contains:
- Email content vectors
- Metadata with `text` and `timestamp` fields
- Appropriate vector dimensions for `text-embedding-3-small` (1536)

## Step 6: Deploy the Application

### 6.1 Create OpenAI Assistant

1. In Apps Script, click the function dropdown
2. Select `createAssistantWithSearchTool`
3. Click **Run**
4. Authorize permissions when prompted
5. Check the logs to ensure success
6. Verify the `OPENAI_ASST` property was created

### 6.2 Install Triggers

1. Select and run `installProcessPendingRequestsTrigger`
2. Select and run `installFinalizeTrigger`
3. Go to **Triggers** tab to verify both triggers are active

### 6.3 Deploy as Web App

1. Click **Deploy** → **New Deployment**
2. Choose **Web App** for type
3. Set **Execute as**: Me
4. Set **Who has access**: Anyone
5. Click **Deploy**
6. Copy the deployment URL

## Step 7: Configure Slack Slash Command

### 7.1 Create Slash Command

1. In your Slack App, go to **Slash Commands**
2. Click **Create New Command**
3. Configure:
   - **Command**: `/mula`
   - **Request URL**: Your Apps Script deployment URL
   - **Short Description**: "Search email archives"
   - **Usage Hint**: "What's the latest update from [account]?"

### 7.2 Reinstall App

1. Go to **OAuth & Permissions**
2. Click **Reinstall to Workspace**
3. Approve the updated permissions

## Step 8: Testing

### 8.1 Health Check

1. Visit your deployment URL in a browser
2. You should see "ok" response

### 8.2 Test Slash Command

1. In Slack, type `/mula test query`
2. You should see "🤖 …thinking…"
3. Wait for the response with search results

### 8.3 Monitor Logs

1. In Apps Script, go to **Executions**
2. Watch for successful processing
3. Check for any errors

## Step 9: Troubleshooting

### Common Issues

1. **"Authorization required"**
   - Re-run the functions to grant permissions
   - Check OAuth scopes in Slack app

2. **"Invalid credentials"**
   - Verify all API keys are correct
   - Check property names match exactly

3. **"No assistant found"**
   - Run `createAssistantWithSearchTool` again
   - Check OpenAI API key has correct permissions

4. **"Pinecone query failed"**
   - Verify index is active and accessible
   - Check endpoint URL format

### Monitoring

- Use **Executions** tab for real-time logs
- Check **Triggers** tab for trigger status
- Monitor **Properties** for queue status

## Security Considerations

- Never share API keys or tokens
- Use environment variables for sensitive data
- Regularly rotate API keys
- Monitor usage and billing

## Maintenance

- Monitor OpenAI usage limits
- Check Pinecone index health
- Review execution logs weekly
- Update assistant instructions as needed

---

Need help? Check the main [README](../README.md) or review the [troubleshooting guide](troubleshooting.md). 