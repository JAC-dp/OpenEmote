import { Client, GatewayIntentBits, Partials, PermissionsBitField, REST, Routes, SlashCommandBuilder, EmbedBuilder } from 'discord.js';
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

const delay = parseInt(process.env.DELAY, 10) || 1000;

// Helper function to format emoji properly
function formatEmoji(emoji) {
    if (!emoji) return '';
    if (typeof emoji === 'string') return emoji;
    return emoji.animated 
        ? `<a:${emoji.name}:${emoji.id}>`
        : `<:${emoji.name}:${emoji.id}>`;
}

// Define commands
const commands = [
    new SlashCommandBuilder()
        .setName('help')
        .setDescription('Shows all available commands and their usage'),
    new SlashCommandBuilder()
        .setName('info')
        .setDescription('Shows information about the bot and its creator'),
    new SlashCommandBuilder()
        .setName('steal')
        .setDescription('Steal emojis from other servers or add custom emojis')
        .addStringOption(option =>
            option.setName('emoji')
                .setDescription('The emoji(s) to steal (can be multiple)')
                .setRequired(false))
        .addAttachmentOption(option =>
            option.setName('image')
                .setDescription('Upload an image to add as an emoji')
                .setRequired(false)),
    new SlashCommandBuilder()
        .setName('remove')
        .setDescription('Remove an emoji from the server')
        .addStringOption(option =>
            option.setName('emoji')
                .setDescription('The emoji to remove')
                .setRequired(true)),
    new SlashCommandBuilder()
        .setName('restrict')
        .setDescription('Restrict emoji usage to specific roles')
        .addRoleOption(option =>
            option.setName('role')
                .setDescription('The role that can use the emoji')
                .setRequired(true))
        .addStringOption(option =>
            option.setName('emoji')
                .setDescription('The emoji to restrict')
                .setRequired(true)),
    new SlashCommandBuilder()
        .setName('unrestrict')
        .setDescription('Remove role restrictions from an emoji')
        .addStringOption(option =>
            option.setName('emoji')
                .setDescription('The emoji to unrestrict')
                .setRequired(true)),
    new SlashCommandBuilder()
        .setName('unrestrict-all')
        .setDescription('Remove role restrictions from all emojis'),
    new SlashCommandBuilder()
        .setName('restrict-list')
        .setDescription('Show all restricted emojis and their roles')
];

// Register slash commands
const rest = new REST({ version: '10' }).setToken(process.env.TOKEN);

client.once('ready', async () => {
    console.log(`Logged in as ${client.user.tag}!`);

    // Generate bot invite link with necessary permissions
    const inviteLink = `https://discord.com/api/oauth2/authorize?client_id=${client.user.id}&permissions=8&scope=bot%20applications.commands`;
    console.log(`Bot Invite Link: ${inviteLink}`);
    
    try {
        console.log('Started refreshing application (/) commands.');
        await rest.put(
            Routes.applicationCommands(client.user.id),
            { body: commands },
        );
        console.log('Successfully reloaded application (/) commands.');
    } catch (error) {
        console.error(error);
    }

    client.user.setPresence({
        activities: [{ 
            name: 'with emojis',
            type: 0 // PLAYING
        }],
        status: 'online'
    });
});

client.on('interactionCreate', async interaction => {
    if (!interaction.isCommand()) return;

    const { commandName } = interaction;

    try {
        switch (commandName) {
            case 'help':
                const helpEmbed = new EmbedBuilder()
                    .setColor('#0099ff')
                    .setTitle('Emoji Management Commands')
                    .setDescription('Here are all available commands and their usage')
                    .setThumbnail(client.user.displayAvatarURL())
                    .addFields(
                        { name: '/help', value: 'Shows this help menu', inline: true },
                        { name: '/info', value: 'Shows information about the bot', inline: true },
                        { name: '/steal', value: 'Steal emojis from other servers or add custom emojis', inline: true },
                        { name: '/remove', value: 'Remove an emoji from the server', inline: true },
                        { name: '/restrict', value: 'Restrict emoji usage to specific roles', inline: true },
                        { name: '/restrict-list', value: 'Show all restricted emojis and their roles', inline: true },
                        { name: '/unrestrict', value: 'Remove role restrictions from an emoji', inline: true },
                        { name: '/unrestrict-all', value: 'Remove role restrictions from all emojis', inline: true }
                    )
                    .setFooter({ text: 'Note: You need Manage Emojis permission to use these commands' });
                await interaction.reply({ embeds: [helpEmbed], ephemeral: true });
                break;

            case 'info':
                const infoEmbed = new EmbedBuilder()
                    .setColor('#0099ff')
                    .setTitle('Bot Information')
                    .setDescription('OpenEmote - A powerful emoji management bot')
                    .setThumbnail(client.user.displayAvatarURL())
                    .addFields(
                        { name: 'GitHub Repository', value: 'https://github.com/JAC-dp/OpenEmote', inline: false },
                        { name: 'Discord', value: '@dankata1337', inline: false },
                        { name: 'Status', value: 'Open Source - All contributions welcome!', inline: false },
                        { name: 'License', value: 'This bot is fully open source and free to use. Feel free to contribute to its development!', inline: false }
                    );
                await interaction.reply({ embeds: [infoEmbed], ephemeral: true });
                break;

            case 'steal':
                if (!interaction.member.permissions.has(PermissionsBitField.Flags.ManageEmojisAndStickers)) {
                    const errorEmbed = new EmbedBuilder()
                        .setColor('#ff0000')
                        .setTitle('Permission Error')
                        .setDescription('You do not have permission to manage emojis.');
                    await interaction.reply({ embeds: [errorEmbed], ephemeral: true });
                    return;
                }

                const emojiOption = interaction.options.getString('emoji');
                const imageOption = interaction.options.getAttachment('image');

                if (!emojiOption && !imageOption) {
                    await interaction.reply({ content: 'Please provide at least one emoji or an image.', ephemeral: true });
                    return;
                }

                await interaction.deferReply();

                if (emojiOption) {
                    // Match all emojis in the string using a global regex
                    const emojiRegex = /<a?:\w+:\d+>/g;
                    const emojis = emojiOption.match(emojiRegex) || [];
                    let successCount = 0;
                    let failCount = 0;

                    if (emojis.length === 0) {
                        const errorEmbed = new EmbedBuilder()
                            .setColor('#ff0000')
                            .setTitle('Invalid Emoji Format')
                            .setDescription('No valid emojis found. Please use Discord emoji format (e.g., <:name:id> or <a:name:id>).');
                        await interaction.followUp({ embeds: [errorEmbed], ephemeral: true });
                        return;
                    }

                    for (const emoji of emojis) {
                        try {
                            const parsedEmoji = emoji.match(/<a?:\w+:(\d+)>/);
                            if (!parsedEmoji) {
                                failCount++;
                                continue;
                            }

                            const emojiId = parsedEmoji[1];
                            const isAnimated = emoji.startsWith('<a:');
                            const emojiUrl = `https://cdn.discordapp.com/emojis/${emojiId}.${isAnimated ? 'gif' : 'png'}`;

                            const response = await fetch(emojiUrl);
                            if (!response.ok) {
                                failCount++;
                                continue;
                            }

                            const arrayBuffer = await response.arrayBuffer();
                            const buffer = Buffer.from(arrayBuffer);

                            await interaction.guild.emojis.create({
                                attachment: buffer,
                                name: `emoji_${emojiId}`
                            });

                            successCount++;
                            await delayExecution(delay);
                        } catch (error) {
                            console.error('Error adding emoji:', error);
                            failCount++;
                        }
                    }

                    // Send a summary of the operation
                    if (successCount > 0) {
                        const successEmbed = new EmbedBuilder()
                            .setColor('#00ff00')
                            .setTitle('Emoji Addition Successful')
                            .setDescription(`Successfully added ${successCount} emoji${successCount !== 1 ? 's' : ''}${failCount > 0 ? `, ${failCount} failed` : ''}.`);
                        await interaction.followUp({ embeds: [successEmbed] });
                    } else {
                        const errorEmbed = new EmbedBuilder()
                            .setColor('#ff0000')
                            .setTitle('Emoji Addition Failed')
                            .setDescription('Failed to add any emojis. Please make sure you\'re using valid emoji formats.');
                        await interaction.followUp({ embeds: [errorEmbed], ephemeral: true });
                    }
                }

                if (imageOption) {
                    try {
                        const response = await fetch(imageOption.url);
                        const arrayBuffer = await response.arrayBuffer();
                        let buffer = Buffer.from(arrayBuffer);

                        // Check if the file is a GIF
                        const isGif = imageOption.contentType === 'image/gif';
                        const maxSize = 256 * 1024; // 256KB in bytes (Discord's limit)

                        if (buffer.length > maxSize) {
                            if (isGif) {
                                // For GIFs, we'll try multiple compression levels
                                const sizes = [
                                    { width: 128, quality: 80, effort: 10 },
                                    { width: 96, quality: 60, effort: 10 },
                                    { width: 64, quality: 40, effort: 10 }
                                ];

                                for (const size of sizes) {
                                    buffer = await sharp(buffer, { animated: true })
                                        .resize(size.width, size.width, { fit: 'inside' })
                                        .gif({ quality: size.quality, effort: size.effort })
                                        .toBuffer();

                                    if (buffer.length <= maxSize) break;
                                }

                                // If still too large, try to reduce frames
                                if (buffer.length > maxSize) {
                                    buffer = await sharp(buffer, { animated: true })
                                        .resize(64, 64, { fit: 'inside' })
                                        .gif({ quality: 30, effort: 10, colors: 64 })
                                        .toBuffer();
                                }
                            } else {
                                // For static images, use more aggressive compression
                                buffer = await sharp(buffer)
                                    .resize(128, 128, { fit: 'inside' })
                                    .jpeg({ quality: 60, mozjpeg: true })
                                    .toBuffer();

                                // If still too large, try even more aggressive compression
                                if (buffer.length > maxSize) {
                                    buffer = await sharp(buffer)
                                        .resize(96, 96, { fit: 'inside' })
                                        .jpeg({ quality: 40, mozjpeg: true })
                                        .toBuffer();
                                }
                            }
                        }

                        await interaction.guild.emojis.create({
                            attachment: buffer,
                            name: `emoji_${Date.now()}`
                        });

                        const successEmbed = new EmbedBuilder()
                            .setColor('#00ff00')
                            .setTitle('Emoji Added')
                            .setDescription('Successfully added emoji from attachment')
                            .addFields({ name: 'URL', value: imageOption.url });
                        await interaction.followUp({ embeds: [successEmbed] });
                    } catch (error) {
                        console.error('Error adding emoji from attachment:', error);
                        const errorEmbed = new EmbedBuilder()
                            .setColor('#ff0000')
                            .setTitle('Error')
                            .setDescription(`Failed to add emoji from attachment: ${error.message}`);
                        await interaction.followUp({ embeds: [errorEmbed], ephemeral: true });
                    }
                }
                break;

            case 'remove':
                if (!interaction.member.permissions.has(PermissionsBitField.Flags.ManageEmojisAndStickers)) {
                    const errorEmbed = new EmbedBuilder()
                        .setColor('#ff0000')
                        .setTitle('Permission Error')
                        .setDescription('You do not have permission to manage emojis.');
                    await interaction.reply({ embeds: [errorEmbed], ephemeral: true });
                    return;
                }

                const emojiToDelete = interaction.options.getString('emoji');
                try {
                    const parsedEmoji = emojiToDelete.match(/<:.+:(\d+)>|<a:.+:(\d+)>/);
                    if (!parsedEmoji) {
                        const errorEmbed = new EmbedBuilder()
                            .setColor('#ff0000')
                            .setTitle('Invalid Emoji Format')
                            .setDescription(`Invalid emoji format: ${emojiToDelete}`);
                        await interaction.reply({ embeds: [errorEmbed], ephemeral: true });
                        return;
                    }

                    const emojiId = parsedEmoji[1] || parsedEmoji[2];
                    const emoji = interaction.guild.emojis.cache.get(emojiId);

                    if (!emoji) {
                        const errorEmbed = new EmbedBuilder()
                            .setColor('#ff0000')
                            .setTitle('Emoji Not Found')
                            .setDescription(`Emoji not found: ${emojiToDelete}`);
                        await interaction.reply({ embeds: [errorEmbed], ephemeral: true });
                        return;
                    }

                    await emoji.delete();
                    const successEmbed = new EmbedBuilder()
                        .setColor('#00ff00')
                        .setTitle('Emoji Removed')
                        .setDescription(`Successfully removed emoji: ${formatEmoji(emoji)}`);
                    await interaction.reply({ embeds: [successEmbed] });
                } catch (error) {
                    console.error('Error deleting emoji:', error);
                    const errorEmbed = new EmbedBuilder()
                        .setColor('#ff0000')
                        .setTitle('Error')
                        .setDescription(`Failed to delete emoji: ${error.message}`);
                    await interaction.reply({ embeds: [errorEmbed], ephemeral: true });
                }
                break;

            case 'restrict':
                if (!interaction.member.permissions.has(PermissionsBitField.Flags.ManageRoles)) {
                    const errorEmbed = new EmbedBuilder()
                        .setColor('#ff0000')
                        .setTitle('Permission Error')
                        .setDescription('You do not have permission to manage roles.');
                    await interaction.reply({ embeds: [errorEmbed], ephemeral: true });
                    return;
                }

                const role = interaction.options.getRole('role');
                const emojiToLock = interaction.options.getString('emoji');

                try {
                    const parsedEmoji = emojiToLock.match(/<:.+:(\d+)>|<a:.+:(\d+)>/);
                    if (!parsedEmoji) {
                        const errorEmbed = new EmbedBuilder()
                            .setColor('#ff0000')
                            .setTitle('Invalid Emoji Format')
                            .setDescription(`Invalid emoji format: ${emojiToLock}`);
                        await interaction.reply({ embeds: [errorEmbed], ephemeral: true });
                        return;
                    }

                    const emojiId = parsedEmoji[1] || parsedEmoji[2];
                    const emoji = interaction.guild.emojis.cache.get(emojiId);

                    if (!emoji) {
                        const errorEmbed = new EmbedBuilder()
                            .setColor('#ff0000')
                            .setTitle('Emoji Not Found')
                            .setDescription(`Emoji not found: ${emojiToLock}`);
                        await interaction.reply({ embeds: [errorEmbed], ephemeral: true });
                        return;
                    }

                    // Get the bot's specific role by name
                    const botRole = interaction.guild.roles.cache.find(role => role.name.toLowerCase() === client.user.username.toLowerCase());
                    
                    if (!botRole) {
                        const errorEmbed = new EmbedBuilder()
                            .setColor('#ff0000')
                            .setTitle('Error')
                            .setDescription('Could not find the bot\'s role. Please make sure the bot has a role named after it.');
                        await interaction.reply({ embeds: [errorEmbed], ephemeral: true });
                        return;
                    }

                    // Set both the user's selected role and the bot's role
                    await emoji.roles.set([role, botRole]);
                    // Force refresh the emoji cache
                    await interaction.guild.emojis.fetch();
                    const successEmbed = new EmbedBuilder()
                        .setColor('#00ff00')
                        .setTitle('Emoji Restricted')
                        .setDescription(`Successfully restricted emoji ${formatEmoji(emoji)} to role ${role.name}`);
                    await interaction.reply({ embeds: [successEmbed] });
                } catch (error) {
                    console.error('Error locking emoji:', error);
                    const errorEmbed = new EmbedBuilder()
                        .setColor('#ff0000')
                        .setTitle('Error')
                        .setDescription(`Failed to lock emoji: ${error.message}`);
                    await interaction.reply({ embeds: [errorEmbed], ephemeral: true });
                }
                break;

            case 'unrestrict':
                if (!interaction.member.permissions.has(PermissionsBitField.Flags.ManageRoles)) {
                    const errorEmbed = new EmbedBuilder()
                        .setColor('#ff0000')
                        .setTitle('Permission Error')
                        .setDescription('You do not have permission to manage roles.');
                    await interaction.reply({ embeds: [errorEmbed], ephemeral: true });
                    return;
                }

                const emojiToUnlock = interaction.options.getString('emoji');

                try {
                    const parsedEmoji = emojiToUnlock.match(/<:.+:(\d+)>|<a:.+:(\d+)>/);
                    if (!parsedEmoji) {
                        const errorEmbed = new EmbedBuilder()
                            .setColor('#ff0000')
                            .setTitle('Invalid Emoji Format')
                            .setDescription(`Invalid emoji format: ${emojiToUnlock}`);
                        await interaction.reply({ embeds: [errorEmbed], ephemeral: true });
                        return;
                    }

                    const emojiId = parsedEmoji[1] || parsedEmoji[2];
                    const emoji = interaction.guild.emojis.cache.get(emojiId);

                    if (!emoji) {
                        const errorEmbed = new EmbedBuilder()
                            .setColor('#ff0000')
                            .setTitle('Emoji Not Found')
                            .setDescription(`Emoji not found: ${emojiToUnlock}`);
                        await interaction.reply({ embeds: [errorEmbed], ephemeral: true });
                        return;
                    }

                    // Check if the emoji has any role restrictions
                    if (emoji.roles.cache.size === 0) {
                        const errorEmbed = new EmbedBuilder()
                            .setColor('#ff0000')
                            .setTitle('No Restrictions')
                            .setDescription(`This emoji is not restricted to any roles: ${emojiToUnlock}`);
                        await interaction.reply({ embeds: [errorEmbed], ephemeral: true });
                        return;
                    }

                    await emoji.roles.set([]);
                    // Force refresh the emoji cache
                    await interaction.guild.emojis.fetch();
                    const successEmbed = new EmbedBuilder()
                        .setColor('#00ff00')
                        .setTitle('Emoji Unrestricted')
                        .setDescription(`Successfully removed restrictions from emoji: ${formatEmoji(emoji)}`);
                    await interaction.reply({ embeds: [successEmbed] });
                } catch (error) {
                    console.error('Error unlocking emoji:', error);
                    const errorEmbed = new EmbedBuilder()
                        .setColor('#ff0000')
                        .setTitle('Error')
                        .setDescription(`Failed to unlock emoji: ${error.message}`);
                    await interaction.reply({ embeds: [errorEmbed], ephemeral: true });
                }
                break;

            case 'unrestrict-all':
                if (!interaction.member.permissions.has(PermissionsBitField.Flags.ManageRoles)) {
                    const errorEmbed = new EmbedBuilder()
                        .setColor('#ff0000')
                        .setTitle('Permission Error')
                        .setDescription('You do not have permission to manage roles.');
                    await interaction.reply({ embeds: [errorEmbed], ephemeral: true });
                    return;
                }

                try {
                    const emojis = interaction.guild.emojis.cache;
                    let count = 0;
                    let total = 0;

                    for (const emoji of emojis.values()) {
                        if (emoji.roles.cache.size > 0) {
                            await emoji.roles.set([]);
                            count++;
                        }
                        total++;
                    }

                    // Force refresh the emoji cache after all changes
                    await interaction.guild.emojis.fetch();

                    if (count === 0) {
                        const infoEmbed = new EmbedBuilder()
                            .setColor('#0099ff')
                            .setTitle('No Restrictions Found')
                            .setDescription('No emojis were found with role restrictions.');
                        await interaction.reply({ embeds: [infoEmbed], ephemeral: true });
                        return;
                    }

                    const successEmbed = new EmbedBuilder()
                        .setColor('#00ff00')
                        .setTitle('All Emojis Unrestricted')
                        .setDescription(`Successfully removed restrictions from ${count} emoji${count !== 1 ? 's' : ''} out of ${total} total emojis`);
                    await interaction.reply({ embeds: [successEmbed] });
                } catch (error) {
                    console.error('Error unlocking all emojis:', error);
                    const errorEmbed = new EmbedBuilder()
                        .setColor('#ff0000')
                        .setTitle('Error')
                        .setDescription(`Failed to unlock all emojis: ${error.message}`);
                    await interaction.reply({ embeds: [errorEmbed], ephemeral: true });
                }
                break;

            case 'restrict-list':
                if (!interaction.member.permissions.has(PermissionsBitField.Flags.ManageRoles)) {
                    const errorEmbed = new EmbedBuilder()
                        .setColor('#ff0000')
                        .setTitle('Permission Error')
                        .setDescription('You do not have permission to view role restrictions.');
                    await interaction.reply({ embeds: [errorEmbed], ephemeral: true });
                    return;
                }

                try {
                    // Force refresh the emoji cache before checking restrictions
                    await interaction.guild.emojis.fetch();
                    const emojis = interaction.guild.emojis.cache;
                    const restrictedEmojis = emojis.filter(emoji => emoji.roles.cache.size > 0);

                    if (restrictedEmojis.size === 0) {
                        const infoEmbed = new EmbedBuilder()
                            .setColor('#0099ff')
                            .setTitle('No Restrictions Found')
                            .setDescription('No emojis are currently restricted to roles.');
                        await interaction.reply({ embeds: [infoEmbed], ephemeral: true });
                        return;
                    }

                    const embed = new EmbedBuilder()
                        .setColor('#0099ff')
                        .setTitle('Restricted Emojis')
                        .setDescription('Here are all emojis with role restrictions:');

                    // Group emojis by role for better organization
                    const roleMap = new Map();
                    const botRole = interaction.guild.roles.cache.find(role => role.name.toLowerCase() === client.user.username.toLowerCase());
                    
                    restrictedEmojis.forEach(emoji => {
                        emoji.roles.cache.forEach(role => {
                            // Skip the bot's role
                            if (role.id === botRole?.id) return;
                            
                            if (!roleMap.has(role.id)) {
                                roleMap.set(role.id, {
                                    name: role.name,
                                    emojis: []
                                });
                            }
                            roleMap.get(role.id).emojis.push(formatEmoji(emoji));
                        });
                    });

                    // Add fields for each role
                    roleMap.forEach(roleData => {
                        const emojiList = roleData.emojis.join('\n');
                        embed.addFields({
                            name: `Role: ${roleData.name}`,
                            value: emojiList || 'No emojis'
                        });
                    });

                    await interaction.reply({ embeds: [embed], ephemeral: true });
                } catch (error) {
                    console.error('Error listing restricted emojis:', error);
                    const errorEmbed = new EmbedBuilder()
                        .setColor('#ff0000')
                        .setTitle('Error')
                        .setDescription(`Failed to list restricted emojis: ${error.message}`);
                    await interaction.reply({ embeds: [errorEmbed], ephemeral: true });
                }
                break;
        }
    } catch (error) {
        console.error('Error handling command:', error);
        
        // Handle interaction timeout
        if (error.code === 10062) {
            try {
                // Try to follow up if the interaction was deferred
                if (interaction.deferred) {
                    const errorEmbed = new EmbedBuilder()
                        .setColor('#ff0000')
                        .setTitle('Error')
                        .setDescription('The command took too long to execute. Please try again.');
                    await interaction.followUp({ embeds: [errorEmbed], ephemeral: true });
                }
            } catch (followUpError) {
                console.error('Error following up:', followUpError);
            }
            return;
        }

        // Handle other errors
        try {
            if (!interaction.replied && !interaction.deferred) {
                const errorEmbed = new EmbedBuilder()
                    .setColor('#ff0000')
                    .setTitle('Error')
                    .setDescription('There was an error while executing this command!');
                await interaction.reply({ embeds: [errorEmbed], ephemeral: true });
            } else {
                const errorEmbed = new EmbedBuilder()
                    .setColor('#ff0000')
                    .setTitle('Error')
                    .setDescription('There was an error while executing this command!');
                await interaction.followUp({ embeds: [errorEmbed], ephemeral: true });
            }
        } catch (replyError) {
            console.error('Error sending error message:', replyError);
        }
    }
});

function delayExecution(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

client.login(process.env.TOKEN);
