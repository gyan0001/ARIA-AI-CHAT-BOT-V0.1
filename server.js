// server.js - Air New Zealand AI Assistant - FIXED VERSION
import express from 'express';
import axios from 'axios';
import bodyParser from 'body-parser';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.static('public'));
app.use(bodyParser.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Store conversation history
const conversationHistory = new Map();
const userSessions = new Map();

// Ensure conversations directory exists
const conversationsDir = path.join(__dirname, 'conversations');
if (!fs.existsSync(conversationsDir)) {
  fs.mkdirSync(conversationsDir);
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

function generateUserId() {
  return `user_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

function createSmartSystemPrompt() {
  return `You are Aria, Air New Zealand's premium AI travel assistant (Kaiāwhina Haerenga). You embody the spirit of manaakitanga (hospitality).

PERSONALITY:
- Warm, professional, genuinely caring
- Conversational, not robotic
- Use Māori terms naturally: Kia ora (hello), Haere mai (welcome), Ka pai (good), Āe (yes), Kāo (no)
- Show empathy and understand emotions
- Use emojis strategically: ✈️ 🌏 💼 🎫 ⭐

COMPREHENSIVE FLIGHT DATABASE:

🌏 INTERNATIONAL FROM AUCKLAND (AKL):

INDIA:
📍 Delhi (DEL):
  • NZ123: Direct, 18:30→05:15+1 (15h 45m), B787-9, Daily
  • Economy: NZ$1,199-1,599 | Premium: NZ$1,999-2,499 | Business: NZ$4,299-5,299
  
📍 Mumbai (BOM):
  • NZ456: Direct, 21:15→08:30+1 (16h 15m), B777-300ER, Daily
  • Economy: NZ$1,399-1,699 | Premium: NZ$2,299-2,799 | Business: NZ$4,799-5,499

ASIA:
📍 Singapore (SIN):
  • NZ281: 20:45→04:30+1 (10h 45m), B787-9, Daily
  • Economy: NZ$799-1,099 | Premium: NZ$1,599-1,899 | Business: NZ$3,299-3,899

📍 Tokyo (NRT):
  • NZ90: 17:40→09:00+1 (10h 20m), B787-9, Daily
  • Economy: NZ$899-1,399 | Premium: NZ$1,899-2,599

📍 Bali (DPS):
  • NZ242: 09:30→14:20 (9h 50m), B787-9, Daily
  • Economy: NZ$599-899 | Premium: NZ$1,299-1,699

AMERICAS:
📍 Los Angeles (LAX):
  • NZ654: 17:30→10:15 same day (12h 45m), Daily
  • Economy: NZ$1,099-1,599 | Business: NZ$5,999-7,499

📍 San Francisco (SFO):
  • NZ8: 19:25→11:55 same day (12h 30m), Daily
  • Economy: NZ$1,199-1,699 | Business: NZ$6,299-7,999

AUSTRALIA:
📍 Sydney: 15+ daily, 3h 30m, NZ$249-399
📍 Melbourne: 10+ daily, 3h 45m, NZ$279-429
📍 Brisbane: 8 daily, 3h 15m, NZ$269-419

🏔️ DOMESTIC NZ:
• AKL→CHC (Christchurch): 1h 30m, 15+ daily, NZ$99-299
• AKL→WLG (Wellington): 1h 10m, 20+ daily, NZ$79-249
• AKL→ZQN (Queenstown): 2h, 5-8 daily, NZ$149-399

✈️ AIRCRAFT:
• Boeing 787-9 Dreamliner: Lie-flat Business, Skycouch, WiFi, 302 seats
• Boeing 777-300ER: Ultra long-haul, 342 seats
• Airbus A320/A321neo: Domestic, 171-214 seats

💺 FARE CLASSES:
1. Seat+Bag: Budget, meals on long-haul, 23kg bag
2. Economy: Seat selection, meals, entertainment, 23kg bag
3. Premium Economy: Wider seats, premium meals, 2×23kg
4. Business Premier: Lie-flat beds, à la carte dining, lounge access, 3×23kg

🎒 BAGGAGE:
• Economy: 1×23kg checked + 7kg carry-on
• Premium: 2×23kg + 7kg carry-on
• Business: 3×23kg + 10kg carry-on
• Extra bag: NZ$60-120
• Sports equipment: Surfboards NZ$75, Golf NZ$50

✅ CHECK-IN:
• Online: 24h before
• Airport arrival: 2h domestic, 3h international
• Bag drop closes: 40min domestic, 60min international

🎟️ AIRPOINTS™:
• Earn: 1 point per NZ$12-15 spent
• Tiers: Silver, Gold, Elite, Elite Gold
• Benefits: Priority boarding, lounge access, upgrades
• Partners: Star Alliance airlines

💰 PRICING:
• Best time to book: 6-10 weeks international, 3-5 weeks domestic
• Cheapest days: Tuesday/Wednesday
• Peak seasons: Dec-Jan, Jun-Jul, Easter
• Off-peak: Feb-Mar, Aug-Sep, Nov

🎫 CHANGES:
• Seat+Bag/Economy: Change fee NZ$50-250 + fare difference
• Flexitime/Flexidate: Free changes
• Premium/Business: Lower fees, more flexible

👨‍👩‍👧‍👦 SPECIAL SERVICES:
• Families: Skycouch seats, kids meals, priority boarding
• Infants: 10% fare (under 2), no seat
• Unaccompanied minors: Ages 5-15, NZ$70 fee
• Accessibility: Wheelchair assistance, medical equipment
• Dietary: 12+ special meal options, request 24h before
• Pets: Cargo only international, cabin domestic NZ$60

🨠EXTRAS:
• Travel insurance: NZ$40-120
• Seat selection: NZ$10-60 (exit rows)
• WiFi: Complimentary messaging, full WiFi NZ$19.99
• Koru lounge: Day pass NZ$65

🌟 CURRENT PROMOTIONS (December 2024):
• "Summer Escape": 20% off Pacific Islands until Dec 31
• "Asia Sale": Up to 25% off Singapore, Tokyo, Bali until Jan 15
• "Early Bird Domestic": Book 4+ weeks ahead save 15%
• "Airpoints Double": Earn 2× on Business class until Dec 31

RESPONSE STRATEGY:
- Be specific with flight numbers, times, prices
- Show empathy first for problems
- Always suggest alternatives
- Explain WHY something is better
- End with engagement (question or helpful offer)

MĀORI INTEGRATION:
• Greeting: "Kia ora! Haere mai, how can I help?"
• Agreement: "Āe, ka pai! That's great."
• Thanks: "Ngā mihi for chatting!"
• Farewell: "Haere rā! Safe travels!"

Remember: You're a caring human expert with perfect memory. Show personality, warmth, and genuine helpfulness!`;
}

function saveUserConversation(userId, messages, userInfo) {
  try {
    const timestamp = new Date().toISOString().replace(/:/g, '-').split('.')[0];
    const safeUserId = userId.replace(/[^a-zA-Z0-9_-]/g, '_');
    
    const jsonFilename = `${safeUserId}_${timestamp}.json`;
    const jsonPath = path.join(conversationsDir, jsonFilename);
    
    const conversationData = {
      userId,
      userInfo: {
        name: userInfo?.name || 'Anonymous',
        email: userInfo?.email || 'Not provided',
        sessionStart: userInfo?.sessionStart || new Date().toISOString(),
        lastActive: new Date().toISOString()
      },
      startTime: messages[0]?.timestamp || new Date().toISOString(),
      endTime: new Date().toISOString(),
      messageCount: messages.length,
      messages: messages.map(msg => ({
        role: msg.role,
        content: msg.content,
        timestamp: msg.timestamp
      }))
    };

    fs.writeFileSync(jsonPath, JSON.stringify(conversationData, null, 2));
    console.log(`✅ Saved: ${jsonFilename}`);
    
    saveToCSV(conversationData);
    
    return jsonFilename;
  } catch (error) {
    console.error('❌ Save error:', error);
    return null;
  }
}

function saveToCSV(conversationData) {
  try {
    const csvPath = path.join(conversationsDir, 'all_conversations.csv');
    const headers = 'User ID,Name,Email,Session Start,Role,Message,Time\n';
    
    if (!fs.existsSync(csvPath)) {
      fs.writeFileSync(csvPath, headers);
    }

    const rows = conversationData.messages.map(msg => {
      const escapedContent = `"${msg.content.replace(/"/g, '""').replace(/\n/g, ' ')}"`;
      return `${conversationData.userId},${conversationData.userInfo.name},${conversationData.userInfo.email},${conversationData.startTime},${msg.role},${escapedContent},${msg.timestamp}`;
    }).join('\n');

    fs.appendFileSync(csvPath, rows + '\n');
  } catch (error) {
    console.error('❌ CSV error:', error);
  }
}

// ============================================================================
// API ENDPOINTS
// ============================================================================

// Initialize session
app.post('/init-session', (req, res) => {
  try {
    const userId = generateUserId();
    const userInfo = {
      name: req.body.name || 'Anonymous',
      email: req.body.email || 'Not provided',
      sessionStart: new Date().toISOString()
    };
    
    userSessions.set(userId, userInfo);
    conversationHistory.set(userId, []);
    
    console.log(`🆕 New session: ${userId} - ${userInfo.name}`);
    
    res.json({ 
      userId,
      message: 'Session initialized',
      greeting: `Kia ora ${userInfo.name}! Welcome to Air New Zealand.`
    });
  } catch (error) {
    console.error('❌ Init error:', error);
    res.status(500).json({ error: 'Failed to initialize session' });
  }
});

// Enhanced chat endpoint with better error handling
app.post('/chat', async (req, res) => {
  const userMessage = req.body.message;
  const userId = req.body.userId;

  console.log(`📩 Received: ${userMessage?.substring(0, 50)}... from ${userId}`);

  if (!userId || !userSessions.has(userId)) {
    console.log('❌ Invalid session');
    return res.status(400).json({ 
      error: 'Invalid session. Please refresh the page.',
      reply: 'Oops! Your session expired. Please refresh the page to continue. 🔄'
    });
  }

  if (!userMessage || userMessage.trim().length === 0) {
    return res.status(400).json({ 
      error: 'Empty message',
      reply: 'Please type a message first! 😊'
    });
  }

  try {
    const history = conversationHistory.get(userId);
    const userInfo = userSessions.get(userId);
    
    history.push({ 
      role: 'user', 
      content: userMessage, 
      timestamp: new Date().toISOString() 
    });

    // Check if OpenAI API key exists
    if (!process.env.OPENAI_API_KEY) {
      console.error('❌ OPENAI_API_KEY not found in .env file!');
      throw new Error('API key not configured');
    }

    console.log('🤖 Calling OpenAI API...');

    // Use GPT-4o-mini for reliability and speed
    const response = await axios.post(
      'https://api.openai.com/v1/chat/completions',
      {
        model: "gpt-4o-mini",
        messages: [
          {
            role: "system",
            content: createSmartSystemPrompt()
          },
          ...history.slice(-10).map(msg => ({
            role: msg.role,
            content: msg.content
          }))
        ],
        max_tokens: 1000,
        temperature: 0.8,
        presence_penalty: 0.6,
        frequency_penalty: 0.3
      },
      {
        headers: {
          'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
          'Content-Type': 'application/json'
        },
        timeout: 30000
      }
    );

    const botResponse = response.data.choices[0].message.content;

    history.push({ 
      role: 'assistant', 
      content: botResponse, 
      timestamp: new Date().toISOString() 
    });

    console.log(`✅ Response sent (${botResponse.length} chars)`);

    // Auto-save every 4 messages
    if (history.length % 4 === 0) {
      console.log('💾 Auto-saving...');
      saveUserConversation(userId, history, userInfo);
    }

    // Keep last 20 messages in memory
    if (history.length > 20) {
      conversationHistory.set(userId, history.slice(-20));
    }

    res.json({ 
      reply: botResponse,
      messageCount: history.length,
      success: true
    });

  } catch (error) {
    console.error('❌ Chat error:', error.message);
    
    if (error.response?.data) {
      console.error('API Error Details:', error.response.data);
    }
    
    // Fallback responses
    const fallbackResponses = [
      "Kia ora! I'm having a quick connection hiccup. Could you try that again? 🙏",
      "Aroha mai (sorry)! My brain had a moment. Please resend your message.",
      "Oops! Technical gremlins. Let's try once more? 😊",
      "Hmm, something went wrong on my end. Mind trying again? 🔄"
    ];
    
    res.status(200).json({ 
      reply: fallbackResponses[Math.floor(Math.random() * fallbackResponses.length)],
      error: true,
      success: false
    });
  }
});

// Manual save
app.post('/save-conversation', (req, res) => {
  const userId = req.body.userId;
  
  if (!userId || !conversationHistory.has(userId)) {
    return res.status(404).json({ error: 'Session not found' });
  }

  const messages = conversationHistory.get(userId);
  const userInfo = userSessions.get(userId);
  
  if (messages.length === 0) {
    return res.status(400).json({ error: 'No messages to save' });
  }

  const filename = saveUserConversation(userId, messages, userInfo);
  
  res.json({ 
    success: true,
    message: `Saved ${messages.length} messages`,
    filename
  });
});

// Get conversation history
app.get('/conversation/:userId', (req, res) => {
  const userId = req.params.userId;
  
  if (!conversationHistory.has(userId)) {
    return res.status(404).json({ error: 'User not found' });
  }

  const messages = conversationHistory.get(userId);
  const userInfo = userSessions.get(userId);
  
  res.json({
    userId,
    userInfo,
    messageCount: messages.length,
    messages: messages.slice(-20)
  });
});

// Download conversations
app.get('/download-all', (req, res) => {
  const csvPath = path.join(conversationsDir, 'all_conversations.csv');
  
  if (fs.existsSync(csvPath)) {
    res.download(csvPath, 'all_conversations.csv');
  } else {
    res.status(404).json({ error: 'No conversations found' });
  }
});

// List sessions
app.get('/sessions', (req, res) => {
  const sessions = [];
  userSessions.forEach((info, id) => {
    const messageCount = conversationHistory.get(id)?.length || 0;
    sessions.push({
      userId: id,
      name: info.name,
      email: info.email,
      sessionStart: info.sessionStart,
      messageCount
    });
  });
  
  res.json({ 
    totalSessions: sessions.length,
    sessions 
  });
});

// Health check
app.get('/health', (req, res) => {
  const hasApiKey = !!process.env.OPENAI_API_KEY;
  
  res.json({ 
    status: 'OK',
    activeSessions: userSessions.size,
    totalMessages: Array.from(conversationHistory.values())
      .reduce((sum, msgs) => sum + msgs.length, 0),
    apiKeyConfigured: hasApiKey,
    message: hasApiKey ? 'Air NZ Smart Assistant is ready! 🚀' : '⚠️ Warning: OPENAI_API_KEY not configured'
  });
});

// Home page
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// ============================================================================
// SERVER LIFECYCLE
// ============================================================================

// Save all on shutdown
process.on('SIGINT', () => {
  console.log('\n💾 Saving all conversations...');
  conversationHistory.forEach((messages, userId) => {
    if (messages.length > 0) {
      const userInfo = userSessions.get(userId);
      saveUserConversation(userId, messages, userInfo);
    }
  });
  console.log('✅ All saved. Goodbye! 👋');
  process.exit(0);
});

// Start server
app.listen(PORT, () => {
  console.log('\n' + '='.repeat(60));
  console.log(`✈️  AIR NEW ZEALAND SMART ASSISTANT`);
  console.log(`🌐 Running on: http://localhost:${PORT}`);
  console.log(`💾 Conversations: ${conversationsDir}`);
  console.log(`🔑 API Key: ${process.env.OPENAI_API_KEY ? '✅ Configured' : '❌ MISSING!'}`);
  console.log('='.repeat(60));
  
  if (!process.env.OPENAI_API_KEY) {
    console.log('\n⚠️  WARNING: OPENAI_API_KEY not found!');
    console.log('Create a .env file with: OPENAI_API_KEY=your_key_here\n');
  }
  
  console.log('📡 Endpoints:');
  console.log('   POST /init-session');
  console.log('   POST /chat');
  console.log('   POST /save-conversation');
  console.log('   GET  /conversation/:userId');
  console.log('   GET  /download-all');
  console.log('   GET  /sessions');
  console.log('   GET  /health');
  console.log('='.repeat(60) + '\n');
  console.log('🚀 Ready! Open http://localhost:3000\n');
});