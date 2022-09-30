require('dotenv').config(); //We call this config function of dotenv to load up all the variables in the .env file
const { Client, GatewayIntentBits, EmbedBuilder, ActivityType } = require('discord.js');
const { DisTube, default: dist } = require('distube');
const PREFIX = ".";

const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent,
        GatewayIntentBits.GuildVoiceStates
    ]
}); //This is how ee create an object of Client


const distube = new DisTube(client, {
    leaveOnStop: false,
    emitNewSongOnly: true,
    emitAddSongWhenCreatingQueue: false,
    emitAddListWhenCreatingQueue: false,
    nsfw: true,
    // customFilters: {
    //     "8d":"apulsator=hz=0.075"
    // }
})

client.login(process.env.TOKEN);

client.on('ready', () => {
    client.user.setActivity(`to ${PREFIX}help`, { type: ActivityType.Listening });
    console.log(`${client.user.tag} has logged in successfully!`);
})

client.on('messageCreate', (message) => {
    if (message.content.startsWith(PREFIX) && !message.author.bot) {
        const args = message.content.split(" ");

        //Commands
        if (args[0].toLowerCase() === PREFIX + "play") {
            args.shift();
            const SongName = args.join(" ");
            if (SongName.trim() === "")
                message.reply("You haven't provided any song name or URL");
            else {
                if (!message.member.voice.channel) {
                    message.reply("You must be connected to a voice channel to play music");
                }
                else {
                    distube.play(message.member.voice.channel, SongName, {
                        member: message.member,
                        textChannel: message.channel,
                        message
                    })
                }
            }
        }

        if (args[0].toLowerCase() === PREFIX + "pause") {
            if (!message.member.voice.channel)
                message.reply("You cannot pause a song if you are not in a voice channel");
            else if (!distube.getQueue(message))
                message.reply("Nothing to pause, the queue is empty");
            else {
                message.reply(":pause_button: Paused current song");
                distube.pause(message);
            }
        }
        if (args[0].toLowerCase() === PREFIX + "resume") {
            if (!message.member.voice.channel)
                message.reply("You cannot resume a song if you are not in a voice channel");
            else if (!distube.getQueue(message))
                message.reply("Nothing to resume, the queue is empty");
            else {
                message.reply(":arrow_forward: Resuming");
                distube.resume(message);
            }
        }
        if (args[0].toLowerCase() === PREFIX + "stop") {
            if (!message.member.voice.channel)
                message.reply("You cannot stop a song if you are not in a voice channel");
            else if (!distube.getQueue(message))
                message.reply("Nothing to stop, the queue is empty");
            else
            {
                message.reply("Song Stopped :stop_sign:");
                distube.stop(message);
            }
        }
        if (args[0].toLowerCase() === PREFIX + "skip") {
            if (!message.member.voice.channel)
                message.reply("You cannot skip a song if you are not in a voice channel");
            else if (!distube.getQueue(message))
                message.reply("Nothing to skip, the queue is empty");
            else {
                if (args.length == 1) {
                    message.reply(":white_check_mark: Skipped current song");
                    if (distube.getQueue(message).songs.length == 1)
                        distube.stop(message);
                    else
                        distube.skip(message);
                }
                else {
                    args.shift()
                    if (args[0] > distube.getQueue(message).songs.length || typeof (Number(args[0])) != 'number')
                        message.reply("That position does not exist. Cannot jump.");
                    else if (Number(args[0]) == 1)
                        message.reply("You are currently playing that song...");
                    else if (Number(args[0]) < 1) {
                        if (distube.getQueue(message).previousSongs.length < 1)
                            message.reply("There's no previous song");
                        else {
                            message.reply(":white_check_mark: Skipped current song");
                            distube.previous(message);
                        }
                    }
                    else {
                        message.reply(":white_check_mark: Skipped current song");
                        distube.jump(message, Number(args[0] - 1));
                    }
                }
            }

        }
        if (args[0].toLowerCase() === PREFIX + "queue") {
            const queue = distube.getQueue(message);
            if (!queue)
                message.reply("Queue is empty");
            else {
                const randomColor = Math.floor(Math.random() * 16777215).toString(16);
                const embed = new EmbedBuilder()
                    .setColor(randomColor)
                    .setTitle("Current queue:")
                    .setDescription(queue.songs.map((song, id) =>
                        `**${id + 1}**. [${song.name}] - \`${song.formattedDuration}\``
                    ).join("\n"))
                message.channel.send({ embeds: [embed] });
            }
        }
        if (args[0].toLowerCase() === PREFIX + "help") {
            const embed = new EmbedBuilder()
                .setTitle('Hello! I am Joe and I listen to the following commands...')
                .addFields(
                    { name: PREFIX + 'play <Song Name>', value: 'Plays the requested song. Replace <Song Name> with your desired song' },
                    { name: PREFIX + 'pause', value: 'Pauses the current song' },
                    { name: PREFIX + 'resume', value: 'Resumes the paused song' },
                    { name: PREFIX + 'skip <Position Number>', value: 'If no <Position Number> is given then it skips to the next song present in the queue. If <Position Number is given>, then it skips to the mentioned position. If <Position Number> is less than 1, then the previous song is played' },
                    { name: PREFIX + 'queue', value: 'Gives a list of songs present in the current queue' },
                    { name: PREFIX + 'stop', value: 'Stops the song and ends the queue' }
                )

            message.channel.send({ embeds: [embed] });
        }
    }
    else
        return;
})
client.on('guildCreate', guild => {
    client.users.cache.get('812753087545737217').send(guild.name + " added me! YAY!");
});

distube.on('playSong', (queue, song) => {
    const randomColor = Math.floor(Math.random() * 16777215).toString(16);
    const embed = new EmbedBuilder()
        .setColor(randomColor)
        .setTitle("Now Playing...")
        .setDescription(song.name)
        .setThumbnail(song.thumbnail)
    queue.textChannel.send({ embeds: [embed] })
})
distube.on('addSong', (queue, song) => {
    const randomColor = Math.floor(Math.random() * 16777215).toString(16);
    const embed = new EmbedBuilder()
        .setColor(randomColor)
        .setTitle("New song added to the queue 👍")
    queue.textChannel.send({ embeds: [embed] });
})