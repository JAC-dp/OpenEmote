# OpenEmote 🤖

A powerful Discord bot for managing emojis with advanced features like role-based restrictions and emoji stealing. Built with ❤️ and Node.js!

## ✨ Features

- 🎨 **Emoji Management**
  - 🎯 Add emojis from other servers
  - 📤 Upload custom emojis from images
  - 🗑️ Remove emojis
  - 🎭 Support for both static and animated emojis

- 🔒 **Role-Based Restrictions**
  - 🛡️ Restrict emoji usage to specific roles
  - 🔓 Remove restrictions from individual emojis
  - 🗑️ Remove all restrictions at once
  - 📋 View all restricted emojis and their roles

- 🛡️ **Permission System**
  - 🔐 Secure command access based on Discord permissions
  - 🤖 Automatic bot role inclusion for restricted emojis

## 🎮 Commands

- `/help` - 📚 Shows all available commands and their usage
- `/info` - ℹ️ Displays information about the bot and its creator
- `/steal` - 🎯 Steal emojis from other servers or add custom emojis
  - ✨ Supports multiple emojis at once
  - 🖼️ Accepts image attachments
- `/remove` - 🗑️ Remove an emoji from the server
- `/restrict` - 🔒 Restrict emoji usage to specific roles
- `/unrestrict` - 🔓 Remove role restrictions from an emoji
- `/unrestrict-all` - 🗑️ Remove role restrictions from all emojis
- `/restrict-list` - 📋 Show all restricted emojis and their roles

## 🚀 Quick Start

### 🤖 Cloud-Hosted Version (Recommended)

Want to use OpenEmote without any setup? Just click the button below to add it to your server! 🚀

[![Add to Discord](https://img.shields.io/badge/Add_to_Discord-7289DA?style=for-the-badge&logo=discord&logoColor=white)](https://discord.com/api/oauth2/authorize?client_id=1252735266674966691&permissions=8&scope=bot%20applications.commands)

### 🐳 Docker Setup

You can run the bot using the pre-built Docker image from GitHub Container Registry:

```bash
docker run -d --name openemote \
  -e TOKEN=your_bot_token_here \
  -e DELAY=1000 \
  ghcr.io/jac-dp/openemote:latest
```

Replace `your_bot_token_here` with your Discord bot token and adjust the `DELAY` value as needed.

<details>
<summary>🔧 Want to build the image locally?</summary>

1. Build the Docker image:
   ```bash
   docker build -t openemote .
   ```

2. Run the container:
   ```bash
   docker run -d --name openemote \
     -e TOKEN=your_bot_token_here \
     -e DELAY=1000 \
     openemote
   ```
</details>

### 📦 Manual Setup

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

## 📋 Requirements

- Node.js 16.9.0 or higher
- Discord.js v14
- Required Discord Bot Permissions:
  - Manage Emojis and Stickers
  - Manage Roles
  - Send Messages
  - Embed Links
  - Attach Files
  - Read Message History

## 💬 Support

Need help? Feel free to:
- 📱 Contact @dankata1337 on Discord
- 🌐 Visit the [GitHub repository](https://github.com/JAC-dp/OpenEmote)
- 📝 Open an issue if you find a bug

## 📄 License

This project is open source and welcomes contributions! Feel free to submit issues and pull requests. 🤝

## 👨‍💻 Credits

Created with ❤️ by @dankata1337 