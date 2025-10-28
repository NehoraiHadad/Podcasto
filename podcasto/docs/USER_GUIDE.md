# Podcasto User Guide

## Table of Contents
- [Getting Started](#getting-started)
- [Choosing Your Podcast Format](#choosing-your-podcast-format)
- [Creating a Podcast](#creating-a-podcast)
- [Managing Episodes](#managing-episodes)
- [Email Notifications](#email-notifications)
- [Best Practices](#best-practices)

---

## Getting Started

Welcome to Podcasto! This guide will help you create and manage AI-powered podcasts from Telegram news channels.

### Prerequisites
- A Podcasto account (sign up at the login page)
- Admin access to create podcasts (request from administrator)
- Access to Telegram channels you want to convert to podcasts

---

## Choosing Your Podcast Format

Podcasto offers two distinct formats for your podcasts. Choose the one that best matches your content and audience.

### Single-Speaker Format (Monologue)

**What is it?**
One host narrates the entire episode, speaking directly to the audience in a continuous narrative.

**Best for:**
- **News summaries and updates**: Daily or weekly news roundups
- **Personal commentary**: Opinion pieces and analysis
- **Educational content**: Lessons, tutorials, explanations
- **Solo storytelling**: Narrative content with one voice
- **Market analysis**: Financial commentary and trends
- **Daily briefings**: Quick updates and summaries

**Advantages:**
- Faster processing time
- Consistent voice throughout
- Clear, focused narrative
- Ideal for factual content
- Professional newsreader style

**Example Use Cases:**
- "Morning Tech News" - A 5-minute tech news summary delivered every morning
- "History Lessons" - Educational content about historical events
- "Market Commentary" - Daily financial market analysis
- "Daily Science" - Brief explanations of scientific discoveries

**Voice Options:**
- Single professional narrator voice
- Consistent tone and pacing
- Various voice personalities available (professional, friendly, authoritative)

---

### Multi-Speaker Format (Dialogue)

**What is it?**
Two speakers engage in conversation, creating a dynamic dialogue with back-and-forth exchanges.

**Best for:**
- **Interviews and Q&A**: One host interviews a guest or expert
- **Discussion shows**: Two hosts debate or analyze topics
- **Panel formats**: Co-hosts reviewing content together
- **Educational dialogue**: Teacher-student style explanations
- **News analysis**: Two perspectives on current events

**Advantages:**
- More engaging for listeners
- Natural conversation flow
- Multiple perspectives
- Better for complex topics
- Mimics traditional podcast format

**Example Use Cases:**
- "Tech Talk" - Two hosts discuss and debate technology topics
- "The Interview" - Host interviews different experts each episode
- "Weekly Review" - Co-hosts review the week's major events
- "Startup Stories" - Founder interviews and business discussions

**Voice Options:**
- Two distinct voices (typically male and female)
- Clear role differentiation (Host and Expert, Host and Guest, etc.)
- Natural conversational dynamics

---

## Creating a Podcast

Follow these steps to create your first podcast:

### Step 1: Navigate to Create Podcast
1. Log in to your Podcasto account
2. Access the **Admin Panel** from the navigation menu
3. Click **Create Podcast** button

### Step 2: Basic Information Tab

Fill in the essential details:

**Podcast Title** (Required)
- Keep it concise and descriptive
- Example: "Daily Tech News" or "Weekly Science Digest"

**Description**
- Brief overview of your podcast's content
- What listeners can expect

**Creator** (Required)
- Your name or organization name
- Appears in podcast metadata

**Podcast Name** (Required)
- Display name for the podcast
- Can be different from the title

**Slogan**
- Optional tagline
- Example: "Your daily dose of tech insights"

### Step 3: Content Source Tab

Configure where your content comes from:

**Content Source**
- Select "Telegram Channel"

**Telegram Channel** (Required)
- Enter the Telegram channel name or URL
- Example: "@technews" or "https://t.me/technews"

**Time Range**
- Specify how many hours of messages to fetch
- Default: 24 hours (daily episodes)
- Options: 6, 12, 24, 48, 72, 168 (weekly) hours

### Step 4: Style & Roles Tab

**This is where you choose your podcast format!**

**Podcast Format** (Required)
- Select either:
  - **Single-Speaker** (Monologue)
  - **Multi-Speaker** (Dialogue)

**Speaker Roles:**

For **Single-Speaker** format:
- **Speaker 1 Role**: Enter one role (e.g., "Host", "Narrator", "Commentator")
- Speaker 2 field will be hidden

For **Multi-Speaker** format:
- **Speaker 1 Role**: Primary speaker (e.g., "Host", "Interviewer")
- **Speaker 2 Role**: Secondary speaker (e.g., "Expert", "Guest", "Co-host")

**Conversation Style**
- Choose the tone: Engaging, Professional, Casual, Educational, etc.

**Creativity Level**
- Slider from 0-100
- Lower values: More factual and straightforward
- Higher values: More creative and conversational
- Recommended: 50-70 for news, 70-90 for entertainment

### Step 5: Additional Settings Tab

**Language**
- Select your podcast language (English, Hebrew, etc.)

**Mixing Techniques**
- Select audio processing options
- Normalization, compression, etc.

**Additional Instructions**
- Optional custom instructions for content generation
- Specific topics to focus on or avoid

**Episode Frequency**
- How often episodes should be generated
- Default: 7 days (weekly)
- Options: 1 (daily), 3, 7, 14, 30 days

### Step 6: Review and Submit

1. Review all your settings
2. Click **Create Podcast**
3. Wait for confirmation

**Important Note:** You cannot change the podcast format after creating episodes. If you need to change the format, create a new podcast configuration.

---

## Managing Episodes

### Generating Episodes

**Manual Generation:**
1. Go to **Admin Panel** → **Episode Management**
2. Find your podcast
3. Click **Generate Episode**
4. Episode will be queued for processing

**Automatic Generation:**
- Episodes are generated based on your **Episode Frequency** setting
- Scheduled episodes run at midnight UTC
- Check episode status in the admin panel

### Episode Processing States

Episodes go through several stages:

1. **Pending**: Episode created, waiting to be processed
2. **Telegram Fetching**: Collecting messages from Telegram
3. **Script Generation**: Creating podcast script with AI
4. **Audio Generation**: Converting script to audio
5. **Completed**: Episode ready for listening
6. **Failed**: Something went wrong (check error message)

### Viewing Episodes

**Admin Panel:**
- See all episodes for all podcasts
- Filter by status
- Bulk actions (delete, retry)

**My Podcasts Page:**
- Your personal podcast subscriptions
- Listen to episodes
- Download audio files

### Episode Details

Click on any episode to see:
- Title and description
- Audio player
- Duration
- Publication date
- Processing metadata
- Error details (if failed)

---

## Email Notifications

### Enabling Notifications

1. Go to **Profile** page
2. Toggle **Email Notifications** on/off
3. Receive episode notifications when:
   - New episode is published
   - Episode you're subscribed to completes

### Notification Content

Emails include:
- Episode title and description
- Direct link to listen
- Podcast information
- Unsubscribe option

### Duplicate Prevention

The system ensures you only receive one notification per episode, even if there are processing retries.

---

## Best Practices

### Choosing the Right Format

**Use Single-Speaker when:**
- Content is primarily informational
- You want fast, efficient narration
- Audience prefers straightforward delivery
- Content is news, updates, or summaries
- Budget or time is limited

**Use Multi-Speaker when:**
- Content benefits from discussion
- Multiple perspectives add value
- Audience enjoys conversational style
- Content is interviews or debates
- You want more engaging episodes

### Content Quality

**For Better Episodes:**
- Use active Telegram channels with regular updates
- Set appropriate time ranges (24h for daily, 168h for weekly)
- Write clear additional instructions if needed
- Choose appropriate creativity levels for your content type

**Telegram Channel Tips:**
- Ensure channels have consistent posting
- Avoid channels with too much noise or spam
- Multiple channels can provide richer content
- Test with different channels to find best fit

### Creativity Levels Guide

- **0-30**: Strictly factual, minimal interpretation
- **30-50**: Balanced, professional narration
- **50-70**: Engaging with some personality (recommended for most)
- **70-85**: Creative, conversational, entertaining
- **85-100**: Highly creative, may add humor or commentary

### Episode Frequency

**Daily (1 day):**
- High-activity channels
- Time-sensitive content
- News and updates

**Weekly (7 days):**
- Most common setting
- Good for digests and summaries
- Allows content to accumulate

**Bi-weekly/Monthly (14-30 days):**
- Low-activity channels
- In-depth analysis
- Curated content

### Troubleshooting Tips

**Episode Failed?**
- Check Telegram channel is accessible
- Verify time range captured messages
- Review error message in episode details
- Try regenerating the episode

**No Messages Found?**
- Extend time range
- Check channel is active
- Verify channel name is correct
- Ensure channel is public or you have access

**Audio Quality Issues?**
- Review mixing techniques settings
- Check script creativity level
- Verify language settings match content
- Consider adjusting conversation style

---

## Getting Help

**Documentation:**
- [Podcast Formats Guide](PODCAST_FORMATS.md) - Detailed format comparison
- [API Documentation](API_DOCUMENTATION.md) - For developers
- [Troubleshooting Guide](TROUBLESHOOTING.md) - Common issues

**Support:**
- Contact your administrator for account issues
- Check CloudWatch logs (admins only)
- Review episode error messages for specific issues

---

**Happy Podcasting!**
