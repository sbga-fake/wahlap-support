const USER_AVATAR = 'data:image/svg+xml,' + encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="%23888"><circle cx="12" cy="8" r="4"/><path d="M12 14c-6 0-8 3-8 5v1h16v-1c0-2-2-5-8-5z"/></svg>');

const contacts = {
  avocado: {
    name: '鳄梨',
    displayName: '鳄梨<span class="org-tag">@华立科技</span>',
    avatar: 'assets/avocado.png',
    messages: [],
    isService: false
  },
  lemon: {
    name: '柠檬',
    displayName: '柠檬<span class="org-tag">@华立科技</span>',
    avatar: 'assets/lemon.png',
    messages: [],
    isService: false
  },
  maimai: {
    name: '舞萌 | 中二',
    displayName: '舞萌 | 中二',
    avatar: 'assets/maimai.png',
    messages: [],
    isService: true
  }
};

let currentContact = 'avocado';
let pendingReplies = {};

const messagesContainer = document.getElementById('messagesContainer');
const messageInput = document.getElementById('messageInput');
const sendBtn = document.getElementById('sendBtn');
const chatTitle = document.querySelector('.chat-title');
const contactItems = document.querySelectorAll('.contact-item');
const chatInputArea = document.getElementById('chatInputArea');
const serviceMenu = document.getElementById('serviceMenu');
const qrcodeBtn = document.getElementById('qrcodeBtn');
const backBtn = document.getElementById('backBtn');
const contactList = document.querySelector('.contact-list');
const chatArea = document.querySelector('.chat-area');
const loadingBar = document.getElementById('loadingBar');

function formatTime(date) {
  return date.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' });
}

function createMessageElement(msg, contact) {
  const div = document.createElement('div');
  div.className = `message ${msg.type}`;
  
  const avatarSrc = msg.type === 'self' 
    ? USER_AVATAR
    : contacts[contact].avatar;
  
  div.innerHTML = `
    <img src="${avatarSrc}" alt="" class="message-avatar">
    <div class="message-content">
      <div class="message-bubble">${escapeHtml(msg.text)}</div>
      <span class="message-time">${formatTime(msg.time)}</span>
    </div>
  `;
  
  return div;
}

function createSystemMessage(text) {
  const div = document.createElement('div');
  div.className = 'system-message';
  div.textContent = text;
  return div;
}

function escapeHtml(text) {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

function renderMessages() {
  messagesContainer.innerHTML = '';
  const messages = contacts[currentContact].messages;
  
  messages.forEach(msg => {
    if (msg.type === 'system') {
      messagesContainer.appendChild(createSystemMessage(msg.text));
    } else {
      messagesContainer.appendChild(createMessageElement(msg, currentContact));
    }
  });
  
  scrollToBottom();
}

function scrollToBottom() {
  messagesContainer.scrollTop = messagesContainer.scrollHeight;
}

function showTypingIndicator() {
  const existing = messagesContainer.querySelector('.typing-wrapper');
  if (existing) return;
  
  const div = document.createElement('div');
  div.className = 'message other typing-wrapper';
  div.innerHTML = `
    <img src="${contacts[currentContact].avatar}" alt="" class="message-avatar">
    <div class="message-content">
      <div class="typing-indicator">
        <span></span><span></span><span></span>
      </div>
    </div>
  `;
  messagesContainer.appendChild(div);
  scrollToBottom();
}

function hideTypingIndicator() {
  const indicator = messagesContainer.querySelector('.typing-wrapper');
  if (indicator) indicator.remove();
}

function showLoadingBar() {
  loadingBar.classList.add('active');
}

function hideLoadingBar() {
  loadingBar.classList.remove('active');
}

function addMessage(text, type, contact) {
  const msg = { text, type, time: new Date() };
  contacts[contact].messages.push(msg);
  
  if (contact === currentContact) {
    if (type === 'system') {
      messagesContainer.appendChild(createSystemMessage(text));
    } else {
      messagesContainer.appendChild(createMessageElement(msg, contact));
    }
    scrollToBottom();
  }
  
  if (type !== 'system') {
    updateContactPreview(contact, text);
  }
}

function updateContactPreview(contactId, text) {
  const item = document.querySelector(`[data-contact="${contactId}"]`);
  if (item) {
    const preview = item.querySelector('.contact-preview');
    const time = item.querySelector('.contact-time');
    preview.textContent = text.length > 20 ? text.slice(0, 20) + '...' : text;
    time.textContent = formatTime(new Date());
  }
}

function getRandomDelay(min, max) {
  return Math.floor(Math.random() * (max - min + 1) + min) * 1000;
}

function scheduleReply(contact, replyText, delay) {
  const replyId = Date.now();
  
  if (!pendingReplies[contact]) pendingReplies[contact] = [];
  
  const timeoutId = setTimeout(() => {
    if (contact === currentContact) hideTypingIndicator();
    addMessage(replyText, 'other', contact);
    pendingReplies[contact] = pendingReplies[contact].filter(r => r.id !== replyId);
  }, delay);
  
  pendingReplies[contact].push({ id: replyId, timeoutId });
  
  if (contact === currentContact) {
    setTimeout(() => {
      if (pendingReplies[contact]?.some(r => r.id === replyId)) {
        showTypingIndicator();
      }
    }, Math.min(delay - 1000, 500));
  }
}

function processAvocadoReply(text) {
  if (text.includes('处理') || text.includes('进度')) {
    const delay = getRandomDelay(3, 10);
    scheduleReply('avocado', '处理时间及进度需依据开发日程而定，具体时间无法明确', delay);
  } else if (text.includes('你好') || text.includes('您好')) {
    const delay = getRandomDelay(1, 6);
    scheduleReply('avocado', '您好！请问有什么可以帮到您？', delay);
  } else if (text.includes('没网') || text.includes('断网')) {
    const delay = getRandomDelay(5, 10);
    scheduleReply('avocado', 'ㅠㅠ已第一时间反馈给开发团队，🥺有最新消息会尽快通知，很抱歉感谢您的耐心等待！', delay);
  } else if (text.includes('更新')) {
    const delay = getRandomDelay(5, 10);
    scheduleReply('avocado', '您好！有关游戏更新的更多消息请关注官方B站动态！', delay);
  } else if (text.includes('能') && text.includes('吗')) {
    const delay = getRandomDelay(4, 8);
    scheduleReply('avocado', 'ㅠㅠ已第一时间反馈给开发团队，🥺有最新消息会尽快通知，很抱歉感谢您的耐心等待！', delay);
  }
}

function processLemonReply() {
  const delay = getRandomDelay(1, 3);
  scheduleReply('lemon', '3', delay);
}

function sendMessage() {
  const text = messageInput.value.trim();
  if (!text) return;
  
  addMessage(text, 'self', currentContact);
  messageInput.value = '';
  
  if (currentContact === 'avocado') {
    processAvocadoReply(text);
  } else if (currentContact === 'lemon') {
    processLemonReply();
  }
}

function updateChatUI() {
  const isService = contacts[currentContact].isService;
  
  if (isService) {
    chatInputArea.style.display = 'none';
    serviceMenu.classList.add('active');
  } else {
    chatInputArea.style.display = '';
    serviceMenu.classList.remove('active');
  }
  
  hideLoadingBar();
}

function switchContact(contactId) {
  if (currentContact === contactId) return;
  
  hideTypingIndicator();
  hideLoadingBar();
  currentContact = contactId;
  
  contactItems.forEach(item => {
    item.classList.toggle('active', item.dataset.contact === contactId);
  });
  
  chatTitle.innerHTML = contacts[contactId].displayName;
  renderMessages();
  updateChatUI();
  
  if (pendingReplies[contactId]?.length > 0) {
    showTypingIndicator();
  }
  
  if (window.innerWidth <= 768) {
    contactList.classList.add('hidden');
    chatArea.classList.add('active');
  }
}

function goBack() {
  contactList.classList.remove('hidden');
  chatArea.classList.remove('active');
}

function handleQRCode() {
  showLoadingBar();
  
  setTimeout(() => {
    hideLoadingBar();
    addMessage('该公众号提供的服务出现故障，请稍后再试', 'system', 'maimai');
  }, 10000);
}

function handleConsultCode() {
  addMessage('发行咨询代码', 'self', 'maimai');
}

sendBtn.addEventListener('click', sendMessage);

messageInput.addEventListener('keydown', (e) => {
  if (e.key === 'Enter' && !e.shiftKey) {
    e.preventDefault();
    sendMessage();
  }
});

contactItems.forEach(item => {
  item.addEventListener('click', () => {
    switchContact(item.dataset.contact);
  });
});

backBtn.addEventListener('click', goBack);

qrcodeBtn.addEventListener('click', handleQRCode);

document.querySelector('[data-action="consultCode"]')?.addEventListener('click', handleConsultCode);

renderMessages();
updateChatUI();
