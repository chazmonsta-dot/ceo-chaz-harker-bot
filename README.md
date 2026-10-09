# 👑 CEO CHAZ BOT - Kali & Mpya

WhatsApp Bot + Admin Panel yenye nguvu.

## Vipengele
- **CEO GROUP** – Inaundwa kiotomatiki + invite link
- **CEO CHANNEL** – Jaribu kuunda (inategemea account)
- **Admin Panel** (hakuna nenosiri kama ulivyoomba)
- QR Code inaonekana kwenye Panel na Terminal
- Tuma message kwa Group kutoka Panel
- Link za kujiunga ziko ndani ya Panel – mtu anabofya anajiunga moja kwa moja

## Jinsi ya kuendesha

```bash
cd /path/to/project
npm install
npm start
```

Kisha fungua browser:

```
http://localhost:3000
```

1. Scan QR Code (WhatsApp → Linked Devices)
2. Baada ya kuunganishwa, bofya **Create / Setup** kama Group haijaonekana
3. Copy Group Link na share – watu wanaweza kujiunga moja kwa moja

## Amri za Bot (kwa watumiaji)
- `menu` au `help` au `!` → Onyesha menu
- `join` au `jiunge` → Pata links za Group & Channel

## Folders
- `auth_info_ceo_chaz/` – Session (usifute isipokuwa unataka login upya)
- `bot_data.json` – Group/Channel IDs zilizohifadhiwa
- `public/` – Panel frontend

## Notes
- Panel haina password (open) kama ulivyoomba.
- Features zinalenga **kuunganisha** watu, si kuchunguza.
- Channel support inategemea version ya Baileys na aina ya account.
