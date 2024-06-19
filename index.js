import { Client, GatewayIntentBits, Partials, PermissionsBitField } from 'discord.js';
import fetch from 'node-fetch';
import sharp from 'sharp';
import dotenv from 'dotenv';

dotenv.config();

const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent
    ],
    partials: [Partials.Channel]
});

const prefix = process.env.PREFIX || '!';
const delay = parseInt(process.env.DELAY, 10) || 1000;

// Define a variable to store the ID of the last added emoji
let lastAddedEmojiId = null;  // also resets it if the code reloads

client.once('ready', () => {
    console.log(`Logged in as ${client.user.tag}!`);

    client.user.setPresence({status: "dnd"}); //sets presence
    client.user.setActivity('GG', { type: 'WATCHING' }); //sets activity AND IT FUCKING DOSENT WORK IDK WHY
});

client.on('messageCreate', async message => {  //this needs better way to handle commands maybe in the feature
    if (message.author.bot) return;

    const botMention = `<@!${client.user.id}>`;
    const botMentionAlt = `<@${client.user.id}>`;
    const startsWithPrefix = message.content.startsWith(prefix);
    const startsWithMention = message.content.startsWith(botMention) || message.content.startsWith(botMentionAlt);

    if (startsWithMention) {
        message.reply(`My prefix is \`${prefix}\`.`);
        return;
    }

    if (!startsWithPrefix) return;

    const args = message.content.slice(prefix.length).trim().split(/ +/);
    const command = args.shift().toLowerCase();
    
    if (command === 'help') {
        message.reply(`**Help Menu**\n \`${prefix}help\` This very same menu.\n \`${prefix}info\` Information about me.\n \`${prefix}addemoji\` Adds emoji from another server or an image.\n \`${prefix}delemoji\` Deletes the last added emoji or the one afther the command.\n \`${prefix}lockemoji\` Locks specified emoji(s) to a role.\n \`${prefix}unlockemoji\` Unocks specified emoji(s).\n\n**Thats it**`);
        return;
    }

    if (command === 'info') {
        message.channel.send('**GitHub Repository:** https://github.com/JAC-dp/OpenEmote\n**Discord:** @dankata1337\n**This discord bot is fully opensorce, all comits are wellcome**');
        return;
    }

    if (command === 'addemoji') {
        if (!message.member.permissions.has(PermissionsBitField.Flags.ManageEmojisAndStickers)) {
            return message.reply('You do not have permission to manage emojis.');
        }

        const emojis = args;
        const attachments = message.attachments;

        if (emojis.length === 0 && attachments.size === 0) {
            return message.reply('Please provide at least one emoji or an image.');
        }

        // Process emojis
        for (const emoji of emojis) {
            try {
                const parsedEmoji = emoji.match(/<:.+:(\d+)>|<a:.+:(\d+)>/);

                if (!parsedEmoji) {
                    return message.reply(`Invalid emoji format: ${emoji}`);
                }

                const emojiId = parsedEmoji[1] || parsedEmoji[2];
                const emojiUrl = `https://cdn.discordapp.com/emojis/${emojiId}.png`;

                const response = await fetch(emojiUrl);
                const buffer = await response.buffer();

                await message.guild.emojis.create({
                    attachment: buffer,
                    name: `emoji_${emojiId}`
                });

                message.reply(`Emoji added from emoji code: ${emoji}`);
                await delayExecution(delay);

                // Update lastAddedEmojiId with the ID of the emoji just added
                lastAddedEmojiId = emojiId;
            } catch (error) {
                if (error.message.includes('rate limit')) {
                    console.error('Discord API rate limit:', error);
                    message.reply('Discord API rate limit exceeded. Please wait and try again later.');
                    break;
                } else {
                    console.error('Error adding emoji:', error);
                    message.reply(`Failed to add emoji: ${emoji}. Error: ${error.message}`);
                }
            }
        }

        // Process attachments
        for (const attachment of attachments.values()) {
            try {
                const response = await fetch(attachment.url);
                let buffer = await response.buffer();

                if (buffer.length > 2 * 1024 * 1024) {
                    buffer = await sharp(buffer)
                        .resize(128, 128, { fit: 'inside' })
                        .toBuffer();
                }

                await message.guild.emojis.create({
                    attachment: buffer,
                    name: `emoji_${Date.now()}`
                });

                message.reply(`Emoji added from attachment: ${attachment.url}`);
                await delayExecution(delay);

                // Update lastAddedEmojiId with the ID of the emoji just added
                lastAddedEmojiId = null; // Reset lastAddedEmojiId after adding attachment (as name is dynamic)
            } catch (error) {  //maybe better error handaling, who cares it spits the errors in runtime
                if (error.message.includes('rate limit')) {
                    console.error('Discord API rate limit:', error);
                    message.reply('Discord API rate limit exceeded. Please wait and try again later.');
                    break;
                } else {
                    console.error('Error adding emoji:', error);
                    message.reply(`Failed to add emoji from attachment: ${attachment.url}. Error: ${error.message}`);
                }
            }
        }
    }

    if (command === 'delemoji') {
        if (!message.member.permissions.has(PermissionsBitField.Flags.ManageEmojisAndStickers)) {
            return message.reply('You do not have permission to manage emojis.');
        }

        const emojiNames = args;

        if (emojiNames.length === 0) {
            // If lastAddedEmojiId is not null, attempt to delete the last added emoji
            if (lastAddedEmojiId) {
                try {
                    const emojiToDelete = message.guild.emojis.cache.find(e => e.id === lastAddedEmojiId);

                    if (!emojiToDelete) {
                        return message.reply(`Please provide at least one emoji to delete. Last emoji not found to delete.`);
                    }

                    await emojiToDelete.delete();
                    message.reply(`Last added emoji deleted.`);
                    lastAddedEmojiId = null; // Reset lastAddedEmojiId after deletion
                } catch (error) {
                    console.error('Error deleting emoji:', error);
                    message.reply(`Failed to delete last added emoji. Error: ${error.message}`);
                }
            } else {
                return message.reply('No emoji found to delete. Please specify an emoji name or add an emoji first.');
            }
        } else {
            // Handle deletion of specific emojis as before
            for (const emojiName of emojiNames) {
                try {
                    const parsedEmojiName = emojiName.match(/:(.+):/)[1];
                    const emoji = message.guild.emojis.cache.find(e => e.name === parsedEmojiName);

                    if (!emoji) {
                        message.reply(`Emoji not found: ${emojiName}`);
                        continue;
                    }

                    await emoji.delete();
                    message.reply(`Emoji deleted: ${emojiName}`);
                } catch (error) {
                    console.error('Error deleting emoji:', error);
                    message.reply(`Failed to delete emoji: ${emojiName}. Error: ${error.message}`);
                }
            }
        }
    }

    if (command === 'lockemoji') {
        if (!message.member.permissions.has(PermissionsBitField.Flags.ManageRoles)) {
            return message.reply('You do not have permission to manage roles.');
        }

        const roleMention = message.mentions.roles.first();
        if (!roleMention) {
            return message.reply('Please mention a role to lock the emojis to.');
        }

        const emojis = args.filter(arg => !arg.startsWith('<@&')); // Filter out role mentions
        if (emojis.length === 0) {
            return message.reply('Please provide at least one emoji to lock.');
        }

        for (const emoji of emojis) {
            try {
                const parsedEmoji = emoji.match(/<:.+:(\d+)>|<a:.+:(\d+)>/);
                if (!parsedEmoji) {
                    message.reply(`Invalid emoji format: ${emoji}`);
                    continue;
                }

                const emojiId = parsedEmoji[1] || parsedEmoji[2];
                const emojiToLock = message.guild.emojis.cache.get(emojiId);
                if (!emojiToLock) {
                    message.reply(`Emoji not found: ${emoji}`);
                    continue;
                }

                await emojiToLock.roles.set([roleMention]);
                message.reply(`Emoji ${emoji} locked to role ${roleMention.name}.`);
            } catch (error) {
                console.error('Error locking emoji:', error);
                message.reply(`Failed to lock emoji: ${emoji}. Error: ${error.message}`);
            }
        }
    }

    if (command === 'unlockemoji') {
        if (!message.member.permissions.has(PermissionsBitField.Flags.ManageRoles)) {
            return message.reply('You do not have permission to manage roles.');
        }

        const emojis = args;
        if (emojis.length === 0) {
            return message.reply('Please provide at least one emoji to unlock.');
        }

        for (const emoji of emojis) {
            try {
                const parsedEmoji = emoji.match(/<:.+:(\d+)>|<a:.+:(\d+)>/);
                if (!parsedEmoji) {
                    message.reply(`Invalid emoji format: ${emoji}`);
                    continue;
                }

                const emojiId = parsedEmoji[1] || parsedEmoji[2];
                const emojiToUnlock = message.guild.emojis.cache.get(emojiId);
                if (!emojiToUnlock) {
                    message.reply(`Emoji not found: ${emoji}`);
                    continue;
                }

                await emojiToUnlock.roles.set([]);
                message.reply(`Emoji ${emoji} unlocked.`);
            } catch (error) {
                console.error('Error unlocking emoji:', error);
                message.reply(`Failed to unlock emoji: ${emoji}. Error: ${error.message}`);
            }
        }
    }
});

function delayExecution(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

client.login(process.env.TOKEN);  //the only simple thing in this codebase
