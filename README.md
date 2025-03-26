# OpenEmote

A powerful Discord bot for managing emojis with advanced features like role-based restrictions and emoji stealing.

## Features

- 🎨 **Emoji Management**
  - Add emojis from other servers
  - Upload custom emojis from images
  - Remove emojis
  - Support for both static and animated emojis

- 🔒 **Role-Based Restrictions**
  - Restrict emoji usage to specific roles
  - Remove restrictions from individual emojis
  - Remove all restrictions at once
  - View all restricted emojis and their roles

- 🛡️ **Permission System**
  - Secure command access based on Discord permissions
  - Automatic bot role inclusion for restricted emojis

## Commands

- `/help` - Shows all available commands and their usage
- `/info` - Displays information about the bot and its creator
- `/steal` - Steal emojis from other servers or add custom emojis
  - Supports multiple emojis at once
  - Accepts image attachments
- `/remove` - Remove an emoji from the server
- `/restrict` - Restrict emoji usage to specific roles
- `/unrestrict` - Remove role restrictions from an emoji
- `/unrestrict-all` - Remove role restrictions from all emojis
- `/restrict-list` - Show all restricted emojis and their roles

## Setup

1. Clone the repository
2. Install dependencies:
   ```bash
   npm install
   ```
3. Create a `.env` file with your Discord bot token:
   ```
   TOKEN=your_bot_token_here
   DELAY=1000  # Optional: Delay between emoji additions (in ms)
   ```
4. Start the bot:
   ```bash
   node index.js
   ```

## Requirements

- Node.js 16.9.0 or higher
- Discord.js v14
- Required Discord Bot Permissions:
  - Manage Emojis and Stickers
  - Manage Roles
  - Send Messages
  - Embed Links
  - Attach Files
  - Read Message History

## Invite the Bot

Use this link to invite the bot to your server:
```
https://discord.com/api/oauth2/authorize?client_id=YOUR_BOT_ID&permissions=8&scope=bot%20applications.commands
```

## Support

For support, contact @dankata1337 on Discord or visit the [GitHub repository](https://github.com/JAC-dp/OpenEmote).

## License

This project is open source and welcomes contributions. Feel free to submit issues and pull requests.

## Credits

Created by @dankata1337 