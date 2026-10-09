/**
 * CEO CHARZ BOT - HACKER SYSTEM
 * Fraud Department Style | Kali & Mpya
 * Panel + Bot with QR + Pairing Code + Ban/Mute
 */

const { default: makeWASocket, useMultiFileAuthState, DisconnectReason, fetchLatestBaileysVersion, makeCacheableSignalKeyStore, Browsers } = require('@whiskeysockets/baileys');
const pino = require('pino');
const qrcodeTerminal = require('qrcode-terminal');
const QRCode = require('qrcode');
const express = require('express');
const cors = require('cors');
const path = require('path');
const fs = require('fs');
const http = require('http');

// ==================== CONFIG ====================
const PORT = process.env.PORT || 3000;
const GROUP_NAME = 'CEO GROUP';
const CHANNEL_NAME = 'CEO CHANNEL';
const AUTH_DIR = './auth_info_ceo_chaz';
const DATA_FILE = './bot_data.json';
const OWNER_NAME = 'CEO CHARZ';
const BOT_NAME = 'CEO CHARZ BOT';

// Global state
let sock = null;
let isConnected = false;
let currentQR = null;
let pairingCode = null;
let groupJid = null;
let groupInviteLink = null;
let channelJid = null;
let channelInviteLink = null;
let botNumber = null;
let connectionStatus = 'disconnected';
let bannedUsers = new Set();
let mutedUsers = new Set();

// Load saved data
function loadData() {
  try {
    if (fs.existsSync(DATA_FILE)) {
      const d = JSON.parse(fs.readFileSync(DATA_FILE, 'utf8'));
      if (d.banned) bannedUsers = new Set(d.banned);
      if (d.muted) mutedUsers = new Set(d.muted);
      return d;
    }
  } catch (e) {}
  return { groupJid: null, channelJid: null, banned: [], muted: [] };
}

function saveData() {
  const data = {
    groupJid,
    channelJid,
    banned: [...bannedUsers],
    muted: [...mutedUsers]
  };
  fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2));
}

let savedData = loadData();
groupJid = savedData.groupJid || null;
channelJid = savedData.channelJid || null;

// ==================== BOT LOGIC ====================
async function startBot() {
  connectionStatus = 'connecting';
  currentQR = null;
  pairingCode = null;

  const { state, saveCreds } = await useMultiFileAuthState(AUTH_DIR);
  const { version } = await fetchLatestBaileysVersion();

  sock = makeWASocket({
    version,
    logger: pino({ level: 'silent' }),
    printQRInTerminal: false,
    auth: {
      creds: state.creds,
      keys: makeCacheableSignalKeyStore(state.keys, pino({ level: 'silent' })),
    },
    browser: Browsers.ubuntu('Chrome'),
    generateHighQualityLinkPreview: true,
    syncFullHistory: false,
    markOnlineOnConnect: true,
    getMessage: async () => undefined,
  });

  sock.ev.on('creds.update', saveCreds);

  sock.ev.on('connection.update', async (update) => {
    const { connection, lastDisconnect, qr } = update;

    if (qr) {
      connectionStatus = 'qr';
      currentQR = qr;
      console.log('\n📱 SCAN QR CODE au tumia PAIRING CODE kwenye Panel\n');
      qrcodeTerminal.generate(qr, { small: true });
      console.log('\n🌐 Panel: http://localhost:' + PORT);
    }

    if (connection === 'open') {
      isConnected = true;
      connectionStatus = 'connected';
      currentQR = null;
      pairingCode = null;
      botNumber = sock.user?.id?.split(':')[0] || sock.user?.id || null;
      console.log('\n✅ BOT ONLINE! Namba:', botNumber);
      console.log('👑 Owner:', OWNER_NAME);
      console.log('🌐 Panel: http://localhost:' + PORT);

      // Keep online
      setInterval(() => {
        if (sock && isConnected) {
          try { sock.sendPresenceUpdate('available'); } catch(e) {}
        }
      }, 30000);

      await setupGroupAndChannel();
    }

    if (connection === 'close') {
      isConnected = false;
      connectionStatus = 'disconnected';
      const statusCode = lastDisconnect?.error?.output?.statusCode;
      const shouldReconnect = statusCode !== DisconnectReason.loggedOut;

      console.log('❌ Connection closed. Code:', statusCode);

      if (shouldReconnect) {
        console.log('🔄 Reconnecting in 3s...');
        setTimeout(startBot, 3000);
      } else {
        console.log('🚪 Logged out. Futa folder auth_info_ceo_chaz kisha anza upya.');
      }
    }
  });

  // ==================== MESSAGE HANDLER ====================
  sock.ev.on('messages.upsert', async ({ messages, type }) => {
    if (type !== 'notify') return;

    for (const msg of messages) {
      if (!msg.message || msg.key.fromMe) continue;

      const from = msg.key.remoteJid;
      const isGroup = from.endsWith('@g.us');
      const sender = isGroup ? (msg.key.participant || from) : from;
      const senderNumber = sender.split('@')[0];
      const text = (msg.message?.conversation || msg.message?.extendedTextMessage?.text || '').trim().toLowerCase();

      // Ban check
      if (bannedUsers.has(senderNumber)) continue;

      // Mute check (groups)
      if (isGroup && mutedUsers.has(senderNumber)) continue;

      // ========== PRIVATE CHAT (INBOX) ==========
      if (!isGroup) {
        const warning = `╔══════════════════════════╗
║   ⚠️  FRAUD DEPARTMENT  ⚠️  ║
╚══════════════════════════╝

👑 *CEO CHARZ BOT*

Hii ni *INBOX YA BOSS*.
Kuwa makini na unachosema.

🔴 Trust No One
🔴 Scam • Lie • Steal • Repeat

Mmiliki: *${OWNER_NAME}*
Bot Status: *ONLINE*

────────────────────
Andika *menu* kuona amri zote.`;

        if (text === 'menu' || text === 'help' || text === '!' || text === 'start' || text.length < 2) {
          await sock.sendMessage(from, { text: warning });
          await sendFullMenu(from);
        } else if (text === 'join' || text === 'jiunge') {
          let reply = `👑 *CEO CHARZ - JIUNGE SASA*\n\n`;
          if (groupInviteLink) reply += `👥 *CEO GROUP*\n${groupInviteLink}\n\n`;
          if (channelInviteLink) reply += `📢 *CEO CHANNEL*\n${channelInviteLink}\n\n`;
          reply += `Bofya link ujiunge moja kwa moja 🔥`;
          await sock.sendMessage(from, { text: reply });
        } else {
          await sock.sendMessage(from, {
            text: `⚠️ *Hii ni Inbox ya Boss CEO CHARZ*\n\nNimepokea ujumbe wako.\nAndika *menu* kuona amri.\n\n🔴 Trust No One`
          });
        }
        continue;
      }

      // ========== GROUP COMMANDS ==========
      if (isGroup) {
        if (text === 'menu' || text === 'help' || text === '!') {
          await sendFullMenu(from);
          continue;
        }
        if (text === 'join' || text === 'jiunge') {
          let reply = `👑 *CEO CHARZ LINKS*\n\n`;
          if (groupInviteLink) reply += `👥 Group: ${groupInviteLink}\n`;
          if (channelInviteLink) reply += `📢 Channel: ${channelInviteLink}\n`;
          await sock.sendMessage(from, { text: reply });
          continue;
        }
        if (text === 'owner' || text === 'boss' || text === 'ceo') {
          await sock.sendMessage(from, {
            text: `👑 *OWNER INFO*\n\nName: *${OWNER_NAME}*\nBot: *${BOT_NAME}*\nStatus: *ONLINE 24/7*\n\n🔴 Fraud Department`
          });
          continue;
        }
      }
    }
  });
}

async function sendFullMenu(jid) {
  const menu = `╔══════════════════════════╗
║     👑 CEO CHARZ MENU     ║
╚══════════════════════════╝

*📋 AMRI ZA WATUMIAJI*
• menu / help / !  → Onyesha menu
• join / jiunge    → Pata links
• owner / boss     → Info ya mmiliki

*🔗 LINKS*
• Group: ${groupInviteLink ? 'Ipo' : 'Inaandaliwa...'}
• Channel: ${channelInviteLink ? 'Ipo' : 'Inaandaliwa...'}

*⚙️ ADMIN (kutoka Panel)*
• Ban / Unban users
• Mute / Unmute
• Broadcast
• Refresh links

────────────────────
🔴 Trust No One
👑 Powered by ${OWNER_NAME}
Bot: ONLINE ⚡`;

  await sock.sendMessage(jid, { text: menu });
}

async function setupGroupAndChannel() {
  if (!sock || !isConnected) return;

  try {
    if (!groupJid) {
      console.log('📦 Creating CEO GROUP...');
      const me = sock.user.id;
      const group = await sock.groupCreate(GROUP_NAME, [me]);
      groupJid = group.id;
      console.log('✅ Group:', groupJid);
      await sock.groupUpdateDescription(groupJid, '🔥 Official CEO CHARZ Group | Fraud Department | Trust No One').catch(()=>{});
      await sock.groupSettingUpdate(groupJid, 'unlocked').catch(()=>{});
    }

    if (groupJid) {
      try {
        const code = await sock.groupInviteCode(groupJid);
        groupInviteLink = `https://chat.whatsapp.com/${code}`;
        console.log('🔗 Group Link:', groupInviteLink);
      } catch (e) {}
    }

    if (!channelJid && typeof sock.newsletterCreate === 'function') {
      try {
        const ch = await sock.newsletterCreate(CHANNEL_NAME, 'CEO CHARZ Official Channel 🔥');
        channelJid = ch.id || ch.jid || ch;
        console.log('✅ Channel created');
      } catch (e) {}
    }

    saveData();
  } catch (err) {
    console.error('Setup error:', err.message);
  }
}

// ==================== EXPRESS PANEL ====================
const app = express();
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

app.get('/api/status', (req, res) => {
  res.json({
    status: connectionStatus,
    connected: isConnected,
    botNumber,
    owner: OWNER_NAME,
    groupJid,
    groupInviteLink,
    channelJid,
    channelInviteLink,
    groupName: GROUP_NAME,
    channelName: CHANNEL_NAME,
    bannedCount: bannedUsers.size,
    mutedCount: mutedUsers.size,
    pairingCode
  });
});

app.get('/api/qr', async (req, res) => {
  if (!currentQR) return res.json({ qr: null });
  try {
    const dataUrl = await QRCode.toDataURL(currentQR, { width: 280, margin: 2, color: { dark: '#ff0000', light: '#000000' } });
    res.json({ qr: dataUrl });
  } catch (e) {
    res.json({ qr: null });
  }
});

app.post('/api/pairing', async (req, res) => {
  const { phone } = req.body;
  if (!phone || !sock) return res.status(400).json({ error: 'Phone number required or bot not ready' });

  try {
    const number = phone.replace(/[^0-9]/g, '');
    if (typeof sock.requestPairingCode === 'function') {
      const code = await sock.requestPairingCode(number);
      pairingCode = code;
      connectionStatus = 'pairing';
      res.json({ success: true, code });
    } else {
      res.status(400).json({ error: 'Pairing code not supported. Use QR instead.' });
    }
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

app.post('/api/refresh-group-link', async (req, res) => {
  if (!sock || !isConnected || !groupJid) return res.status(400).json({ error: 'Bot not ready' });
  try {
    const code = await sock.groupInviteCode(groupJid);
    groupInviteLink = `https://chat.whatsapp.com/${code}`;
    res.json({ success: true, link: groupInviteLink });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

app.post('/api/new-group-link', async (req, res) => {
  if (!sock || !isConnected || !groupJid) return res.status(400).json({ error: 'Bot not ready' });
  try {
    const code = await sock.groupRevokeInvite(groupJid);
    groupInviteLink = `https://chat.whatsapp.com/${code}`;
    res.json({ success: true, link: groupInviteLink });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

app.post('/api/create-group', async (req, res) => {
  if (!sock || !isConnected) return res.status(400).json({ error: 'Bot not connected' });
  try {
    await setupGroupAndChannel();
    res.json({ success: true, groupJid, groupInviteLink, channelJid, channelInviteLink });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

app.post('/api/send-group', async (req, res) => {
  const { text } = req.body;
  if (!sock || !isConnected || !groupJid || !text) return res.status(400).json({ error: 'Missing data' });
  try {
    await sock.sendMessage(groupJid, { text });
    res.json({ success: true });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

app.post('/api/ban', async (req, res) => {
  const { number } = req.body;
  if (!number) return res.status(400).json({ error: 'Number required' });
  const clean = number.replace(/[^0-9]/g, '');
  bannedUsers.add(clean);
  saveData();
  if (sock && isConnected && groupJid) {
    try {
      await sock.groupParticipantsUpdate(groupJid, [`${clean}@s.whatsapp.net`], 'remove');
    } catch (e) {}
  }
  res.json({ success: true, banned: [...bannedUsers] });
});

app.post('/api/unban', async (req, res) => {
  const { number } = req.body;
  if (!number) return res.status(400).json({ error: 'Number required' });
  const clean = number.replace(/[^0-9]/g, '');
  bannedUsers.delete(clean);
  saveData();
  res.json({ success: true, banned: [...bannedUsers] });
});

app.post('/api/mute', async (req, res) => {
  const { number } = req.body;
  if (!number) return res.status(400).json({ error: 'Number required' });
  const clean = number.replace(/[^0-9]/g, '');
  mutedUsers.add(clean);
  saveData();
  res.json({ success: true, muted: [...mutedUsers] });
});

app.post('/api/unmute', async (req, res) => {
  const { number } = req.body;
  if (!number) return res.status(400).json({ error: 'Number required' });
  const clean = number.replace(/[^0-9]/g, '');
  mutedUsers.delete(clean);
  saveData();
  res.json({ success: true, muted: [...mutedUsers] });
});

app.post('/api/restart', (req, res) => {
  res.json({ success: true });
  setTimeout(() => process.exit(0), 800);
});

app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// ==================== START ====================
const server = http.createServer(app);
server.listen(PORT, () => {
  console.log(`\n🔴 CEO CHARZ HACKER PANEL → http://localhost:${PORT}`);
  console.log(`👑 Owner: ${OWNER_NAME}`);
  console.log(`🔓 Open Panel (no password)\n`);
});

startBot().catch(console.error);

process.on('SIGINT', () => {
  console.log('\n👋 Shutting down...');
  if (sock) try { sock.end(); } catch(e) {}
  process.exit(0);
});
