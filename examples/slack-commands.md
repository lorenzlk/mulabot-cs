# Slack Command Examples

This document provides examples of how to use the Mula Slack Assistant effectively.

## Basic Usage

The assistant responds to the `/mula` slash command in Slack. Simply type your question naturally.

### Syntax
```
/mula [your question about an account or publisher]
```

## Example Commands

### 1. Account Status Queries

**Command:**
```
/mula What's the latest update from Brit+Co?
```

**Expected Response:**
```
🤖 On June 15, 2025 (email from Sarah at Brit+Co), they reported Q2 performance metrics. 
Revenue increased 12% MoM to $45K, with RPM holding steady at $1.08.

Next Steps:
• Review Q3 forecast by June 20
• Schedule quarterly business review

Anything else you'd like to know about Brit+Co?
```

### 2. Performance Metrics

**Command:**
```
/mula What's the RPM data for BuzzFeed this month?
```

**Expected Response:**
```
🤖 On June 10, 2025 (email from Mike at BuzzFeed), RPM was $0.95 (↓ 5% vs May). 
They're seeing seasonal traffic dips but expect recovery in July.

Next Steps:
• Monitor weekly performance through June
• Discuss optimization strategies in next call

Anything else you'd like to know about BuzzFeed?
```

### 3. Revenue Information

**Command:**
```
/mula How is PopSugar performing revenue-wise?
```

**Expected Response:**
```
🤖 On June 8, 2025 (email from Jennifer at PopSugar), May revenue hit $78K (↑ 8% MoM). 
Strong performance in lifestyle and beauty verticals driving growth.

Next Steps:
• Expand beauty content partnership
• Review summer content calendar

Anything else you'd like to know about PopSugar?
```

### 4. Technical Issues

**Command:**
```
/mula Any recent technical issues with Refinery29?
```

**Expected Response:**
```
🤖 On June 12, 2025 (email from Tech Team at Refinery29), they resolved the mobile ad loading issue. 
Page load times improved by 15% and viewability is back to normal levels.

Next Steps:
• Monitor performance metrics weekly
• Implement similar fixes across other properties

Anything else you'd like to know about Refinery29?
```

### 5. Partnership Updates

**Command:**
```
/mula What's new with our Vox Media partnership?
```

**Expected Response:**
```
🤖 On June 14, 2025 (email from David at Vox Media), they're expanding to 3 new verticals. 
Initial tests show 20% higher engagement rates in tech and gaming content.

Next Steps:
• Finalize contracts for new verticals by June 25
• Plan content strategy for Q3 launch

Anything else you'd like to know about Vox Media?
```

## Advanced Usage Tips

### 1. Be Specific with Publisher Names

✅ **Good:**
```
/mula What's the latest from Brit+Co?
/mula BuzzFeed RPM update
/mula PopSugar revenue numbers
```

❌ **Avoid:**
```
/mula What's happening?
/mula Any updates?
/mula How are things?
```

### 2. Use Keywords for Better Results

Include relevant keywords in your queries:

- **Performance**: RPM, CTR, revenue, earnings, metrics
- **Technical**: loading, viewability, issues, bugs, fixes
- **Business**: partnership, contract, renewal, expansion
- **Content**: verticals, categories, strategy, calendar

### 3. Ask Follow-up Questions

The assistant maintains context for follow-up questions:

```
/mula What's the latest from Vice Media?
# Wait for response, then ask:
/mula What about their mobile performance?
```

### 4. Request Specific Data Types

**Metrics-focused:**
```
/mula Show me Mashable's performance metrics
/mula What are the latest RPM numbers for Complex?
```

**Business-focused:**
```
/mula Any contract updates with The Verge?
/mula What's the partnership status with Gizmodo?
```

**Technical-focused:**
```
/mula Any technical issues reported by TechCrunch?
/mula How is the ad serving performance for Engadget?
```

## Response Format

The assistant follows a consistent response format:

1. **Date and Source**: When the information was received and from whom
2. **Key Information**: The most important data points
3. **Context**: Additional relevant details
4. **Next Steps**: Action items or follow-ups (when applicable)
5. **Follow-up Prompt**: Asking if you need more information

## Troubleshooting Commands

### No Results Found

If you see:
```
🤖 I didn't find any recent email matches for that query. 
Could you rephrase or specify a different account?
```

Try:
- Using the full publisher name
- Including alternative spellings or common abbreviations
- Adding more context or keywords

### Examples of Rephasing

**Original:** `/mula How is BC doing?`
**Better:** `/mula What's the latest update from Brit+Co?`

**Original:** `/mula Any news?`
**Better:** `/mula Any recent updates from our publisher partners?`

## Publisher Name Variations

Use these common names/variations:

| Publisher | Alternative Names |
|-----------|------------------|
| Brit+Co | Brit & Co, Brit Co |
| BuzzFeed | Buzz Feed |
| PopSugar | Pop Sugar |
| Refinery29 | Refinery 29, R29 |
| Complex Media | Complex |
| The Verge | Verge |
| TechCrunch | Tech Crunch |

## Best Practices

### 1. Regular Check-ins
```
/mula Weekly update for our top 5 publishers
/mula What's new this week with our partners?
```

### 2. Pre-meeting Preparation
```
/mula Latest metrics for tomorrow's BuzzFeed meeting
/mula Recent issues with Vox Media for our call
```

### 3. Performance Monitoring
```
/mula Any publishers showing declining RPM this month?
/mula Which accounts had technical issues this week?
```

### 4. Business Development
```
/mula Recent expansion discussions with existing partners
/mula Contract renewal timeline for Q3 partners
```

## Integration with Workflows

### Morning Standup
Use the assistant to prepare for team meetings:
```
/mula Key updates from yesterday's publisher emails
/mula Any urgent issues that need attention today?
```

### Client Calls
Get quick context before calls:
```
/mula Recent performance data for [Publisher] before our 2pm call
/mula Latest technical updates from [Publisher]
```

### Weekly Reports
Gather information for reporting:
```
/mula This week's revenue highlights across all partners
/mula Major performance changes this week
```

---

**Pro Tip**: The assistant searches through historical email data, so you can ask about trends, comparisons, and historical performance too!

## Getting Better Results

1. **Use specific timeframes** when possible
2. **Include publisher names** in your queries
3. **Ask follow-up questions** for more detail
4. **Use business terminology** your team commonly uses
5. **Be patient** - complex queries may take a moment to process

Need more help? Check the main [README](../README.md) for setup information. 