// Enhanced Frontend JavaScript - FIXED SESSION MANAGEMENT

let userId = null;
let userName = 'Guest';
let isTyping = false;
let sessionInitialized = false;

// DOM Elements
const chatButton = document.getElementById('chatButton');
const chatWindow = document.getElementById('chatWindow');
const closeChat = document.getElementById('closeChat');
const userInput = document.getElementById('userInput');
const sendBtn = document.getElementById('sendBtn');
const chatMessages = document.getElementById('chatMessages');
const userModal = document.getElementById('userModal');
const userInfoForm = document.getElementById('userInfoForm');
const mobileMenu = document.getElementById('mobileMenu');
const mobileMenuOverlay = document.getElementById('mobileMenuOverlay');
const closeMobileMenu = document.getElementById('closeMobileMenu');

// Initialize
document.addEventListener('DOMContentLoaded', async () => {
  console.log('✅ Air NZ Assistant Loaded');
  
  // Set welcome time
  const welcomeTime = document.getElementById('welcomeTime');
  if (welcomeTime) {
    welcomeTime.textContent = new Date().toLocaleTimeString('en-NZ', {
      hour: '2-digit',
      minute: '2-digit'
    });
  }
  
  // Check for existing session in localStorage
  const savedUserId = localStorage.getItem('airnz_userId');
  const savedName = localStorage.getItem('airnz_userName');
  
  if (savedUserId && savedName) {
    // Verify session is still valid on server
    try {
      const response = await fetch(`/conversation/${savedUserId}`);
      if (response.ok) {
        userId = savedUserId;
        userName = savedName;
        sessionInitialized = true;
        console.log(`👋 Welcome back, ${userName}! (${userId})`);
        
        // Update welcome message with user name
        addBotMessage(`Welcome back, ${userName}! How can I help you today? 😊`);
      } else {
        // Session expired on server, clear localStorage
        localStorage.removeItem('airnz_userId');
        localStorage.removeItem('airnz_userName');
        console.log('⚠️ Previous session expired');
      }
    } catch (error) {
      console.error('Error verifying session:', error);
    }
  }
  
  // Setup event listeners
  setupEventListeners();
  
  // Auto-show modal if no valid session
  if (!sessionInitialized) {
    setTimeout(() => {
      userModal.style.display = 'flex';
    }, 3000);
  }
});

function setupEventListeners() {
  // Chat toggle
  chatButton.addEventListener('click', toggleChat);
  closeChat.addEventListener('click', toggleChat);
  
  // Send message
  sendBtn.addEventListener('click', sendMessage);
  userInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter' && !isTyping) {
      sendMessage();
    }
  });
  
  // User info form
  userInfoForm.addEventListener('submit', handleUserInfo);
  
  // Quick actions
  document.querySelectorAll('.action-card').forEach(card => {
    card.addEventListener('click', () => {
      const action = card.dataset.action;
      if (action) {
        openChatWithMessage(action);
      }
    });
  });
  
  // Quick replies
  document.querySelectorAll('.quick-reply-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const message = btn.dataset.message;
      if (message) {
        userInput.value = message;
        sendMessage();
      }
    });
  });
  
  // Destination cards
  document.querySelectorAll('.dest-card').forEach(card => {
    card.addEventListener('click', () => {
      const dest = card.dataset.dest;
      if (dest) {
        openChatWithMessage(`Tell me about flights to ${dest}`);
      }
    });
  });
  
  // Search flights
  const searchBtn = document.getElementById('searchFlights');
  if (searchBtn) {
    searchBtn.addEventListener('click', () => {
      const from = document.getElementById('fromInput').value || 'Auckland';
      const to = document.getElementById('toInput').value || 'Singapore';
      openChatWithMessage(`Show me flights from ${from} to ${to}`);
    });
  }
  
  // Mobile menu
  if (mobileMenu) {
    mobileMenu.addEventListener('click', () => {
      mobileMenuOverlay.classList.add('active');
    });
  }
  
  if (closeMobileMenu) {
    closeMobileMenu.addEventListener('click', () => {
      mobileMenuOverlay.classList.remove('active');
    });
  }
  
  // Close mobile menu when clicking outside
  mobileMenuOverlay.addEventListener('click', (e) => {
    if (e.target === mobileMenuOverlay) {
      mobileMenuOverlay.classList.remove('active');
    }
  });
  
  // Mobile nav links
  document.querySelectorAll('.mobile-nav-links a').forEach(link => {
    link.addEventListener('click', () => {
      mobileMenuOverlay.classList.remove('active');
    });
  });
  
  // Remove chat badge on first open
  chatButton.addEventListener('click', () => {
    const badge = chatButton.querySelector('.chat-badge');
    if (badge) {
      badge.style.display = 'none';
    }
  }, { once: true });
}

function toggleChat() {
  // If no session, show modal instead
  if (!sessionInitialized) {
    userModal.style.display = 'flex';
    return;
  }
  
  chatWindow.classList.toggle('active');
  
  if (chatWindow.classList.contains('active')) {
    userInput.focus();
  }
}

function openChatWithMessage(message) {
  // If no session, show modal and store pending message
  if (!sessionInitialized) {
    userModal.style.display = 'flex';
    localStorage.setItem('pendingMessage', message);
    return;
  }
  
  chatWindow.classList.add('active');
  userInput.value = message;
  setTimeout(() => sendMessage(), 300);
}

async function handleUserInfo(e) {
  e.preventDefault();
  
  const name = document.getElementById('userName').value.trim();
  const email = document.getElementById('userEmail').value.trim();
  
  if (!name) {
    alert('Please enter your name');
    return;
  }
  
  console.log(`🔄 Initializing session for ${name}...`);
  
  try {
    // Initialize session with server
    const response = await fetch('/init-session', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, email })
    });
    
    if (!response.ok) {
      throw new Error('Failed to initialize session');
    }
    
    const data = await response.json();
    userId = data.userId;
    userName = name;
    sessionInitialized = true;
    
    // Save to localStorage
    localStorage.setItem('airnz_userId', userId);
    localStorage.setItem('airnz_userName', name);
    
    console.log(`✅ Session created: ${userId}`);
    
    // Close modal
    userModal.style.display = 'none';
    
    // Clear default welcome message and add personalized one
    const firstMessage = chatMessages.querySelector('.message.bot');
    if (firstMessage) {
      firstMessage.remove();
    }
    
    addBotMessage(`${data.greeting} I'm Aria, your personal travel assistant. How can I help you today? 😊`);
    
    // Open chat
    chatWindow.classList.add('active');
    
    // Send pending message if any
    const pendingMessage = localStorage.getItem('pendingMessage');
    if (pendingMessage) {
      userInput.value = pendingMessage;
      localStorage.removeItem('pendingMessage');
      setTimeout(() => sendMessage(), 500);
    }
    
  } catch (error) {
    console.error('❌ Session init error:', error);
    alert('Connection error. Please check your internet and try again.');
  }
}

async function sendMessage() {
  const message = userInput.value.trim();
  
  if (!message || isTyping) {
    console.log('⚠️ Empty message or already typing');
    return;
  }
  
  // Double check session
  if (!sessionInitialized || !userId) {
    console.log('❌ No session, showing modal');
    userModal.style.display = 'flex';
    return;
  }
  
  console.log(`📤 Sending message: "${message}"`);
  console.log(`👤 User ID: ${userId}`);
  
  // Add user message
  addUserMessage(message);
  userInput.value = '';
  
  // Hide quick replies after first message
  const quickReplies = document.getElementById('quickReplies');
  if (quickReplies) {
    quickReplies.style.display = 'none';
  }
  
  // Show typing indicator
  showTyping();
  
  try {
    const response = await fetch('/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ 
        message,
        userId 
      })
    });
    
    console.log(`📥 Response status: ${response.status}`);
    
    const data = await response.json();
    
    console.log('📥 Response data:', data);
    
    // Remove typing indicator
    hideTyping();
    
    // Check if session expired
    if (data.error && response.status === 400) {
      console.log('⚠️ Session expired on server');
      // Clear localStorage and show modal
      localStorage.removeItem('airnz_userId');
      localStorage.removeItem('airnz_userName');
      sessionInitialized = false;
      userId = null;
      addBotMessage("Your session has expired. Please refresh the page to start a new chat. 🔄");
      return;
    }
    
    // Add bot response
    addBotMessage(data.reply);
    
  } catch (error) {
    console.error('❌ Chat error:', error);
    hideTyping();
    addBotMessage("Aroha mai (sorry)! I'm having connection issues. Please check your internet and try again. 🙏");
  }
}

function addUserMessage(text) {
  const messageDiv = document.createElement('div');
  messageDiv.className = 'message user';
  
  messageDiv.innerHTML = `
    <div class="message-content">
      <p>${escapeHtml(text)}</p>
      <div class="message-time">${getCurrentTime()}</div>
    </div>
  `;
  
  chatMessages.appendChild(messageDiv);
  scrollToBottom();
}

function addBotMessage(text) {
  const messageDiv = document.createElement('div');
  messageDiv.className = 'message bot';
  
  // Convert markdown-style formatting to HTML
  const formattedText = formatBotMessage(text);
  
  messageDiv.innerHTML = `
    <div class="message-avatar">
      <i class="fas fa-headset"></i>
    </div>
    <div class="message-content">
      <strong>Aria</strong>
      <div class="bot-text">${formattedText}</div>
      <div class="message-time">${getCurrentTime()}</div>
    </div>
  `;
  
  chatMessages.appendChild(messageDiv);
  scrollToBottom();
}

function formatBotMessage(text) {
  // Preserve line breaks and format lists
  let formatted = escapeHtml(text);
  
  // Convert bullet points
  formatted = formatted.replace(/• /g, '<br>• ');
  formatted = formatted.replace(/\n/g, '<br>');
  
  // Bold text (if using **text**)
  formatted = formatted.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
  
  return formatted;
}

function showTyping() {
  isTyping = true;
  sendBtn.disabled = true;
  userInput.disabled = true;
  
  const typingDiv = document.createElement('div');
  typingDiv.className = 'message bot typing-indicator';
  typingDiv.id = 'typingIndicator';
  
  typingDiv.innerHTML = `
    <div class="message-avatar">
      <i class="fas fa-headset"></i>
    </div>
    <div class="typing">
      <span></span>
      <span></span>
      <span></span>
    </div>
  `;
  
  chatMessages.appendChild(typingDiv);
  scrollToBottom();
}

function hideTyping() {
  isTyping = false;
  sendBtn.disabled = false;
  userInput.disabled = false;
  
  const typingIndicator = document.getElementById('typingIndicator');
  if (typingIndicator) {
    typingIndicator.remove();
  }
}

function scrollToBottom() {
  chatMessages.scrollTop = chatMessages.scrollHeight;
}

function getCurrentTime() {
  return new Date().toLocaleTimeString('en-NZ', {
    hour: '2-digit',
    minute: '2-digit'
  });
}

function escapeHtml(text) {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

// Auto-resize input on mobile
if (window.innerWidth <= 768) {
  userInput.addEventListener('focus', () => {
    chatWindow.style.height = '70vh';
  });
  
  userInput.addEventListener('blur', () => {
    setTimeout(() => {
      chatWindow.style.height = '';
    }, 100);
  });
}

// Save conversation before page unload
window.addEventListener('beforeunload', () => {
  if (userId && sessionInitialized) {
    // Fire and forget save request
    fetch('/save-conversation', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId }),
      keepalive: true
    }).catch(() => {});
  }
});

// Debug helper - check session status
window.checkSession = function() {
  console.log('=== SESSION STATUS ===');
  console.log('User ID:', userId);
  console.log('User Name:', userName);
  console.log('Session Initialized:', sessionInitialized);
  console.log('LocalStorage User ID:', localStorage.getItem('airnz_userId'));
  console.log('LocalStorage User Name:', localStorage.getItem('airnz_userName'));
  console.log('====================');
};

console.log('🚀 Air NZ Assistant Ready - Kia kaha!');
console.log('💡 Tip: Type checkSession() in console to debug session issues');