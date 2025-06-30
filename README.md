# Mula Slack Assistant 🤖

> **AI-powered Slack bot that searches email archives using OpenAI Assistants and Pinecone vector search**

A sophisticated Google Apps Script-based Slack bot that helps team members quickly retrieve account summaries and information from indexed email archives. The assistant uses OpenAI's GPT-4 model with custom function calling to search through Pinecone-indexed email data and provide concise, actionable responses.

## 🌟 Features

- **Intelligent Email Search**: Semantic search through email archives using Pinecone vector database
- **OpenAI Assistant Integration**: Powered by GPT-4o-mini with custom function calling
- **Asynchronous Processing**: Queue-based system handles multiple requests efficiently
- **Slack Integration**: Native slash command support with real-time status updates
- **Account Summaries**: Provides concise updates with dates, metrics, and next steps
- **Error Handling**: Robust error handling with detailed logging
- **Scalable Architecture**: Time-based triggers prevent timeouts and handle background processing

## 🏗️ Architecture

The system uses a sophisticated queue-based architecture to handle Slack requests asynchronously:

```
┌─────────────┐    ┌──────────────┐    ┌─────────────┐
│ Slack User  │───▶│ Google Apps  │───▶│ OpenAI      │
│ /command    │    │ Script       │    │ Assistant   │
└─────────────┘    └──────────────┘    └─────────────┘
                           │                    │
                           ▼                    ▼
                   ┌──────────────┐    ┌─────────────┐
                   │ Queue System │    │ Pinecone    │
                   │ + Triggers   │    │ Vector DB   │
                   └──────────────┘    └─────────────┘
```

### Key Components

1. **doPost()**: Receives Slack slash commands and enqueues them
2. **processPendingRequests()**: Processes queued requests (1-minute trigger)
3. **finalizeRuns()**: Monitors OpenAI assistant runs (1-minute trigger)
4. **handleToolCalls()**: Executes Pinecone searches when assistant needs data
5. **Assistant**: Custom OpenAI assistant with email search function

## 🚀 Quick Start

### Prerequisites

- Google Apps Script project
- Slack App with Bot User OAuth Token
- OpenAI API key with GPT-4 access
- Pinecone account with vector database
- Email data indexed in Pinecone

### 1. Set Up Google Apps Script

1. Create a new Google Apps Script project
2. Copy the contents of `Code.gs` into your script editor
3. Save the project

### 2. Configure Environment Variables

In your Google Apps Script project, go to **Settings** → **Script Properties** and add:

| Property | Description | Example |
|----------|-------------|---------|
| `SLACK_BOT_TOKEN` | Slack Bot User OAuth Token | `xoxb-your-bot-token-here` |
| `SLACK_SIGNING_SECRET` | Slack App Signing Secret (optional) | `your-signing-secret-here` |
| `OPENAI_KEY` | OpenAI API Key | `sk-proj-abc123...` |
| `PINECONE_ENDPOINT` | Pinecone Index URL | `https://your-index.svc.us-east1-aws.pinecone.io` |
| `PINECONE_KEY` | Pinecone API Key | `pcsk-abc123...` |

### 3. Create OpenAI Assistant

Run this function once to create your assistant:

```javascript
createAssistantWithSearchTool()
```

This will create an OpenAI assistant and store its ID in the `OPENAI_ASST` property.

### 4. Install Triggers

Run these functions once to set up the processing triggers:

```javascript
installProcessPendingRequestsTrigger()  // Processes queued requests every minute
installFinalizeTrigger()               // Monitors assistant runs every minute
```

### 5. Deploy as Web App

1. Click **Deploy** → **New Deployment**
2. Choose **Web App** as the type
3. Set **Execute as**: Me
4. Set **Who has access**: Anyone
5. Copy the deployment URL

### 6. Configure Slack App

1. In your Slack App settings, go to **Slash Commands**
2. Create a new command (e.g., `/mula`)
3. Set the **Request URL** to your Google Apps Script deployment URL
4. Save the configuration

## 📖 Usage

### Basic Command

```
/mula What's the latest RPM data from X Pub?
```

### Example Response

```
🤖 On June 4, 2025 (email from John at Pub), the RPM was $1.05 (↑ 3% WoW). 
In May it was $0.97 (flat vs. April).

Next Steps:
• Schedule a call with Pub X ad ops by June 10.
• Confirm final creative assets by June 7.

Anything else you'd like to know about Pub X?
```

## 🔧 Configuration

### Assistant Instructions

The assistant is configured with specific instructions for:
- Always searching email archives first
- Providing concise 2-3 sentence summaries
- Including specific dates and metrics
- Formatting next steps as bullet points
- Using professional, clear language

### Search Function

The assistant has access to one function:
- `search_emails(query: string)` - Returns up to 5 email objects with id, text, and timestamp

### Timeout Handling

The system uses cycle tracking and graceful degradation:
- No forced timeouts during debugging phase
- Detailed status logging for monitoring
- Automatic cleanup of completed/failed runs

## 🛠️ Development

### Project Structure

```
mulabot-cs/
├── Code.gs              # Main Google Apps Script file
├── README.md           # This file
├── appsscript.json     # Apps Script manifest
├── docs/               # Documentation
│   ├── setup.md        # Detailed setup guide
│   ├── api.md          # API documentation
│   └── troubleshooting.md
└── examples/           # Usage examples
    └── slack-commands.md
```

### Key Functions

| Function | Purpose |
|----------|---------|
| `doPost()` | Handles incoming Slack requests |
| `processPendingRequests()` | Processes queued slash commands |
| `finalizeRuns()` | Monitors and completes assistant runs |
| `handleToolCalls()` | Executes Pinecone searches |
| `createAssistantWithSearchTool()` | Sets up OpenAI assistant |

### Logging

The system provides comprehensive logging:
- Request queuing and processing
- Assistant run status updates
- Tool call executions
- Error handling and recovery

## 🔍 Monitoring

### Health Check

Visit your deployment URL directly to get a health check:
```
GET https://script.google.com/macros/s/YOUR_DEPLOYMENT_ID/exec
Response: "ok"
```

### Logs

Monitor the system through Google Apps Script's **Executions** tab:
- View real-time execution logs
- Track processing times
- Monitor error rates

### Properties

Check current system state via **Settings** → **Script Properties**:
- `ACTIVE_RUNS`: Currently processing assistant runs
- `RUN_META_*`: Metadata for individual runs
- `SLASH_QUEUE`: Pending slash commands (temporary)

## 📊 Performance

- **Response Time**: ~2-3 seconds for simple queries
- **Concurrent Handling**: Unlimited via queue system
- **Timeout Resilience**: No forced timeouts, graceful degradation
- **Cache Duration**: Thread IDs cached for 6 hours

## 🚨 Troubleshooting

### Common Issues

1. **"Failed to start account summary"**
   - Check OpenAI API key and assistant ID
   - Verify assistant exists and is accessible

2. **"Failed to complete tool call"**
   - Check Pinecone endpoint and API key
   - Verify vector database is accessible

3. **No response in Slack**
   - Check Slack bot token permissions
   - Verify deployment URL in Slack app settings

### Debug Mode

The current version includes verbose logging. Check the **Executions** tab for detailed logs.

## 🔐 Security

- API keys stored securely in Google Apps Script Properties
- All external API calls use proper authentication
- No sensitive data logged or exposed
- Slack signature verification supported (optional)

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## 📄 License

This project is proprietary software for Mula team use.

## 📞 Support

For issues or questions:
1. Check the troubleshooting guide
2. Review execution logs
3. Contact the development team

---

**Built with ❤️ for the Mula team** 
