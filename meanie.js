// modules and setup information
const Discord = require("discord.js");
const client = new Discord.Client({ autoReconnect: true, disableEveryone: true });
const config = require("./config.json");
const fs = require("fs");
const request = require("request");
const cheerio = require("cheerio");
const urlExists = require("url-exists"); 
const YTMP3Downloader = require("youtube-mp3-downloader");
const YTValidator = require("youtube-validator");
const getYTID = require("get-youtube-id");

// bot login
client.login(config.token);

// global default channel instantiation
const defaultChannel = guild => {
  const channels = guild.channels.cache
    .filter(c => c.type === "text" && c.permissionsFor(guild.me).has("SEND_MESSAGES"))
    .sort((a, b) => a.createdTimestamp > b.createdTimestamp);
  return channels.find(c => c.name.includes("general")) || channels.find(c => c.name.includes("main")) || channels.find(c => c.name.includes("lobby")) || channels.find(c => c.name.includes("genderlel")) || channels.find(c => c.name.includes("crib")) || channels.first();
}

// global function to convert every first letter of a word in a string to uppercase
function eachWordUpper(str) {
  let array = str.split(" ");
  let newarray = [];
    
  for (let x = 0; x < array.length; x++) {
      newarray.push(array[x].charAt(0).toUpperCase() + array[x].slice(1));
  }

  return newarray.join(" "); 
} 

// global function for testing to see what is attached to a message, if anything
function extension(attachment) { 
  const imageLink = attachment.split('.');
  const typeOfImage = imageLink[imageLink.length - 1];
  const image = /(jpg|jpeg|png|gif)/gi.test(typeOfImage);
  if (!image) return '';
  return attachment;
}

// configure global YouTube to MP3 downloader object
let YD = new YTMP3Downloader({
  "ffmpegPath": "/usr/src/FFmpeg/libavcodec/libmp3lame.c",          // Where is the FFmpeg binary located?
  "outputPath": "/home/pi/djsbots/lphelper/yt2mp3_files",           // Where should the downloaded and encoded files be stored?
  "youtubeVideoQuality": "highest",                                 // What video quality should be used?
  "queueParallelism": 2,                                            // How many parallel downloads/encodes should be started?
  "progressTimeout": 2000                                           // How long should be the interval of the progress reports
});

// ready event
client.on("ready", () => {
  // log that bot has successfully started
  console.log("M.E.A.N.I.E. is now online!");

  // pick random activity from file and set it as current activity
  let activities = JSON.parse(fs.readFileSync("./activities.json"));
  let activitiesAsArray = Object.keys(activities);

  let randomActivity = activitiesAsArray[Math.floor(Math.random() * activitiesAsArray.length)];
  client.user.setActivity(activities[randomActivity].botactivity, { type: activities[randomActivity].activitytype });

  // continually set random activity every 30 minutes from here on out
  setInterval(function() {
    randomActivity = activitiesAsArray[Math.floor(Math.random() * activitiesAsArray.length)];
    client.user.setActivity(activities[randomActivity].botactivity, { type: activities[randomActivity].activitytype });
    // console.log(`Changed activity to "${activities[randomActivity].botactivity}" with activity type ${activities[randomActivity].activitytype}.`);
  }, 1.8e+6);
});

// // user update event
// client.on("userUpdate", (oldUser, newUser) => {
//   // update private server icon with new avatar on change
//   if (oldUser.id === config.creatorid) {
//     let pserver = client.guilds.cache.find(g => g.id === "200458694704627712");
//     pserver.setIcon(newUser.displayAvatarURL(), "Vex avatar change occurred.")
//       .catch(error => console.error(error));
//   }
// });

// joining guild event
client.on("guildCreate", guild => {
  const channel = defaultChannel(guild);
  console.log(`I have joined a guild by the name of ${guild.name}!`);
  channel.send(`M.E.A.N.I.E. has now arrived in **${guild.name}**! It is a pleasure to make your acquaintance. :robot:`).catch(error => console.error(error));
});

// leaving guild event
client.on("guildDelete", guild => {
  console.log(`I have left a guild by the name of ${guild.name}!`);
});

// error event
client.on("error", e => console.error(e));

// warn event
client.on("warn", e => console.warn(e));

// debug event
// client.on("debug", e => console.info(e));

// message event
client.on("message", async message => {
    // make sure author isn't bot
    if (message.author.bot) return;

    // check for command messages outside of #bots in Level Palace
    // if (message.channel.type !== "dm" && message.channel.type !== "group" && message.guild.id === "325490421419606016" && !message.content.toLowerCase().startsWith("?mute") && !message.content.toLowerCase().startsWith("?unmute") && !message.content.toLowerCase().startsWith("?rank") && !message.content.toLowerCase().startsWith("!feed") && !message.content.toLowerCase().startsWith("-feed") && !message.content.toLowerCase().startsWith("~feed")) {
    //   let botprefix;
    //   let botcommand;

    //   // get prefix
    //   if (message.content.startsWith("<@127296623779774464>")) botprefix = "<@127296623779774464>";
    //   else if (message.content.startsWith("+")) botprefix = "+";
    //   else if (message.content.startsWith("`")) botprefix = "`";
    //   else if (message.content.startsWith("!")) botprefix = "!";
    //   else if (message.content.startsWith("-")) botprefix = "-";
    //   else if (message.content.startsWith("~")) botprefix = "~";
    //   else if (message.content.startsWith("?")) botprefix = "?";
    //   else if (message.content.startsWith(".")) botprefix = ".";
    //   else if (message.content.startsWith("t!")) botprefix = "t!";
    //   else if (message.content.startsWith("t@")) botprefix = "t@";
    //   else if (message.content.startsWith("=")) botprefix = "=";
    //   else if (message.content.startsWith(";;")) botprefix = ";;";
    //   else if (message.content.startsWith("%")) botprefix = "%";

    //   if (message.channel.id !== "325492750667612162" && message.channel.id !== "325495534896807936" && message.channel.id !== "325495670502850560" && message.channel.id !== "334144051706331136" && message.channel.id !== "330810124757368832") {
    //     if (message.content.startsWith("<@127296623779774464>") || message.content.startsWith("+") || message.content.startsWith("`") || message.content.startsWith("!") || message.content.startsWith("-") || message.content.startsWith("~") || message.content.startsWith("?") || message.content.startsWith(".") || message.content.startsWith("t!") || message.content.startsWith("t@") || message.content.startsWith("=") || message.content.startsWith(";;") || message.content.startsWith("%")) {
    //       botcommand = message.content.slice(botprefix.length);

    //       // check if the bot command begins with a letter
    //       function hasFirstLetterOrNumber(c) {
    //         if (botprefix === "<@127296623779774464>") c = c.trim();
    //         c = c.substring(0, 1);

    //         if (c.toLowerCase() !== c.toUpperCase() || /^\d/.test(c)) {
    //           return true;
    //         } else {
    //           return false;
    //         }
    //       }

    //       if (hasFirstLetterOrNumber(botcommand) && !botcommand.includes(botprefix)) {
    //         message.channel.send("Use other bot commands in <#325492750667612162>.").then(msg => {
    //           return msg.delete(5000);
    //         });
    //       }
    //     }
    //   }
    // }

    // code for "ayy"
    if (message.content.toLowerCase() === "ayy" && message.guild.id === "325490421419606016" && message.channel.id === "325492750667612162" || message.content.toLowerCase() === "ayy" && message.guild.id !== "325490421419606016") return message.channel.send("You're not funny.");

    // make sure message starts with command prefix or a bot mention from here onwards
    if (!message.content.startsWith(config.prefix) && !message.content.startsWith(`<@${client.user.id}>`) && !message.content.startsWith(`<@!${client.user.id}>`)) return;

    // respond to message with just a mention
    if (message.content === `<@${client.user.id}>` || message.content === `<@!${client.user.id}>`) {
      if (message.author.id !== config.creatorid) return message.channel.send(`Why the mention, **${message.author.username}**?`);
      else return message.channel.send(`What do you need, master?`);
    }

    // various variable setup
    let command;
    let mentionMessage;
    let args;

    if (message.content.startsWith(config.prefix)) command = message.content.split(" ")[0].slice(config.prefix.length).toLowerCase();
    else mentionMessage = message.content.split(" ").slice(1).join(" ").replace(/\s/g, "").toLowerCase();
    
    if (message.content.startsWith(config.prefix)) args = message.content.split(" ").slice(1).join(" ");

    // log method setup
    function log(cmd) {
      if (message.author.id === config.creatorid) return;

      let trimmedArgs = args;
      let logchannel = client.channels.cache.find(c => c.id === "436702599706705940");
      if (message.channel === logchannel) return;
      if (args.length > 500) trimmedArgs = args.substring(0, 500).trim() + "...";
      

      if (!args) {
        if (message.channel.type === "dm") {
          return logchannel.send({ embed: {
            color: 3447003,
            fields: [
              {
                name: "Command Used",
                value: cmd
              },
              {
                name: "Author",
                value: message.author.username
              },
              {
                name: "Used in",
                value: "Direct Messages"
              }
            ]
          }});
        } else if (message.channel.type === "group") {
          return logchannel.send({ embed: {
            color: 3447003,
            fields: [
              {
                name: "Command Used",
                value: cmd
              },
              {
                name: "Author",
                value: message.author.username
              },    
              {
                name: "Used in",
                value: `The ${message.channel.name} Group DM`
              }
            ]
          }});
        } else {
          return logchannel.send({ embed: {
            color: 3447003,
            fields: [
              {
                name: "Command Used",
                value: cmd
              },
              {
                name: "Author",
                value: message.author.username
              },
              {
                name: "Server",
                value: message.guild.name
              },
              {
                name: "Channel",
                value: `#${message.channel.name}`
              }
            ]
          }});
        }
      } else {
        if (message.channel.type === "dm") {
          return logchannel.send({ embed: {
            color: 3447003,
            fields: [
              {
                name: "Command Used",
                value: cmd
              },
              {
                name: "Author",
                value: message.author.username
              },
              {
                name: "Used in",
                value: "Direct Messages"
              },
              {
                name: "Arguments",
                value: trimmedArgs
              }
            ]
          }});
        } else if (message.channel.type === "group") {
          return logchannel.send({ embed: {
            color: 3447003,
            fields: [
              {
                name: "Command Used",
                value: cmd
              },
              {
                name: "Author",
                value: message.author.username
              },    
              {
                name: "Used in",
                value: `The ${message.channel.name} Group DM`
              },
              {
                name: "Arguments",
                value: trimmedArgs
              }
            ]
          }});
        } else {
          return logchannel.send({ embed: {
            color: 3447003,
            fields: [
              {
                name: "Command Used",
                value: cmd
              },
              {
                name: "Author",
                value: message.author.username
              },
              {
                name: "Server",
                value: message.guild.name
              },
              {
                name: "Channel",
                value: `#${message.channel.name}`
              },
              {
                name: "Arguments",
                value: trimmedArgs
              }
            ]
          }});
        }
      }
    }

    // commands
    if (command === "commands" || command === "help" || mentionMessage && mentionMessage.includes("commands") || mentionMessage && mentionMessage.includes("help")) {
      log(command);
      
      let pmsg = await message.channel.send("Generating...");
      message.author.send({ embed: {
        color: 3447003,
        description: "A list of all M.E.A.N.I.E.'s commands, (Mario Editor Assistant New Intelligent Edition), a bot created by <@107944323454074880> that helps in automating various Mario editor and Discord actions.\n\n**Want to add me to your server? You can do so with the link below:**\nhttps://discordapp.com/oauth2/authorize?client_id=242866547771703296&scope=bot&permissions=1342185472\n\n***Current Command Prefix: " + config.prefix + "***",
        fields: [
          {
            name: "---------- Basic Bot Commands ----------",
            value: "These are very basic commands that pertain to me."
          },
          {
            name: config.prefix + "commands or " + config.prefix + "help",
            value: "Gives you this list of my commands."
          },
          {
            name: config.prefix + "say",
            value: "A command used to make me say whatever you want."
          },
          {
            name: config.prefix + "invite",
            value: "An easy way to get the invite link that is used to add me to your server."
          },
          {
            name: config.prefix + "test or " + config.prefix + "ping",
            value: "Tests to see if I'm currently working, and lists different latency statistics."
          },
          {
            name: "---------- LP Site/SMF/SMC Commands ----------",
            value: "These commands are used to automate various actions on the Level Palace site, or with Super Mario Flash/Super Mario Construct."
          },
          // {
          //   name: config.prefix + "contestresults",
          //   value: "**TEMPORARY**\nShows results from the latest LP contest!"
          // },
          {
            name: config.prefix + "lpstatus or " + config.prefix + "islpup",
            value: "Tests to see if Level Palace is currently up or not."
          },
          {
            name: config.prefix + "user/" + config.prefix + "finduser/" + config.prefix + "member/" + config.prefix + "findmember/" + config.prefix + "profile/" + config.prefix + "findprofile",
            value: "Lets you search for an LP user and links you to their profile if found. Also gives various information about them."
          },
          {
            name: config.prefix + "iduser/" + config.prefix + "idfinduser/" + config.prefix + "idmember/" + config.prefix + "idfindmember/" + config.prefix + "idprofile/" + config.prefix + "idfindprofile",
            value: "Lets you search for an LP user via ID and links you to their profile if found. Also gives various information about them."
          },
          // {
          //   name: config.prefix + "checkir or " + config.prefix + "ir",
          //   value: "Checks to see if Intensive Rating, (IR), is currently active or not."
          // },
          {
            name: config.prefix + "numpending or " + config.prefix + "pending",
            value: "Tells you how many levels are currently in Pending."
          },
          // {
          //   name: config.prefix + "ratesleft or " + config.prefix + "votesleft",
          //   value: "Calculates the remaining number of votes needed in order to clear out all of the levels in Pending."
          // },
          // {
          //   name: config.prefix + "levelinfo or " + config.prefix + "pendinginfo",
          //   value: "Checks the Pending section, and calculates the number of votes needed in order to clear out all of the levels."
          // },
          {
            name: config.prefix + "randompending or " + config.prefix + "randomlevel",
            value: "Randomly picks out a level from Pending for you to rate if there are any, and displays various information about it."
          },
          {
            name: config.prefix + "game or " + config.prefix + "lpgame",
            value: "Links any valid LP game that you specify."
          },
          {
            name: config.prefix + "level or " + config.prefix + "levelsearch",
            value: "Lets you search for an LP level and links you to it if found. Also lists up to 10 other possible matches if there are any, and lets you pick the one you want.\n\n***Note:*** *Due to the nature of this command, it does not find private levels. If you do wish to find a level with this condition, however, use the ID version of this command instead.*"
          },
          {
            name: config.prefix + "idlevel or " + config.prefix + "idlevelsearch",
            value: "Lets you search for an LP level via ID and links you to it if found."
          },
          // {
          //   name: config.prefix + "mp3 or " + config.prefix + "yt2mp3",
          //   value: "Converts a passed in YouTube video link or ID into an MP3 for you to use as Super Mario Flash custom music."
          // },
          {
            name: "---------- LP Wiki Commands ----------",
            value: "These commands are used to automate various actions on the Level Palace wiki."
          },
          {
            name: config.prefix + "wiki or " + config.prefix + "wikisearch",
            value: "Lets you search for any article on the LP wiki and links you to it if found. Also shows up to 500 characters of a page description if one is found. Enter \"random\" as the article name for me to fetch a random article."
          },
          {
            name: "---------- Discord-related Commands ----------",
            value: "These commands are used to automate various Discord-related actions."
          },
          {
            name: config.prefix + "color or " + config.prefix + "colour",
            value: "Adds a specified color role to you, and removes your previous one, if one exists. To generate a random color role, enter \"random\" as the color, and to remove your current color role, enter \"remove\" as the color.\n\n***Note:*** *This command may not work as intended in your server if you have a lot of colored roles that you assign to users.*"
          },
          {
            name: config.prefix + "clean",
            value: "**USER NEEDS MANAGE MESSAGES PERMISSION**\nDeletes specified messages that are sent by me in the current channel of a server."
          },
          {
            name: config.prefix + "clear",
            value: "**USER NEEDS MANAGE MESSAGES PERMISSION**\nDeletes specified messages from a channel. Can be specified by either a certain user, a number of messages to delete, or both."
          },
          {
            name: config.prefix + "addemoji",
            value: "**USER NEEDS MANAGE EMOJIS PERMISSION**\nAdds an emoji to a server."
          },
          {
            name: config.prefix + "delemoji or " + config.prefix + "rememoji",
            value: "**USER NEEDS MANAGE EMOJIS PERMISSION**\nDeletes an emoji from a server based on either a name or ID."
          },
          {
            name: config.prefix + "emojislots or " + config.prefix + "emoteslots/" + config.prefix + "pinslots/" + config.prefix + "roleslots",
            value: "Tells you how many emoji, pin, or role slots are remaining in a server, (or DM or Group DM if using " + config.prefix + "emojislots), depending on which command you use."
          }
        ]
      }}).then(msg => {
        // cover for Discord latency
        setTimeout(function() {
          console.log(`My command list was sent to ${message.author.username} via Direct Message.`);
          if (message.channel.type !== "dm") pmsg.edit("My command list has been sent to you via Direct Message!");
          else pmsg.delete();
        }, 1000);
      }).catch(err => {
        console.error(`My command list was failed to be sent to ${message.author.username} via Direct Message.`);
        pmsg.edit("**An error occurred while trying to send a Direct Message:**```" + err + "```");
      });
    }

    else if (command === "setprefix" || command === "prefix") {
      if (message.author.id !== config.creatorid) {
        let denymsg = await message.channel.send("You are not allowed to use this command!");
        return denymsg.delete(5000);
      }
      if (!args) return message.channel.send("You need to include a command prefix!");
      if (args.includes(" ")) return message.channel.send("Your command prefix must not include spaces!");
      if (args === config.prefix) return message.channel.send("That is already my command prefix!");

      args = args.replace(/"/g, '\\"');
      args = args.replace(/`/g, '\\`');

      message.channel.send(`My command prefix has now been changed to **${args}**!`, { split: true })
      .then(function() {
        console.log(`My command prefix was changed to "${args}".`);
        fs.writeFile("./config.json", `{ "prefix": "${args}", "creatorid": "${config.creatorid}"}`, err => {
          if (err) throw err;
        });
      }).catch(err => {
        console.error(`An error occurred while trying to send a message:\n${err}`);
        return message.channel.send("**An error occurred while trying to send a message:**```" + err + "```");
      });
    }

    // else if (command === "banplumes") {
    //   if (message.author.id !== config.creatorid) return;
      
    //   message.guild.ban("339467371981045761").catch(console.error);
    //   message.guild.ban("339542563105144834").catch(console.error);
    //   message.guild.ban("402903141097537538").catch(console.error);
    //   message.guild.ban("315189616884056064").catch(console.error);
    //   message.guild.ban("405764980898791426").catch(console.error);
    //   message.guild.ban("405772963795828739").catch(console.error);
    //   message.guild.ban("405775816438579210").catch(console.error);
    //   message.guild.ban("326983588954505216").catch(console.error);
    //   message.guild.ban("337021712434462720").catch(console.error);
    //   message.guild.ban("397958778550747146").catch(console.error);
    //   message.guild.ban("275023064851546113").catch(console.error);
    //   message.guild.ban("148564483122528265").catch(console.error);
    //   message.guild.ban("397145235496370186").catch(console.error);
      

    //   message.channel.send("Banned all Plume accounts.");
    // }

    // else if (command === "unbanplumes") {
    //   if (message.author.id !== config.creatorid) return;

    //   message.guild.unban("339467371981045761").catch(console.error);
    //   message.guild.unban("339542563105144834").catch(console.error);
    //   message.guild.unban("402903141097537538").catch(console.error);
    //   message.guild.unban("315189616884056064").catch(console.error);
    //   message.guild.unban("405764980898791426").catch(console.error);
    //   message.guild.unban("405772963795828739").catch(console.error);
    //   message.guild.unban("405775816438579210").catch(console.error);
    //   message.guild.unban("326983588954505216").catch(console.error);
    //   message.guild.unban("337021712434462720").catch(console.error);
    //   message.guild.unban("397958778550747146").catch(console.error);
    //   message.guild.unban("275023064851546113").catch(console.error);
    //   message.guild.unban("148564483122528265").catch(console.error);
    //   message.guild.unban("397145235496370186").catch(console.error);

    //   message.channel.send("Unbanned all Plume accounts.");
    // }

    else if (command === "addactivity" || command === "botactivity") {
      let activities = JSON.parse(fs.readFileSync("./activities.json"));
      let botActivity;
      let activityType;

      if (!args) return message.channel.send("You need to include an activity with an activity type for me to add!");
      if (!args.includes("|")) return message.channel.send("**Usage:**```" + config.prefix + "addactivity/" + config.prefix + "botactivity [Activity for me to add] | [Activity type for me to add] (Either 0, 1, 2, 3, or what they represent)```*Activity type 0 = \"Playing...\"\nActivity type 1 = \"Streaming...\"\nActivity type 2 = \"Listening...\"\nActivity type 3 = \"Watching...\"*");

      botActivity = args.split("|")[0].trim();
      activityType = args.split("|")[1].replace(/\s/g, "").toLowerCase();

      if (message.author.id !== config.creatorid) {
        let denymsg = await message.channel.send("You are not allowed to use this command!");
        return denymsg.delete(5000);
      }
      
      if (!botActivity || !activityType || args.replace(/\s/g, "").toLowerCase() === "usage") return message.channel.send("**Usage:**```" + config.prefix + "addactivity/" + config.prefix + "botactivity [Activity for me to add] | [Activity type for me to add] (Either 0, 1, 2, 3, or what they represent)```*Activity type 0 = \"Playing...\"\nActivity type 1 = \"Streaming...\"\nActivity type 2 = \"Listening...\"\nActivity type 3 = \"Watching...\"*");
      if (activityType && !/^0+$/.test(activityType) && parseInt(activityType) !== 1 && parseInt(activityType) !== 2 && parseInt(activityType) !== 3 && activityType !== "playing" && activityType !== "streaming" && activityType !== "listening" && activityType !== "watching") return message.channel.send("The only valid activity types are **PLAYING**, **STREAMING**, **LISTENING**, and **WATCHING**! (**0**, **1**, **2**, and **3**)");

      // convert input to valid types
      if (activityType === "0" || activityType === "playing") activityType = "PLAYING";
      if (activityType === "1" || activityType === "streaming") activityType = "STREAMING";
      if (activityType === "2" || activityType === "listening") activityType = "LISTENING";
      if (activityType === "3" || activityType === "watching") activityType = "WATCHING";

      // check to see if the specified activity along with the same activity type are already added
      if (activities[botActivity] && activities[botActivity].activitytype === activityType) return message.channel.send("That activity with that activity type is already added to me!");

      args = args.replace(/"/g, '\\"');
      args = args.replace(/`/g, '\\`');

      if (activities[botActivity] && activities[botActivity].activitytype !== activityType) {
        // change activity type of existing activity
        message.channel.send(`The activity type of **${botActivity}** has now been changed to **${activityType}!**`, { split: true })
        .then(function() {
          console.log(`The activity type of "${botActivity}" has been changed to ${activityType}.`);
          activities[botActivity] = {
            "botactivity" : botActivity,
            "activitytype" : activityType
          };
          fs.writeFile("./activities.json", JSON.stringify(activities), err => {
            if (err) console.log(err);
          });
        }).catch(err => {
          console.error(`An error occurred while trying to send a message:\n${err}`);
          return message.channel.send("**An error occurred while trying to send a message:**```" + err + "```");
        });
      } else {
        // add activity with activity type
        message.channel.send(`The activity **${botActivity}** with activity type **${activityType}** has been added!`, { split: true })
        .then(function() {
          console.log(`The activity "${botActivity}" with activity type ${activityType} was added.`);
          activities[botActivity] = {
            "botactivity" : botActivity,
            "activitytype" : activityType
          };
          fs.writeFile("./activities.json", JSON.stringify(activities), err => {
            if (err) console.log(err);
          });
        }).catch(err => {
          console.error(`An error occurred while trying to send a message:\n${err}`);
          return message.channel.send("**An error occurred while trying to send a message:**```" + err + "```");
        });
      }
    }

    else if (command === "delactivity" || command === "remactivity") {
      // variable declarations
      let activities = JSON.parse(fs.readFileSync("./activities.json"));
      let botActivity;

      if (!args) return message.channel.send("You need to include an activity for me to remove!");

      botActivity = args.trim();

      if (message.author.id !== config.creatorid) {
        let denymsg = await message.channel.send("You are not allowed to use this command!");
        return denymsg.delete(5000);
      }
      
      if (args.replace(/\s/g, "").toLowerCase() === "usage") return message.channel.send("**Usage:**```" + config.prefix + "delactivity/" + config.prefix + "remactivity [Activity for me to remove] (Activity type will be obtained automatically)```");

      args = args.replace(/"/g, '\\"');
      args = args.replace(/`/g, '\\`');

      // check to see if the specified activity is added and can be removed
      if (!activities[botActivity]) return message.channel.send("That activity is not currently added to me!");

      // remove activity
      message.channel.send(`The activity **${botActivity}** with activity type **${activities[botActivity].activitytype}** has been removed!`, { split: true })
      .then(function() {
        console.log(`The activity "${botActivity}" with activity type ${activities[botActivity].activitytype} was removed.`);
        delete activities[botActivity];
        fs.writeFile("./activities.json", JSON.stringify(activities), err => {
          if (err) console.log(err);
        });
      }).catch(err => {
        console.error(`An error occurred while trying to send a message:\n${err}`);
        return message.channel.send("**An error occurred while trying to send a message:**```" + err + "```");
      });
    }

    else if (command === "clearpins") {
      if (message.author.id !== config.creatorid) {
        let denymsg = await message.channel.send("You are not allowed to use this command!");
        return denymsg.delete(5000);
      }

      let channel = client.channels.cache.find(c => c.id === "325490421419606016");

      channel.fetchPinnedMessages().then(pins => {
        pins.forEach(function (pin) {
           pin.unpin().catch(err => {
            console.error(`An error occurred while trying to unpin a message:\n${err}`);
            message.channel.send("**An error occurred while trying to unpin a message:**```" + err + "```");
          });
        });

        if (message.channel.id !== "325490421419606016") message.channel.send("All pins cleared in <#325490421419606016>!");
        channel.send("All the pins are being cleared out to make room for new ones, and will all be unpinned shortly!");
      }).catch(err => {
        console.error(`An error occurred while trying to fetch pinned messages:\n${err}`);
        message.channel.send("**An error occurred while trying to fetch pinned messages:**```" + err + "```");
      });
    }

    // else if (command === "starboard") {
    //   if (message.channel.type === "dm" || message.channel.type === "group") return;
    //   if (message.guild.id !== "325490421419606016") return;
    //   if (message.channel.id === "326576626097979402" || message.channel.id === "325496108467879956" || message.channel.id === "357386246793723905" || message.channel.id === "414852683292213253" || message.channel.id === "468472403199000576" || message.channel.id === "456626411910856706" || message.channel.id === "456626483654557698" || message.channel.id === "455993305067683840" || message.channel.id === "454493943426449408" || message.channel.id === "399778380398198784" || message.channel.id === "392421139089063937" || message.channel.id === "325495534896807936" || message.channel.id === "325495670502850560" || message.channel.id === "334144051706331136" || message.channel.id === "330810124757368832") return message.channel.send("You cannot starboard messages from this channel!");
    //   if (!message.member.hasPermission("MANAGE_MESSAGES")) {
    //     return message.channel.send("You need the **Manage Messages** permission in order to use this command!").then(msg => {
    //       msg.delete(5000);
    //       // if (message.deletable && message.guild.me.hasPermission("MANAGE_MESSAGES")) message.delete(5000);
    //     });
    //   }

    //   log(command);
    //   args = args.replace(/\s/g, "").toLowerCase();

    //   // constant declarations
    //   const starChannel = client.channels.cache.find(c => c.id === "468472403199000576");
    //   const fetchedMessages = await starChannel.messages.fetch({ limit: 100 });
    //   const stars = fetchedMessages.find(m => m.embeds[0] && m.embeds[0].footer.text.startsWith('⭐') && m.embeds[0].footer.text.endsWith(args));

    //   // if statement checks
    //   if (!args) return message.channel.send("You must include an ID of a message for me to starboard that is no more than 100 messages older than yours, and that is from this channel!");
    //   if (args === "usage") return message.channel.send("**Usage:**\n```" + config.prefix + "starboard [ID of message for me to starboard]```\n\n***Note: Your message ID must be of a message that is no more than 100 messages older than yours, and must also be from this channel, due to Discord limitations.***");
    //   if (isNaN(args)) return message.channel.send("Please enter a numeric message ID!");
    //   if (args.length < 15 || args.length > 100) return message.channel.send("Please enter a message ID consisting of more than 15 digits, but less than 100 digits!");

    //   // check to see if the message is already in the starboard or not
    //   if (stars) {
    //     console.log(`${message.author.tag} tried to starboard a message that was already starboarded in #${message.channel.name} of ${message.guild.name}.`);
    //     message.channel.send("That message is already starboarded!");
    //   } else {
    //     let starMsg = await message.channel.messages.fetch({ limit: 100 }).catch(err => {
    //       console.error(`An error occurred while trying to fetch messages in #${message.channel.name} of ${message.guild.name}:\n${err}`);
    //       return message.channel.send("**An error occurred while trying to fetch messages:**```" + err + "```");
    //     });
    //     starMsg = starMsg.find(m => m.id === args);

    //     if (starMsg) {
    //       const image = starMsg.attachments.size > 0 ? await extension(starMsg.attachments.array()[0].url) : '';
    //       if (image === '' && starMsg.cleanContent.length < 1) return;
      
    //       await starChannel.send({ embed: {
    //         color: 0xfdaa30,
    //         description: starMsg.cleanContent,
    //         author: {
    //           name: starMsg.author.tag + ` in #${starMsg.channel.name} (Starboarded by ${message.author.tag})`,
    //           url: starMsg.url,
    //           icon_url: starMsg.author.displayAvatarURL()
    //         },
    //         timestamp: new Date(),
    //         footer: {
    //           text: `⭐ ❌ | ${starMsg.id}`
    //         },
    //         image: {
    //           url: image
    //         }
    //       }});
    //       //   .setColor(0xfdaa30)
    //       //   .setDescription(starMsg.cleanContent)
    //       //   .setAuthor(starMsg.author.tag, starMsg.author.displayAvatarURL())
    //       //   .setTimestamp(new Date())
    //       //   .setFooter(`⭐ ❌ | ${starMsg.id}`)
    //       //   .setImage(image);
    //       // await starChannel.send({ embed });
    //       console.log(`${message.author.tag} starboarded a message with an ID of ${args} in #${message.channel.name} of ${message.guild.name}.`);
    //       message.channel.send(`The message with an ID of **${args}** has been starboarded!`);
    //     } else {
    //       console.log(`${message.author.tag} tried to starboard a message that didn't exist in #${message.channel.name} of ${message.guild.name}.`);
    //       message.channel.send("That message either doesn't exist, isn't from this channel, or is more than 100 messages older than yours!");
    //     }
    //   }
    // }

    else if (command === "invite") {
      log(command);

      if (message.channel.type === "dm") {
        console.log(`${message.author.tag} requested my invite link in DMs.`);
      } else if (message.channel.type === "group") {
        console.log(`${message.author.tag} requested my invite link in the ${message.channel.name} Group DM.`);
      } else {
        console.log(`${message.author.tag} requested my invite link in #${message.channel.name} of ${message.guild.name}.`);
      }
      message.channel.send("**Invite me to your server with the link below:**\nhttps://discordapp.com/oauth2/authorize?client_id=242866547771703296&scope=bot&permissions=1342185472");
    }

    else if (command === "restart") {
      if (message.author.id !== config.creatorid) {
        let denymsg = await message.channel.send("You are not allowed to use this command!");
        return denymsg.delete(5000);
      }

      let pmsg = await message.channel.send("Restarting...");

      client.destroy().then(function() {
        client.login().then(token => {
          pmsg.edit("Successfully restarted!");
        });
      });
    }

    else if (command === "die" || command === "stop" || command === "kill") {
      if (message.author.id !== config.creatorid) {
        let denymsg = await message.channel.send("You are not allowed to use this command!");
        return denymsg.delete(5000);
      }

      message.channel.send("Until next time! :wave:").then(msg => {
        client.destroy();
      });
    }

    else if (command === "test" || command === "ping") {
      log(command);

      message.channel.send("Test!").then(msg => {
        if (message.channel.type === "dm") {
          console.log(`I was tested to see if I was online or not by ${message.author.username} in DMs. My latency was ${msg.createdTimestamp - message.createdTimestamp}ms, and my API latency was ${Math.round(client.ping)}ms!`);
        } else if (message.channel.type === "group") {
          console.log(`I was tested to see if I was online or not by ${message.author.username} in the ${message.channel.name} Group DM. My latency was ${msg.createdTimestamp - message.createdTimestamp}ms, and my API latency was ${Math.round(client.ping)}ms!`);
        } else {
          console.log(`I was tested to see if I was online or not by ${message.author.username} in #${message.channel.name} of ${message.guild.name}. My latency was ${msg.createdTimestamp - message.createdTimestamp}ms, and my API latency was ${Math.round(client.ping)}ms!`);
        }
        msg.edit(`__***Stats:***__\n\n**LATENCY:** ${msg.createdTimestamp - message.createdTimestamp}ms.\n**API LATENCY:** ${Math.round(client.ws.ping)}ms.`);
      });
    }

    else if (command === "say") {
      if (args === "You are not allowed to use this command!" && message.author.id !== config.creatorid || args === "You are not allowed to use this command here!" && message.author.id !== config.creatorid || args === "You are not aIIowed to use this command here!" && message.author.id !== config.creatorid) return message.channel.send("Stop trying to be funny, even MB has a better sense of humor than you.");
      if (message.author.id !== config.creatorid && message.guild && message.guild.id === "325490421419606016") {
        let denymsg = await message.channel.send("You are not allowed to use this command here!");
        return denymsg.delete(5000);
      }
      if (!args) return message.channel.send("You must include something for me to say!");
      if (args.length > 1500) return message.channel.send("Please enter a message consisting of 1500 characters or less!");

      log(command);

      message.channel.send(args, { split: true }).then(msg => {
        if (message.channel.type === "dm") {
          console.log(`I said "${args}" to ${message.author.username} in DMs.`);
        } else if (message.channel.type === "group") {
          console.log(`I said "${args}" to ${message.author.username} in the ${message.channel.name} Group DM.`);
        } else {
          console.log(`I said "${args}" to ${message.author.username} in #${message.channel.name} of ${message.guild.name}.`);
        }
      }).catch(err => {
        console.error(`An error occurred while trying to send a message:\n${err}`);
        return message.channel.send("**An error occurred while trying to send a message:**```" + err + "```");
      });
    }

    else if (command === "gensay") {
      if (message.author.id !== config.creatorid) return;
      if (!args) return message.channel.send("You must include something for me to say in <#325490421419606016>!");

      let channel = client.channels.cache.find(c => c.id === "325490421419606016");
      channel.send(args);
    }

    else if (command  === "setavatar" || command === "setpfp") {
      if (message.author.id !== config.creatorid) return;
      if (!args) return message.channel.send("You must include an avatar link!");
      
      args = args.replace(/\s/g, "");
      if (!args.toLowerCase().endsWith(".png") && !args.toLowerCase().endsWith(".gif") && !args.toLowerCase().endsWith(".jpg") && !args.toLowerCase().endsWith(".jpeg") && !args.toLowerCase().endsWith(".tiff")) return message.channel.send("That is not a valid image link!");

      let pmsg = await message.channel.send("Changing avatar...");

      urlExists(args, function(err, exists) {
        if (!err) {
          if (exists) {
            client.user.setAvatar(args).then(user => {
              pmsg.edit("Avatar set!");
            }).catch(err => {
              pmsg.edit("**An error occurred while trying to set my avatar:**```" + err + "```");
            });
          } else {
            pmsg.edit("The URL specified is not a valid image!");
          }
        } else {
          pmsg.edit("An error occurred while trying to verify whether or not your image link was valid. Please try again.");
        }
      });
    }

    else if (command  === "setusername" || command === "setname") {
      if (message.author.id !== config.creatorid) return;
      if (!args) return message.channel.send("You must include a username!");
      
      let pmsg = await message.channel.send("Changing username...");

      client.user.setUsername(args).then(user => {
        pmsg.edit(`Username set to **${user.username}**!`);
      }).catch(err => {
        pmsg.edit("**An error occurred while trying to set my username:**```" + err + "```");
      });
    }

    // else if (command === "contestresults") {
    //   console.log(`I have sent the 2nd Annual LP Contest Results to ${message.author.username}!`);
    //   message.channel.send("__**2nd Annual LP Contest Results:**__\n\n**#1:** Popthatcorn14 | 95%\n**#2:** TheBlackKoopa232 | 91.6%\n**#3:** LazorCozmic5 | 91.3%\n**#4:** creator | 91%\n**#5:** Luigibonus | 84.6%\n**#6:** Mario Blight | 84%\n**#7:** 1 Up Shroom | 83.3%\n**#8:** Ubfunkeys7 | 83%\n**#9:** ElectricPenguin | 81.7%\n**#10:** Parbounli | 78.3%\n**#11:** Leer201 | 78.3%\n**#12:** Laser | 72.3%\n**#13:** Mario00000000 | 70.7%\n**#14:** Blue Meowstic | 69.3%\n**#15:** Q22 | 68.3%\n**#16:** PrzemekXD | 67%\n**#17:** Softendo | 53.3%\n**#18:** tranvucam | 50.3%\n**#19:** Nathan nathan | 49.7%\n**#20:** Ernesdo | 48.7%\n**#21:** Filip Underwood | 43.3%\n**#22:** cyanide4376 | 36.6%\n**#23:** BusteRalph | 23.3%\n**#24:** Waluigi68 | 20.3%\n**#25:** Nitrogamer | 18.6%\n**#26:** ForeverAlone | 7.6%\n**#27:** Plume 4.0 | 1%");
    // }

    else if (command === "islpup" || command === "lpstatus") {
      if (message.guild && message.guild.id === "752287527473381419") return;

      log(command);

      let pmsg = await message.channel.send("Checking LP's status...");

      // check LP's current status
      request({ uri: "https://www.levelpalace.com/", timeout: 10000, time: true, headers: { "User-Agent": "lp-helper" } }, function(err, resp, body) {
        if (!err && resp.statusCode === 200) {
          let $ = cheerio.load(body);

          if ($("div.navbar-fixed").length > 0) {
            if (message.channel.type === "dm") {
              console.log(`Level Palace was reported as being up by ${message.author.username} in DMs.`);
            } else if (message.channel.type === "group") {
              console.log(`Level Palace was reported as being up by ${message.author.username} in the ${message.channel.name} Group DM.`);
            } else {
              console.log(`Level Palace was reported as being up by ${message.author.username} in #${message.channel.name} of ${message.guild.name}.`);
            }
            pmsg.edit(`Level Palace is currently **up**, with a response time of **${resp.elapsedTime}ms**.`);
          } else {
            if (message.channel.type === "dm") {
              console.log(`Level Palace was reported as being down by ${message.author.username} in DMs.`);
            } else if (message.channel.type === "group") {
              console.log(`Level Palace was reported as being down by ${message.author.username} in the ${message.channel.name} Group DM.`);
            } else {
              console.log(`Level Palace was reported as being down by ${message.author.username} in #${message.channel.name} of ${message.guild.name}.`);
            }
            pmsg.edit("Level Palace is currently **down**.");
          }
        } else {
          if (message.channel.type === "dm") {
            console.log(`Level Palace was reported as being down by ${message.author.username} in DMs.`);
          } else if (message.channel.type === "group") {
            console.log(`Level Palace was reported as being down by ${message.author.username} in the ${message.channel.name} Group DM.`);
          } else {
            console.log(`Level Palace was reported as being down by ${message.author.username} in #${message.channel.name} of ${message.guild.name}.`);
          }
          pmsg.edit("Level Palace is currently **down**.");
        }
      });
    }

    else if (command === "user" || command === "finduser" || command === "member" || command === "findmember" || command === "profile" || command === "findprofile") {
      // if (message.author.id !== config.creatorid) return message.channel.send("Under construction, please wait.");
      if (message.guild && message.guild.id === "752287527473381419") return;
      
      if (!args) return message.channel.send("You must include a user to find!");
      if (args.length > 100) return message.channel.send("Please enter a username consisting of 100 characters or less!");

      args = args.replace(/"/g, '\\"');
      args = args.replace(/`/g, '\\`');
      let userName = encodeURIComponent(args.trim());
      let userinfo = [];

      log(command);

      let pmsg = await message.channel.send("Finding user...");

      // search for user(s) on members page
      request({ uri: `https://www.levelpalace.com/profile?user=${userName}`, timeout: 10000, headers: { "User-Agent": "lp-helper" } }, function(err, resp, body) {
        if (!err && resp.statusCode === 200) {
          let $ = cheerio.load(body);

          if ($("div.navbar-fixed").length === 0) return pmsg.edit("Level Palace is currently **down**, and so this command will not work properly right now. Please try again later!");

          // let userlinks = [];
          // let names = [];
          // gather up to 10 members from the member search page
          // if ($("td:contains('No members found.')").length === 0) {
          //   $("tr", "div.table-container").each(function() {
          //     if ($(this).find("td").length > 0) {
          //       if (names.length <= 9) {
          //         let profilelink = $(this).find("td").find("a[href*='profile']").attr("href");
          //         userlinks.push(profilelink);
          //         let name = $(this).find("td").find("a").text().trim();
          //         names.push(name);
          //       }
          //     }
          //   });
          // }

          // run certain code based on how many members were found on the members page
          // if (names.length === 0) {
          //   if (message.channel.type === "dm") {
          //     console.log(`A user by the name of "${args.trim()}" was failed to be found by ${message.author.username} in DMs.`);
          //   } else if (message.channel.type === "group") {
          //     console.log(`A user by the name of "${args.trim()}" was failed to be found by ${message.author.username} in the ${message.channel.name} Group DM.`);
          //   } else {
          //     console.log(`A user by the name of "${args.trim()}" was failed to be found by ${message.author.username} in #${message.channel.name} of ${message.guild.name}.`);
          //   }
          //   pmsg.edit(`No LP user was found with the name: **${args.trim()}**! Please try again.`).catch(err => {
          //     pmsg.edit("**An error occurred while trying to edit this message:**```" + err + "```");
          //   });
          // } else if (names.length === 1) {
            // request({ uri: `https://www.levelpalace.com/profile?user=${userName}`, timeout: 10000, headers: { "User-Agent": "lp-helper" } }, function(err, resp, body) {
            //   if (!err && resp.statusCode === 200) {
            //     let $ = cheerio.load(body);

                // if ($("div.navbar-fixed").length === 0) return pmsg.edit("Level Palace is currently **down**, and so this command will not work properly right now. Please try again later!");

                if ($("div.page-banner").length > 0) {
                  $(".card-title", ".profile-banner").each(function() {
                    let stat = $(this).text().trim() || $("img.tooltipped").attr("alt").toLowerCase();
                    userinfo.push(stat);
                  });
                  $(".subtitle", ".profile-banner").each(function() {
                    let status = $(this).text().trim();
                    userinfo.push(status);
                  });
                  $("a[href*='rates?user_id=']", ".profile-banner").each(function() {
                    let link = $(this).attr("href").substring(14);
                    userinfo.push(link);
                  });
                  $("div", ".profile-user-icon").each(function() {
                    let avatar = $(this).attr("style").trim().split(")")[0].slice(22);
                    if (avatar.startsWith("files") || avatar.startsWith("images")) avatar = "https://www.levelpalace.com/" + avatar;
                    urlExists(avatar, function(err, exists) {
                      if (!err) {
                        if (!exists) {
                          avatar = "https://i.imgur.com/2E8BWdV.png";
                        }
                      } else {
                        avatar = "https://i.imgur.com/2E8BWdV.png";
                      }
                    });
                    userinfo.push(avatar);
                  });

                  if (message.channel.type === "dm") {
                    console.log(`A user by the name of "${args.trim()}" was found by ${message.author.username} in DMs.`);
                  } else if (message.channel.type === "group") {
                    console.log(`A user by the name of "${args.trim()}" was found by ${message.author.username} in the ${message.channel.name} Group DM.`);
                  } else {
                    console.log(`A user by the name of "${args.trim()}" was found by ${message.author.username} in #${message.channel.name} of ${message.guild.name}.`);
                  }
                  if (userinfo[6] === "NOW") {
                    if (userinfo[5] === "?") {
                      pmsg.edit({ content: "Here is the user I found:", embed: {
                        color: 3447003,
                        thumbnail: {
                          url: userinfo[userinfo.length - 1]
                        },
                        fields: [
                          {
                            name: "Username",
                            value: userinfo[0],
                            inline: true
                          },
                          {
                            name: "Status",
                            value: userinfo[7],
                            inline: true
                          },
                          {
                            name: "User ID",
                            value: userinfo[14],
                            inline: true
                          },
                          {
                            name: "XP Rank",
                            value: userinfo[1],
                            inline: true
                          },
                          {
                            name: "Levels",
                            value: userinfo[2],
                            inline: true
                          },
                          {
                            name: "Rates",
                            value: userinfo[3],
                            inline: true
                          },
                          {
                            name: "Friends",
                            value: userinfo[4],
                            inline: true
                          },
                          {
                            name: "Location",
                            value: "Unknown",
                            inline: true
                          },
                          {
                            name: "Online",
                            value: ":white_check_mark:",
                            inline: true
                          },
                          {
                            name: "Links to Profile",
                            value: `<https://www.levelpalace.com/profile?user=${encodeURIComponent(userinfo[0])}>\n<https://www.levelpalace.com/profile?user_id=${userinfo[14]}>`,
                            inline: true
                          }
                        ]
                      }}).catch(err => {
                        pmsg.edit("**An error occurred while trying to edit this message:**```" + err + "```");
                      });

                      // pmsg.edit(`User found!\n\n**${userinfo[0]}** (**${userinfo[8]}**), has an XP rank of **${userinfo[1]}**, **${userinfo[2]}** level(s), **${userinfo[3]}** rate(s), **${userinfo[4]}** friend(s), has an unknown location, and is currently online!\n\nHere's the link to their profile:\n<https://www.levelpalace.com/profile?user=${encodeURIComponent(userinfo[0])}>`).catch(err => {
                      //   pmsg.edit("**An error occurred while trying to edit this message:**```" + err + "```");
                      // });
                    } else {
                      pmsg.edit({ content: "Here is the user I found:", embed: {
                        color: 3447003,
                        thumbnail: {
                          url: userinfo[userinfo.length - 1]
                        },
                        fields: [
                          {
                            name: "Username",
                            value: userinfo[0],
                            inline: true
                          },
                          {
                            name: "Status",
                            value: userinfo[7],
                            inline: true
                          },
                          {
                            name: "User ID",
                            value: userinfo[14],
                            inline: true
                          },
                          {
                            name: "XP Rank",
                            value: userinfo[1],
                            inline: true
                          },
                          {
                            name: "Levels",
                            value: userinfo[2],
                            inline: true
                          },
                          {
                            name: "Rates",
                            value: userinfo[3],
                            inline: true
                          },
                          {
                            name: "Friends",
                            value: userinfo[4],
                            inline: true
                          },
                          {
                            name: "Location",
                            value: `:flag_${userinfo[5].toLowerCase()}:`,
                            inline: true
                          },
                          {
                            name: "Online",
                            value: ":white_check_mark:",
                            inline: true
                          },
                          {
                            name: "Links to Profile",
                            value: `<https://www.levelpalace.com/profile?user=${encodeURIComponent(userinfo[0])}>\n<https://www.levelpalace.com/profile?user_id=${userinfo[14]}>`,
                            inline: true
                          }
                        ]
                      }}).catch(err => {
                        pmsg.edit("**An error occurred while trying to edit this message:**```" + err + "```");
                      });

                      // pmsg.edit(`User found!\n\n**${userinfo[0]}** (**${userinfo[8]}**), has an XP rank of **${userinfo[1]}**, **${userinfo[2]}** level(s), **${userinfo[3]}** rate(s), **${userinfo[4]}** friend(s), lives in :flag_${userinfo[5].toLowerCase()}:, and is currently online!\n\nHere's the link to their profile:\n<https://www.levelpalace.com/profile?user=${encodeURIComponent(userinfo[0])}>`).catch(err => {
                      //   pmsg.edit("**An error occurred while trying to edit this message:**```" + err + "```");
                      // });
                    }
                  } else if (userinfo[6].endsWith("AM") || userinfo[6].endsWith("PM")) {
                    if (userinfo[5] === "?") {
                      pmsg.edit({ content: "Here is the user I found:", embed: {
                        color: 3447003,
                        thumbnail: {
                          url: userinfo[userinfo.length - 1]
                        },
                        fields: [
                          {
                            name: "Username",
                            value: userinfo[0],
                            inline: true
                          },
                          {
                            name: "Status",
                            value: userinfo[7],
                            inline: true
                          },
                          {
                            name: "User ID",
                            value: userinfo[14],
                            inline: true
                          },
                          {
                            name: "XP Rank",
                            value: userinfo[1],
                            inline: true
                          },
                          {
                            name: "Levels",
                            value: userinfo[2],
                            inline: true
                          },
                          {
                            name: "Rates",
                            value: userinfo[3],
                            inline: true
                          },
                          {
                            name: "Friends",
                            value: userinfo[4],
                            inline: true
                          },
                          {
                            name: "Location",
                            value: "Unknown",
                            inline: true
                          },
                          {
                            name: "Online :x:",
                            value: `**Last Online:**\n${userinfo[6]} (EST/EDT)`,
                            inline: true
                          },
                          {
                            name: "Links to Profile",
                            value: `<https://www.levelpalace.com/profile?user=${encodeURIComponent(userinfo[0])}>\n<https://www.levelpalace.com/profile?user_id=${userinfo[14]}>`,
                            inline: true
                          }
                        ]
                      }}).catch(err => {
                        pmsg.edit("**An error occurred while trying to edit this message:**```" + err + "```");
                      });

                      // pmsg.edit(`User found!\n\n**${userinfo[0]}** (**${userinfo[8]}**), has an XP rank of **${userinfo[1]}**, **${userinfo[2]}** level(s), **${userinfo[3]}** rate(s), **${userinfo[4]}** friend(s), has an unknown location, and was last online at **${userinfo[6]}** (EST/EDT)!\n\nHere's the link to their profile:\n<https://www.levelpalace.com/profile?user=${encodeURIComponent(userinfo[0])}>`).catch(err => {
                      //   pmsg.edit("**An error occurred while trying to edit this message:**```" + err + "```");
                      // });
                    } else {
                      pmsg.edit({ content: "Here is the user I found:", embed: {
                        color: 3447003,
                        thumbnail: {
                          url: userinfo[userinfo.length - 1]
                        },
                        fields: [
                          {
                            name: "Username",
                            value: userinfo[0],
                            inline: true
                          },
                          {
                            name: "Status",
                            value: userinfo[7],
                            inline: true
                          },
                          {
                            name: "User ID",
                            value: userinfo[14],
                            inline: true
                          },
                          {
                            name: "XP Rank",
                            value: userinfo[1],
                            inline: true
                          },
                          {
                            name: "Levels",
                            value: userinfo[2],
                            inline: true
                          },
                          {
                            name: "Rates",
                            value: userinfo[3],
                            inline: true
                          },
                          {
                            name: "Friends",
                            value: userinfo[4],
                            inline: true
                          },
                          {
                            name: "Location",
                            value: `:flag_${userinfo[5].toLowerCase()}:`,
                            inline: true
                          },
                          {
                            name: "Online :x:",
                            value: `**Last Online:**\n${userinfo[6]} (EST/EDT)`,
                            inline: true
                          },
                          {
                            name: "Links to Profile",
                            value: `<https://www.levelpalace.com/profile?user=${encodeURIComponent(userinfo[0])}>\n<https://www.levelpalace.com/profile?user_id=${userinfo[14]}>`,
                            inline: true
                          }
                        ]
                      }}).catch(err => {
                        pmsg.edit("**An error occurred while trying to edit this message:**```" + err + "```");
                      });

                      // pmsg.edit(`User found!\n\n**${userinfo[0]}** (**${userinfo[8]}**), has an XP rank of **${userinfo[1]}**, **${userinfo[2]}** level(s), **${userinfo[3]}** rate(s), **${userinfo[4]}** friend(s), lives in :flag_${userinfo[5].toLowerCase()}:, and was last online at **${userinfo[6]}** (EST/EDT)!\n\nHere's the link to their profile:\n<https://www.levelpalace.com/profile?user=${encodeURIComponent(userinfo[0])}>`).catch(err => {
                      //   pmsg.edit("**An error occurred while trying to edit this message:**```" + err + "```");
                      // });
                    }
                  } else {
                    if (userinfo[5] === "?") {
                      pmsg.edit({ content: "Here is the user I found:", embed: {
                        color: 3447003,
                        thumbnail: {
                          url: userinfo[userinfo.length - 1]
                        },
                        fields: [
                          {
                            name: "Username",
                            value: userinfo[0],
                            inline: true
                          },
                          {
                            name: "Status",
                            value: userinfo[7],
                            inline: true
                          },
                          {
                            name: "User ID",
                            value: userinfo[14],
                            inline: true
                          },
                          {
                            name: "XP Rank",
                            value: userinfo[1],
                            inline: true
                          },
                          {
                            name: "Levels",
                            value: userinfo[2],
                            inline: true
                          },
                          {
                            name: "Rates",
                            value: userinfo[3],
                            inline: true
                          },
                          {
                            name: "Friends",
                            value: userinfo[4],
                            inline: true
                          },
                          {
                            name: "Location",
                            value: "Unknown",
                            inline: true
                          },
                          {
                            name: "Online :x:",
                            value: `**Last Online:**\n${userinfo[6]} (EST/EDT)`,
                            inline: true
                          },
                          {
                            name: "Links to Profile",
                            value: `<https://www.levelpalace.com/profile?user=${encodeURIComponent(userinfo[0])}>\n<https://www.levelpalace.com/profile?user_id=${userinfo[14]}>`,
                            inline: true
                          }
                        ]
                      }}).catch(err => {
                        pmsg.edit("**An error occurred while trying to edit this message:**```" + err + "```");
                      });

                      // pmsg.edit(`User found!\n\n**${userinfo[0]}** (**${userinfo[8]}**), has an XP rank of **${userinfo[1]}**, **${userinfo[2]}** level(s), **${userinfo[3]}** rate(s), **${userinfo[4]}** friend(s), has an unknown location, and was last online on **${userinfo[6]}**!\n\nHere's the link to their profile:\n<https://www.levelpalace.com/profile?user=${encodeURIComponent(userinfo[0])}>`).catch(err => {
                      //   pmsg.edit("**An error occurred while trying to edit this message:**```" + err + "```");
                      // });
                    } else {
                      pmsg.edit({ content: "Here is the user I found:", embed: {
                        color: 3447003,
                        thumbnail: {
                          url: userinfo[userinfo.length - 1]
                        },
                        fields: [
                          {
                            name: "Username",
                            value: userinfo[0],
                            inline: true
                          },
                          {
                            name: "Status",
                            value: userinfo[7],
                            inline: true
                          },
                          {
                            name: "User ID",
                            value: userinfo[14],
                            inline: true
                          },
                          {
                            name: "XP Rank",
                            value: userinfo[1],
                            inline: true
                          },
                          {
                            name: "Levels",
                            value: userinfo[2],
                            inline: true
                          },
                          {
                            name: "Rates",
                            value: userinfo[3],
                            inline: true
                          },
                          {
                            name: "Friends",
                            value: userinfo[4],
                            inline: true
                          },
                          {
                            name: "Location",
                            value: `:flag_${userinfo[5].toLowerCase()}:`,
                            inline: true
                          },
                          {
                            name: "Online :x:",
                            value: `**Last Online:**\n${userinfo[6]} (EST/EDT)`,
                            inline: true
                          },
                          {
                            name: "Links to Profile",
                            value: `<https://www.levelpalace.com/profile?user=${encodeURIComponent(userinfo[0])}>\n<https://www.levelpalace.com/profile?user_id=${userinfo[14]}>`,
                            inline: true
                          }
                        ]
                      }}).catch(err => {
                        pmsg.edit("**An error occurred while trying to edit this message:**```" + err + "```");
                      });

                      // pmsg.edit(`User found!\n\n**${userinfo[0]}** (**${userinfo[8]}**), has an XP rank of **${userinfo[1]}**, **${userinfo[2]}** level(s), **${userinfo[3]}** rate(s), **${userinfo[4]}** friend(s), lives in :flag_${userinfo[5].toLowerCase()}:, and was last online on **${userinfo[6]}**!\n\nHere's the link to their profile:\n<https://www.levelpalace.com/profile?user=${encodeURIComponent(userinfo[0])}>`).catch(err => {
                      //   pmsg.edit("**An error occurred while trying to edit this message:**```" + err + "```");
                      // });
                    }
                  }
                } else {
                  if (message.channel.type === "dm") {
                    console.log(`A user by the name of "${args.trim()}" was failed to be found by ${message.author.username} in DMs.`);
                  } else if (message.channel.type === "group") {
                    console.log(`A user by the name of "${args.trim()}" was failed to be found by ${message.author.username} in the ${message.channel.name} Group DM.`);
                  } else {
                    console.log(`A user by the name of "${args.trim()}" was failed to be found by ${message.author.username} in #${message.channel.name} of ${message.guild.name}.`);
                  }
                  pmsg.edit(`No LP user was found with the name: **${args.trim()}**! Please try again.`).catch(err => {
                    pmsg.edit("**An error occurred while trying to edit this message:**```" + err + "```");
                  });
                }
            //   } else {
            //     console.error(`${message.author.username} encountered an error while trying to find a user in #${message.channel.name} of ${message.guild.name}.`);
            //     pmsg.edit("An error has occurred, please try again.");
            //   }
            // });
          // } else {
            // send appropriate message based on how many users were found during the search
          //   if (names.length === 2) {
          //     pmsg.delete();
          //     message.channel.send(`__Please choose the number of the LP user you are trying to specify, or reply with "cancel" to choose none:__\n\n**[1]** ${names[1]}\n**[2]** ${names[2]}`).catch(err => {
          //       console.error(`An error occurred while trying to send a message:\n${err}`);
          //       return message.channel.send("**An error occurred while trying to send a message:**```" + err + "```");
          //     });
          //   } else if (names.length === 3) {
          //     pmsg.delete();
          //     message.channel.send(`__Please choose the number of the LP user you are trying to specify, or reply with "cancel" to choose none:__\n\n**[1]** ${names[1]}\n**[2]** ${names[2]}\n**[3]** ${names[3]}`).catch(err => {
          //       console.error(`An error occurred while trying to send a message:\n${err}`);
          //       return message.channel.send("**An error occurred while trying to send a message:**```" + err + "```");
          //     });
          //   } else if (names.length === 4) {
          //     pmsg.delete();
          //     message.channel.send(`__Please choose the number of the LP user you are trying to specify, or reply with "cancel" to choose none:__\n\n**[1]** ${names[1]}\n**[2]** ${names[2]}\n**[3]** ${names[3]}\n**[4]** ${names[4]}`).catch(err => {
          //       console.error(`An error occurred while trying to send a message:\n${err}`);
          //       return message.channel.send("**An error occurred while trying to send a message:**```" + err + "```");
          //     });
          //   } else if (names.length === 5) {
          //     pmsg.delete();
          //     message.channel.send(`__Please choose the number of the LP user you are trying to specify, or reply with "cancel" to choose none:__\n\n**[1]** ${names[1]}\n**[2]** ${names[2]}\n**[3]** ${names[3]}\n**[4]** ${names[4]}\n**[5]** ${names[5]}`).catch(err => {
          //       console.error(`An error occurred while trying to send a message:\n${err}`);
          //       return message.channel.send("**An error occurred while trying to send a message:**```" + err + "```");
          //     });
          //   } else if (names.length === 6) {
          //     pmsg.delete();
          //     message.channel.send(`__Please choose the number of the LP user you are trying to specify, or reply with "cancel" to choose none:__\n\n**[1]** ${names[1]}\n**[2]** ${names[2]}\n**[3]** ${names[3]}\n**[4]** ${names[4]}\n**[5]** ${names[5]}\n**[6]** ${names[6]}`).catch(err => {
          //       console.error(`An error occurred while trying to send a message:\n${err}`);
          //       return message.channel.send("**An error occurred while trying to send a message:**```" + err + "```");
          //     });
          //   } else if (names.length === 7) {
          //     pmsg.delete();
          //     message.channel.send(`__Please choose the number of the LP user you are trying to specify, or reply with "cancel" to choose none:__\n\n**[1]** ${names[1]}\n**[2]** ${names[2]}\n**[3]** ${names[3]}\n**[4]** ${names[4]}\n**[5]** ${names[5]}\n**[6]** ${names[6]}\n**[7]** ${names[7]}`).catch(err => {
          //       console.error(`An error occurred while trying to send a message:\n${err}`);
          //       return message.channel.send("**An error occurred while trying to send a message:**```" + err + "```");
          //     });
          //   } else if (names.length === 8) {
          //     pmsg.delete();
          //     message.channel.send(`__Please choose the number of the LP user you are trying to specify, or reply with "cancel" to choose none:__\n\n**[1]** ${names[1]}\n**[2]** ${names[2]}\n**[3]** ${names[3]}\n**[4]** ${names[4]}\n**[5]** ${names[5]}\n**[6]** ${names[6]}\n**[7]** ${names[7]}\n**[8]** ${names[8]}`).catch(err => {
          //       console.error(`An error occurred while trying to send a message:\n${err}`);
          //       return message.channel.send("**An error occurred while trying to send a message:**```" + err + "```");
          //     });
          //   } else if (names.length === 9) {
          //     pmsg.delete();
          //     message.channel.send(`__Please choose the number of the LP user you are trying to specify, or reply with "cancel" to choose none:__\n\n**[1]** ${names[1]}\n**[2]** ${names[2]}\n**[3]** ${names[3]}\n**[4]** ${names[4]}\n**[5]** ${names[5]}\n**[6]** ${names[6]}\n**[7]** ${names[7]}\n**[8]** ${names[8]}\n**[9]** ${names[9]}`).catch(err => {
          //       console.error(`An error occurred while trying to send a message:\n${err}`);
          //       return message.channel.send("**An error occurred while trying to send a message:**```" + err + "```");
          //     });
          //   } else if (names.length === 10) {
          //     pmsg.delete();
          //     message.channel.send(`__Please choose the number of the LP user you are trying to specify, or reply with "cancel" to choose none:__\n\n**[1]** ${names[1]}\n**[2]** ${names[2]}\n**[3]** ${names[3]}\n**[4]** ${names[4]}\n**[5]** ${names[5]}\n**[6]** ${names[6]}\n**[7]** ${names[7]}\n**[8]** ${names[8]}\n**[9]** ${names[9]}\n**[10]** ${names[10]}\n\n***Note:*** *There may be more than 10 members that match your search query, but only up to 10 are shown.*`).catch(err => {
          //       console.error(`An error occurred while trying to send a message:\n${err}`);
          //       return message.channel.send("**An error occurred while trying to send a message:**```" + err + "```");
          //     });
          //   }

          //   // establish filter for response messages
          //   const filter = rmsg => {
          //     if (!isNaN(rmsg.content) && names[rmsg.content] && rmsg.author.id === message.author.id || rmsg.content.replace(/\s/g, "").toLowerCase() === "cancel" && rmsg.author.id === message.author.id) return true;
          //   }

          //   message.channel.awaitMessages(filter, { max: 1, time: 20000, errors: ["time"] })
          //     .then(collected => {
          //       // retrieve user information if input is not "cancel"
          //       if (collected.first().content !== "cancel") {
          //         let pmsg = message.channel.send("Retrieving user information...");

          //         request({ uri: `https://www.levelpalace.com/${userlinks[collected.first().content]}`, timeout: 10000, headers: { "User-Agent": "lp-helper" } }, function(err, resp, body) {
          //           if (!err && resp.statusCode === 200) {
          //             let $ = cheerio.load(body);

          //             if ($("div.navbar-fixed").length === 0) return pmsg.edit("Level Palace is currently **down**, and so this command will not work properly right now. Please try again later!");

          //             if ($("div.page-banner").length > 0) {
          //               $(".card-title", ".profile-banner").each(function() {
          //                 let stat = $(this).text().trim() || $("img.tooltipped").attr("alt").toLowerCase();
          //                 userinfo.push(stat);
          //               });
          //               $(".subtitle", ".profile-banner").each(function() {
          //                 let status = $(this).text().trim();
          //                 userinfo.push(status);
          //               });
          //               $("div", ".profile-user-icon").each(function() {
          //                 let avatar = $(this).attr("style").trim().slice(22, -2);
          //                 if (avatar.startsWith("files") || avatar.startsWith("images")) avatar = "https://www.levelpalace.com/" + avatar;
          //                 urlExists(avatar, function(err, exists) {
          //                  if (!err) {
          //                    if (!exists) {
          //                      avatar = "https://i.imgur.com/2E8BWdV.png";
          //                    }
          //                  } else {
          //                    avatar = "https://i.imgur.com/2E8BWdV.png";
          //                  }
        //                  });
          //                 userinfo.push(avatar);
          //               });

          //               if (message.channel.type === "dm") {
          //                 console.log(`A user by the name of "${args.trim()}" was found by ${message.author.username} in DMs.`);
          //               } else if (message.channel.type === "group") {
          //                 console.log(`A user by the name of "${args.trim()}" was found by ${message.author.username} in the ${message.channel.name} Group DM.`);
          //               } else {
          //                 console.log(`A user by the name of "${args.trim()}" was found by ${message.author.username} in #${message.channel.name} of ${message.guild.name}.`);
          //               }
          //               if (userinfo[6] === "NOW") {
          //                 if (userinfo[5] === "?") {
          //                   pmsg.edit({ embed: {
          //                     color: 3447003,
          //                     thumbnail: {
          //                       url: userinfo[userinfo.length - 1]
          //                     },
          //                     fields: [{
          //                         name: "Username",
          //                         value: userinfo[0],
          //                         inline: true
          //                       },
          //                       {
          //                         name: "Status",
          //                         value: userinfo[8],
          //                         inline: true
          //                       },
          //                       {
          //                         name: "XP Rank",
          //                         value: userinfo[1],
          //                         inline: true
          //                       },
          //                       {
          //                         name: "Levels",
          //                         value: userinfo[2],
          //                         inline: true
          //                       },
          //                       {
          //                         name: "Rates",
          //                         value: userinfo[3],
          //                         inline: true
          //                       },
          //                       {
          //                         name: "Friends",
          //                         value: userinfo[4],
          //                         inline: true
          //                       },
          //                       {
          //                         name: "Location",
          //                         value: "Unknown",
          //                         inline: true
          //                       },
          //                       {
          //                         name: "Online",
          //                         value: ":white_check_mark:",
          //                         inline: true
          //                       },
          //                       {
          //                         name: "Link to Profile",
          //                         value: `<https://www.levelpalace.com/profile?user=${encodeURIComponent(userinfo[0])}>`,
          //                         inline: true
          //                       }
          //                     ]
          //                   }}).catch(err => {
          //                     pmsg.edit("**An error occurred while trying to edit this message:**```" + err + "```");
          //                   });

          //                   // pmsg.edit(`User found!\n\n**${userinfo[0]}** (**${userinfo[8]}**), has an XP rank of **${userinfo[1]}**, **${userinfo[2]}** level(s), **${userinfo[3]}** rate(s), **${userinfo[4]}** friend(s), has an unknown location, and is currently online!\n\nHere's the link to their profile:\n<https://www.levelpalace.com/profile?user=${encodeURIComponent(userinfo[0])}>`).catch(err => {
          //                   //   pmsg.edit("**An error occurred while trying to edit this message:**```" + err + "```");
          //                   // });
          //                 } else {
          //                   pmsg.edit({ embed: {
          //                     color: 3447003,
          //                     thumbnail: {
          //                       url: userinfo[userinfo.length - 1]
          //                     },
          //                     fields: [{
          //                         name: "Username",
          //                         value: userinfo[0],
          //                         inline: true
          //                       },
          //                       {
          //                         name: "Status",
          //                         value: userinfo[8],
          //                         inline: true
          //                       },
          //                       {
          //                         name: "XP Rank",
          //                         value: userinfo[1],
          //                         inline: true
          //                       },
          //                       {
          //                         name: "Levels",
          //                         value: userinfo[2],
          //                         inline: true
          //                       },
          //                       {
          //                         name: "Rates",
          //                         value: userinfo[3],
          //                         inline: true
          //                       },
          //                       {
          //                         name: "Friends",
          //                         value: userinfo[4],
          //                         inline: true
          //                       },
          //                       {
          //                         name: "Location",
          //                         value: `:flag_${userinfo[5].toLowerCase()}:`,
          //                         inline: true
          //                       },
          //                       {
          //                         name: "Online",
          //                         value: ":white_check_mark:",
          //                         inline: true
          //                       },
          //                       {
          //                         name: "Link to Profile",
          //                         value: `<https://www.levelpalace.com/profile?user=${encodeURIComponent(userinfo[0])}>`,
          //                         inline: true
          //                       }
          //                     ]
          //                   }}).catch(err => {
          //                     pmsg.edit("**An error occurred while trying to edit this message:**```" + err + "```");
          //                   });

          //                   // pmsg.edit(`User found!\n\n**${userinfo[0]}** (**${userinfo[8]}**), has an XP rank of **${userinfo[1]}**, **${userinfo[2]}** level(s), **${userinfo[3]}** rate(s), **${userinfo[4]}** friend(s), lives in :flag_${userinfo[5].toLowerCase()}:, and is currently online!\n\nHere's the link to their profile:\n<https://www.levelpalace.com/profile?user=${encodeURIComponent(userinfo[0])}>`).catch(err => {
          //                   //   pmsg.edit("**An error occurred while trying to edit this message:**```" + err + "```");
          //                   // });
          //                 }
          //               } else if (userinfo[6].endsWith("AM") || userinfo[6].endsWith("PM")) {
          //                 if (userinfo[5] === "?") {
          //                   pmsg.edit({ embed: {
          //                     color: 3447003,
          //                     thumbnail: {
          //                       url: userinfo[userinfo.length - 1]
          //                     },
          //                     fields: [{
          //                         name: "Username",
          //                         value: userinfo[0],
          //                         inline: true
          //                       },
          //                       {
          //                         name: "Status",
          //                         value: userinfo[8],
          //                         inline: true
          //                       },
          //                       {
          //                         name: "XP Rank",
          //                         value: userinfo[1],
          //                         inline: true
          //                       },
          //                       {
          //                         name: "Levels",
          //                         value: userinfo[2],
          //                         inline: true
          //                       },
          //                       {
          //                         name: "Rates",
          //                         value: userinfo[3],
          //                         inline: true
          //                       },
          //                       {
          //                         name: "Friends",
          //                         value: userinfo[4],
          //                         inline: true
          //                       },
          //                       {
          //                         name: "Location",
          //                         value: "Unknown",
          //                         inline: true
          //                       },
          //                       {
          //                         name: "Online :x:",
          //                         value: `**Last Online:**\n${userinfo[6]} (EST/EDT)`,
          //                         inline: true
          //                       },
          //                       {
          //                         name: "Link to Profile",
          //                         value: `<https://www.levelpalace.com/profile?user=${encodeURIComponent(userinfo[0])}>`,
          //                         inline: true
          //                       }
          //                     ]
          //                   }}).catch(err => {
          //                     pmsg.edit("**An error occurred while trying to edit this message:**```" + err + "```");
          //                   });

          //                   // pmsg.edit(`User found!\n\n**${userinfo[0]}** (**${userinfo[8]}**), has an XP rank of **${userinfo[1]}**, **${userinfo[2]}** level(s), **${userinfo[3]}** rate(s), **${userinfo[4]}** friend(s), has an unknown location, and was last online at **${userinfo[6]}** (EST/EDT)!\n\nHere's the link to their profile:\n<https://www.levelpalace.com/profile?user=${encodeURIComponent(userinfo[0])}>`).catch(err => {
          //                   //   pmsg.edit("**An error occurred while trying to edit this message:**```" + err + "```");
          //                   // });
          //                 } else {
          //                   pmsg.edit({ embed: {
          //                     color: 3447003,
          //                     thumbnail: {
          //                       url: userinfo[userinfo.length - 1]
          //                     },
          //                     fields: [{
          //                         name: "Username",
          //                         value: userinfo[0],
          //                         inline: true
          //                       },
          //                       {
          //                         name: "Status",
          //                         value: userinfo[8],
          //                         inline: true
          //                       },
          //                       {
          //                         name: "XP Rank",
          //                         value: userinfo[1],
          //                         inline: true
          //                       },
          //                       {
          //                         name: "Levels",
          //                         value: userinfo[2],
          //                         inline: true
          //                       },
          //                       {
          //                         name: "Rates",
          //                         value: userinfo[3],
          //                         inline: true
          //                       },
          //                       {
          //                         name: "Friends",
          //                         value: userinfo[4],
          //                         inline: true
          //                       },
          //                       {
          //                         name: "Location",
          //                         value: `:flag_${userinfo[5].toLowerCase()}:`,
          //                         inline: true
          //                       },
          //                       {
          //                         name: "Online :x:",
          //                         value: `**Last Online:**\n${userinfo[6]} (EST/EDT)`,
          //                         inline: true
          //                       },
          //                       {
          //                         name: "Link to Profile",
          //                         value: `<https://www.levelpalace.com/profile?user=${encodeURIComponent(userinfo[0])}>`,
          //                         inline: true
          //                       }
          //                     ]
          //                   }}).catch(err => {
          //                     pmsg.edit("**An error occurred while trying to edit this message:**```" + err + "```");
          //                   });

          //                   // pmsg.edit(`User found!\n\n**${userinfo[0]}** (**${userinfo[8]}**), has an XP rank of **${userinfo[1]}**, **${userinfo[2]}** level(s), **${userinfo[3]}** rate(s), **${userinfo[4]}** friend(s), lives in :flag_${userinfo[5].toLowerCase()}:, and was last online at **${userinfo[6]}** (EST/EDT)!\n\nHere's the link to their profile:\n<https://www.levelpalace.com/profile?user=${encodeURIComponent(userinfo[0])}>`).catch(err => {
          //                   //   pmsg.edit("**An error occurred while trying to edit this message:**```" + err + "```");
          //                   // });
          //                 }
          //               } else {
          //                 if (userinfo[5] === "?") {
          //                   pmsg.edit({ embed: {
          //                     color: 3447003,
          //                     thumbnail: {
          //                       url: userinfo[userinfo.length - 1]
          //                     },
          //                     fields: [{
          //                         name: "Username",
          //                         value: userinfo[0],
          //                         inline: true
          //                       },
          //                       {
          //                         name: "Status",
          //                         value: userinfo[8],
          //                         inline: true
          //                       },
          //                       {
          //                         name: "XP Rank",
          //                         value: userinfo[1],
          //                         inline: true
          //                       },
          //                       {
          //                         name: "Levels",
          //                         value: userinfo[2],
          //                         inline: true
          //                       },
          //                       {
          //                         name: "Rates",
          //                         value: userinfo[3],
          //                         inline: true
          //                       },
          //                       {
          //                         name: "Friends",
          //                         value: userinfo[4],
          //                         inline: true
          //                       },
          //                       {
          //                         name: "Location",
          //                         value: "Unknown",
          //                         inline: true
          //                       },
          //                       {
          //                         name: "Online :x:",
          //                         value: `**Last Online:**\n${userinfo[6]} (EST/EDT)`,
          //                         inline: true
          //                       },
          //                       {
          //                         name: "Link to Profile",
          //                         value: `<https://www.levelpalace.com/profile?user=${encodeURIComponent(userinfo[0])}>`,
          //                         inline: true
          //                       }
          //                     ]
          //                   }}).catch(err => {
          //                     pmsg.edit("**An error occurred while trying to edit this message:**```" + err + "```");
          //                   });

          //                   // pmsg.edit(`User found!\n\n**${userinfo[0]}** (**${userinfo[8]}**), has an XP rank of **${userinfo[1]}**, **${userinfo[2]}** level(s), **${userinfo[3]}** rate(s), **${userinfo[4]}** friend(s), has an unknown location, and was last online on **${userinfo[6]}**!\n\nHere's the link to their profile:\n<https://www.levelpalace.com/profile?user=${encodeURIComponent(userinfo[0])}>`).catch(err => {
          //                   //   pmsg.edit("**An error occurred while trying to edit this message:**```" + err + "```");
          //                   // });
          //                 } else {
          //                   pmsg.edit({ embed: {
          //                     color: 3447003,
          //                     thumbnail: {
          //                       url: userinfo[userinfo.length - 1]
          //                     },
          //                     fields: [{
          //                         name: "Username",
          //                         value: userinfo[0],
          //                         inline: true
          //                       },
          //                       {
          //                         name: "Status",
          //                         value: userinfo[8],
          //                         inline: true
          //                       },
          //                       {
          //                         name: "XP Rank",
          //                         value: userinfo[1],
          //                         inline: true
          //                       },
          //                       {
          //                         name: "Levels",
          //                         value: userinfo[2],
          //                         inline: true
          //                       },
          //                       {
          //                         name: "Rates",
          //                         value: userinfo[3],
          //                         inline: true
          //                       },
          //                       {
          //                         name: "Friends",
          //                         value: userinfo[4],
          //                         inline: true
          //                       },
          //                       {
          //                         name: "Location",
          //                         value: `:flag_${userinfo[5].toLowerCase()}:`,
          //                         inline: true
          //                       },
          //                       {
          //                         name: "Online :x:",
          //                         value: `**Last Online:**\n${userinfo[6]} (EST/EDT)`,
          //                         inline: true
          //                       },
          //                       {
          //                         name: "Link to Profile",
          //                         value: `<https://www.levelpalace.com/profile?user=${encodeURIComponent(userinfo[0])}>`,
          //                         inline: true
          //                       }
          //                     ]
          //                   }}).catch(err => {
          //                     pmsg.edit("**An error occurred while trying to edit this message:**```" + err + "```");
          //                   });

          //                   // pmsg.edit(`User found!\n\n**${userinfo[0]}** (**${userinfo[8]}**), has an XP rank of **${userinfo[1]}**, **${userinfo[2]}** level(s), **${userinfo[3]}** rate(s), **${userinfo[4]}** friend(s), lives in :flag_${userinfo[5].toLowerCase()}:, and was last online on **${userinfo[6]}**!\n\nHere's the link to their profile:\n<https://www.levelpalace.com/profile?user=${encodeURIComponent(userinfo[0])}>`).catch(err => {
          //                   //   pmsg.edit("**An error occurred while trying to edit this message:**```" + err + "```");
          //                   // });
          //                 }
          //               }
          //             } else {
          //               if (message.channel.type === "dm") {
          //                 console.log(`A user by the name of "${args.trim()}" was failed to be found by ${message.author.username} in DMs.`);
          //               } else if (message.channel.type === "group") {
          //                 console.log(`A user by the name of "${args.trim()}" was failed to be found by ${message.author.username} in the ${message.channel.name} Group DM.`);
          //               } else {
          //                 console.log(`A user by the name of "${args.trim()}" was failed to be found by ${message.author.username} in #${message.channel.name} of ${message.guild.name}.`);
          //               }
          //               pmsg.edit(`No LP user was found with the name: **${args.trim()}**! Please try again.`).catch(err => {
          //                 pmsg.edit("**An error occurred while trying to edit this message:**```" + err + "```");
          //               });
          //             }
          //           } else {
          //             console.error(`${message.author.username} encountered an error while trying to find a user in #${message.channel.name} of ${message.guild.name}.`);
          //             pmsg.edit("An error has occurred, please try again.");
          //           }
          //         }); 
          //       } else {
          //         message.channel.send(`**${message.author.username}**, request canceled.`);
          //       }
          //     })
          //     .catch(collected => {
          //       message.channel.send(`**${message.author.username}**, your LP user request timed out.`);
          //     });
          // }
        } else {
          console.error(`${message.author.username} encountered an error while trying to find a user in #${message.channel.name} of ${message.guild.name}.`);
          pmsg.edit("An error has occurred, please try again.");
        }
      });
    }

    else if (command === "iduser" || command === "idfinduser" || command === "idmember" || command === "idfindmember" || command === "idprofile" || command === "idfindprofile") {
      if (message.guild && message.guild.id === "752287527473381419") return;
      if (!args) return message.channel.send("You must include an ID for a user to find!");

      args = args.replace(/"/g, '\\"');
      args = args.replace(/`/g, '\\`');
      let userID = encodeURIComponent(args.replace(/\s/g, ""));
      let userinfo = [];

      if (isNaN(userID)) return message.channel.send("Please enter a numeric user ID!");
      if (args.length > 10) return message.channel.send("Please enter a user ID consisting of 10 digits or less!");

      log(command);

      let pmsg = await message.channel.send("Finding user...");

      // attempt to find user on LP
      request({ uri: `https://www.levelpalace.com/profile?user_id=${userID}`, timeout: 10000, headers: { "User-Agent": "lp-helper" } }, function(err, resp, body) {
        if (!err && resp.statusCode === 200) {
          let $ = cheerio.load(body);

          if ($("div.navbar-fixed").length === 0) return pmsg.edit("Level Palace is currently **down**, and so this command will not work properly right now. Please try again later!");

          if ($("div.page-banner").length > 0) {
            $(".card-title", ".profile-banner").each(function() {
              let stat = $(this).text().trim() || $("img.tooltipped").attr("alt").toLowerCase();
              userinfo.push(stat);
            });
            $(".subtitle", ".profile-banner").each(function() {
              let status = $(this).text().trim();
              userinfo.push(status);
            });
            $("a[href*='rates?user_id=']", ".profile-banner").each(function() {
              let link = $(this).attr("href").substring(14);
              userinfo.push(link);
            });
            $("div", ".profile-user-icon").each(function() {
              let avatar = $(this).attr("style").trim().split(")")[0].slice(22);
              if (avatar.startsWith("files") || avatar.startsWith("images")) avatar = "https://www.levelpalace.com/" + avatar;
              urlExists(avatar, function(err, exists) {
                if (!err) {
                  if (!exists) {
                    avatar = "https://i.imgur.com/2E8BWdV.png";
                  }
                } else {
                  avatar = "https://i.imgur.com/2E8BWdV.png";
                }
              });
              userinfo.push(avatar);
            });

            if (message.channel.type === "dm") {
              console.log(`A user with an ID of "${userID}" was found by ${message.author.username} in DMs.`);
            } else if (message.channel.type === "group") {
              console.log(`A user with an ID of "${userID}" was found by ${message.author.username} in the ${message.channel.name} Group DM.`);
            } else {
              console.log(`A user with an ID of "${userID}" was found by ${message.author.username} in #${message.channel.name} of ${message.guild.name}.`);
            }
            if (userinfo[6] === "NOW") {
              if (userinfo[5] === "?") {
                pmsg.edit({ content: "Here is the user I found:", embed: {
                  color: 3447003,
                  thumbnail: {
                    url: userinfo[userinfo.length - 1]
                  },
                  fields: [
                    {
                      name: "Username",
                      value: userinfo[0],
                      inline: true
                    },
                    {
                      name: "Status",
                      value: userinfo[7],
                      inline: true
                    },
                    {
                      name: "User ID",
                      value: userinfo[14],
                      inline: true
                    },
                    {
                      name: "XP Rank",
                      value: userinfo[1],
                      inline: true
                    },
                    {
                      name: "Levels",
                      value: userinfo[2],
                      inline: true
                    },
                    {
                      name: "Rates",
                      value: userinfo[3],
                      inline: true
                    },
                    {
                      name: "Friends",
                      value: userinfo[4],
                      inline: true
                    },
                    {
                      name: "Location",
                      value: "Unknown",
                      inline: true
                    },
                    {
                      name: "Online",
                      value: ":white_check_mark:",
                      inline: true
                    },
                    {
                      name: "Links to Profile",
                      value: `<https://www.levelpalace.com/profile?user_id=${userinfo[14]}>\n<https://www.levelpalace.com/profile?user=${encodeURIComponent(userinfo[0])}>`,
                      inline: true
                    }
                  ]
                }}).catch(err => {
                  pmsg.edit("**An error occurred while trying to edit this message:**```" + err + "```");
                });

                // pmsg.edit(`User found!\n\n**${userinfo[0]}** (**${userinfo[8]}**), has an XP rank of **${userinfo[1]}**, **${userinfo[2]}** level(s), **${userinfo[3]}** rate(s), **${userinfo[4]}** friend(s), has an unknown location, and is currently online!\n\nHere's the link to their profile:\n<https://www.levelpalace.com/profile?user_id=${userID}>`).catch(err => {
                //   pmsg.edit("**An error occurred while trying to edit this message:**```" + err + "```");
                // });
              } else {
                pmsg.edit({ content: "Here is the user I found:", embed: {
                  color: 3447003,
                  thumbnail: {
                    url: userinfo[userinfo.length - 1]
                  },
                  fields: [
                    {
                      name: "Username",
                      value: userinfo[0],
                      inline: true
                    },
                    {
                      name: "Status",
                      value: userinfo[7],
                      inline: true
                    },
                    {
                      name: "User ID",
                      value: userinfo[14],
                      inline: true
                    },
                    {
                      name: "XP Rank",
                      value: userinfo[1],
                      inline: true
                    },
                    {
                      name: "Levels",
                      value: userinfo[2],
                      inline: true
                    },
                    {
                      name: "Rates",
                      value: userinfo[3],
                      inline: true
                    },
                    {
                      name: "Friends",
                      value: userinfo[4],
                      inline: true
                    },
                    {
                      name: "Location",
                      value: `:flag_${userinfo[5].toLowerCase()}:`,
                      inline: true
                    },
                    {
                      name: "Online",
                      value: ":white_check_mark:",
                      inline: true
                    },
                    {
                      name: "Links to Profile",
                      value: `<https://www.levelpalace.com/profile?user_id=${userinfo[14]}>\n<https://www.levelpalace.com/profile?user=${encodeURIComponent(userinfo[0])}>`,
                      inline: true
                    }
                  ]
                }}).catch(err => {
                  pmsg.edit("**An error occurred while trying to edit this message:**```" + err + "```");
                });

                // pmsg.edit(`User found!\n\n**${userinfo[0]}** (**${userinfo[8]}**), has an XP rank of **${userinfo[1]}**, **${userinfo[2]}** level(s), **${userinfo[3]}** rate(s), **${userinfo[4]}** friend(s), lives in :flag_${userinfo[5].toLowerCase()}:, and is currently online!\n\nHere's the link to their profile:\n<https://www.levelpalace.com/profile?user_id=${userID}>`).catch(err => {
                //   pmsg.edit("**An error occurred while trying to edit this message:**```" + err + "```");
                // });
              }
            } else if (userinfo[6].endsWith("AM") || userinfo[6].endsWith("PM")) {
              if (userinfo[5] === "?") {
                pmsg.edit({ content: "Here is the user I found:", embed: {
                  color: 3447003,
                  thumbnail: {
                    url: userinfo[userinfo.length - 1]
                  },
                  fields: [
                    {
                      name: "Username",
                      value: userinfo[0],
                      inline: true
                    },
                    {
                      name: "Status",
                      value: userinfo[7],
                      inline: true
                    },
                    {
                      name: "User ID",
                      value: userinfo[14],
                      inline: true
                    },
                    {
                      name: "XP Rank",
                      value: userinfo[1],
                      inline: true
                    },
                    {
                      name: "Levels",
                      value: userinfo[2],
                      inline: true
                    },
                    {
                      name: "Rates",
                      value: userinfo[3],
                      inline: true
                    },
                    {
                      name: "Friends",
                      value: userinfo[4],
                      inline: true
                    },
                    {
                      name: "Location",
                      value: "Unknown",
                      inline: true
                    },
                    {
                      name: "Online :x:",
                      value: `**Last Online:**\n${userinfo[6]} (EST/EDT)`,
                      inline: true
                    },
                    {
                      name: "Links to Profile",
                      value: `<https://www.levelpalace.com/profile?user_id=${userinfo[14]}>\n<https://www.levelpalace.com/profile?user=${encodeURIComponent(userinfo[0])}>`,
                      inline: true
                    }
                  ]
                }}).catch(err => {
                  pmsg.edit("**An error occurred while trying to edit this message:**```" + err + "```");
                });

                // pmsg.edit(`User found!\n\n**${userinfo[0]}** (**${userinfo[8]}**), has an XP rank of **${userinfo[1]}**, **${userinfo[2]}** level(s), **${userinfo[3]}** rate(s), **${userinfo[4]}** friend(s), has an unknown location, and was last online at **${userinfo[6]}** (EST/EDT)!\n\nHere's the link to their profile:\n<https://www.levelpalace.com/profile?user_id=${userID}>`).catch(err => {
                //   pmsg.edit("**An error occurred while trying to edit this message:**```" + err + "```");
                // });
              } else {
                pmsg.edit({ content: "Here is the user I found:", embed: {
                  color: 3447003,
                  thumbnail: {
                    url: userinfo[userinfo.length - 1]
                  },
                  fields: [
                    {
                      name: "Username",
                      value: userinfo[0],
                      inline: true
                    },
                    {
                      name: "Status",
                      value: userinfo[7],
                      inline: true
                    },
                    {
                      name: "User ID",
                      value: userinfo[14],
                      inline: true
                    },
                    {
                      name: "XP Rank",
                      value: userinfo[1],
                      inline: true
                    },
                    {
                      name: "Levels",
                      value: userinfo[2],
                      inline: true
                    },
                    {
                      name: "Rates",
                      value: userinfo[3],
                      inline: true
                    },
                    {
                      name: "Friends",
                      value: userinfo[4],
                      inline: true
                    },
                    {
                      name: "Location",
                      value: `:flag_${userinfo[5].toLowerCase()}:`,
                      inline: true
                    },
                    {
                      name: "Online :x:",
                      value: `**Last Online:**\n${userinfo[6]} (EST/EDT)`,
                      inline: true
                    },
                    {
                      name: "Links to Profile",
                      value: `<https://www.levelpalace.com/profile?user_id=${userinfo[14]}>\n<https://www.levelpalace.com/profile?user=${encodeURIComponent(userinfo[0])}>`,
                      inline: true
                    }
                  ]
                }}).catch(err => {
                  pmsg.edit("**An error occurred while trying to edit this message:**```" + err + "```");
                });

                // pmsg.edit(`User found!\n\n**${userinfo[0]}** (**${userinfo[8]}**), has an XP rank of **${userinfo[1]}**, **${userinfo[2]}** level(s), **${userinfo[3]}** rate(s), **${userinfo[4]}** friend(s), lives in :flag_${userinfo[5].toLowerCase()}:, and was last online at **${userinfo[6]}** (EST/EDT)!\n\nHere's the link to their profile:\n<https://www.levelpalace.com/profile?user_id=${userID}>`).catch(err => {
                //   pmsg.edit("**An error occurred while trying to edit this message:**```" + err + "```");
                // });
              }
            } else {
              if (userinfo[5] === "?") {
                pmsg.edit({ content: "Here is the user I found:", embed: {
                  color: 3447003,
                  thumbnail: {
                    url: userinfo[userinfo.length - 1]
                  },
                  fields: [
                    {
                      name: "Username",
                      value: userinfo[0],
                      inline: true
                    },
                    {
                      name: "Status",
                      value: userinfo[7],
                      inline: true
                    },
                    {
                      name: "User ID",
                      value: userinfo[14],
                      inline: true
                    },
                    {
                      name: "XP Rank",
                      value: userinfo[1],
                      inline: true
                    },
                    {
                      name: "Levels",
                      value: userinfo[2],
                      inline: true
                    },
                    {
                      name: "Rates",
                      value: userinfo[3],
                      inline: true
                    },
                    {
                      name: "Friends",
                      value: userinfo[4],
                      inline: true
                    },
                    {
                      name: "Location",
                      value: "Unknown",
                      inline: true
                    },
                    {
                      name: "Online :x:",
                      value: `**Last Online:**\n${userinfo[6]} (EST/EDT)`,
                      inline: true
                    },
                    {
                      name: "Links to Profile",
                      value: `<https://www.levelpalace.com/profile?user_id=${userinfo[14]}>\n<https://www.levelpalace.com/profile?user=${encodeURIComponent(userinfo[0])}>`,
                      inline: true
                    }
                  ]
                }}).catch(err => {
                  pmsg.edit("**An error occurred while trying to edit this message:**```" + err + "```");
                });

                // pmsg.edit(`User found!\n\n**${userinfo[0]}** (**${userinfo[8]}**), has an XP rank of **${userinfo[1]}**, **${userinfo[2]}** level(s), **${userinfo[3]}** rate(s), **${userinfo[4]}** friend(s), has an unknown location, and was last online on **${userinfo[6]}**!\n\nHere's the link to their profile:\n<https://www.levelpalace.com/profile?user_id=${userID}>`).catch(err => {
                //   pmsg.edit("**An error occurred while trying to edit this message:**```" + err + "```");
                // });
              } else {
                pmsg.edit({ content: "Here is the user I found:", embed: {
                  color: 3447003,
                  thumbnail: {
                    url: userinfo[userinfo.length - 1]
                  },
                  fields: [
                    {
                      name: "Username",
                      value: userinfo[0],
                      inline: true
                    },
                    {
                      name: "Status",
                      value: userinfo[7],
                      inline: true
                    },
                    {
                      name: "User ID",
                      value: userinfo[14],
                      inline: true
                    },
                    {
                      name: "XP Rank",
                      value: userinfo[1],
                      inline: true
                    },
                    {
                      name: "Levels",
                      value: userinfo[2],
                      inline: true
                    },
                    {
                      name: "Rates",
                      value: userinfo[3],
                      inline: true
                    },
                    {
                      name: "Friends",
                      value: userinfo[4],
                      inline: true
                    },
                    {
                      name: "Location",
                      value: `:flag_${userinfo[5].toLowerCase()}:`,
                      inline: true
                    },
                    {
                      name: "Online :x:",
                      value: `**Last Online:**\n${userinfo[6]} (EST/EDT)`,
                      inline: true
                    },
                    {
                      name: "Links to Profile",
                      value: `<https://www.levelpalace.com/profile?user_id=${userinfo[14]}>\n<https://www.levelpalace.com/profile?user=${encodeURIComponent(userinfo[0])}>`,
                      inline: true
                    }
                  ]
                }}).catch(err => {
                  pmsg.edit("**An error occurred while trying to edit this message:**```" + err + "```");
                });

                // pmsg.edit(`User found!\n\n**${userinfo[0]}** (**${userinfo[8]}**), has an XP rank of **${userinfo[1]}**, **${userinfo[2]}** level(s), **${userinfo[3]}** rate(s), **${userinfo[4]}** friend(s), lives in :flag_${userinfo[5].toLowerCase()}:, and was last online on **${userinfo[6]}**!\n\nHere's the link to their profile:\n<https://www.levelpalace.com/profile?user_id=${userID}>`).catch(err => {
                //   pmsg.edit("**An error occurred while trying to edit this message:**```" + err + "```");
                // });
              }
            }
          } else {
            if (message.channel.type === "dm") {
              console.log(`A user with an ID of "${userID}" was failed to be found by ${message.author.username} in DMs.`);
            } else if (message.channel.type === "group") {
              console.log(`A user with an ID of "${userID}" was failed to be found by ${message.author.username} in the ${message.channel.name} Group DM.`);
            } else {
              console.log(`A user with an ID of "${userID}" was failed to be found by ${message.author.username} in #${message.channel.name} of ${message.guild.name}.`);
            }
            pmsg.edit(`No LP user was found with the ID: **${userID}**! Please try again.`).catch(err => {
              pmsg.edit("**An error occurred while trying to edit this message:**```" + err + "```");
            });
          }
        } else {
          console.error(`${message.author.username} encountered an error while trying to find a user via ID in #${message.channel.name} of ${message.guild.name}.`);
          pmsg.edit("An error has occurred, please try again.");
        }
      });
    }

    // else if (command === "checkir" || command === "ir") {
    //   let pmsg = await message.channel.send("Checking for Intensive Rating...");

    //   // check LP for IR
    //   request({ uri: "https://www.levelpalace.com/levels", timeout: 10000, headers: { "User-Agent": "lp-helper" } }, function(err, resp, body) {
    //     if (!err && resp.statusCode === 200) {
    //       let $ = cheerio.load(body);

    //       if ($("h5:contains('Intensive rating! No new levels can be published until all of the remaining levels get 4 votes. Please rate some levels!')").length > 0) {
    //         console.log(`${message.author.tag} was told that Intensive Rating is currently on.`);
    //         pmsg.edit("Intensive Rating is currently **on**. Please rate some levels!");
    //       } else {
    //         console.log(`${message.author.tag} was told that Intensive Rating is currently off.`);
    //         pmsg.edit("Intensive Rating is currently **off**.");
    //       }
    //     } else {
    //       console.error(`${message.author.username} encountered an error while trying to check for Intensive Rating in #${message.channel.name} of ${message.guild.name}.`);
    //       pmsg.edit("An error has occurred, please try again.");
    //     }
    //   });
    // }

    else if (command === "numpending" || command === "pending") {
      if (message.guild && message.guild.id === "752287527473381419") return;
      log(command);

      let levels = [];
      let pmsg = await message.channel.send("Checking the Pending section...");

      // check Pending section page 1
      request({ uri: "https://www.levelpalace.com/levels", timeout: 10000, headers: { "User-Agent": "lp-helper" } }, function(err, resp, body) {
        if (!err && resp.statusCode === 200) {
          let $ = cheerio.load(body);

          if ($("div.navbar-fixed").length === 0) return pmsg.edit("Level Palace is currently **down**, and so this command will not work properly right now. Please try again later!");

          if ($("div.table-container:contains('No levels found.')").length === 0) {
            $("div.card-content", "div.table-container").each(function() {
              let level = $(this).attr("a[href*='level']");
              levels.push(level);
            });
          }

          // if there is no page 2, do this and stop execution
          if ($("a.padding-right-0[href*='page=2']").length === 0) {
            if (levels.length === 1) {
              if (message.channel.type === "dm") {
                console.log(`${message.author.tag} was told in DMs that there is ${levels.length} current level in Pending.`);
              } else if (message.channel.type === "group") {
                console.log(`${message.author.tag} was told in the ${message.channel.name} Group DM that there is ${levels.length} current level in Pending.`);
              } else {
                console.log(`${message.author.tag} was told in #${message.channel.name} of ${message.guild.name} that there is ${levels.length} current level in Pending.`);
              }
              pmsg.edit(`There is currently **${levels.length}** level in Pending!`);
            } else {
              if (message.channel.type === "dm") {
                console.log(`${message.author.tag} was told in DMs that there are ${levels.length} current levels in Pending.`);
              } else if (message.channel.type === "group") {
                console.log(`${message.author.tag} was told in the ${message.channel.name} Group DM that there are ${levels.length} current levels in Pending.`);
              } else {
                console.log(`${message.author.tag} was told in #${message.channel.name} of ${message.guild.name} that there are ${levels.length} current levels in Pending.`);
              }
              pmsg.edit(`There are currently **${levels.length}** levels in Pending!`);
            }
          }

          // check Pending section page 2
          if ($("a.padding-right-0[href*='page=2']").length > 0) {
            request({ uri: `https://www.levelpalace.com/levels?level_class=Pending&sort=newest&page=2`, headers: { "User-Agent": "lp-helper" } }, function(err, resp, body) {
              if (!err && resp.statusCode === 200) {
                let $ = cheerio.load(body);

                $("div.card-content", "div.table-container").each(function() {
                  let level = $(this).attr("a[href*='level']");
                  levels.push(level);
                });

                // if there is no page 3, do this and stop execution
                if ($(`a.padding-right-0[href*='page=3']`).length === 0) {
                  if (levels.length === 1) {
                    if (message.channel.type === "dm") {
                      console.log(`${message.author.tag} was told in DMs that there is ${levels.length} current level in Pending.`);
                    } else if (message.channel.type === "group") {
                      console.log(`${message.author.tag} was told in the ${message.channel.name} Group DM that there is ${levels.length} current level in Pending.`);
                    } else {
                      console.log(`${message.author.tag} was told in #${message.channel.name} of ${message.guild.name} that there is ${levels.length} current level in Pending.`);
                    }
                    pmsg.edit(`There is currently **${levels.length}** level in Pending!`);
                  } else {
                    if (message.channel.type === "dm") {
                      console.log(`${message.author.tag} was told in DMs that there are ${levels.length} current levels in Pending.`);
                    } else if (message.channel.type === "group") {
                      console.log(`${message.author.tag} was told in the ${message.channel.name} Group DM that there are ${levels.length} current levels in Pending.`);
                    } else {
                      console.log(`${message.author.tag} was told in #${message.channel.name} of ${message.guild.name} that there are ${levels.length} current levels in Pending.`);
                    }
                    pmsg.edit(`There are currently **${levels.length}** levels in Pending!`);
                  }
                }

                // check Pending section page 3
                if ($("a.padding-right-0[href*='page=3']").length > 0) {
                  request({ uri: `https://www.levelpalace.com/levels?level_class=Pending&sort=newest&page=3`, headers: { "User-Agent": "lp-helper" } }, function(err, resp, body) {
                    if (!err && resp.statusCode === 200) {
                      let $ = cheerio.load(body);

                      $("div.card-content", "div.table-container").each(function() {
                        let level = $(this).attr("a[href*='level']");
                        levels.push(level);
                      });
                      
                      // do this and stop execution
                      if (levels.length === 1) {
                        if (message.channel.type === "dm") {
                          console.log(`${message.author.tag} was told in DMs that there is ${levels.length} current level in Pending.`);
                        } else if (message.channel.type === "group") {
                          console.log(`${message.author.tag} was told in the ${message.channel.name} Group DM that there is ${levels.length} current level in Pending.`);
                        } else {
                          console.log(`${message.author.tag} was told in #${message.channel.name} of ${message.guild.name} that there is ${levels.length} current level in Pending.`);
                        }
                        pmsg.edit(`There is currently **${levels.length}** level in Pending!`);
                      } else {
                        if (message.channel.type === "dm") {
                          console.log(`${message.author.tag} was told in DMs that there are ${levels.length} current levels in Pending.`);
                        } else if (message.channel.type === "group") {
                          console.log(`${message.author.tag} was told in the ${message.channel.name} Group DM that there are ${levels.length} current levels in Pending.`);
                        } else {
                          console.log(`${message.author.tag} was told in #${message.channel.name} of ${message.guild.name} that there are ${levels.length} current levels in Pending.`);
                        }
                        pmsg.edit(`There are currently **${levels.length}** levels in Pending!`);
                      }
                    }
                  });
                }
              }
            });
          }
        } else {
          console.error(`${message.author.username} encountered an error while trying to check the amount of Pending levels in #${message.channel.name} of ${message.guild.name}.`);
          pmsg.edit("An error has occurred, please try again.");
        }
      });
    }

    // else if (command === "ratesleft" || command === "votesleft") {
    //   log(command);

    //   let levels = [];
    //   let rates = 0;
    //   let pmsg = await message.channel.send("Calculating the remaining number of votes...");

    //   // check Pending section page 1
    //   request({ uri: "https://www.levelpalace.com/levels", timeout: 10000, headers: { "User-Agent": "lp-helper" } }, function(err, resp, body) {
    //     if (!err && resp.statusCode === 200) {
    //       let $ = cheerio.load(body);

    //       if ($("div.navbar-fixed").length === 0) return pmsg.edit("Level Palace is currently **down**, and so this command will not work properly right now. Please try again later!");

    //       // get number of levels if there are any
    //       if ($("td:contains('No levels found.')").length === 0) {
    //         $("tr", "div.table-container").each(function() {
    //           let level = $(this).attr("tr");
    //           levels.push(level);

    //           // get the remaining number of votes in order to clear out Pending
    //           if ($(this).find("td").length > 0) {
    //             let rateCount = parseInt($(this).find("td:nth-child(6)").text());
    //             rates += rateCount;
    //           }
    //         });
    //         levels = levels.slice(1);
    //       }

    //       // if there is no page 2, do this and stop execution
    //       if ($("a.padding-right-0[href*='page=2']").length === 0) {
    //         if ((levels.length * 4) - rates === 1) {
    //           if (message.channel.type === "dm") {
    //             console.log(`${message.author.tag} was told in DMs that the Pending section needs ${(levels.length * 4) - rates} more vote in order to clear out all of the levels.`);
    //           } else if (message.channel.type === "group") {
    //             console.log(`${message.author.tag} was told in the ${message.channel.name} Group DM that the Pending section needs ${(levels.length * 4) - rates} more vote in order to clear out all of the levels.`);
    //           } else {
    //             console.log(`${message.author.tag} was told in #${message.channel.name} of ${message.guild.name} that the Pending section needs ${(levels.length * 4) - rates} more vote in order to clear out all of the levels.`);
    //           }
    //           pmsg.edit(`The Pending section needs **${(levels.length * 4) - rates}** more vote in order clear out all of the levels!`);
    //         } else {
    //           if (message.channel.type === "dm") {
    //             console.log(`${message.author.tag} was told in DMs that the Pending section needs ${(levels.length * 4) - rates} more votes in order to clear out all of the levels.`);
    //           } else if (message.channel.type === "group") {
    //             console.log(`${message.author.tag} was told in the ${message.channel.name} Group DM that the Pending section needs ${(levels.length * 4) - rates} more votes in order to clear out all of the levels.`);
    //           } else {
    //             console.log(`${message.author.tag} was told in #${message.channel.name} of ${message.guild.name} that the Pending section needs ${(levels.length * 4) - rates} more votes in order to clear out all of the levels.`);
    //           }
    //           pmsg.edit(`The Pending section needs **${(levels.length * 4) - rates}** more votes in order clear out all of the levels!`);
    //         }
    //       }

    //       // check Pending section page 2
    //       if ($("a.padding-right-0[href*='page=2']").length > 0) {
    //         request({ uri: `https://www.levelpalace.com/levels?level_class=Pending&sort=newest&page=2`, headers: { "User-Agent": "lp-helper" } }, function(err, resp, body) {
    //           if (!err && resp.statusCode === 200) {
    //             let $ = cheerio.load(body);

    //             // get number of levels
    //             $("tr", "div.table-container").each(function() {
    //               let level = $(this).attr("tr");
    //               levels.push(level);

    //               // get the remaining number of votes in order to clear out Pending
    //               if ($(this).find("td").length > 0) {
    //                 let rateCount = parseInt($(this).find("td:nth-child(6)").text());
    //                 rates += rateCount;
    //               }
    //             });
    //             levels = levels.slice(1);

    //             // if there is no page 3, do this and stop execution
    //             if ($(`a.padding-right-0[href*='page=3']`).length === 0) {
    //               if ((levels.length * 4) - rates === 1) {
    //                 if (message.channel.type === "dm") {
    //                   console.log(`${message.author.tag} was told in DMs that the Pending section needs ${(levels.length * 4) - rates} more vote in order to clear out all of the levels.`);
    //                 } else if (message.channel.type === "group") {
    //                   console.log(`${message.author.tag} was told in the ${message.channel.name} Group DM that the Pending section needs ${(levels.length * 4) - rates} more vote in order to clear out all of the levels.`);
    //                 } else {
    //                   console.log(`${message.author.tag} was told in #${message.channel.name} of ${message.guild.name} that the Pending section needs ${(levels.length * 4) - rates} more vote in order to clear out all of the levels.`);
    //                 }
    //                 pmsg.edit(`The Pending section needs **${(levels.length * 4) - rates}** more vote in order clear out all of the levels!`);
    //               } else {
    //                 if (message.channel.type === "dm") {
    //                   console.log(`${message.author.tag} was told in DMs that the Pending section needs ${(levels.length * 4) - rates} more votes in order to clear out all of the levels.`);
    //                 } else if (message.channel.type === "group") {
    //                   console.log(`${message.author.tag} was told in the ${message.channel.name} Group DM that the Pending section needs ${(levels.length * 4) - rates} more votes in order to clear out all of the levels.`);
    //                 } else {
    //                   console.log(`${message.author.tag} was told in #${message.channel.name} of ${message.guild.name} that the Pending section needs ${(levels.length * 4) - rates} more votes in order to clear out all of the levels.`);
    //                 }
    //                 pmsg.edit(`The Pending section needs **${(levels.length * 4) - rates}** more votes in order clear out all of the levels!`);
    //               }
    //             }

    //             // check Pending section page 3
    //             if ($("a.padding-right-0[href*='page=3']").length > 0) {
    //               request({ uri: `https://www.levelpalace.com/levels?level_class=Pending&sort=newest&page=3`, headers: { "User-Agent": "lp-helper" } }, function(err, resp, body) {
    //                 if (!err && resp.statusCode === 200) {
    //                   let $ = cheerio.load(body);
                      
    //                   // get number of levels
    //                   $("tr", "div.table-container").each(function() {
    //                     let level = $(this).attr("tr");
    //                     levels.push(level);
      
    //                     // get the remaining number of votes in order to clear out Pending
    //                     if ($(this).find("td").length > 0) {
    //                       let rateCount = parseInt($(this).find("td:nth-child(6)").text());
    //                       rates += rateCount;
    //                     }
    //                   });
    //                   levels = levels.slice(1);
                      
    //                   // do this and stop execution
    //                   if ((levels.length * 4) - rates === 1) {
    //                     if (message.channel.type === "dm") {
    //                       console.log(`${message.author.tag} was told in DMs that the Pending section needs ${(levels.length * 4) - rates} more vote in order to clear out all of the levels.`);
    //                     } else if (message.channel.type === "group") {
    //                       console.log(`${message.author.tag} was told in the ${message.channel.name} Group DM that the Pending section needs ${(levels.length * 4) - rates} more vote in order to clear out all of the levels.`);
    //                     } else {
    //                       console.log(`${message.author.tag} was told in #${message.channel.name} of ${message.guild.name} that the Pending section needs ${(levels.length * 4) - rates} more vote in order to clear out all of the levels.`);
    //                     }
    //                     pmsg.edit(`The Pending section needs **${(levels.length * 4) - rates}** more vote in order clear out all of the levels!`);
    //                   } else {
    //                     if (message.channel.type === "dm") {
    //                       console.log(`${message.author.tag} was told in DMs that the Pending section needs ${(levels.length * 4) - rates} more votes in order to clear out all of the levels.`);
    //                     } else if (message.channel.type === "group") {
    //                       console.log(`${message.author.tag} was told in the ${message.channel.name} Group DM that the Pending section needs ${(levels.length * 4) - rates} more votes in order to clear out all of the levels.`);
    //                     } else {
    //                       console.log(`${message.author.tag} was told in #${message.channel.name} of ${message.guild.name} that the Pending section needs ${(levels.length * 4) - rates} more votes in order to clear out all of the levels.`);
    //                     }
    //                     pmsg.edit(`The Pending section needs **${(levels.length * 4) - rates}** more votes in order clear out all of the levels!`);
    //                   }
    //                 }
    //               });
    //             }
    //           }
    //         });
    //       }
    //     } else {
    //       console.error(`${message.author.username} encountered an error while trying to calculate the remaining number of votes in order to clear out all of the levels in Pending in #${message.channel.name} of ${message.guild.name}.`);
    //       pmsg.edit("An error has occurred, please try again.");
    //     }
    //   });
    // }

    // else if (command === "levelinfo" || command === "pendinginfo") {
    //   log(command);

    //   // let intensiveRating;
    //   let levels = [];
    //   let rates = 0;
    //   let pmsg = await message.channel.send("Checking the Pending section, and calculating the number of votes needed in order to clear out all of the levels...");

    //   // check LP for IR and check Pending section page 1
    //   request({ uri: "https://www.levelpalace.com/levels", timeout: 20000, headers: { "User-Agent": "lp-helper" } }, function(err, resp, body) {
    //     if (!err && resp.statusCode === 200) {
    //       let $ = cheerio.load(body);

    //       if ($("div.navbar-fixed").length === 0) return pmsg.edit("Level Palace is currently **down**, and so this command will not work properly right now. Please try again later!");

    //       // if ($("h5:contains('Intensive rating! No new levels can be published until all of the remaining levels get 4 votes. Please rate some levels!')").length > 0) {
    //       //   intensiveRating = true;
    //       // } else {
    //       //   intensiveRating = false;
    //       // }

    //       // get number of levels if there are any
    //       if ($("td:contains('No levels found.')").length === 0) {
    //         $("tr", "div.table-container").each(function() {
    //           let level = $(this).attr("tr");
    //           levels.push(level);

    //           // get the remaining number of votes in order to clear out Pending
    //           if ($(this).find("td").length > 0) {
    //             let rateCount = parseInt($(this).find("td:nth-child(6)").text());
    //             rates += rateCount;
    //           }
    //         });
    //         levels = levels.slice(1);
    //       }

    //       // if there is no page 2, do this and stop execution
    //       if ($("a.padding-right-0[href*='page=2']").length === 0) {
    //         if (levels.length === 1) {
    //             if ((levels.length * 4) - rates === 1) {
    //               if (message.channel.type === "dm") {
    //                 console.log(`${message.author.tag} was told in DMs that there is ${levels.length} current level in Pending, and that the Pending section needs ${(levels.length * 4) - rates} more vote in order to be cleared out.`);
    //               } else if (message.channel.type === "group") {
    //                 console.log(`${message.author.tag} was told in the ${message.channel.name} Group DM that there is ${levels.length} current level in Pending, and that the Pending section needs ${(levels.length * 4) - rates} more vote in order to be cleared out.`);
    //               } else {
    //                 console.log(`${message.author.tag} was told in #${message.channel.name} of ${message.guild.name} that there is ${levels.length} current level in Pending, and that the Pending section needs ${(levels.length * 4) - rates} more vote in order to be cleared out.`);
    //               }
    //               pmsg.edit(`There is currently **${levels.length}** level in Pending, and the Pending section needs **${(levels.length * 4) - rates}** more vote in order to clear out all of the levels!`);
    //             } else {
    //               if (message.channel.type === "dm") {
    //                 console.log(`${message.author.tag} was told in DMs that there is ${levels.length} current level in Pending, and that the Pending section needs ${(levels.length * 4) - rates} more votes in order to be cleared out.`);
    //               } else if (message.channel.type === "group") {
    //                 console.log(`${message.author.tag} was told in the ${message.channel.name} Group DM that there is ${levels.length} current level in Pending, and that the Pending section needs ${(levels.length * 4) - rates} more votes in order to be cleared out.`);
    //               } else {
    //                 console.log(`${message.author.tag} was told in #${message.channel.name} of ${message.guild.name} that there is ${levels.length} current level in Pending, and that the Pending section needs ${(levels.length * 4) - rates} more votes in order to be cleared out.`);
    //               }
    //               pmsg.edit(`There is currently **${levels.length}** level in Pending, and the Pending section needs **${(levels.length * 4) - rates}** more votes in order to clear out all of the levels!`);
    //             }
    //         } else {
    //           if ((levels.length * 4) - rates === 1) {
    //             if (message.channel.type === "dm") {
    //               console.log(`${message.author.tag} was told in DMs that there are ${levels.length} current levels in Pending, and that the Pending section needs ${(levels.length * 4) - rates} more vote in order to be cleared out.`);
    //             } else if (message.channel.type === "group") {
    //               console.log(`${message.author.tag} was told in the ${message.channel.name} Group DM that there are ${levels.length} current levels in Pending, and that the Pending section needs ${(levels.length * 4) - rates} more vote in order to be cleared out.`);
    //             } else {
    //               console.log(`${message.author.tag} was told in #${message.channel.name} of ${message.guild.name} that there are ${levels.length} current levels in Pending, and that the Pending section needs ${(levels.length * 4) - rates} more vote in order to be cleared out.`);
    //             }
    //             pmsg.edit(`There are currently **${levels.length}** levels in Pending, and the Pending section needs **${(levels.length * 4) - rates}** more vote in order to clear out all of the levels!`);
    //           } else {
    //             if (message.channel.type === "dm") {
    //               console.log(`${message.author.tag} was told in DMs that there are ${levels.length} current levels in Pending, and that the Pending section needs ${(levels.length * 4) - rates} more votes in order to be cleared out.`);
    //             } else if (message.channel.type === "group") {
    //               console.log(`${message.author.tag} was told in the ${message.channel.name} Group DM that there are ${levels.length} current levels in Pending, and that the Pending section needs ${(levels.length * 4) - rates} more votes in order to be cleared out.`);
    //             } else {
    //               console.log(`${message.author.tag} was told in #${message.channel.name} of ${message.guild.name} that there are ${levels.length} current levels in Pending, and that the Pending section needs ${(levels.length * 4) - rates} more votes in order to be cleared out.`);
    //             }
    //             pmsg.edit(`There are currently **${levels.length}** levels in Pending, and the Pending section needs **${(levels.length * 4) - rates}** more votes in order to clear out all of the levels!`);
    //           }
    //         }
    //       }
    //       // check Pending section page 2
    //       if ($("a.padding-right-0[href*='page=2']").length > 0) {
    //         request({ uri: `https://www.levelpalace.com/levels?level_class=Pending&sort=newest&page=2`, headers: { "User-Agent": "lp-helper" } }, function(err, resp, body) {
    //           if (!err && resp.statusCode === 200) {
    //             let $ = cheerio.load(body);

    //             // get number of levels
    //             $("tr", "div.table-container").each(function() {
    //               let level = $(this).attr("tr");
    //               levels.push(level);

    //               // get the remaining number of votes in order to clear out Pending
    //               if ($(this).find("td").length > 0) {
    //                 let rateCount = parseInt($(this).find("td:nth-child(6)").text());
    //                 rates += rateCount;
    //               }
    //             });
    //             levels = levels.slice(1);

    //             // if there is no page 3, do this and stop execution
    //             if ($(`a.padding-right-0[href*='page=3']`).length === 0) {
    //               if (levels.length === 1) {
    //                 if ((levels.length * 4) - rates === 1) {
    //                   if (message.channel.type === "dm") {
    //                     console.log(`${message.author.tag} was told in DMs that there is ${levels.length} current level in Pending, and that the Pending section needs ${(levels.length * 4) - rates} more vote in order to be cleared out.`);
    //                   } else if (message.channel.type === "group") {
    //                     console.log(`${message.author.tag} was told in the ${message.channel.name} Group DM that there is ${levels.length} current level in Pending, and that the Pending section needs ${(levels.length * 4) - rates} more vote in order to be cleared out.`);
    //                   } else {
    //                     console.log(`${message.author.tag} was told in #${message.channel.name} of ${message.guild.name} that there is ${levels.length} current level in Pending, and that the Pending section needs ${(levels.length * 4) - rates} more vote in order to be cleared out.`);
    //                   }
    //                   pmsg.edit(`There is currently **${levels.length}** level in Pending, and the Pending section needs **${(levels.length * 4) - rates}** more vote in order to clear out all of the levels!`);
    //                 } else {
    //                   if (message.channel.type === "dm") {
    //                     console.log(`${message.author.tag} was told in DMs that there is ${levels.length} current level in Pending, and that the Pending section needs ${(levels.length * 4) - rates} more votes in order to be cleared out.`);
    //                   } else if (message.channel.type === "group") {
    //                     console.log(`${message.author.tag} was told in the ${message.channel.name} Group DM that there is ${levels.length} current level in Pending, and that the Pending section needs ${(levels.length * 4) - rates} more votes in order to be cleared out.`);
    //                   } else {
    //                     console.log(`${message.author.tag} was told in #${message.channel.name} of ${message.guild.name} that there is ${levels.length} current level in Pending, and that the Pending section needs ${(levels.length * 4) - rates} more votes in order to be cleared out.`);
    //                   }
    //                   pmsg.edit(`There is currently **${levels.length}** level in Pending, and the Pending section needs **${(levels.length * 4) - rates}** more votes in order to clear out all of the levels!`);
    //                 }
    //               } else {
    //                 if ((levels.length * 4) - rates === 1) {
    //                   if (message.channel.type === "dm") {
    //                     console.log(`${message.author.tag} was told in DMs that there are ${levels.length} current levels in Pending, and that the Pending section needs ${(levels.length * 4) - rates} more vote in order to be cleared out.`);
    //                   } else if (message.channel.type === "group") {
    //                     console.log(`${message.author.tag} was told in the ${message.channel.name} Group DM that there are ${levels.length} current levels in Pending, and that the Pending section needs ${(levels.length * 4) - rates} more vote in order to be cleared out.`);
    //                   } else {
    //                     console.log(`${message.author.tag} was told in #${message.channel.name} of ${message.guild.name} that there are ${levels.length} current levels in Pending, and that the Pending section needs ${(levels.length * 4) - rates} more vote in order to be cleared out.`);
    //                   }
    //                   pmsg.edit(`There are currently **${levels.length}** levels in Pending, and the Pending section needs **${(levels.length * 4) - rates}** more vote in order to clear out all of the levels!`);
    //                 } else {
    //                   if (message.channel.type === "dm") {
    //                     console.log(`${message.author.tag} was told in DMs that there are ${levels.length} current levels in Pending, and that the Pending section needs ${(levels.length * 4) - rates} more votes in order to be cleared out.`);
    //                   } else if (message.channel.type === "group") {
    //                     console.log(`${message.author.tag} was told in the ${message.channel.name} Group DM that there are ${levels.length} current levels in Pending, and that the Pending section needs ${(levels.length * 4) - rates} more votes in order to be cleared out.`);
    //                   } else {
    //                     console.log(`${message.author.tag} was told in #${message.channel.name} of ${message.guild.name} that there are ${levels.length} current levels in Pending, and that the Pending section needs ${(levels.length * 4) - rates} more votes in order to be cleared out.`);
    //                   }
    //                   pmsg.edit(`There are currently **${levels.length}** levels in Pending, and the Pending section needs **${(levels.length * 4) - rates}** more votes in order to clear out all of the levels!`);
    //                 }
    //               }
    //             }

    //             // check Pending section page 3
    //             if ($("a.padding-right-0[href*='page=3']").length > 0) {
    //               request({ uri: `https://www.levelpalace.com/levels?level_class=Pending&sort=newest&page=3`, headers: { "User-Agent": "lp-helper" } }, function(err, resp, body) {
    //                 if (!err && resp.statusCode === 200) {
    //                   let $ = cheerio.load(body);

    //                   // get number of levels
    //                   $("tr", "div.table-container").each(function() {
    //                     let level = $(this).attr("tr");
    //                     levels.push(level);
      
    //                     // get the remaining number of votes in order to clear out Pending
    //                     if ($(this).find("td").length > 0) {
    //                       let rateCount = parseInt($(this).find("td:nth-child(6)").text());
    //                       rates += rateCount;
    //                     }
    //                   });
    //                   levels = levels.slice(1);
                      
    //                   // do this and stop execution
    //                   if (levels.length === 1) {
    //                     if (levels.length === 1) {
    //                       if ((levels.length * 4) - rates === 1) {
    //                         if (message.channel.type === "dm") {
    //                           console.log(`${message.author.tag} was told in DMs that there is ${levels.length} current level in Pending, and that the Pending section needs ${(levels.length * 4) - rates} more vote in order to be cleared out.`);
    //                         } else if (message.channel.type === "group") {
    //                           console.log(`${message.author.tag} was told in the ${message.channel.name} Group DM that there is ${levels.length} current level in Pending, and that the Pending section needs ${(levels.length * 4) - rates} more vote in order to be cleared out.`);
    //                         } else {
    //                           console.log(`${message.author.tag} was told in #${message.channel.name} of ${message.guild.name} that there is ${levels.length} current level in Pending, and that the Pending section needs ${(levels.length * 4) - rates} more vote in order to be cleared out.`);
    //                         }
    //                         pmsg.edit(`There is currently **${levels.length}** level in Pending, and the Pending section needs **${(levels.length * 4) - rates}** more vote in order to clear out all of the levels!`);
    //                       } else {
    //                         if (message.channel.type === "dm") {
    //                           console.log(`${message.author.tag} was told in DMs that there is ${levels.length} current level in Pending, and that the Pending section needs ${(levels.length * 4) - rates} more votes in order to be cleared out.`);
    //                         } else if (message.channel.type === "group") {
    //                           console.log(`${message.author.tag} was told in the ${message.channel.name} Group DM that there is ${levels.length} current level in Pending, and that the Pending section needs ${(levels.length * 4) - rates} more votes in order to be cleared out.`);
    //                         } else {
    //                           console.log(`${message.author.tag} was told in #${message.channel.name} of ${message.guild.name} that there is ${levels.length} current level in Pending, and that the Pending section needs ${(levels.length * 4) - rates} more votes in order to be cleared out.`);
    //                         }
    //                         pmsg.edit(`There is currently **${levels.length}** level in Pending, and the Pending section needs **${(levels.length * 4) - rates}** more votes in order to clear out all of the levels!`);
    //                       }
    //                     } else {
    //                       if ((levels.length * 4) - rates === 1) {
    //                         if (message.channel.type === "dm") {
    //                           console.log(`${message.author.tag} was told in DMs that there are ${levels.length} current levels in Pending, and that the Pending section needs ${(levels.length * 4) - rates} more vote in order to be cleared out.`);
    //                         } else if (message.channel.type === "group") {
    //                           console.log(`${message.author.tag} was told in the ${message.channel.name} Group DM that there are ${levels.length} current levels in Pending, and that the Pending section needs ${(levels.length * 4) - rates} more vote in order to be cleared out.`);
    //                         } else {
    //                           console.log(`${message.author.tag} was told in #${message.channel.name} of ${message.guild.name} that there are ${levels.length} current levels in Pending, and that the Pending section needs ${(levels.length * 4) - rates} more vote in order to be cleared out.`);
    //                         }
    //                         pmsg.edit(`There are currently **${levels.length}** levels in Pending, and the Pending section needs **${(levels.length * 4) - rates}** more vote in order to clear out all of the levels!`);
    //                       } else {
    //                         if (message.channel.type === "dm") {
    //                           console.log(`${message.author.tag} was told in DMs that there are ${levels.length} current levels in Pending, and that the Pending section needs ${(levels.length * 4) - rates} more votes in order to be cleared out.`);
    //                         } else if (message.channel.type === "group") {
    //                           console.log(`${message.author.tag} was told in the ${message.channel.name} Group DM that there are ${levels.length} current levels in Pending, and that the Pending section needs ${(levels.length * 4) - rates} more votes in order to be cleared out.`);
    //                         } else {
    //                           console.log(`${message.author.tag} was told in #${message.channel.name} of ${message.guild.name} that there are ${levels.length} current levels in Pending, and that the Pending section needs ${(levels.length * 4) - rates} more votes in order to be cleared out.`);
    //                         }
    //                         pmsg.edit(`There are currently **${levels.length}** levels in Pending, and the Pending section needs **${(levels.length * 4) - rates}** more votes in order to clear out all of the levels!`);
    //                       }
    //                     }
    //                   }
    //                 }
    //               });
    //             }
    //           }
    //         });
    //       }
    //     } else {
    //       console.error(`${message.author.username} encountered an error while trying to check the amount of Pending levels, and while trying to calculate the number of votes needed in order to clear out all of the levels in Pending in #${message.channel.name} of ${message.guild.name}.`);
    //       pmsg.edit("An error has occurred, please try again.");
    //     }
    //   });
    // }

    else if (command === "randompending" || command === "randomlevel") {
      if (message.guild && message.guild.id === "752287527473381419") return;
      log(command);

      let levellinks = [];
      let levelinfo = [];
      let pmsg = await message.channel.send("Choosing a random Pending level...");

      // check LP for IR and check Pending section page 1
      request({ uri: "https://www.levelpalace.com/levels", timeout: 20000, headers: { "User-Agent": "lp-helper" } }, function(err, resp, body) {
        if (!err && resp.statusCode === 200) {
          let $ = cheerio.load(body);

          if ($("div.navbar-fixed").length === 0) return pmsg.edit("Level Palace is currently **down**, and so this command will not work properly right now. Please try again later!");

          // get number of levels if there are any
          if ($("div.table-container:contains('No levels found.')").length === 0) {
            $("div.card-content", "div.table-container").each(function() {
              if ($(this).find("a").length > 0) {
                let levellink = $(this).find("a[href*='level']").attr("href");
                levellinks.push(levellink);
              }
            });
          }

          // if there is no page 2, do this and stop execution
          if ($("a.padding-right-0[href*='page=2']").length === 0) {

            // if Pending section is empty, do this and stop execution
            if (levellinks.length === 0) {
              if (message.channel.type === "dm") {
                console.log(`${message.author.tag} attempted to pick a random Pending level in DMs, but the Pending section was empty.`);
              } else if (message.channel.type === "group") {
                console.log(`${message.author.tag} attempted to pick a random Pending level in the ${message.channel.name} Group DM, but the Pending section was empty.`);
              } else {
                console.log(`${message.author.tag} attempted to pick a random Pending level in #${message.channel.name} of ${message.guild.name}, but the Pending section was empty.`);
              }
              return pmsg.edit("There are no current levels in Pending, so a random level cannot be picked!");
            }

            // get random level link
            let randomlink = levellinks[Math.floor(Math.random() * levellinks.length)];

            request({ uri: `https://www.levelpalace.com/${randomlink}`, headers: { "User-Agent": "lp-helper" } }, function(err, resp, body) {
              if (!err && resp.statusCode === 200) {
                let $ = cheerio.load(body);

                // get level title
                $("p.truncate", "div.nav-wrapper").each(function() {
                  let title = $(this).text().trim();
                  levelinfo.push(title);
                });

                // get author stats and level stats
                $("ul.level-stats", "div.level-info").each(function() {
                  // get author name
                  let author = $("p.user-username").text().trim();
                  levelinfo.push(author);

                  // get author status
                  let status = $("p.user-class").text().trim();
                  levelinfo.push(status);

                  // get author rank
                  let rank = $("p.user-rank").text().trim();
                  levelinfo.push(rank);

                  // get all level stats
                  $("li.collection-item", "ul.level-stats").each(function() {
                    let stat = $(this).text().trim().split(" ").slice(1).join(" ");
                    levelinfo.push(stat);
                  });
                });

                // get level image if one exists
                $("img[src]", "ul.slides").each(function() {
                  let levelimage = $(this).attr("src");
                  urlExists(levelimage, function(err, exists) {
                    if (!err) {
                      if (!exists) {
                        levelimage = "https://i.imgur.com/2E8BWdV.png";
                      }
                    } else {
                      levelimage = "https://i.imgur.com/2E8BWdV.png";
                    }
                  });
                  levelinfo.push(levelimage);
                });

                // add dummy level image if one is still not added
                if (!levelinfo[levelinfo.length - 1].includes("http")) levelinfo.push("https://i.imgur.com/2E8BWdV.png");

                if (levelinfo[10].trim() === "See description") {
                  if (message.channel.type === "dm") {
                    console.log(`${message.author.tag} requested a random Pending level in DMs, and "${levelinfo[0]}" by ${levelinfo[1]} was chosen.`);
                  } else if (message.channel.type === "group") {
                    console.log(`${message.author.tag} requested a random Pending level in the ${message.channel.name} Group DM, and "${levelinfo[0]}" by ${levelinfo[1]} was chosen.`);
                  } else {
                    console.log(`${message.author.tag} requested a random Pending level in #${message.channel.name} of ${message.guild.name}, and "${levelinfo[0]}" by ${levelinfo[1]} was chosen.`);
                  }
                  pmsg.edit({ content: "Here is the level I picked:", embed: {
                    color: 3447003,
                    thumbnail: {
                      url: levelinfo[levelinfo.length - 1]
                    },
                    fields: [
                      {
                        name: "Name",
                        value: levelinfo[0]
                      },
                      {
                        name: "Author",
                        value: `${levelinfo[1]}\n(${levelinfo[2]}, ${levelinfo[3]})`
                      },
                      {
                        name: "Rating",
                        value: levelinfo[6],
                        inline: true
                      },
                      {
                        name: "Votes",
                        value: levelinfo[7],
                        inline: true
                      },
                      {
                        name: "Plays",
                        value: levelinfo[8],
                        inline: true
                      },
                      {
                        name: "Favorites",
                        value: levelinfo[9].split(" ").slice(1).join(" "),
                        inline: true
                      },
                      {
                        name: "Game",
                        value: "In Description",
                        inline: true
                      },
                      {
                        name: "Difficulty",
                        value: levelinfo[11],
                        inline: true
                      },
                      {
                        name: "Published on",
                        value: `${levelinfo[12]} (EST/EDT)`,
                        inline: true
                      },
                      {
                        name: "Link",
                        value: `<https://www.levelpalace.com/${randomlink}>`,
                        inline: true
                      }
                    ]
                  }}).catch(err => {
                    pmsg.edit("**An error occurred while trying to edit this message:**```" + err + "```");
                  });
                  
                  // pmsg.edit(`Random Pending level chosen!\n\n**${levelinfo[0]}**\nBy: **${levelinfo[1]}** (**${levelinfo[2]}**, **${levelinfo[3]}**)\n\nThis level's rating is **${levelinfo[6]}**, it has **${levelinfo[7]}** vote(s), **${levelinfo[8]}** play(s), **${levelinfo[9].split(" ").slice(1).join(" ")}** favorite(s), its required game is in the description, its difficulty is **${levelinfo[11]}**, and it was published on **${levelinfo[12]}** (EST/EDT)!\n\nYou can go check out and possibly review the level here:\n<https://www.levelpalace.com/${randomlink}>`).catch(err => {
                  //   pmsg.edit("**An error occurred while trying to edit this message:**```" + err + "```");
                  // });
                } else {
                  if (message.channel.type === "dm") {
                    console.log(`${message.author.tag} requested a random Pending level in DMs, and "${levelinfo[0]}" by ${levelinfo[1]} was chosen.`);
                  } else if (message.channel.type === "group") {
                    console.log(`${message.author.tag} requested a random Pending level in the ${message.channel.name} Group DM, and "${levelinfo[0]}" by ${levelinfo[1]} was chosen.`);
                  } else {
                    console.log(`${message.author.tag} requested a random Pending level in #${message.channel.name} of ${message.guild.name}, and "${levelinfo[0]}" by ${levelinfo[1]} was chosen.`);
                  }
                  pmsg.edit({ content: "Here is the level I picked:", embed: {
                    color: 3447003,
                    thumbnail: {
                      url: levelinfo[levelinfo.length - 1]
                    },
                    fields: [
                      {
                        name: "Name",
                        value: levelinfo[0]
                      },
                      {
                        name: "Author",
                        value: `${levelinfo[1]}\n(${levelinfo[2]}, ${levelinfo[3]})`
                      },
                      {
                        name: "Rating",
                        value: levelinfo[6],
                        inline: true
                      },
                      {
                        name: "Votes",
                        value: levelinfo[7],
                        inline: true
                      },
                      {
                        name: "Plays",
                        value: levelinfo[8],
                        inline: true
                      },
                      {
                        name: "Favorites",
                        value: levelinfo[9].split(" ").slice(1).join(" "),
                        inline: true
                      },
                      {
                        name: "Game",
                        value: levelinfo[10].trim(),
                        inline: true
                      },
                      {
                        name: "Difficulty",
                        value: levelinfo[11],
                        inline: true
                      },
                      {
                        name: "Published on",
                        value: `${levelinfo[12]} (EST/EDT)`,
                        inline: true
                      },
                      {
                        name: "Link",
                        value: `<https://www.levelpalace.com/${randomlink}>`,
                        inline: true
                      }
                    ]
                  }}).catch(err => {
                    pmsg.edit("**An error occurred while trying to edit this message:**```" + err + "```");
                  });

                  // pmsg.edit(`Random Pending level chosen!\n\n**${levelinfo[0]}**\nBy: **${levelinfo[1]}** (**${levelinfo[2]}**, **${levelinfo[3]}**)\n\nThis level's rating is **${levelinfo[6]}**, it has **${levelinfo[7]}** vote(s), **${levelinfo[8]}** play(s), **${levelinfo[9].split(" ").slice(1).join(" ")}** favorite(s), its required game is **${levelinfo[10].trim()}**, its difficulty is **${levelinfo[11]}**, and it was published on **${levelinfo[12]}** (EST/EDT)!\n\nYou can go check out and possibly review the level here:\n<https://www.levelpalace.com/${randomlink}>`).catch(err => {
                  //   pmsg.edit("**An error occurred while trying to edit this message:**```" + err + "```");
                  // });
                }
              }
            });
          }

          // check Pending section page 2
          if ($("a.padding-right-0[href*='page=2']").length > 0) {
            request({ uri: `https://www.levelpalace.com/levels?level_class=Pending&sort=newest&page=2`, headers: { "User-Agent": "lp-helper" } }, function(err, resp, body) {
              if (!err && resp.statusCode === 200) {
                let $ = cheerio.load(body);

                // get number of levels
                if ($("td:contains('No levels found.')").length === 0) {
                  $("div.card-content", "div.table-container").each(function() {
                    if ($(this).find("a").length > 0) {
                      let levellink = $(this).find("a[href*='level']").attr("href");
                      levellinks.push(levellink);
                    }
                  });
                }

                // if there is no page 3, do this and stop execution
                if ($(`a.padding-right-0[href*='page=3']`).length === 0) {
                  // get random level link
                  let randomlink = levellinks[Math.floor(Math.random() * levellinks.length)];

                  request({ uri: `https://www.levelpalace.com/${randomlink}`, headers: { "User-Agent": "lp-helper" } }, function(err, resp, body) {
                    if (!err && resp.statusCode === 200) {
                      let $ = cheerio.load(body);

                      // get level title
                      $("p.truncate", "div.nav-wrapper").each(function() {
                        let title = $(this).text().trim();
                        levelinfo.push(title);
                      });

                      // get author stats and level stats
                      $("ul.level-stats", "div.level-info").each(function() {
                        // get author name
                        let author = $("p.user-username").text().trim();
                        levelinfo.push(author);

                        // get author status
                        let status = $("p.user-class").text().trim();
                        levelinfo.push(status);

                        // get author rank
                        let rank = $("p.user-rank").text().trim();
                        levelinfo.push(rank);

                        // get all level stats
                        $("li.collection-item", "ul.level-stats").each(function() {
                          let stat = $(this).text().trim().split(" ").slice(1).join(" ");
                          levelinfo.push(stat);
                        });
                      });

                      // get level image if one exists
                      $("img[src]", "ul.slides").each(function() {
                        let levelimage = $(this).attr("src");
                        urlExists(levelimage, function(err, exists) {
                          if (!err) {
                            if (!exists) {
                              levelimage = "https://i.imgur.com/2E8BWdV.png";
                            }
                          } else {
                            levelimage = "https://i.imgur.com/2E8BWdV.png";
                          }
                        });
                        levelinfo.push(levelimage);
                      });

                      // add dummy level image if one is still not added
                      if (!levelinfo[levelinfo.length - 1].includes("http")) levelinfo.push("https://i.imgur.com/2E8BWdV.png");

                      if (levelinfo[10].trim() === "See description") {
                        if (message.channel.type === "dm") {
                          console.log(`${message.author.tag} requested a random Pending level in DMs, and "${levelinfo[0]}" by ${levelinfo[1]} was chosen.`);
                        } else if (message.channel.type === "group") {
                          console.log(`${message.author.tag} requested a random Pending level in the ${message.channel.name} Group DM, and "${levelinfo[0]}" by ${levelinfo[1]} was chosen.`);
                        } else {
                          console.log(`${message.author.tag} requested a random Pending level in #${message.channel.name} of ${message.guild.name}, and "${levelinfo[0]}" by ${levelinfo[1]} was chosen.`);
                        }
                        pmsg.edit({ content: "Here is the level I picked:", embed: {
                          color: 3447003,
                          thumbnail: {
                            url: levelinfo[levelinfo.length - 1]
                          },
                          fields: [
                            {
                              name: "Name",
                              value: levelinfo[0]
                            },
                            {
                              name: "Author",
                              value: `${levelinfo[1]}\n(${levelinfo[2]}, ${levelinfo[3]})`
                            },
                            {
                              name: "Rating",
                              value: levelinfo[6],
                              inline: true
                            },
                            {
                              name: "Votes",
                              value: levelinfo[7],
                              inline: true
                            },
                            {
                              name: "Plays",
                              value: levelinfo[8],
                              inline: true
                            },
                            {
                              name: "Favorites",
                              value: levelinfo[9].split(" ").slice(1).join(" "),
                              inline: true
                            },
                            {
                              name: "Game",
                              value: "In Description",
                              inline: true
                            },
                            {
                              name: "Difficulty",
                              value: levelinfo[11],
                              inline: true
                            },
                            {
                              name: "Published on",
                              value: `${levelinfo[12]} (EST/EDT)`,
                              inline: true
                            },
                            {
                              name: "Link",
                              value: `<https://www.levelpalace.com/${randomlink}>`,
                              inline: true
                            }
                          ]
                        }}).catch(err => {
                          pmsg.edit("**An error occurred while trying to edit this message:**```" + err + "```");
                        });

                        // pmsg.edit(`Random Pending level chosen!\n\n**${levelinfo[0]}**\nBy: **${levelinfo[1]}** (**${levelinfo[2]}**, **${levelinfo[3]}**)\n\nThis level's rating is **${levelinfo[6]}**, it has **${levelinfo[7]}** vote(s), **${levelinfo[8]}** play(s), **${levelinfo[9].split(" ").slice(1).join(" ")}** favorite(s), its required game is in the description, its difficulty is **${levelinfo[11]}**, and it was published on **${levelinfo[12]}** (EST/EDT)!\n\nYou can go check out and possibly review the level here:\nhttps://www.levelpalace.com/${randomlink}`).catch(err => {
                        //   pmsg.edit("**An error occurred while trying to edit this message:**```" + err + "```");
                        // });
                      } else {
                        if (message.channel.type === "dm") {
                          console.log(`${message.author.tag} requested a random Pending level in DMs, and "${levelinfo[0]}" by ${levelinfo[1]} was chosen.`);
                        } else if (message.channel.type === "group") {
                          console.log(`${message.author.tag} requested a random Pending level in the ${message.channel.name} Group DM, and "${levelinfo[0]}" by ${levelinfo[1]} was chosen.`);
                        } else {
                          console.log(`${message.author.tag} requested a random Pending level in #${message.channel.name} of ${message.guild.name}, and "${levelinfo[0]}" by ${levelinfo[1]} was chosen.`);
                        }
                        pmsg.edit({ content: "Here is the level I picked:", embed: {
                          color: 3447003,
                          thumbnail: {
                            url: levelinfo[levelinfo.length - 1]
                          },
                          fields: [
                            {
                              name: "Name",
                              value: levelinfo[0]
                            },
                            {
                              name: "Author",
                              value: `${levelinfo[1]}\n(${levelinfo[2]}, ${levelinfo[3]})`
                            },
                            {
                              name: "Rating",
                              value: levelinfo[6],
                              inline: true
                            },
                            {
                              name: "Votes",
                              value: levelinfo[7],
                              inline: true
                            },
                            {
                              name: "Plays",
                              value: levelinfo[8],
                              inline: true
                            },
                            {
                              name: "Favorites",
                              value: levelinfo[9].split(" ").slice(1).join(" "),
                              inline: true
                            },
                            {
                              name: "Game",
                              value: levelinfo[10].trim(),
                              inline: true
                            },
                            {
                              name: "Difficulty",
                              value: levelinfo[11],
                              inline: true
                            },
                            {
                              name: "Published on",
                              value: `${levelinfo[12]} (EST/EDT)`,
                              inline: true
                            },
                            {
                              name: "Link",
                              value: `<https://www.levelpalace.com/${randomlink}>`,
                              inline: true
                            }
                          ]
                        }}).catch(err => {
                          pmsg.edit("**An error occurred while trying to edit this message:**```" + err + "```");
                        });

                        // pmsg.edit(`Random Pending level chosen!\n\n**${levelinfo[0]}**\nBy: **${levelinfo[1]}** (**${levelinfo[2]}**, **${levelinfo[3]}**)\n\nThis level's rating is **${levelinfo[6]}**, it has **${levelinfo[7]}** vote(s), **${levelinfo[8]}** play(s), **${levelinfo[9].split(" ").slice(1).join(" ")}** favorite(s), its required game is **${levelinfo[10].trim()}**, its difficulty is **${levelinfo[11]}**, and it was published on **${levelinfo[12]}** (EST/EDT)!\n\nYou can go check out and possibly review the level here:\nhttps://www.levelpalace.com/${randomlink}`).catch(err => {
                        //   pmsg.edit("**An error occurred while trying to edit this message:**```" + err + "```");
                        // });
                      }
                    }
                  });
                }

                // check Pending section page 3
                if ($("a.padding-right-0[href*='page=3']").length > 0) {
                  request({ uri: `https://www.levelpalace.com/levels?level_class=Pending&sort=newest&page=3`, headers: { "User-Agent": "lp-helper" } }, function(err, resp, body) {
                    if (!err && resp.statusCode === 200) {
                      let $ = cheerio.load(body);

                      // get number of levels
                      if ($("td:contains('No levels found.')").length === 0) {
                        $("div.card-content", "div.table-container").each(function() {
                          if ($(this).find("a").length > 0) {
                            let levellink = $(this).find("a[href*='level']").attr("href");
                            levellinks.push(levellink);
                          }
                        });
                      }
                      
                      // do this and stop execution
                      // get random level link
                      let randomlink = levellinks[Math.floor(Math.random() * levellinks.length)];

                      request({ uri: `https://www.levelpalace.com/${randomlink}`, headers: { "User-Agent": "lp-helper" } }, function(err, resp, body) {
                        if (!err && resp.statusCode === 200) {
                          let $ = cheerio.load(body);

                          // get level title
                          $("p.truncate", "div.nav-wrapper").each(function() {
                            let title = $(this).text().trim();
                            levelinfo.push(title);
                          });

                          // get author stats and level stats
                          $("ul.level-stats", "div.level-info").each(function() {
                            // get author name
                            let author = $("p.user-username").text().trim();
                            levelinfo.push(author);

                            // get author status
                            let status = $("p.user-class").text().trim();
                            levelinfo.push(status);

                            // get author rank
                            let rank = $("p.user-rank").text().trim();
                            levelinfo.push(rank);

                            // get all level stats
                            $("li.collection-item", "ul.level-stats").each(function() {
                              let stat = $(this).text().trim().split(" ").slice(1).join(" ");
                              levelinfo.push(stat);
                            });
                          });

                          // get level image if one exists
                          $("img[src]", "ul.slides").each(function() {
                            let levelimage = $(this).attr("src");
                            urlExists(levelimage, function(err, exists) {
                              if (!err) {
                                if (!exists) {
                                  levelimage = "https://i.imgur.com/2E8BWdV.png";
                                }
                              } else {
                                levelimage = "https://i.imgur.com/2E8BWdV.png";
                              }
                            });
                            levelinfo.push(levelimage);
                          });

                          // add dummy level image if one is still not added
                          if (!levelinfo[levelinfo.length - 1].includes("http")) levelinfo.push("https://i.imgur.com/2E8BWdV.png");

                          if (levelinfo[10].trim() === "See description") {
                            if (message.channel.type === "dm") {
                              console.log(`${message.author.tag} requested a random Pending level in DMs, and "${levelinfo[0]}" by ${levelinfo[1]} was chosen.`);
                            } else if (message.channel.type === "group") {
                              console.log(`${message.author.tag} requested a random Pending level in the ${message.channel.name} Group DM, and "${levelinfo[0]}" by ${levelinfo[1]} was chosen.`);
                            } else {
                              console.log(`${message.author.tag} requested a random Pending level in #${message.channel.name} of ${message.guild.name}, and "${levelinfo[0]}" by ${levelinfo[1]} was chosen.`);
                            }
                            pmsg.edit({ content: "Here is the level I picked:", embed: {
                              color: 3447003,
                              thumbnail: {
                                url: levelinfo[levelinfo.length - 1]
                              },
                              fields: [
                                {
                                  name: "Name",
                                  value: levelinfo[0]
                                },
                                {
                                  name: "Author",
                                  value: `${levelinfo[1]}\n(${levelinfo[2]}, ${levelinfo[3]})`
                                },
                                {
                                  name: "Rating",
                                  value: levelinfo[6],
                                  inline: true
                                },
                                {
                                  name: "Votes",
                                  value: levelinfo[7],
                                  inline: true
                                },
                                {
                                  name: "Plays",
                                  value: levelinfo[8],
                                  inline: true
                                },
                                {
                                  name: "Favorites",
                                  value: levelinfo[9].split(" ").slice(1).join(" "),
                                  inline: true
                                },
                                {
                                  name: "Game",
                                  value: "In Description",
                                  inline: true
                                },
                                {
                                  name: "Difficulty",
                                  value: levelinfo[11],
                                  inline: true
                                },
                                {
                                  name: "Published on",
                                  value: `${levelinfo[12]} (EST/EDT)`,
                                  inline: true
                                },
                                {
                                  name: "Link",
                                  value: `<https://www.levelpalace.com/${randomlink}>`,
                                  inline: true
                                }
                              ]
                            }}).catch(err => {
                              pmsg.edit("**An error occurred while trying to edit this message:**```" + err + "```");
                            });

                            // pmsg.edit(`Random Pending level chosen!\n\n**${levelinfo[0]}**\nBy: **${levelinfo[1]}** (**${levelinfo[2]}**, **${levelinfo[3]}**)\n\nThis level's rating is **${levelinfo[6]}**, it has **${levelinfo[7]}** vote(s), **${levelinfo[8]}** play(s), **${levelinfo[9].split(" ").slice(1).join(" ")}** favorite(s), its required game is in the description, its difficulty is **${levelinfo[11]}**, and it was published on **${levelinfo[12]}** (EST/EDT)!\n\nYou can go check out and possibly review the level here:\n<https://www.levelpalace.com/${randomlink}>`).catch(err => {
                            //   pmsg.edit("**An error occurred while trying to edit this message:**```" + err + "```");
                            // });
                          } else {
                            if (message.channel.type === "dm") {
                              console.log(`${message.author.tag} requested a random Pending level in DMs, and "${levelinfo[0]}" by ${levelinfo[1]} was chosen.`);
                            } else if (message.channel.type === "group") {
                              console.log(`${message.author.tag} requested a random Pending level in the ${message.channel.name} Group DM, and "${levelinfo[0]}" by ${levelinfo[1]} was chosen.`);
                            } else {
                              console.log(`${message.author.tag} requested a random Pending level in #${message.channel.name} of ${message.guild.name}, and "${levelinfo[0]}" by ${levelinfo[1]} was chosen.`);
                            }
                            pmsg.edit({ content: "Here is the level I picked:", embed: {
                              color: 3447003,
                              thumbnail: {
                                url: levelinfo[levelinfo.length - 1]
                              },
                              fields: [
                                {
                                  name: "Name",
                                  value: levelinfo[0]
                                },
                                {
                                  name: "Author",
                                  value: `${levelinfo[1]}\n(${levelinfo[2]}, ${levelinfo[3]})`
                                },
                                {
                                  name: "Rating",
                                  value: levelinfo[6],
                                  inline: true
                                },
                                {
                                  name: "Votes",
                                  value: levelinfo[7],
                                  inline: true
                                },
                                {
                                  name: "Plays",
                                  value: levelinfo[8],
                                  inline: true
                                },
                                {
                                  name: "Favorites",
                                  value: levelinfo[9].split(" ").slice(1).join(" "),
                                  inline: true
                                },
                                {
                                  name: "Game",
                                  value: levelinfo[10].trim(),
                                  inline: true
                                },
                                {
                                  name: "Difficulty",
                                  value: levelinfo[11],
                                  inline: true
                                },
                                {
                                  name: "Published on",
                                  value: `${levelinfo[12]} (EST/EDT)`,
                                  inline: true
                                },
                                {
                                  name: "Link",
                                  value: `<https://www.levelpalace.com/${randomlink}>`,
                                  inline: true
                                }
                              ]
                            }}).catch(err => {
                              pmsg.edit("**An error occurred while trying to edit this message:**```" + err + "```");
                            });

                            // pmsg.edit(`Random Pending level chosen!\n\n**${levelinfo[0]}**\nBy: **${levelinfo[1]}** (**${levelinfo[2]}**, **${levelinfo[3]}**)\n\nThis level's rating is **${levelinfo[6]}**, it has **${levelinfo[7]}** vote(s), **${levelinfo[8]}** play(s), **${levelinfo[9].split(" ").slice(1).join(" ")}** favorite(s), its required game is **${levelinfo[10].trim()}**, its difficulty is **${levelinfo[11]}**, and it was published on **${levelinfo[12]}** (EST/EDT)!\n\nYou can go check out and possibly review the level here:\n<https://www.levelpalace.com/${randomlink}>`).catch(err => {
                            //   pmsg.edit("**An error occurred while trying to edit this message:**```" + err + "```");
                            // });
                          }
                        }
                      });
                    }
                  });
                }
              }
            });
          }
        } else {
          console.error(`${message.author.username} encountered an error while trying to choose a random Pending level in #${message.channel.name} of ${message.guild.name}.`);
          pmsg.edit("An error has occurred, please try again.");
        }
      });
    }

    else if (command === "game" || command === "lpgame") {
      if (message.guild && message.guild.id === "752287527473381419") return;
      if (!args) return message.channel.send("You must include a game for me to find and link!");
      if (args.length > 500) return message.channel.send("Please enter a game name consisting of 500 characters or less!");

      log(command);

      let game = args.replace(/\s/g, "").toLowerCase();

      // define lp games with links
      if (game === "smf1" || game === "supermarioflash1" || game === "supermarioflash" || game === "smf") {
        if (message.channel.type === "dm") {
          console.log(`${message.author.tag} requested a link to Super Mario Flash in DMs.`);
        } else if (message.channel.type === "group") {
          console.log(`${message.author.tag} requested a link to Super Mario Flash in the ${message.channel.name} Group DM.`);
        } else {
          console.log(`${message.author.tag} requested a link to Super Mario Flash in #${message.channel.name} of ${message.guild.name}.`);
        }
        message.channel.send("Link to Super Mario Flash:\nhttps://www.levelpalace.com/game?id=1");
      } else if (game === "smb2" || game === "smb2flash" || game === "supermariobros2" || game === "supermariobros2flash" || game === "smb2edition" || game === "supermariobros2edition" || game === "smb2flash" || game === "supermariobros2" || game === "supermariobros2flash" || game === "smb2edition" || game === "supermariobros2edition") {
        if (message.channel.type === "dm") {
          console.log(`${message.author.tag} requested a link to both Super Mario Bros 2 Editions in DMs.`);
        } else if (message.channel.type === "group") {
          console.log(`${message.author.tag} requested a link to both Super Mario Bros 2 Editions in the ${message.channel.name} Group DM.`);
        } else {
          console.log(`${message.author.tag} requested a link to both Super Mario Bros 2 Editions in #${message.channel.name} of ${message.guild.name}.`);
        }
        message.channel.send("Links to both Super Mario Bros 2 Editions:\n\n**SMF1 Version:**\nhttps://www.levelpalace.com/game?id=2\n**SMF2 Version:**\nhttps://www.levelpalace.com/game?id=47");
      } else if (game === "smf1smb2" || game === "smb2smf1" || game === "smf1smb2flash" || game === "smf1supermariobros2" || game === "smf1supermariobros2flash" || game === "smf1smb2edition" || game === "smf1supermariobros2edition" || game === "smb2flashsmf1" || game === "supermariobros2smf1" || game === "supermariobros2flashsmf1" || game === "smb2editionsmf1" || game === "supermariobros2editionsmf1") {
        if (message.channel.type === "dm") {
          console.log(`${message.author.tag} requested a link to Super Mario Bros 2 Edition (SMF1) in DMs.`);
        } else if (message.channel.type === "group") {
          console.log(`${message.author.tag} requested a link to Super Mario Bros 2 Edition (SMF1) in the ${message.channel.name} Group DM.`);
        } else {
          console.log(`${message.author.tag} requested a link to Super Mario Bros 2 Edition (SMF1) in #${message.channel.name} of ${message.guild.name}.`);
        }
        message.channel.send("Link to Super Mario Bros 2 Edition (SMF1):\nhttps://www.levelpalace.com/game?id=2");
      } else if (game === "smf2smb2" || game === "smb2smf2" || game === "smf2smb2flash" || game === "smf2supermariobros2" || game === "smf2supermariobros2flash" || game === "smf2smb2edition" || game === "smf2supermariobros2edition" || game === "smb2flashsmf2" || game === "supermariobros2smf2" || game === "supermariobros2flashsmf2" || game === "smb2editionsmf2" || game === "supermariobros2editionsmf2") {
        if (message.channel.type === "dm") {
          console.log(`${message.author.tag} requested a link to Super Mario Bros 2 Edition (SMF2) in DMs.`);
        } else if (message.channel.type === "group") {
          console.log(`${message.author.tag} requested a link to Super Mario Bros 2 Edition (SMF2) in the ${message.channel.name} Group DM.`);
        } else {
          console.log(`${message.author.tag} requested a link to Super Mario Bros 2 Edition (SMF2) in #${message.channel.name} of ${message.guild.name}.`);
        }
        message.channel.send("Link to Super Mario Bros 2 Edition (SMF2):\nhttps://www.levelpalace.com/game?id=47");
      } else if (game === "pyrogenic" || game === "pyrogenicedition" || game === "pyrogenicflash") {
        if (message.channel.type === "dm") {
          console.log(`${message.author.tag} requested a link to Pyrogenic Edition in DMs.`);
        } else if (message.channel.type === "group") {
          console.log(`${message.author.tag} requested a link to Pyrogenic Edition in the ${message.channel.name} Group DM.`);
        } else {
          console.log(`${message.author.tag} requested a link to Pyrogenic Edition in #${message.channel.name} of ${message.guild.name}.`);
        }
        message.channel.send("Link to Pyrogenic Edition:\nhttps://www.levelpalace.com/game?id=3");
      } else if (game === "smbf" || game === "smb" || game === "supermariobros" || game === "supermariobrosflash" || game === "supermariobrosedition") {
        if (message.channel.type === "dm") {
          console.log(`${message.author.tag} requested a link to Super Mario Bros Edition in DMs.`);
        } else if (message.channel.type === "group") {
          console.log(`${message.author.tag} requested a link to Super Mario Bros Edition in the ${message.channel.name} Group DM.`);
        } else {
          console.log(`${message.author.tag} requested a link to Super Mario Bros Edition in #${message.channel.name} of ${message.guild.name}.`);
        }
        message.channel.send("Link to Super Mario Bros Edition:\nhttps://www.levelpalace.com/game?id=4");
      } else if (game === "egyptian" || game === "egyptianedition" || game === "egyptianflash") {
        if (message.channel.type === "dm") {
          console.log(`${message.author.tag} requested a link to Egyptian Edition in DMs.`);
        } else if (message.channel.type === "group") {
          console.log(`${message.author.tag} requested a link to Egyptian Edition in the ${message.channel.name} Group DM.`);
        } else {
          console.log(`${message.author.tag} requested a link to Egyptian Edition in #${message.channel.name} of ${message.guild.name}.`);
        }
        message.channel.send("Link to Egyptian Edition:\nhttps://www.levelpalace.com/game?id=5");
      } else if (game === "urban" || game === "urbanedition" || game === "urbanflash") {
        if (message.channel.type === "dm") {
          console.log(`${message.author.tag} requested a link to Urban Edition in DMs.`);
        } else if (message.channel.type === "group") {
          console.log(`${message.author.tag} requested a link to Urban Edition in the ${message.channel.name} Group DM.`);
        } else {
          console.log(`${message.author.tag} requested a link to Urban Edition in #${message.channel.name} of ${message.guild.name}.`);
        }
        message.channel.send("Link to Urban Edition:\nhttps://www.levelpalace.com/game?id=6");
      } else if (game === "snow" || game === "snowedition" || game === "snowflash") {
        if (message.channel.type === "dm") {
          console.log(`${message.author.tag} requested a link to Snow Edition in DMs.`);
        } else if (message.channel.type === "group") {
          console.log(`${message.author.tag} requested a link to Snow Edition in the ${message.channel.name} Group DM.`);
        } else {
          console.log(`${message.author.tag} requested a link to Snow Edition in #${message.channel.name} of ${message.guild.name}.`);
        }
        message.channel.send("Link to Snow Edition:\nhttps://www.levelpalace.com/game?id=7");
      } else if (game === "castle" || game === "castleedition" || game === "castleflash") {
        if (message.channel.type === "dm") {
          console.log(`${message.author.tag} requested a link to Castle Edition in DMs.`);
        } else if (message.channel.type === "group") {
          console.log(`${message.author.tag} requested a link to Castle Edition in the ${message.channel.name} Group DM.`);
        } else {
          console.log(`${message.author.tag} requested a link to Castle Edition in #${message.channel.name} of ${message.guild.name}.`);
        }
        message.channel.send("Link to Castle Edition:\nhttps://www.levelpalace.com/game?id=8");
      } else if (game === "cave" || game === "caveedition" || game === "caveflash") {
        if (message.channel.type === "dm") {
          console.log(`${message.author.tag} requested a link to Cave Edition in DMs.`);
        } else if (message.channel.type === "group") {
          console.log(`${message.author.tag} requested a link to Cave Edition in the ${message.channel.name} Group DM.`);
        } else {
          console.log(`${message.author.tag} requested a link to Cave Edition in #${message.channel.name} of ${message.guild.name}.`);
        }
        message.channel.send("Link to Cave Edition:\nhttps://www.levelpalace.com/game?id=9");
      } else if (game === "cartoon"  || game === "cartoonedition" || game === "cartoonflash" || game === "supercartoon" || game === "supercartoonedition" || game === "supercartoonflash") {
        if (message.channel.type === "dm") {
          console.log(`${message.author.tag} requested a link to Super Cartoon Flash in DMs.`);
        } else if (message.channel.type === "group") {
          console.log(`${message.author.tag} requested a link to Super Cartoon Flash in the ${message.channel.name} Group DM.`);
        } else {
          console.log(`${message.author.tag} requested a link to Super Cartoon Flash in #${message.channel.name} of ${message.guild.name}.`);
        }
        message.channel.send("Link to Super Cartoon Flash:\nhttps://www.levelpalace.com/game?id=32");
      } else if (game === "toad" || game === "toadedition" || game === "toadflash" || game === "supertoad" || game === "supertoadedition" || game === "supertoadflash") {
        if (message.channel.type === "dm") {
          console.log(`${message.author.tag} requested a link to Super Toad Flash in DMs.`);
        } else if (message.channel.type === "group") {
          console.log(`${message.author.tag} requested a link to Super Toad Flash in the ${message.channel.name} Group DM.`);
        } else {
          console.log(`${message.author.tag} requested a link to Super Toad Flash in #${message.channel.name} of ${message.guild.name}.`);
        }
        message.channel.send("Link to Super Toad Flash:\nhttps://www.levelpalace.com/game?id=33");
      } else if (game === "fast" || game === "fastmario" || game === "fastmarioedition" || game === "fastmarioflash") {
        if (message.channel.type === "dm") {
          console.log(`${message.author.tag} requested a link to Fast Mario Edition in DMs.`);
        } else if (message.channel.type === "group") {
          console.log(`${message.author.tag} requested a link to Fast Mario Edition in the ${message.channel.name} Group DM.`);
        } else {
          console.log(`${message.author.tag} requested a link to Fast Mario Edition in #${message.channel.name} of ${message.guild.name}.`);
        }
        message.channel.send("Link to Fast Mario Edition:\nhttps://www.levelpalace.com/game?id=35");
      } else if (game === "smfgalaxy" || game === "galaxy" || game === "smfgalaxyedition" || game === "smfgalaxyflash" || game === "smf1galaxyedition" || game === "smf1galaxyflash" || game === "galaxyedition" || game === "galaxyflash") {
        if (message.channel.type === "dm") {
          console.log(`${message.author.tag} requested a link to SMF Galaxy Edition in DMs.`);
        } else if (message.channel.type === "group") {
          console.log(`${message.author.tag} requested a link to SMF Galaxy Edition in the ${message.channel.name} Group DM.`);
        } else {
          console.log(`${message.author.tag} requested a link to SMF Galaxy Edition in #${message.channel.name} of ${message.guild.name}.`);
        }
        message.channel.send("Link to SMF Galaxy Edition:\nhttps://www.levelpalace.com/game?id=36");
      } else if (game === "smfland" || game === "land" || game === "smflandedition" || game === "smflandflash" || game === "smf1landedition" || game === "smf1landflash" || game === "landedition" || game === "landflash") {
        if (message.channel.type === "dm") {
          console.log(`${message.author.tag} requested a link to SMF Land Edition in DMs.`);
        } else if (message.channel.type === "group") {
          console.log(`${message.author.tag} requested a link to SMF Land Edition in the ${message.channel.name} Group DM.`);
        } else {
          console.log(`${message.author.tag} requested a link to SMF Land Edition in #${message.channel.name} of ${message.guild.name}.`);
        }
        message.channel.send("Link to SMF Land Edition:\nhttps://www.levelpalace.com/game?id=41");
      } else if (game === "haunted" || game === "hauntededition" || game === "hauntedflash") {
        if (message.channel.type === "dm") {
          console.log(`${message.author.tag} requested a link to Haunted Edition in DMs.`);
        } else if (message.channel.type === "group") {
          console.log(`${message.author.tag} requested a link to Haunted Edition in the ${message.channel.name} Group DM.`);
        } else {
          console.log(`${message.author.tag} requested a link to Haunted Edition in #${message.channel.name} of ${message.guild.name}.`);
        }
        message.channel.send("Link to Haunted Edition:\nhttps://www.levelpalace.com/game?id=45");
      } else if (game === "candy" || game === "candyedition" || game === "candyflash" || game === "smfcandy" || game === "smfcandyedition" || game === "smfcandyflash" || game === "smf1candy" || game === "smf1candyedition" || game === "smf1candyflash") {
        if (message.channel.type === "dm") {
          console.log(`${message.author.tag} requested a link to Candy Edition in DMs.`);
        } else if (message.channel.type === "group") {
          console.log(`${message.author.tag} requested a link to Candy Edition in the ${message.channel.name} Group DM.`);
        } else {
          console.log(`${message.author.tag} requested a link to Candy Edition in #${message.channel.name} of ${message.guild.name}.`);
        }
        message.channel.send("Link to Candy Edition:\nhttps://www.levelpalace.com/game?id=46");
      } else if (game === "smf2" || game === "supermarioflash2") {
        if (message.channel.type === "dm") {
          console.log(`${message.author.tag} requested a link to Super Mario Flash 2 in DMs.`);
        } else if (message.channel.type === "group") {
          console.log(`${message.author.tag} requested a link to Super Mario Flash 2 in the ${message.channel.name} Group DM.`);
        } else {
          console.log(`${message.author.tag} requested a link to Super Mario Flash 2 in #${message.channel.name} of ${message.guild.name}.`);
        }
        message.channel.send("Link to Super Mario Flash 2:\nhttps://www.levelpalace.com/game?id=10");
      } else if (game === "dk" || game === "dkc" || game === "dkcf" || game === "dkfc" || game === "donkeykong" || game === "donkeykongflash" || game === "donkeykongcountryflash" || game === "donkeykongflashcountry" || game === "donkeykongedition" || game === "donkeykongcountryedition") {
        if (message.channel.type === "dm") {
          console.log(`${message.author.tag} requested a link to Donkey Kong Country Flash in DMs.`);
        } else if (message.channel.type === "group") {
          console.log(`${message.author.tag} requested a link to Donkey Kong Country Flash in the ${message.channel.name} Group DM.`);
        } else {
          console.log(`${message.author.tag} requested a link to Donkey Kong Country Flash in #${message.channel.name} of ${message.guild.name}.`);
        }
        message.channel.send("Link to Donkey Kong Country Flash:\nhttps://www.levelpalace.com/game?id=11");
      } else if (game === "wario" || game === "warioflash" || game === "warioedition" || game === "warioland" || game === "wariolandflash" || game === "wariolandedition") {
        if (message.channel.type === "dm") {
          console.log(`${message.author.tag} requested a link to Wario Land Edition in DMs.`);
        } else if (message.channel.type === "group") {
          console.log(`${message.author.tag} requested a link to Wario Land Edition in the ${message.channel.name} Group DM.`);
        } else {
          console.log(`${message.author.tag} requested a link to Wario Land Edition in #${message.channel.name} of ${message.guild.name}.`);
        }
        message.channel.send("Link to Wario Land Edition:\nhttps://www.levelpalace.com/game?id=12");
      } else if (game === "sonic" || game === "sonicflash" || game === "sonicedition" || game === "sonicthehedgehog" || game === "sonicthehedgehogflash" || game === "sonicthehedgehogedition") {
        if (message.channel.type === "dm") {
          console.log(`${message.author.tag} requested a link to Sonic the Hedgehog Edition in DMs.`);
        } else if (message.channel.type === "group") {
          console.log(`${message.author.tag} requested a link to Sonic the Hedgehog Edition in the ${message.channel.name} Group DM.`);
        } else {
          console.log(`${message.author.tag} requested a link to Sonic the Hedgehog Edition in #${message.channel.name} of ${message.guild.name}.`);
        }
        message.channel.send("Link to Sonic the Hedgehog Edition:\nhttps://www.levelpalace.com/game?id=13");
      } else if (game === "chaos" || game === "chaosedition" || game === "chaosflash") {
        if (message.channel.type === "dm") {
          console.log(`${message.author.tag} requested a link to Chaos Edition in DMs.`);
        } else if (message.channel.type === "group") {
          console.log(`${message.author.tag} requested a link to Chaos Edition in the ${message.channel.name} Group DM.`);
        } else {
          console.log(`${message.author.tag} requested a link to Chaos Edition in #${message.channel.name} of ${message.guild.name}.`);
        }
        message.channel.send("Link to Chaos Edition:\nhttps://www.levelpalace.com/game?id=14");
      } else if (game === "desert" || game === "desertflash" || game === "desertedition" || game === "deserteditionsmf2" || game === "desertflashsmf2" || game === "smf2desertedition" || game === "smf2desertflash") {
        if (message.channel.type === "dm") {
          console.log(`${message.author.tag} requested a link to Desert Edition in DMs.`);
        } else if (message.channel.type === "group") {
          console.log(`${message.author.tag} requested a link to Desert Edition in the ${message.channel.name} Group DM.`);
        } else {
          console.log(`${message.author.tag} requested a link to Desert Edition in #${message.channel.name} of ${message.guild.name}.`);
        }
        message.channel.send("Link to Desert Edition:\nhttps://www.levelpalace.com/game?id=15");
      } else if (game === "enhanced" || game === "enhancededition" || game === "enhancedflash") {
        if (message.channel.type === "dm") {
          console.log(`${message.author.tag} requested a link to Enhanced Edition in DMs.`);
        } else if (message.channel.type === "group") {
          console.log(`${message.author.tag} requested a link to Enhanced Edition in the ${message.channel.name} Group DM.`);
        } else {
          console.log(`${message.author.tag} requested a link to Enhanced Edition in #${message.channel.name} of ${message.guild.name}.`);
        }
        message.channel.send("Link to Enhanced Edition:\nhttps://www.levelpalace.com/game?id=16");
      } else if (game === "neo" || game === "neoflash" || game === "neoedition") {
        if (message.channel.type === "dm") {
          console.log(`${message.author.tag} requested a link to Neo Edition in DMs.`);
        } else if (message.channel.type === "group") {
          console.log(`${message.author.tag} requested a link to Neo Edition in the ${message.channel.name} Group DM.`);
        } else {
          console.log(`${message.author.tag} requested a link to Neo Edition in #${message.channel.name} of ${message.guild.name}.`);
        }
        message.channel.send("Link to Neo Edition:\nhttps://www.levelpalace.com/game?id=17");
      } else if (game === "soviet" || game === "sovietflash" || game === "sovietedition" || game === "supersoviet" || game === "supersovietflash" || game === "supersovietedition") {
        if (message.channel.type === "dm") {
          console.log(`${message.author.tag} requested a link to Super Soviet Flash in DMs.`);
        } else if (message.channel.type === "group") {
          console.log(`${message.author.tag} requested a link to Super Soviet Flash in the ${message.channel.name} Group DM.`);
        } else {
          console.log(`${message.author.tag} requested a link to Super Soviet Flash in #${message.channel.name} of ${message.guild.name}.`);
        }
        message.channel.send("Link to Super Soviet Flash:\nhttps://www.levelpalace.com/game?id=18");
      } else if (game === "smb3" || game === "smb3f" || game === "mariobros3" || game === "mariobros3flash" || game === "mariobros3edition" || game === "supermariobros3" || game === "supermariobros3flash" || game === "supermariobros3edition") {
        if (message.channel.type === "dm") {
          console.log(`${message.author.tag} requested a link to Super Mario Bros 3 Edition in DMs.`);
        } else if (message.channel.type === "group") {
          console.log(`${message.author.tag} requested a link to Super Mario Bros 3 Edition in the ${message.channel.name} Group DM.`);
        } else {
          console.log(`${message.author.tag} requested a link to Super Mario Bros 3 Edition in #${message.channel.name} of ${message.guild.name}.`);
        }
        message.channel.send("Link to Super Mario Bros 3 Edition:\nhttps://www.levelpalace.com/game?id=19");
      } else if (game === "yoshi" || game === "yoshisisland" || game === "yoshisislandflash" || game === "yoshisislandedition" || game === "yoshi'sisland" || game === "yoshi'sislandflash" || game === "yoshi'sislandedition" || game === "yoshiisland" || game === "yoshiislandflash" || game === "yoshiislandedition") {
        if (message.channel.type === "dm") {
          console.log(`${message.author.tag} requested a link to Yoshi Island Flash in DMs.`);
        } else if (message.channel.type === "group") {
          console.log(`${message.author.tag} requested a link to Yoshi Island Flash in the ${message.channel.name} Group DM.`);
        } else {
          console.log(`${message.author.tag} requested a link to Yoshi Island Flash in #${message.channel.name} of ${message.guild.name}.`);
        }
        message.channel.send("Link to Yoshi Island Flash:\nhttps://www.levelpalace.com/game?id=20");
      } else if (game === "chocolate" || game === "chocolateflash" || game === "chocolateedition") {
        if (message.channel.type === "dm") {
          console.log(`${message.author.tag} requested a link to Chocolate Edition in DMs.`);
        } else if (message.channel.type === "group") {
          console.log(`${message.author.tag} requested a link to Chocolate Edition in the ${message.channel.name} Group DM.`);
        } else {
          console.log(`${message.author.tag} requested a link to Chocolate Edition in #${message.channel.name} of ${message.guild.name}.`);
        }
        message.channel.send("Link to Chocolate Edition:\nhttps://www.levelpalace.com/game?id=21");
      } else if (game === "cryogenic" || game === "cryogenicflash" || game === "cryogenicedition") {
        if (message.channel.type === "dm") {
          console.log(`${message.author.tag} requested a link to Cryogenic Edition in DMs.`);
        } else if (message.channel.type === "group") {
          console.log(`${message.author.tag} requested a link to Cryogenic Edition in the ${message.channel.name} Group DM.`);
        } else {
          console.log(`${message.author.tag} requested a link to Cryogenic Edition in #${message.channel.name} of ${message.guild.name}.`);
        }
        message.channel.send("Link to Cryogenic Edition:\nhttps://www.levelpalace.com/game?id=22");
      } else if (game === "corpse" || game === "corpseflash" || game === "corpseedition") {
        if (message.channel.type === "dm") {
          console.log(`${message.author.tag} requested a link to Corpse Edition in DMs.`);
        } else if (message.channel.type === "group") {
          console.log(`${message.author.tag} requested a link to Corpse Edition in the ${message.channel.name} Group DM.`);
        } else {
          console.log(`${message.author.tag} requested a link to Corpse Edition in #${message.channel.name} of ${message.guild.name}.`);
        }
        message.channel.send("Link to Corpse Edition:\nhttps://www.levelpalace.com/game?id=23");
      } else if (game === "ultimate" || game === "ultimateflash" || game === "ultimateedition") {
        if (message.channel.type === "dm") {
          console.log(`${message.author.tag} requested a link to Ultimate Edition in DMs.`);
        } else if (message.channel.type === "group") {
          console.log(`${message.author.tag} requested a link to Ultimate Edition in the ${message.channel.name} Group DM.`);
        } else {
          console.log(`${message.author.tag} requested a link to Ultimate Edition in #${message.channel.name} of ${message.guild.name}.`);
        }
        message.channel.send("Link to Ultimate Edition:\nhttps://www.levelpalace.com/game?id=24");
      } else if (game === "golden" || game === "goldenflash" || game === "goldenedition") {
        if (message.channel.type === "dm") {
          console.log(`${message.author.tag} requested a link to Golden Edition in DMs.`);
        } else if (message.channel.type === "group") {
          console.log(`${message.author.tag} requested a link to Golden Edition in the ${message.channel.name} Group DM.`);
        } else {
          console.log(`${message.author.tag} requested a link to Golden Edition in #${message.channel.name} of ${message.guild.name}.`);
        }
        message.channel.send("Link to Golden Edition:\nhttps://www.levelpalace.com/game?id=25");
      } else if (game === "nsmf2" || game === "newmario2" || game === "newsupermario2" || game === "newmarioflash2" || game === "newsupermarioflash2" || game === "newsupermarioflash2edition") {
        if (message.channel.type === "dm") {
          console.log(`${message.author.tag} requested a link to New Super Mario Flash 2 Edition in DMs.`);
        } else if (message.channel.type === "group") {
          console.log(`${message.author.tag} requested a link to New Super Mario Flash 2 Edition in the ${message.channel.name} Group DM.`);
        } else {
          console.log(`${message.author.tag} requested a link to New Super Mario Flash 2 Edition in #${message.channel.name} of ${message.guild.name}.`);
        }
        message.channel.send("Link to New Super Mario Flash 2 Edition:\nhttps://www.levelpalace.com/game?id=26");
      } else if (game === "crash" || game === "crashedition" || game === "crashflash" || game === "crashbandicoot" || game === "crashbandicootflash" || game === "crashbandicootedition") {
        if (message.channel.type === "dm") {
          console.log(`${message.author.tag} requested a link to Crash Bandicoot Edition in DMs.`);
        } else if (message.channel.type === "group") {
          console.log(`${message.author.tag} requested a link to Crash Bandicoot Edition in the ${message.channel.name} Group DM.`);
        } else {
          console.log(`${message.author.tag} requested a link to Crash Bandicoot Edition in #${message.channel.name} of ${message.guild.name}.`);
        }
        message.channel.send("Link to Crash Bandicoot Edition:\nhttps://www.levelpalace.com/game?id=27");
      } else if (game === "blue" || game === "blueflash" || game === "blueedition") {
        if (message.channel.type === "dm") {
          console.log(`${message.author.tag} requested a link to Blue Edition in DMs.`);
        } else if (message.channel.type === "group") {
          console.log(`${message.author.tag} requested a link to Blue Edition in the ${message.channel.name} Group DM.`);
        } else {
          console.log(`${message.author.tag} requested a link to Blue Edition in #${message.channel.name} of ${message.guild.name}.`);
        }
        message.channel.send("Link to Blue Edition:\nhttps://www.levelpalace.com/game?id=29");
      } else if (game === "green" || game === "green" || game === "greenedition") {
        if (message.channel.type === "dm") {
          console.log(`${message.author.tag} requested a link to Green Edition in DMs.`);
        } else if (message.channel.type === "group") {
          console.log(`${message.author.tag} requested a link to Green Edition in the ${message.channel.name} Group DM.`);
        } else {
          console.log(`${message.author.tag} requested a link to Green Edition in #${message.channel.name} of ${message.guild.name}.`);
        }
        message.channel.send("Link to Green Edition:\nhttps://www.levelpalace.com/game?id=30");
      } else if (game === "bcr" || game === "bcrflash" || game === "bcredition" || game === "superbcr" || game === "superbcrflash" || game === "superbcredition") {
        if (message.channel.type === "dm") {
          console.log(`${message.author.tag} requested a link to Super BCR Flash in DMs.`);
        } else if (message.channel.type === "group") {
          console.log(`${message.author.tag} requested a link to Super BCR Flash in the ${message.channel.name} Group DM.`);
        } else {
          console.log(`${message.author.tag} requested a link to Super BCR Flash in #${message.channel.name} of ${message.guild.name}.`);
        }
        message.channel.send("Link to Super BCR Flash:\nhttps://www.levelpalace.com/game?id=31");
      } else if (game === "axew" || game === "axewflash" || game === "axewedition" || game === "superaxew" || game === "superaxewflash" || game === "superaxewedition") {
        if (message.channel.type === "dm") {
          console.log(`${message.author.tag} requested a link to Super Axew Flash in DMs.`);
        } else if (message.channel.type === "group") {
          console.log(`${message.author.tag} requested a link to Super Axew Flash in the ${message.channel.name} Group DM.`);
        } else {
          console.log(`${message.author.tag} requested a link to Super Axew Flash in #${message.channel.name} of ${message.guild.name}.`);
        }
        message.channel.send("Link to Super Axew Flash:\nhttps://www.levelpalace.com/game?id=37");
      } else if (game === "pop" || game === "popflash" || game === "popedition" || game === "superpop" || game === "superpopflash" || game === "superpopedition") {
        if (message.channel.type === "dm") {
          console.log(`${message.author.tag} requested a link to Super Pop Flash in DMs.`);
        } else if (message.channel.type === "group") {
          console.log(`${message.author.tag} requested a link to Super Pop Flash in the ${message.channel.name} Group DM.`);
        } else {
          console.log(`${message.author.tag} requested a link to Super Pop Flash in #${message.channel.name} of ${message.guild.name}.`);
        }
        message.channel.send("Link to Super Pop Flash:\nhttps://www.levelpalace.com/game?id=38");
      } else if (game === "luigi" || game === "luigiflash" || game === "luigiedition" || game === "superluigi" || game === "superluigiflash" || game === "superluigiedition" || game === "luigiflash2" || game === "luigiedition2" || game === "superluigiflash2" || game === "superluigiedition2") {
        if (message.channel.type === "dm") {
          console.log(`${message.author.tag} requested a link to Super Luigi Flash 2 Edition in DMs.`);
        } else if (message.channel.type === "group") {
          console.log(`${message.author.tag} requested a link to Super Luigi Flash 2 Edition in the ${message.channel.name} Group DM.`);
        } else {
          console.log(`${message.author.tag} requested a link to Super Luigi Flash 2 Edition in #${message.channel.name} of ${message.guild.name}.`);
        }
        message.channel.send("Link to Super Luigi Flash 2 Edition:\nhttps://www.levelpalace.com/game?id=39");
      } else if (game === "jungle" || game === "jungleflash" || game === "jungleedition") {
        if (message.channel.type === "dm") {
          console.log(`${message.author.tag} requested a link to Jungle Edition in DMs.`);
        } else if (message.channel.type === "group") {
          console.log(`${message.author.tag} requested a link to Jungle Edition in the ${message.channel.name} Group DM.`);
        } else {
          console.log(`${message.author.tag} requested a link to Jungle Edition in #${message.channel.name} of ${message.guild.name}.`);
        }
        message.channel.send("Link to Jungle Edition:\nhttps://www.levelpalace.com/game?id=40");
      } else if (game === "aae" || game === "aaeflash" || game === "aaeedition" || game === "smf2aae" || game === "smf2aaeflash" || game === "smf2aaeedition") {
        if (message.channel.type === "dm") {
          console.log(`${message.author.tag} requested a link to SMF2 AAE Edition in DMs.`);
        } else if (message.channel.type === "group") {
          console.log(`${message.author.tag} requested a link to SMF2 AAE Edition in the ${message.channel.name} Group DM.`);
        } else {
          console.log(`${message.author.tag} requested a link to SMF2 AAE Edition in #${message.channel.name} of ${message.guild.name}.`);
        }
        message.channel.send("Link to SMF2 AAE Edition:\nhttps://www.levelpalace.com/game?id=42");
      } else if (game === "solar" || game === "solarflash" || game === "solaredition") {
        if (message.channel.type === "dm") {
          console.log(`${message.author.tag} requested a link to Solar Edition in DMs.`);
        } else if (message.channel.type === "group") {
          console.log(`${message.author.tag} requested a link to Solar Edition in the ${message.channel.name} Group DM.`);
        } else {
          console.log(`${message.author.tag} requested a link to Solar Edition in #${message.channel.name} of ${message.guild.name}.`);
        }
        message.channel.send("Link to Solar Edition:\nhttps://www.levelpalace.com/game?id=43");
      } else if (game === "aced" || game === "acedflash" || game === "acededition") {
        if (message.channel.type === "dm") {
          console.log(`${message.author.tag} requested a link to Aced Edition in DMs.`);
        } else if (message.channel.type === "group") {
          console.log(`${message.author.tag} requested a link to Aced Edition in the ${message.channel.name} Group DM.`);
        } else {
          console.log(`${message.author.tag} requested a link to Aced Edition in #${message.channel.name} of ${message.guild.name}.`);
        }
        message.channel.send("Link to Aced Edition:\nhttps://www.levelpalace.com/game?id=44");
      } else if (game === "smf3" || game === "supermarioflash3") {
        if (message.channel.type === "dm") {
          console.log(`${message.author.tag} requested a link to Super Mario Flash 3 in DMs.`);
        } else if (message.channel.type === "group") {
          console.log(`${message.author.tag} requested a link to Super Mario Flash 3 in the ${message.channel.name} Group DM.`);
        } else {
          console.log(`${message.author.tag} requested a link to Super Mario Flash 3 in #${message.channel.name} of ${message.guild.name}.`);
        }
        message.channel.send("Link to Super Mario Flash 3:\nhttps://www.levelpalace.com/game?id=28");
      } else if (game === "smc" || game === "supermarioconstruct") {
          if (message.channel.type === "dm") {
            console.log(`${message.author.tag} requested a link to Super Mario Construct in DMs.`);
          } else if (message.channel.type === "group") {
            console.log(`${message.author.tag} requested a link to Super Mario Construct in the ${message.channel.name} Group DM.`);
          } else {
            console.log(`${message.author.tag} requested a link to Super Mario Construct in #${message.channel.name} of ${message.guild.name}.`);
          }
          message.channel.send("Link to Super Mario Construct:\nhttps://www.levelpalace.com/game?id=49");
      } else {
        if (message.channel.type === "dm") {
          console.log(`${message.author.tag} requested a link to an unrecognized LP game, by entering "${args.trim()}" in DMs.`);
        } else if (message.channel.type === "group") {
          console.log(`${message.author.tag} requested a link to an unrecognized LP game, by entering "${args.trim()}" in the ${message.channel.name} Group DM.`);
        } else {
          console.log(`${message.author.tag} requested a link to an unrecognized LP game, by entering "${args.trim()}" in #${message.channel.name} of ${message.guild.name}.`);
        }
        message.channel.send(`I do not recognize any LP game by the name of **${args.trim()}**, please try again.`, { split: true }).catch(err => {
          console.error(`An error occurred while trying to send a message:\n${err}`);
          return message.channel.send("**An error occurred while trying to send a message:**```" + err + "```");
        });
      }
    }

    else if (command === "level" || command === "levelsearch") {
      if (message.guild && message.guild.id === "752287527473381419") return;
      if (!args) return message.channel.send("You must include the name of a level to look up!");
      if (args.length > 500) return message.channel.send("Please enter a level name consisting of 500 characters or less!");

      log(command);

      let levelName = encodeURIComponent(args.trim());
      let levelinfo = [];
      let pmsg = await message.channel.send("Retrieving level information...");

      // search for level(s) by name
      request({ uri: `https://www.levelpalace.com/levels?level_class=All&name=${levelName}`, timeout: 20000, headers: { "User-Agent": "lp-helper" } }, function(err, resp, body) {
        if (!err && resp.statusCode === 200) {
          let $ = cheerio.load(body);

          if ($("div.navbar-fixed").length === 0) return pmsg.edit("Level Palace is currently **down**, and so this command will not work properly right now. Please try again later!");

          let levellinks = [];
          let levels = [];

          // gather up to 10 levels from the level search page
          if ($("div.table-container:contains('No levels found.')").length === 0) {
            $("div.card-item", "div.card-blocks").each(function() {
              // omit featured levels
              if ($(this).find("div.card-featured-label").length > 0) return;

              if ($(this).find("a.card-title").length > 0) {
                if (levels.length <= 9) {
                  let levellink = $(this).find("a.card-title").attr("href");
                  levellinks.push(levellink);
                  let level = $(this).find("a.card-title").text().trim();
                  levels.push(level);
                }
              }
            });
          }

          // run certain code based on how many levels were found on the levels page
          if (levels.length === 0) {
            if (message.channel.type === "dm") {
              console.log(`A level by the name of "${args.trim()}" was failed to be found by ${message.author.username} in DMs.`);
            } else if (message.channel.type === "group") {
              console.log(`A level by the name of "${args.trim()}" was failed to be found by ${message.author.username} in the ${message.channel.name} Group DM.`);
            } else {
              console.log(`A level by the name of "${args.trim()}" was failed to be found by ${message.author.username} in #${message.channel.name} of ${message.guild.name}.`);
            }
            pmsg.edit(`No level was found with the name: **${args.trim()}**! Please try again.`).catch(err => {
              pmsg.edit("**An error occurred while trying to edit this message:**```" + err + "```");
            });
          } else if (levels.length === 1) {
            request({ uri: `https://www.levelpalace.com/${levellinks[0]}`, timeout: 20000, headers: { "User-Agent": "lp-helper" } }, function(err, resp, body) {
              if (!err && resp.statusCode === 200) {
                let $ = cheerio.load(body);

                if ($("div.navbar-fixed").length === 0) return pmsg.edit("Level Palace is currently **down**, and so this command will not work properly right now. Please try again later!");

                // get level title
                $("p.truncate", "div.nav-wrapper").each(function() {
                  let title = $(this).text().trim();
                  levelinfo.push(title);
                });

                // get author stats and level stats
                $("ul.level-stats", "div.level-info").each(function() {
                  // get author name
                  let author = $("p.user-username").text().trim();
                  levelinfo.push(author);

                  // get author status
                  let status = $("p.user-class").text().trim();
                  levelinfo.push(status);

                  // get author rank
                  let rank = $("p.user-rank").text().trim();
                  levelinfo.push(rank);

                  // get all level stats
                  $("li.collection-item", "ul.level-stats").each(function() {
                    let stat = $(this).text().trim().split(" ").slice(1).join(" ");
                    levelinfo.push(stat);
                  });
                });

                // get level image if one exists
                $("img[src]", "ul.slides").each(function() {
                  let levelimage = $(this).attr("src");
                  urlExists(levelimage, function(err, exists) {
                    if (!err) {
                      if (!exists) {
                        levelimage = "https://i.imgur.com/2E8BWdV.png";
                      }
                    } else {
                      levelimage = "https://i.imgur.com/2E8BWdV.png";
                    }
                  });
                  levelinfo.push(levelimage);
                });

                // add dummy level image if one is still not added
                if (!levelinfo[levelinfo.length - 1].includes("http")) levelinfo.push("https://i.imgur.com/2E8BWdV.png");

                if (levelinfo[10].trim() === "See description") {
                  if (message.channel.type === "dm") {
                    console.log(`${message.author.tag} entered "${args.trim()}" as a level name in DMs, and "${levelinfo[0]}" by ${levelinfo[1]} was found.`);
                  } else if (message.channel.type === "group") {
                    console.log(`${message.author.tag} entered "${args.trim()}" as a level name in the ${message.channel.name} Group DM, and "${levelinfo[0]}" by ${levelinfo[1]} was found.`);
                  } else {
                    console.log(`${message.author.tag} entered "${args.trim()}" as a level name in #${message.channel.name} of ${message.guild.name}, and "${levelinfo[0]}" by ${levelinfo[1]} was found.`);
                  }
                  pmsg.edit({ content: "Here is the level I found:", embed: {
                    color: 3447003,
                    thumbnail: {
                      url: levelinfo[levelinfo.length - 1]
                    },
                    fields: [
                      {
                        name: "Name",
                        value: levelinfo[0]
                      },
                      {
                        name: "Author",
                        value: `${levelinfo[1]}\n(${levelinfo[2]}, ${levelinfo[3]})`
                      },
                      {
                        name: "Class",
                        value: levelinfo[5],
                        inline: true
                      },
                      {
                        name: "Rating",
                        value: levelinfo[6],
                        inline: true
                      },
                      {
                        name: "Votes",
                        value: levelinfo[7],
                        inline: true
                      },
                      {
                        name: "Plays",
                        value: levelinfo[8],
                        inline: true
                      },
                      {
                        name: "Favorites",
                        value: levelinfo[9].split(" ").slice(1).join(" "),
                        inline: true
                      },
                      {
                        name: "Game",
                        value: "In Description",
                        inline: true
                      },
                      {
                        name: "Difficulty",
                        value: levelinfo[11],
                        inline: true
                      },
                      {
                        name: "Published on",
                        value: `${levelinfo[12]} (EST/EDT)`,
                        inline: true
                      },
                      {
                        name: "Link",
                        value: `<${resp.request.uri.href}>`,
                        inline: true
                      }
                    ]
                  }}).catch(err => {
                    pmsg.edit("**An error occurred while trying to edit this message:**```" + err + "```");
                  });

                  // pmsg.edit(`Level found!\n\n**${levelinfo[0]}**\nBy: **${levelinfo[1]}** (**${levelinfo[2]}**, **${levelinfo[3]}**)\n\nThis level is currently in the **${levelinfo[5]}** class, its rating is **${levelinfo[6]}**, it has **${levelinfo[7]}** vote(s), **${levelinfo[8]}** play(s), **${levelinfo[9].split(" ").slice(1).join(" ")}** favorite(s), its required game is in the description, its difficulty is **${levelinfo[11]}**, and it was published on **${levelinfo[12]}** (EST/EDT)!\n\nYou can go check out and possibly review the level here:\n<${resp.request.uri.href}>`).catch(err => {
                  //   pmsg.edit("**An error occurred while trying to edit this message:**```" + err + "```");
                  // });
                } else {
                  if (message.channel.type === "dm") {
                    console.log(`${message.author.tag} entered "${args.trim()}" as a level name in DMs, and "${levelinfo[0]}" by ${levelinfo[1]} was found.`);
                  } else if (message.channel.type === "group") {
                    console.log(`${message.author.tag} entered "${args.trim()}" as a level name in the ${message.channel.name} Group DM, and "${levelinfo[0]}" by ${levelinfo[1]} was found.`);
                  } else {
                    console.log(`${message.author.tag} entered "${args.trim()}" as a level name in #${message.channel.name} of ${message.guild.name}, and "${levelinfo[0]}" by ${levelinfo[1]} was found.`);
                  }
                  pmsg.edit({ content: "Here is the level I found:", embed: {
                    color: 3447003,
                    thumbnail: {
                      url: levelinfo[levelinfo.length - 1]
                    },
                    fields: [
                      {
                        name: "Name",
                        value: levelinfo[0]
                      },
                      {
                        name: "Author",
                        value: `${levelinfo[1]}\n(${levelinfo[2]}, ${levelinfo[3]})`
                      },
                      {
                        name: "Class",
                        value: levelinfo[5],
                        inline: true
                      },
                      {
                        name: "Rating",
                        value: levelinfo[6],
                        inline: true
                      },
                      {
                        name: "Votes",
                        value: levelinfo[7],
                        inline: true
                      },
                      {
                        name: "Plays",
                        value: levelinfo[8],
                        inline: true
                      },
                      {
                        name: "Favorites",
                        value: levelinfo[9].split(" ").slice(1).join(" "),
                        inline: true
                      },
                      {
                        name: "Game",
                        value: levelinfo[10].trim(),
                        inline: true
                      },
                      {
                        name: "Difficulty",
                        value: levelinfo[11],
                        inline: true
                      },
                      {
                        name: "Published on",
                        value: `${levelinfo[12]} (EST/EDT)`,
                        inline: true
                      },
                      {
                        name: "Link",
                        value: `<${resp.request.uri.href}>`,
                        inline: true
                      }
                    ]
                  }}).catch(err => {
                    pmsg.edit("**An error occurred while trying to edit this message:**```" + err + "```");
                  });

                  // pmsg.edit(`Level found!\n\n**${levelinfo[0]}**\nBy: **${levelinfo[1]}** (**${levelinfo[2]}**, **${levelinfo[3]}**)\n\nThis level is currently in the **${levelinfo[5]}** class, its rating is **${levelinfo[6]}**, it has **${levelinfo[7]}** vote(s), **${levelinfo[8]}** play(s), **${levelinfo[9].split(" ").slice(1).join(" ")}** favorite(s), its required game is **${levelinfo[10].trim()}**, its difficulty is **${levelinfo[11]}**, and it was published on **${levelinfo[12]}** (EST/EDT)!\n\nYou can go check out and possibly review the level here:\n<${resp.request.uri.href}>`).catch(err => {
                  //   pmsg.edit("**An error occurred while trying to edit this message:**```" + err + "```");
                  // });
                }
              } else {
                console.error(`${message.author.username} encountered an error while trying to find a level in #${message.channel.name} of ${message.guild.name}.`);
                pmsg.edit("An error has occurred, please try again.");
              }
            });
          } else {
            // send appropriate message based on how many levels were found during the search
            if (levels.length === 2) {
              pmsg.delete();
              message.channel.send(`***Please choose the number of the LP level you are trying to specify, or reply with "cancel" to choose none:***\n\n**[0]** ${levels[0]}\n**[1]** ${levels[1]}`)
              .then(msg => {
                // establish filter for response messages
                const filter = rmsg => {
                  if (!isNaN(rmsg.content) && levels[rmsg.content] && rmsg.author.id === message.author.id || rmsg.content.replace(/\s/g, "").toLowerCase() === "cancel" && rmsg.author.id === message.author.id) return true;
                }

                message.channel.awaitMessages(filter, { max: 1, time: 20000, errors: ["time"] })
                .then(collected => {
                  // retrieve user information if input is not "cancel"
                  if (collected.first().content !== "cancel") {

                    request({ uri: `https://www.levelpalace.com/${levellinks[collected.first().content]}`, timeout: 20000, headers: { "User-Agent": "lp-helper" } }, function(err, resp, body) {
                      if (!err && resp.statusCode === 200) {
                        let $ = cheerio.load(body);

                        if ($("div.navbar-fixed").length === 0) return message.channel.send("Level Palace is currently **down**, and so this command will not work properly right now. Please try again later!");

                        // get level title
                        $("p.truncate", "div.nav-wrapper").each(function() {
                          let title = $(this).text().trim();
                          levelinfo.push(title);
                        });

                        // get author stats and level stats
                        $("ul.level-stats", "div.level-info").each(function() {
                          // get author name
                          let author = $("p.user-username").text().trim();
                          levelinfo.push(author);

                          // get author status
                          let status = $("p.user-class").text().trim();
                          levelinfo.push(status);

                          // get author rank
                          let rank = $("p.user-rank").text().trim();
                          levelinfo.push(rank);

                          // get all level stats
                          $("li.collection-item", "ul.level-stats").each(function() {
                            let stat = $(this).text().trim().split(" ").slice(1).join(" ");
                            levelinfo.push(stat);
                          });
                        });

                        // get level image if one exists
                        $("img[src]", "ul.slides").each(function() {
                          let levelimage = $(this).attr("src");
                          urlExists(levelimage, function(err, exists) {
                            if (!err) {
                              if (!exists) {
                                levelimage = "https://i.imgur.com/2E8BWdV.png";
                              }
                            } else {
                              levelimage = "https://i.imgur.com/2E8BWdV.png";
                            }
                          });
                          levelinfo.push(levelimage);
                        });

                        // add dummy level image if one is still not added
                        if (!levelinfo[levelinfo.length - 1].includes("http")) levelinfo.push("https://i.imgur.com/2E8BWdV.png");

                        if (levelinfo[10].trim() === "See description") {
                          if (message.channel.type === "dm") {
                            console.log(`${message.author.tag} entered "${args.trim()}" as a level name in DMs, and "${levelinfo[0]}" by ${levelinfo[1]} was found.`);
                          } else if (message.channel.type === "group") {
                            console.log(`${message.author.tag} entered "${args.trim()}" as a level name in the ${message.channel.name} Group DM, and "${levelinfo[0]}" by ${levelinfo[1]} was found.`);
                          } else {
                            console.log(`${message.author.tag} entered "${args.trim()}" as a level name in #${message.channel.name} of ${message.guild.name}, and "${levelinfo[0]}" by ${levelinfo[1]} was found.`);
                          }
                          msg.delete();
                          if (message.guild.me.hasPermission("MANAGE_MESSAGES")) collected.first().delete();
                          message.channel.send({ content: "Here is your requested level:", embed: {
                            color: 3447003,
                            thumbnail: {
                              url: levelinfo[levelinfo.length - 1]
                            },
                            fields: [
                              {
                                name: "Name",
                                value: levelinfo[0]
                              },
                              {
                                name: "Author",
                                value: `${levelinfo[1]}\n(${levelinfo[2]}, ${levelinfo[3]})`
                              },
                              {
                                name: "Class",
                                value: levelinfo[5],
                                inline: true
                              },
                              {
                                name: "Rating",
                                value: levelinfo[6],
                                inline: true
                              },
                              {
                                name: "Votes",
                                value: levelinfo[7],
                                inline: true
                              },
                              {
                                name: "Plays",
                                value: levelinfo[8],
                                inline: true
                              },
                              {
                                name: "Favorites",
                                value: levelinfo[9].split(" ").slice(1).join(" "),
                                inline: true
                              },
                              {
                                name: "Game",
                                value: "In Description",
                                inline: true
                              },
                              {
                                name: "Difficulty",
                                value: levelinfo[11],
                                inline: true
                              },
                              {
                                name: "Published on",
                                value: `${levelinfo[12]} (EST/EDT)`,
                                inline: true
                              },
                              {
                                name: "Link",
                                value: `<${resp.request.uri.href}>`,
                                inline: true
                              }
                            ]
                          }}).catch(err => {
                            message.channel.send("**An error occurred while trying to send a message:**```" + err + "```");
                          });

                          // message.channel.send(`Level found!\n\n**${levelinfo[0]}**\nBy: **${levelinfo[1]}** (**${levelinfo[2]}**, **${levelinfo[3]}**)\n\nThis level is currently in the **${levelinfo[5]}** class, its rating is **${levelinfo[6]}**, it has **${levelinfo[7]}** vote(s), **${levelinfo[8]}** play(s), **${levelinfo[9].split(" ").slice(1).join(" ")}** favorite(s), its required game is in the description, its difficulty is **${levelinfo[11]}**, and it was published on **${levelinfo[12]}** (EST/EDT)!\n\nYou can go check out and possibly review the level here:\n<${resp.request.uri.href}>`).catch(err => {
                          //   message.channel.send("**An error occurred while trying to send a message:**```" + err + "```");
                          // });
                        } else {
                          if (message.channel.type === "dm") {
                            console.log(`${message.author.tag} entered "${args.trim()}" as a level name in DMs, and "${levelinfo[0]}" by ${levelinfo[1]} was found.`);
                          } else if (message.channel.type === "group") {
                            console.log(`${message.author.tag} entered "${args.trim()}" as a level name in the ${message.channel.name} Group DM, and "${levelinfo[0]}" by ${levelinfo[1]} was found.`);
                          } else {
                            console.log(`${message.author.tag} entered "${args.trim()}" as a level name in #${message.channel.name} of ${message.guild.name}, and "${levelinfo[0]}" by ${levelinfo[1]} was found.`);
                          }
                          msg.delete();
                          if (message.guild.me.hasPermission("MANAGE_MESSAGES")) collected.first().delete();
                          message.channel.send({ content: "Here is your requested level:", embed: {
                            color: 3447003,
                            thumbnail: {
                              url: levelinfo[levelinfo.length - 1]
                            },
                            fields: [
                              {
                                name: "Name",
                                value: levelinfo[0]
                              },
                              {
                                name: "Author",
                                value: `${levelinfo[1]}\n(${levelinfo[2]}, ${levelinfo[3]})`
                              },
                              {
                                name: "Class",
                                value: levelinfo[5],
                                inline: true
                              },
                              {
                                name: "Rating",
                                value: levelinfo[6],
                                inline: true
                              },
                              {
                                name: "Votes",
                                value: levelinfo[7],
                                inline: true
                              },
                              {
                                name: "Plays",
                                value: levelinfo[8],
                                inline: true
                              },
                              {
                                name: "Favorites",
                                value: levelinfo[9].split(" ").slice(1).join(" "),
                                inline: true
                              },
                              {
                                name: "Game",
                                value: levelinfo[10].trim(),
                                inline: true
                              },
                              {
                                name: "Difficulty",
                                value: levelinfo[11],
                                inline: true
                              },
                              {
                                name: "Published on",
                                value: `${levelinfo[12]} (EST/EDT)`,
                                inline: true
                              },
                              {
                                name: "Link",
                                value: `<${resp.request.uri.href}>`,
                                inline: true
                              }
                            ]
                          }}).catch(err => {
                            message.channel.send("**An error occurred while trying to send a message:**```" + err + "```");
                          });

                          // pmsg.edit(`Level found!\n\n**${levelinfo[0]}**\nBy: **${levelinfo[1]}** (**${levelinfo[2]}**, **${levelinfo[3]}**)\n\nThis level is currently in the **${levelinfo[5]}** class, its rating is **${levelinfo[6]}**, it has **${levelinfo[7]}** vote(s), **${levelinfo[8]}** play(s), **${levelinfo[9].split(" ").slice(1).join(" ")}** favorite(s), its required game is **${levelinfo[10].trim()}**, its difficulty is **${levelinfo[11]}**, and it was published on **${levelinfo[12]}** (EST/EDT)!\n\nYou can go check out and possibly review the level here:\n<${resp.request.uri.href}>`).catch(err => {
                          //   pmsg.edit("**An error occurred while trying to edit this message:**```" + err + "```");
                          // });
                        }
                      } else {
                        console.error(`${message.author.username} encountered an error while trying to find a level in #${message.channel.name} of ${message.guild.name}.`);
                        message.channel.send("An error has occurred, please try again.");
                      }
                    });
                  } else {
                    msg.delete();
                    if (message.guild.me.hasPermission("MANAGE_MESSAGES")) collected.first().delete();
                    message.channel.send(`**${message.author.username}**, request canceled.`);
                  }
                })
                .catch(collected => {
                  msg.delete();
                  message.channel.send(`**${message.author.username}**, your LP level request timed out.`);
                });
              })
              .catch(err => {
                console.error(`An error occurred while trying to send a message:\n${err}`);
                message.channel.send("**An error occurred while trying to send a message:**```" + err + "```");
              });
            } else if (levels.length === 3) {
              pmsg.delete();
              message.channel.send(`***Please choose the number of the LP level you are trying to specify, or reply with "cancel" to choose none:***\n\n**[0]** ${levels[0]}\n**[1]** ${levels[1]}\n**[2]** ${levels[2]}`)
              .then(msg => {
                // establish filter for response messages
                const filter = rmsg => {
                  if (!isNaN(rmsg.content) && levels[rmsg.content] && rmsg.author.id === message.author.id || rmsg.content.replace(/\s/g, "").toLowerCase() === "cancel" && rmsg.author.id === message.author.id) return true;
                }

                message.channel.awaitMessages(filter, { max: 1, time: 20000, errors: ["time"] })
                .then(collected => {
                  // retrieve user information if input is not "cancel"
                  if (collected.first().content !== "cancel") {

                    request({ uri: `https://www.levelpalace.com/${levellinks[collected.first().content]}`, timeout: 20000, headers: { "User-Agent": "lp-helper" } }, function(err, resp, body) {
                      if (!err && resp.statusCode === 200) {
                        let $ = cheerio.load(body);

                        if ($("div.navbar-fixed").length === 0) return message.channel.send("Level Palace is currently **down**, and so this command will not work properly right now. Please try again later!");

                        // get level title
                        $("p.truncate", "div.nav-wrapper").each(function() {
                          let title = $(this).text().trim();
                          levelinfo.push(title);
                        });

                        // get author stats and level stats
                        $("ul.level-stats", "div.level-info").each(function() {
                          // get author name
                          let author = $("p.user-username").text().trim();
                          levelinfo.push(author);

                          // get author status
                          let status = $("p.user-class").text().trim();
                          levelinfo.push(status);

                          // get author rank
                          let rank = $("p.user-rank").text().trim();
                          levelinfo.push(rank);

                          // get all level stats
                          $("li.collection-item", "ul.level-stats").each(function() {
                            let stat = $(this).text().trim().split(" ").slice(1).join(" ");
                            levelinfo.push(stat);
                          });
                        });

                        // get level image if one exists
                        $("img[src]", "ul.slides").each(function() {
                          let levelimage = $(this).attr("src");
                          urlExists(levelimage, function(err, exists) {
                            if (!err) {
                              if (!exists) {
                                levelimage = "https://i.imgur.com/2E8BWdV.png";
                              }
                            } else {
                              levelimage = "https://i.imgur.com/2E8BWdV.png";
                            }
                          });
                          levelinfo.push(levelimage);
                        });

                        // add dummy level image if one is still not added
                        if (!levelinfo[levelinfo.length - 1].includes("http")) levelinfo.push("https://i.imgur.com/2E8BWdV.png");

                        if (levelinfo[10].trim() === "See description") {
                          if (message.channel.type === "dm") {
                            console.log(`${message.author.tag} entered "${args.trim()}" as a level name in DMs, and "${levelinfo[0]}" by ${levelinfo[1]} was found.`);
                          } else if (message.channel.type === "group") {
                            console.log(`${message.author.tag} entered "${args.trim()}" as a level name in the ${message.channel.name} Group DM, and "${levelinfo[0]}" by ${levelinfo[1]} was found.`);
                          } else {
                            console.log(`${message.author.tag} entered "${args.trim()}" as a level name in #${message.channel.name} of ${message.guild.name}, and "${levelinfo[0]}" by ${levelinfo[1]} was found.`);
                          }
                          msg.delete();
                          if (message.guild.me.hasPermission("MANAGE_MESSAGES")) collected.first().delete();
                          message.channel.send({ content: "Here is your requested level:", embed: {
                            color: 3447003,
                            thumbnail: {
                              url: levelinfo[levelinfo.length - 1]
                            },
                            fields: [
                              {
                                name: "Name",
                                value: levelinfo[0]
                              },
                              {
                                name: "Author",
                                value: `${levelinfo[1]}\n(${levelinfo[2]}, ${levelinfo[3]})`
                              },
                              {
                                name: "Class",
                                value: levelinfo[5],
                                inline: true
                              },
                              {
                                name: "Rating",
                                value: levelinfo[6],
                                inline: true
                              },
                              {
                                name: "Votes",
                                value: levelinfo[7],
                                inline: true
                              },
                              {
                                name: "Plays",
                                value: levelinfo[8],
                                inline: true
                              },
                              {
                                name: "Favorites",
                                value: levelinfo[9].split(" ").slice(1).join(" "),
                                inline: true
                              },
                              {
                                name: "Game",
                                value: "In Description",
                                inline: true
                              },
                              {
                                name: "Difficulty",
                                value: levelinfo[11],
                                inline: true
                              },
                              {
                                name: "Published on",
                                value: `${levelinfo[12]} (EST/EDT)`,
                                inline: true
                              },
                              {
                                name: "Link",
                                value: `<${resp.request.uri.href}>`,
                                inline: true
                              }
                            ]
                          }}).catch(err => {
                            message.channel.send("**An error occurred while trying to send a message:**```" + err + "```");
                          });

                          // message.channel.send(`Level found!\n\n**${levelinfo[0]}**\nBy: **${levelinfo[1]}** (**${levelinfo[2]}**, **${levelinfo[3]}**)\n\nThis level is currently in the **${levelinfo[5]}** class, its rating is **${levelinfo[6]}**, it has **${levelinfo[7]}** vote(s), **${levelinfo[8]}** play(s), **${levelinfo[9].split(" ").slice(1).join(" ")}** favorite(s), its required game is in the description, its difficulty is **${levelinfo[11]}**, and it was published on **${levelinfo[12]}** (EST/EDT)!\n\nYou can go check out and possibly review the level here:\n<${resp.request.uri.href}>`).catch(err => {
                          //   message.channel.send("**An error occurred while trying to send a message:**```" + err + "```");
                          // });
                        } else {
                          if (message.channel.type === "dm") {
                            console.log(`${message.author.tag} entered "${args.trim()}" as a level name in DMs, and "${levelinfo[0]}" by ${levelinfo[1]} was found.`);
                          } else if (message.channel.type === "group") {
                            console.log(`${message.author.tag} entered "${args.trim()}" as a level name in the ${message.channel.name} Group DM, and "${levelinfo[0]}" by ${levelinfo[1]} was found.`);
                          } else {
                            console.log(`${message.author.tag} entered "${args.trim()}" as a level name in #${message.channel.name} of ${message.guild.name}, and "${levelinfo[0]}" by ${levelinfo[1]} was found.`);
                          }
                          msg.delete();
                          if (message.guild.me.hasPermission("MANAGE_MESSAGES")) collected.first().delete();
                          message.channel.send({ content: "Here is your requested level:", embed: {
                            color: 3447003,
                            thumbnail: {
                              url: levelinfo[levelinfo.length - 1]
                            },
                            fields: [
                              {
                                name: "Name",
                                value: levelinfo[0]
                              },
                              {
                                name: "Author",
                                value: `${levelinfo[1]}\n(${levelinfo[2]}, ${levelinfo[3]})`
                              },
                              {
                                name: "Class",
                                value: levelinfo[5],
                                inline: true
                              },
                              {
                                name: "Rating",
                                value: levelinfo[6],
                                inline: true
                              },
                              {
                                name: "Votes",
                                value: levelinfo[7],
                                inline: true
                              },
                              {
                                name: "Plays",
                                value: levelinfo[8],
                                inline: true
                              },
                              {
                                name: "Favorites",
                                value: levelinfo[9].split(" ").slice(1).join(" "),
                                inline: true
                              },
                              {
                                name: "Game",
                                value: levelinfo[10].trim(),
                                inline: true
                              },
                              {
                                name: "Difficulty",
                                value: levelinfo[11],
                                inline: true
                              },
                              {
                                name: "Published on",
                                value: `${levelinfo[12]} (EST/EDT)`,
                                inline: true
                              },
                              {
                                name: "Link",
                                value: `<${resp.request.uri.href}>`,
                                inline: true
                              }
                            ]
                          }}).catch(err => {
                            message.channel.send("**An error occurred while trying to send a message:**```" + err + "```");
                          });

                          // pmsg.edit(`Level found!\n\n**${levelinfo[0]}**\nBy: **${levelinfo[1]}** (**${levelinfo[2]}**, **${levelinfo[3]}**)\n\nThis level is currently in the **${levelinfo[5]}** class, its rating is **${levelinfo[6]}**, it has **${levelinfo[7]}** vote(s), **${levelinfo[8]}** play(s), **${levelinfo[9].split(" ").slice(1).join(" ")}** favorite(s), its required game is **${levelinfo[10].trim()}**, its difficulty is **${levelinfo[11]}**, and it was published on **${levelinfo[12]}** (EST/EDT)!\n\nYou can go check out and possibly review the level here:\n<${resp.request.uri.href}>`).catch(err => {
                          //   pmsg.edit("**An error occurred while trying to edit this message:**```" + err + "```");
                          // });
                        }
                      } else {
                        console.error(`${message.author.username} encountered an error while trying to find a level in #${message.channel.name} of ${message.guild.name}.`);
                        message.channel.send("An error has occurred, please try again.");
                      }
                    });
                  } else {
                    msg.delete();
                    if (message.guild.me.hasPermission("MANAGE_MESSAGES")) collected.first().delete();
                    message.channel.send(`**${message.author.username}**, request canceled.`);
                  }
                })
                .catch(collected => {
                  msg.delete();
                  message.channel.send(`**${message.author.username}**, your LP level request timed out.`);
                });
              })
              .catch(err => {
                console.error(`An error occurred while trying to send a message:\n${err}`);
                message.channel.send("**An error occurred while trying to send a message:**```" + err + "```");
              });
            } else if (levels.length === 4) {
              pmsg.delete();
              message.channel.send(`***Please choose the number of the LP level you are trying to specify, or reply with "cancel" to choose none:***\n\n**[0]** ${levels[0]}\n**[1]** ${levels[1]}\n**[2]** ${levels[2]}\n**[3]** ${levels[3]}`)
              .then(msg => {
                // establish filter for response messages
                const filter = rmsg => {
                  if (!isNaN(rmsg.content) && levels[rmsg.content] && rmsg.author.id === message.author.id || rmsg.content.replace(/\s/g, "").toLowerCase() === "cancel" && rmsg.author.id === message.author.id) return true;
                }

                message.channel.awaitMessages(filter, { max: 1, time: 20000, errors: ["time"] })
                .then(collected => {
                  // retrieve user information if input is not "cancel"
                  if (collected.first().content !== "cancel") {

                    request({ uri: `https://www.levelpalace.com/${levellinks[collected.first().content]}`, timeout: 20000, headers: { "User-Agent": "lp-helper" } }, function(err, resp, body) {
                      if (!err && resp.statusCode === 200) {
                        let $ = cheerio.load(body);

                        if ($("div.navbar-fixed").length === 0) return message.channel.send("Level Palace is currently **down**, and so this command will not work properly right now. Please try again later!");

                        // get level title
                        $("p.truncate", "div.nav-wrapper").each(function() {
                          let title = $(this).text().trim();
                          levelinfo.push(title);
                        });

                        // get author stats and level stats
                        $("ul.level-stats", "div.level-info").each(function() {
                          // get author name
                          let author = $("p.user-username").text().trim();
                          levelinfo.push(author);

                          // get author status
                          let status = $("p.user-class").text().trim();
                          levelinfo.push(status);

                          // get author rank
                          let rank = $("p.user-rank").text().trim();
                          levelinfo.push(rank);

                          // get all level stats
                          $("li.collection-item", "ul.level-stats").each(function() {
                            let stat = $(this).text().trim().split(" ").slice(1).join(" ");
                            levelinfo.push(stat);
                          });
                        });

                        // get level image if one exists
                        $("img[src]", "ul.slides").each(function() {
                          let levelimage = $(this).attr("src");
                          urlExists(levelimage, function(err, exists) {
                            if (!err) {
                              if (!exists) {
                                levelimage = "https://i.imgur.com/2E8BWdV.png";
                              }
                            } else {
                              levelimage = "https://i.imgur.com/2E8BWdV.png";
                            }
                          });
                          levelinfo.push(levelimage);
                        });

                        // add dummy level image if one is still not added
                        if (!levelinfo[levelinfo.length - 1].includes("http")) levelinfo.push("https://i.imgur.com/2E8BWdV.png");

                        if (levelinfo[10].trim() === "See description") {
                          if (message.channel.type === "dm") {
                            console.log(`${message.author.tag} entered "${args.trim()}" as a level name in DMs, and "${levelinfo[0]}" by ${levelinfo[1]} was found.`);
                          } else if (message.channel.type === "group") {
                            console.log(`${message.author.tag} entered "${args.trim()}" as a level name in the ${message.channel.name} Group DM, and "${levelinfo[0]}" by ${levelinfo[1]} was found.`);
                          } else {
                            console.log(`${message.author.tag} entered "${args.trim()}" as a level name in #${message.channel.name} of ${message.guild.name}, and "${levelinfo[0]}" by ${levelinfo[1]} was found.`);
                          }
                          msg.delete();
                          if (message.guild.me.hasPermission("MANAGE_MESSAGES")) collected.first().delete();
                          message.channel.send({ content: "Here is your requested level:", embed: {
                            color: 3447003,
                            thumbnail: {
                              url: levelinfo[levelinfo.length - 1]
                            },
                            fields: [
                              {
                                name: "Name",
                                value: levelinfo[0]
                              },
                              {
                                name: "Author",
                                value: `${levelinfo[1]}\n(${levelinfo[2]}, ${levelinfo[3]})`
                              },
                              {
                                name: "Class",
                                value: levelinfo[5],
                                inline: true
                              },
                              {
                                name: "Rating",
                                value: levelinfo[6],
                                inline: true
                              },
                              {
                                name: "Votes",
                                value: levelinfo[7],
                                inline: true
                              },
                              {
                                name: "Plays",
                                value: levelinfo[8],
                                inline: true
                              },
                              {
                                name: "Favorites",
                                value: levelinfo[9].split(" ").slice(1).join(" "),
                                inline: true
                              },
                              {
                                name: "Game",
                                value: "In Description",
                                inline: true
                              },
                              {
                                name: "Difficulty",
                                value: levelinfo[11],
                                inline: true
                              },
                              {
                                name: "Published on",
                                value: `${levelinfo[12]} (EST/EDT)`,
                                inline: true
                              },
                              {
                                name: "Link",
                                value: `<${resp.request.uri.href}>`,
                                inline: true
                              }
                            ]
                          }}).catch(err => {
                            message.channel.send("**An error occurred while trying to send a message:**```" + err + "```");
                          });

                          // message.channel.send(`Level found!\n\n**${levelinfo[0]}**\nBy: **${levelinfo[1]}** (**${levelinfo[2]}**, **${levelinfo[3]}**)\n\nThis level is currently in the **${levelinfo[5]}** class, its rating is **${levelinfo[6]}**, it has **${levelinfo[7]}** vote(s), **${levelinfo[8]}** play(s), **${levelinfo[9].split(" ").slice(1).join(" ")}** favorite(s), its required game is in the description, its difficulty is **${levelinfo[11]}**, and it was published on **${levelinfo[12]}** (EST/EDT)!\n\nYou can go check out and possibly review the level here:\n<${resp.request.uri.href}>`).catch(err => {
                          //   message.channel.send("**An error occurred while trying to send a message:**```" + err + "```");
                          // });
                        } else {
                          if (message.channel.type === "dm") {
                            console.log(`${message.author.tag} entered "${args.trim()}" as a level name in DMs, and "${levelinfo[0]}" by ${levelinfo[1]} was found.`);
                          } else if (message.channel.type === "group") {
                            console.log(`${message.author.tag} entered "${args.trim()}" as a level name in the ${message.channel.name} Group DM, and "${levelinfo[0]}" by ${levelinfo[1]} was found.`);
                          } else {
                            console.log(`${message.author.tag} entered "${args.trim()}" as a level name in #${message.channel.name} of ${message.guild.name}, and "${levelinfo[0]}" by ${levelinfo[1]} was found.`);
                          }
                          msg.delete();
                          if (message.guild.me.hasPermission("MANAGE_MESSAGES")) collected.first().delete();
                          message.channel.send({ content: "Here is your requested level:", embed: {
                            color: 3447003,
                            thumbnail: {
                              url: levelinfo[levelinfo.length - 1]
                            },
                            fields: [
                              {
                                name: "Name",
                                value: levelinfo[0]
                              },
                              {
                                name: "Author",
                                value: `${levelinfo[1]}\n(${levelinfo[2]}, ${levelinfo[3]})`
                              },
                              {
                                name: "Class",
                                value: levelinfo[5],
                                inline: true
                              },
                              {
                                name: "Rating",
                                value: levelinfo[6],
                                inline: true
                              },
                              {
                                name: "Votes",
                                value: levelinfo[7],
                                inline: true
                              },
                              {
                                name: "Plays",
                                value: levelinfo[8],
                                inline: true
                              },
                              {
                                name: "Favorites",
                                value: levelinfo[9].split(" ").slice(1).join(" "),
                                inline: true
                              },
                              {
                                name: "Game",
                                value: levelinfo[10].trim(),
                                inline: true
                              },
                              {
                                name: "Difficulty",
                                value: levelinfo[11],
                                inline: true
                              },
                              {
                                name: "Published on",
                                value: `${levelinfo[12]} (EST/EDT)`,
                                inline: true
                              },
                              {
                                name: "Link",
                                value: `<${resp.request.uri.href}>`,
                                inline: true
                              }
                            ]
                          }}).catch(err => {
                            message.channel.send("**An error occurred while trying to send a message:**```" + err + "```");
                          });

                          // pmsg.edit(`Level found!\n\n**${levelinfo[0]}**\nBy: **${levelinfo[1]}** (**${levelinfo[2]}**, **${levelinfo[3]}**)\n\nThis level is currently in the **${levelinfo[5]}** class, its rating is **${levelinfo[6]}**, it has **${levelinfo[7]}** vote(s), **${levelinfo[8]}** play(s), **${levelinfo[9].split(" ").slice(1).join(" ")}** favorite(s), its required game is **${levelinfo[10].trim()}**, its difficulty is **${levelinfo[11]}**, and it was published on **${levelinfo[12]}** (EST/EDT)!\n\nYou can go check out and possibly review the level here:\n<${resp.request.uri.href}>`).catch(err => {
                          //   pmsg.edit("**An error occurred while trying to edit this message:**```" + err + "```");
                          // });
                        }
                      } else {
                        console.error(`${message.author.username} encountered an error while trying to find a level in #${message.channel.name} of ${message.guild.name}.`);
                        message.channel.send("An error has occurred, please try again.");
                      }
                    });
                  } else {
                    msg.delete();
                    if (message.guild.me.hasPermission("MANAGE_MESSAGES")) collected.first().delete();
                    message.channel.send(`**${message.author.username}**, request canceled.`);
                  }
                })
                .catch(collected => {
                  msg.delete();
                  message.channel.send(`**${message.author.username}**, your LP level request timed out.`);
                });
              })
              .catch(err => {
                console.error(`An error occurred while trying to send a message:\n${err}`);
                message.channel.send("**An error occurred while trying to send a message:**```" + err + "```");
              });
            } else if (levels.length === 5) {
              pmsg.delete();
              message.channel.send(`***Please choose the number of the LP level you are trying to specify, or reply with "cancel" to choose none:***\n\n**[0]** ${levels[0]}\n**[1]** ${levels[1]}\n**[2]** ${levels[2]}\n**[3]** ${levels[3]}\n**[4]** ${levels[4]}`)
              .then(msg => {
                // establish filter for response messages
                const filter = rmsg => {
                  if (!isNaN(rmsg.content) && levels[rmsg.content] && rmsg.author.id === message.author.id || rmsg.content.replace(/\s/g, "").toLowerCase() === "cancel" && rmsg.author.id === message.author.id) return true;
                }

                message.channel.awaitMessages(filter, { max: 1, time: 20000, errors: ["time"] })
                .then(collected => {
                  // retrieve user information if input is not "cancel"
                  if (collected.first().content !== "cancel") {

                    request({ uri: `https://www.levelpalace.com/${levellinks[collected.first().content]}`, timeout: 20000, headers: { "User-Agent": "lp-helper" } }, function(err, resp, body) {
                      if (!err && resp.statusCode === 200) {
                        let $ = cheerio.load(body);

                        if ($("div.navbar-fixed").length === 0) return message.channel.send("Level Palace is currently **down**, and so this command will not work properly right now. Please try again later!");

                        // get level title
                        $("p.truncate", "div.nav-wrapper").each(function() {
                          let title = $(this).text().trim();
                          levelinfo.push(title);
                        });

                        // get author stats and level stats
                        $("ul.level-stats", "div.level-info").each(function() {
                          // get author name
                          let author = $("p.user-username").text().trim();
                          levelinfo.push(author);

                          // get author status
                          let status = $("p.user-class").text().trim();
                          levelinfo.push(status);

                          // get author rank
                          let rank = $("p.user-rank").text().trim();
                          levelinfo.push(rank);

                          // get all level stats
                          $("li.collection-item", "ul.level-stats").each(function() {
                            let stat = $(this).text().trim().split(" ").slice(1).join(" ");
                            levelinfo.push(stat);
                          });
                        });

                        // get level image if one exists
                        $("img[src]", "ul.slides").each(function() {
                          let levelimage = $(this).attr("src");
                          urlExists(levelimage, function(err, exists) {
                            if (!err) {
                              if (!exists) {
                                levelimage = "https://i.imgur.com/2E8BWdV.png";
                              }
                            } else {
                              levelimage = "https://i.imgur.com/2E8BWdV.png";
                            }
                          });
                          levelinfo.push(levelimage);
                        });

                        // add dummy level image if one is still not added
                        if (!levelinfo[levelinfo.length - 1].includes("http")) levelinfo.push("https://i.imgur.com/2E8BWdV.png");

                        if (levelinfo[10].trim() === "See description") {
                          if (message.channel.type === "dm") {
                            console.log(`${message.author.tag} entered "${args.trim()}" as a level name in DMs, and "${levelinfo[0]}" by ${levelinfo[1]} was found.`);
                          } else if (message.channel.type === "group") {
                            console.log(`${message.author.tag} entered "${args.trim()}" as a level name in the ${message.channel.name} Group DM, and "${levelinfo[0]}" by ${levelinfo[1]} was found.`);
                          } else {
                            console.log(`${message.author.tag} entered "${args.trim()}" as a level name in #${message.channel.name} of ${message.guild.name}, and "${levelinfo[0]}" by ${levelinfo[1]} was found.`);
                          }
                          msg.delete();
                          if (message.guild.me.hasPermission("MANAGE_MESSAGES")) collected.first().delete();
                          message.channel.send({ content: "Here is your requested level:", embed: {
                            color: 3447003,
                            thumbnail: {
                              url: levelinfo[levelinfo.length - 1]
                            },
                            fields: [
                              {
                                name: "Name",
                                value: levelinfo[0]
                              },
                              {
                                name: "Author",
                                value: `${levelinfo[1]}\n(${levelinfo[2]}, ${levelinfo[3]})`
                              },
                              {
                                name: "Class",
                                value: levelinfo[5],
                                inline: true
                              },
                              {
                                name: "Rating",
                                value: levelinfo[6],
                                inline: true
                              },
                              {
                                name: "Votes",
                                value: levelinfo[7],
                                inline: true
                              },
                              {
                                name: "Plays",
                                value: levelinfo[8],
                                inline: true
                              },
                              {
                                name: "Favorites",
                                value: levelinfo[9].split(" ").slice(1).join(" "),
                                inline: true
                              },
                              {
                                name: "Game",
                                value: "In Description",
                                inline: true
                              },
                              {
                                name: "Difficulty",
                                value: levelinfo[11],
                                inline: true
                              },
                              {
                                name: "Published on",
                                value: `${levelinfo[12]} (EST/EDT)`,
                                inline: true
                              },
                              {
                                name: "Link",
                                value: `<${resp.request.uri.href}>`,
                                inline: true
                              }
                            ]
                          }}).catch(err => {
                            message.channel.send("**An error occurred while trying to send a message:**```" + err + "```");
                          });

                          // message.channel.send(`Level found!\n\n**${levelinfo[0]}**\nBy: **${levelinfo[1]}** (**${levelinfo[2]}**, **${levelinfo[3]}**)\n\nThis level is currently in the **${levelinfo[5]}** class, its rating is **${levelinfo[6]}**, it has **${levelinfo[7]}** vote(s), **${levelinfo[8]}** play(s), **${levelinfo[9].split(" ").slice(1).join(" ")}** favorite(s), its required game is in the description, its difficulty is **${levelinfo[11]}**, and it was published on **${levelinfo[12]}** (EST/EDT)!\n\nYou can go check out and possibly review the level here:\n<${resp.request.uri.href}>`).catch(err => {
                          //   message.channel.send("**An error occurred while trying to send a message:**```" + err + "```");
                          // });
                        } else {
                          if (message.channel.type === "dm") {
                            console.log(`${message.author.tag} entered "${args.trim()}" as a level name in DMs, and "${levelinfo[0]}" by ${levelinfo[1]} was found.`);
                          } else if (message.channel.type === "group") {
                            console.log(`${message.author.tag} entered "${args.trim()}" as a level name in the ${message.channel.name} Group DM, and "${levelinfo[0]}" by ${levelinfo[1]} was found.`);
                          } else {
                            console.log(`${message.author.tag} entered "${args.trim()}" as a level name in #${message.channel.name} of ${message.guild.name}, and "${levelinfo[0]}" by ${levelinfo[1]} was found.`);
                          }
                          msg.delete();
                          if (message.guild.me.hasPermission("MANAGE_MESSAGES")) collected.first().delete();
                          message.channel.send({ content: "Here is your requested level:", embed: {
                            color: 3447003,
                            thumbnail: {
                              url: levelinfo[levelinfo.length - 1]
                            },
                            fields: [
                              {
                                name: "Name",
                                value: levelinfo[0]
                              },
                              {
                                name: "Author",
                                value: `${levelinfo[1]}\n(${levelinfo[2]}, ${levelinfo[3]})`
                              },
                              {
                                name: "Class",
                                value: levelinfo[5],
                                inline: true
                              },
                              {
                                name: "Rating",
                                value: levelinfo[6],
                                inline: true
                              },
                              {
                                name: "Votes",
                                value: levelinfo[7],
                                inline: true
                              },
                              {
                                name: "Plays",
                                value: levelinfo[8],
                                inline: true
                              },
                              {
                                name: "Favorites",
                                value: levelinfo[9].split(" ").slice(1).join(" "),
                                inline: true
                              },
                              {
                                name: "Game",
                                value: levelinfo[10].trim(),
                                inline: true
                              },
                              {
                                name: "Difficulty",
                                value: levelinfo[11],
                                inline: true
                              },
                              {
                                name: "Published on",
                                value: `${levelinfo[12]} (EST/EDT)`,
                                inline: true
                              },
                              {
                                name: "Link",
                                value: `<${resp.request.uri.href}>`,
                                inline: true
                              }
                            ]
                          }}).catch(err => {
                            message.channel.send("**An error occurred while trying to send a message:**```" + err + "```");
                          });

                          // pmsg.edit(`Level found!\n\n**${levelinfo[0]}**\nBy: **${levelinfo[1]}** (**${levelinfo[2]}**, **${levelinfo[3]}**)\n\nThis level is currently in the **${levelinfo[5]}** class, its rating is **${levelinfo[6]}**, it has **${levelinfo[7]}** vote(s), **${levelinfo[8]}** play(s), **${levelinfo[9].split(" ").slice(1).join(" ")}** favorite(s), its required game is **${levelinfo[10].trim()}**, its difficulty is **${levelinfo[11]}**, and it was published on **${levelinfo[12]}** (EST/EDT)!\n\nYou can go check out and possibly review the level here:\n<${resp.request.uri.href}>`).catch(err => {
                          //   pmsg.edit("**An error occurred while trying to edit this message:**```" + err + "```");
                          // });
                        }
                      } else {
                        console.error(`${message.author.username} encountered an error while trying to find a level in #${message.channel.name} of ${message.guild.name}.`);
                        message.channel.send("An error has occurred, please try again.");
                      }
                    });
                  } else {
                    msg.delete();
                    if (message.guild.me.hasPermission("MANAGE_MESSAGES")) collected.first().delete();
                    message.channel.send(`**${message.author.username}**, request canceled.`);
                  }
                })
                .catch(collected => {
                  msg.delete();
                  message.channel.send(`**${message.author.username}**, your LP level request timed out.`);
                });
              })
              .catch(err => {
                console.error(`An error occurred while trying to send a message:\n${err}`);
                message.channel.send("**An error occurred while trying to send a message:**```" + err + "```");
              });
            } else if (levels.length === 6) {
              pmsg.delete();
              message.channel.send(`***Please choose the number of the LP level you are trying to specify, or reply with "cancel" to choose none:***\n\n**[0]** ${levels[0]}\n**[1]** ${levels[1]}\n**[2]** ${levels[2]}\n**[3]** ${levels[3]}\n**[4]** ${levels[4]}\n**[5]** ${levels[5]}`)
              .then(msg => {
                // establish filter for response messages
                const filter = rmsg => {
                  if (!isNaN(rmsg.content) && levels[rmsg.content] && rmsg.author.id === message.author.id || rmsg.content.replace(/\s/g, "").toLowerCase() === "cancel" && rmsg.author.id === message.author.id) return true;
                }

                message.channel.awaitMessages(filter, { max: 1, time: 20000, errors: ["time"] })
                .then(collected => {
                  // retrieve user information if input is not "cancel"
                  if (collected.first().content !== "cancel") {

                    request({ uri: `https://www.levelpalace.com/${levellinks[collected.first().content]}`, timeout: 20000, headers: { "User-Agent": "lp-helper" } }, function(err, resp, body) {
                      if (!err && resp.statusCode === 200) {
                        let $ = cheerio.load(body);

                        if ($("div.navbar-fixed").length === 0) return message.channel.send("Level Palace is currently **down**, and so this command will not work properly right now. Please try again later!");

                        // get level title
                        $("p.truncate", "div.nav-wrapper").each(function() {
                          let title = $(this).text().trim();
                          levelinfo.push(title);
                        });

                        // get author stats and level stats
                        $("ul.level-stats", "div.level-info").each(function() {
                          // get author name
                          let author = $("p.user-username").text().trim();
                          levelinfo.push(author);

                          // get author status
                          let status = $("p.user-class").text().trim();
                          levelinfo.push(status);

                          // get author rank
                          let rank = $("p.user-rank").text().trim();
                          levelinfo.push(rank);

                          // get all level stats
                          $("li.collection-item", "ul.level-stats").each(function() {
                            let stat = $(this).text().trim().split(" ").slice(1).join(" ");
                            levelinfo.push(stat);
                          });
                        });

                        // get level image if one exists
                        $("img[src]", "ul.slides").each(function() {
                          let levelimage = $(this).attr("src");
                          urlExists(levelimage, function(err, exists) {
                            if (!err) {
                              if (!exists) {
                                levelimage = "https://i.imgur.com/2E8BWdV.png";
                              }
                            } else {
                              levelimage = "https://i.imgur.com/2E8BWdV.png";
                            }
                          });
                          levelinfo.push(levelimage);
                        });

                        // add dummy level image if one is still not added
                        if (!levelinfo[levelinfo.length - 1].includes("http")) levelinfo.push("https://i.imgur.com/2E8BWdV.png");

                        if (levelinfo[10].trim() === "See description") {
                          if (message.channel.type === "dm") {
                            console.log(`${message.author.tag} entered "${args.trim()}" as a level name in DMs, and "${levelinfo[0]}" by ${levelinfo[1]} was found.`);
                          } else if (message.channel.type === "group") {
                            console.log(`${message.author.tag} entered "${args.trim()}" as a level name in the ${message.channel.name} Group DM, and "${levelinfo[0]}" by ${levelinfo[1]} was found.`);
                          } else {
                            console.log(`${message.author.tag} entered "${args.trim()}" as a level name in #${message.channel.name} of ${message.guild.name}, and "${levelinfo[0]}" by ${levelinfo[1]} was found.`);
                          }
                          msg.delete();
                          if (message.guild.me.hasPermission("MANAGE_MESSAGES")) collected.first().delete();
                          message.channel.send({ content: "Here is your requested level:", embed: {
                            color: 3447003,
                            thumbnail: {
                              url: levelinfo[levelinfo.length - 1]
                            },
                            fields: [
                              {
                                name: "Name",
                                value: levelinfo[0]
                              },
                              {
                                name: "Author",
                                value: `${levelinfo[1]}\n(${levelinfo[2]}, ${levelinfo[3]})`
                              },
                              {
                                name: "Class",
                                value: levelinfo[5],
                                inline: true
                              },
                              {
                                name: "Rating",
                                value: levelinfo[6],
                                inline: true
                              },
                              {
                                name: "Votes",
                                value: levelinfo[7],
                                inline: true
                              },
                              {
                                name: "Plays",
                                value: levelinfo[8],
                                inline: true
                              },
                              {
                                name: "Favorites",
                                value: levelinfo[9].split(" ").slice(1).join(" "),
                                inline: true
                              },
                              {
                                name: "Game",
                                value: "In Description",
                                inline: true
                              },
                              {
                                name: "Difficulty",
                                value: levelinfo[11],
                                inline: true
                              },
                              {
                                name: "Published on",
                                value: `${levelinfo[12]} (EST/EDT)`,
                                inline: true
                              },
                              {
                                name: "Link",
                                value: `<${resp.request.uri.href}>`,
                                inline: true
                              }
                            ]
                          }}).catch(err => {
                            message.channel.send("**An error occurred while trying to send a message:**```" + err + "```");
                          });

                          // message.channel.send(`Level found!\n\n**${levelinfo[0]}**\nBy: **${levelinfo[1]}** (**${levelinfo[2]}**, **${levelinfo[3]}**)\n\nThis level is currently in the **${levelinfo[5]}** class, its rating is **${levelinfo[6]}**, it has **${levelinfo[7]}** vote(s), **${levelinfo[8]}** play(s), **${levelinfo[9].split(" ").slice(1).join(" ")}** favorite(s), its required game is in the description, its difficulty is **${levelinfo[11]}**, and it was published on **${levelinfo[12]}** (EST/EDT)!\n\nYou can go check out and possibly review the level here:\n<${resp.request.uri.href}>`).catch(err => {
                          //   message.channel.send("**An error occurred while trying to send a message:**```" + err + "```");
                          // });
                        } else {
                          if (message.channel.type === "dm") {
                            console.log(`${message.author.tag} entered "${args.trim()}" as a level name in DMs, and "${levelinfo[0]}" by ${levelinfo[1]} was found.`);
                          } else if (message.channel.type === "group") {
                            console.log(`${message.author.tag} entered "${args.trim()}" as a level name in the ${message.channel.name} Group DM, and "${levelinfo[0]}" by ${levelinfo[1]} was found.`);
                          } else {
                            console.log(`${message.author.tag} entered "${args.trim()}" as a level name in #${message.channel.name} of ${message.guild.name}, and "${levelinfo[0]}" by ${levelinfo[1]} was found.`);
                          }
                          msg.delete();
                          if (message.guild.me.hasPermission("MANAGE_MESSAGES")) collected.first().delete();
                          message.channel.send({ content: "Here is your requested level:", embed: {
                            color: 3447003,
                            thumbnail: {
                              url: levelinfo[levelinfo.length - 1]
                            },
                            fields: [
                              {
                                name: "Name",
                                value: levelinfo[0]
                              },
                              {
                                name: "Author",
                                value: `${levelinfo[1]}\n(${levelinfo[2]}, ${levelinfo[3]})`
                              },
                              {
                                name: "Class",
                                value: levelinfo[5],
                                inline: true
                              },
                              {
                                name: "Rating",
                                value: levelinfo[6],
                                inline: true
                              },
                              {
                                name: "Votes",
                                value: levelinfo[7],
                                inline: true
                              },
                              {
                                name: "Plays",
                                value: levelinfo[8],
                                inline: true
                              },
                              {
                                name: "Favorites",
                                value: levelinfo[9].split(" ").slice(1).join(" "),
                                inline: true
                              },
                              {
                                name: "Game",
                                value: levelinfo[10].trim(),
                                inline: true
                              },
                              {
                                name: "Difficulty",
                                value: levelinfo[11],
                                inline: true
                              },
                              {
                                name: "Published on",
                                value: `${levelinfo[12]} (EST/EDT)`,
                                inline: true
                              },
                              {
                                name: "Link",
                                value: `<${resp.request.uri.href}>`,
                                inline: true
                              }
                            ]
                          }}).catch(err => {
                            message.channel.send("**An error occurred while trying to send a message:**```" + err + "```");
                          });

                          // pmsg.edit(`Level found!\n\n**${levelinfo[0]}**\nBy: **${levelinfo[1]}** (**${levelinfo[2]}**, **${levelinfo[3]}**)\n\nThis level is currently in the **${levelinfo[5]}** class, its rating is **${levelinfo[6]}**, it has **${levelinfo[7]}** vote(s), **${levelinfo[8]}** play(s), **${levelinfo[9].split(" ").slice(1).join(" ")}** favorite(s), its required game is **${levelinfo[10].trim()}**, its difficulty is **${levelinfo[11]}**, and it was published on **${levelinfo[12]}** (EST/EDT)!\n\nYou can go check out and possibly review the level here:\n<${resp.request.uri.href}>`).catch(err => {
                          //   pmsg.edit("**An error occurred while trying to edit this message:**```" + err + "```");
                          // });
                        }
                      } else {
                        console.error(`${message.author.username} encountered an error while trying to find a level in #${message.channel.name} of ${message.guild.name}.`);
                        message.channel.send("An error has occurred, please try again.");
                      }
                    });
                  } else {
                    msg.delete();
                    if (message.guild.me.hasPermission("MANAGE_MESSAGES")) collected.first().delete();
                    message.channel.send(`**${message.author.username}**, request canceled.`);
                  }
                })
                .catch(collected => {
                  msg.delete();
                  message.channel.send(`**${message.author.username}**, your LP level request timed out.`);
                });
              })
              .catch(err => {
                console.error(`An error occurred while trying to send a message:\n${err}`);
                message.channel.send("**An error occurred while trying to send a message:**```" + err + "```");
              });
            } else if (levels.length === 7) {
              pmsg.delete();
              message.channel.send(`***Please choose the number of the LP level you are trying to specify, or reply with "cancel" to choose none:***\n\n**[0]** ${levels[0]}\n**[1]** ${levels[1]}\n**[2]** ${levels[2]}\n**[3]** ${levels[3]}\n**[4]** ${levels[4]}\n**[5]** ${levels[5]}\n**[6]** ${levels[6]}`)
              .then(msg => {
                // establish filter for response messages
                const filter = rmsg => {
                  if (!isNaN(rmsg.content) && levels[rmsg.content] && rmsg.author.id === message.author.id || rmsg.content.replace(/\s/g, "").toLowerCase() === "cancel" && rmsg.author.id === message.author.id) return true;
                }

                message.channel.awaitMessages(filter, { max: 1, time: 20000, errors: ["time"] })
                .then(collected => {
                  // retrieve user information if input is not "cancel"
                  if (collected.first().content !== "cancel") {

                    request({ uri: `https://www.levelpalace.com/${levellinks[collected.first().content]}`, timeout: 20000, headers: { "User-Agent": "lp-helper" } }, function(err, resp, body) {
                      if (!err && resp.statusCode === 200) {
                        let $ = cheerio.load(body);

                        if ($("div.navbar-fixed").length === 0) return message.channel.send("Level Palace is currently **down**, and so this command will not work properly right now. Please try again later!");

                        // get level title
                        $("p.truncate", "div.nav-wrapper").each(function() {
                          let title = $(this).text().trim();
                          levelinfo.push(title);
                        });

                        // get author stats and level stats
                        $("ul.level-stats", "div.level-info").each(function() {
                          // get author name
                          let author = $("p.user-username").text().trim();
                          levelinfo.push(author);

                          // get author status
                          let status = $("p.user-class").text().trim();
                          levelinfo.push(status);

                          // get author rank
                          let rank = $("p.user-rank").text().trim();
                          levelinfo.push(rank);

                          // get all level stats
                          $("li.collection-item", "ul.level-stats").each(function() {
                            let stat = $(this).text().trim().split(" ").slice(1).join(" ");
                            levelinfo.push(stat);
                          });
                        });

                        // get level image if one exists
                        $("img[src]", "ul.slides").each(function() {
                          let levelimage = $(this).attr("src");
                          urlExists(levelimage, function(err, exists) {
                            if (!err) {
                              if (!exists) {
                                levelimage = "https://i.imgur.com/2E8BWdV.png";
                              }
                            } else {
                              levelimage = "https://i.imgur.com/2E8BWdV.png";
                            }
                          });
                          levelinfo.push(levelimage);
                        });

                        // add dummy level image if one is still not added
                        if (!levelinfo[levelinfo.length - 1].includes("http")) levelinfo.push("https://i.imgur.com/2E8BWdV.png");

                        if (levelinfo[10].trim() === "See description") {
                          if (message.channel.type === "dm") {
                            console.log(`${message.author.tag} entered "${args.trim()}" as a level name in DMs, and "${levelinfo[0]}" by ${levelinfo[1]} was found.`);
                          } else if (message.channel.type === "group") {
                            console.log(`${message.author.tag} entered "${args.trim()}" as a level name in the ${message.channel.name} Group DM, and "${levelinfo[0]}" by ${levelinfo[1]} was found.`);
                          } else {
                            console.log(`${message.author.tag} entered "${args.trim()}" as a level name in #${message.channel.name} of ${message.guild.name}, and "${levelinfo[0]}" by ${levelinfo[1]} was found.`);
                          }
                          msg.delete();
                          if (message.guild.me.hasPermission("MANAGE_MESSAGES")) collected.first().delete();
                          message.channel.send({ content: "Here is your requested level:", embed: {
                            color: 3447003,
                            thumbnail: {
                              url: levelinfo[levelinfo.length - 1]
                            },
                            fields: [
                              {
                                name: "Name",
                                value: levelinfo[0]
                              },
                              {
                                name: "Author",
                                value: `${levelinfo[1]}\n(${levelinfo[2]}, ${levelinfo[3]})`
                              },
                              {
                                name: "Class",
                                value: levelinfo[5],
                                inline: true
                              },
                              {
                                name: "Rating",
                                value: levelinfo[6],
                                inline: true
                              },
                              {
                                name: "Votes",
                                value: levelinfo[7],
                                inline: true
                              },
                              {
                                name: "Plays",
                                value: levelinfo[8],
                                inline: true
                              },
                              {
                                name: "Favorites",
                                value: levelinfo[9].split(" ").slice(1).join(" "),
                                inline: true
                              },
                              {
                                name: "Game",
                                value: "In Description",
                                inline: true
                              },
                              {
                                name: "Difficulty",
                                value: levelinfo[11],
                                inline: true
                              },
                              {
                                name: "Published on",
                                value: `${levelinfo[12]} (EST/EDT)`,
                                inline: true
                              },
                              {
                                name: "Link",
                                value: `<${resp.request.uri.href}>`,
                                inline: true
                              }
                            ]
                          }}).catch(err => {
                            message.channel.send("**An error occurred while trying to send a message:**```" + err + "```");
                          });

                          // message.channel.send(`Level found!\n\n**${levelinfo[0]}**\nBy: **${levelinfo[1]}** (**${levelinfo[2]}**, **${levelinfo[3]}**)\n\nThis level is currently in the **${levelinfo[5]}** class, its rating is **${levelinfo[6]}**, it has **${levelinfo[7]}** vote(s), **${levelinfo[8]}** play(s), **${levelinfo[9].split(" ").slice(1).join(" ")}** favorite(s), its required game is in the description, its difficulty is **${levelinfo[11]}**, and it was published on **${levelinfo[12]}** (EST/EDT)!\n\nYou can go check out and possibly review the level here:\n<${resp.request.uri.href}>`).catch(err => {
                          //   message.channel.send("**An error occurred while trying to send a message:**```" + err + "```");
                          // });
                        } else {
                          if (message.channel.type === "dm") {
                            console.log(`${message.author.tag} entered "${args.trim()}" as a level name in DMs, and "${levelinfo[0]}" by ${levelinfo[1]} was found.`);
                          } else if (message.channel.type === "group") {
                            console.log(`${message.author.tag} entered "${args.trim()}" as a level name in the ${message.channel.name} Group DM, and "${levelinfo[0]}" by ${levelinfo[1]} was found.`);
                          } else {
                            console.log(`${message.author.tag} entered "${args.trim()}" as a level name in #${message.channel.name} of ${message.guild.name}, and "${levelinfo[0]}" by ${levelinfo[1]} was found.`);
                          }
                          msg.delete();
                          if (message.guild.me.hasPermission("MANAGE_MESSAGES")) collected.first().delete();
                          message.channel.send({ content: "Here is your requested level:", embed: {
                            color: 3447003,
                            thumbnail: {
                              url: levelinfo[levelinfo.length - 1]
                            },
                            fields: [
                              {
                                name: "Name",
                                value: levelinfo[0]
                              },
                              {
                                name: "Author",
                                value: `${levelinfo[1]}\n(${levelinfo[2]}, ${levelinfo[3]})`
                              },
                              {
                                name: "Class",
                                value: levelinfo[5],
                                inline: true
                              },
                              {
                                name: "Rating",
                                value: levelinfo[6],
                                inline: true
                              },
                              {
                                name: "Votes",
                                value: levelinfo[7],
                                inline: true
                              },
                              {
                                name: "Plays",
                                value: levelinfo[8],
                                inline: true
                              },
                              {
                                name: "Favorites",
                                value: levelinfo[9].split(" ").slice(1).join(" "),
                                inline: true
                              },
                              {
                                name: "Game",
                                value: levelinfo[10].trim(),
                                inline: true
                              },
                              {
                                name: "Difficulty",
                                value: levelinfo[11],
                                inline: true
                              },
                              {
                                name: "Published on",
                                value: `${levelinfo[12]} (EST/EDT)`,
                                inline: true
                              },
                              {
                                name: "Link",
                                value: `<${resp.request.uri.href}>`,
                                inline: true
                              }
                            ]
                          }}).catch(err => {
                            message.channel.send("**An error occurred while trying to send a message:**```" + err + "```");
                          });

                          // pmsg.edit(`Level found!\n\n**${levelinfo[0]}**\nBy: **${levelinfo[1]}** (**${levelinfo[2]}**, **${levelinfo[3]}**)\n\nThis level is currently in the **${levelinfo[5]}** class, its rating is **${levelinfo[6]}**, it has **${levelinfo[7]}** vote(s), **${levelinfo[8]}** play(s), **${levelinfo[9].split(" ").slice(1).join(" ")}** favorite(s), its required game is **${levelinfo[10].trim()}**, its difficulty is **${levelinfo[11]}**, and it was published on **${levelinfo[12]}** (EST/EDT)!\n\nYou can go check out and possibly review the level here:\n<${resp.request.uri.href}>`).catch(err => {
                          //   pmsg.edit("**An error occurred while trying to edit this message:**```" + err + "```");
                          // });
                        }
                      } else {
                        console.error(`${message.author.username} encountered an error while trying to find a level in #${message.channel.name} of ${message.guild.name}.`);
                        message.channel.send("An error has occurred, please try again.");
                      }
                    });
                  } else {
                    msg.delete();
                    if (message.guild.me.hasPermission("MANAGE_MESSAGES")) collected.first().delete();
                    message.channel.send(`**${message.author.username}**, request canceled.`);
                  }
                })
                .catch(collected => {
                  msg.delete();
                  message.channel.send(`**${message.author.username}**, your LP level request timed out.`);
                });
              })
              .catch(err => {
                console.error(`An error occurred while trying to send a message:\n${err}`);
                message.channel.send("**An error occurred while trying to send a message:**```" + err + "```");
              });
            } else if (levels.length === 8) {
              pmsg.delete();
              message.channel.send(`***Please choose the number of the LP level you are trying to specify, or reply with "cancel" to choose none:***\n\n**[0]** ${levels[0]}\n**[1]** ${levels[1]}\n**[2]** ${levels[2]}\n**[3]** ${levels[3]}\n**[4]** ${levels[4]}\n**[5]** ${levels[5]}\n**[6]** ${levels[6]}\n**[7]** ${levels[7]}`)
              .then(msg => {
                // establish filter for response messages
                const filter = rmsg => {
                  if (!isNaN(rmsg.content) && levels[rmsg.content] && rmsg.author.id === message.author.id || rmsg.content.replace(/\s/g, "").toLowerCase() === "cancel" && rmsg.author.id === message.author.id) return true;
                }

                message.channel.awaitMessages(filter, { max: 1, time: 20000, errors: ["time"] })
                .then(collected => {
                  // retrieve user information if input is not "cancel"
                  if (collected.first().content !== "cancel") {

                    request({ uri: `https://www.levelpalace.com/${levellinks[collected.first().content]}`, timeout: 20000, headers: { "User-Agent": "lp-helper" } }, function(err, resp, body) {
                      if (!err && resp.statusCode === 200) {
                        let $ = cheerio.load(body);

                        if ($("div.navbar-fixed").length === 0) return message.channel.send("Level Palace is currently **down**, and so this command will not work properly right now. Please try again later!");

                        // get level title
                        $("p.truncate", "div.nav-wrapper").each(function() {
                          let title = $(this).text().trim();
                          levelinfo.push(title);
                        });

                        // get author stats and level stats
                        $("ul.level-stats", "div.level-info").each(function() {
                          // get author name
                          let author = $("p.user-username").text().trim();
                          levelinfo.push(author);

                          // get author status
                          let status = $("p.user-class").text().trim();
                          levelinfo.push(status);

                          // get author rank
                          let rank = $("p.user-rank").text().trim();
                          levelinfo.push(rank);

                          // get all level stats
                          $("li.collection-item", "ul.level-stats").each(function() {
                            let stat = $(this).text().trim().split(" ").slice(1).join(" ");
                            levelinfo.push(stat);
                          });
                        });

                        // get level image if one exists
                        $("img[src]", "ul.slides").each(function() {
                          let levelimage = $(this).attr("src");
                          urlExists(levelimage, function(err, exists) {
                            if (!err) {
                              if (!exists) {
                                levelimage = "https://i.imgur.com/2E8BWdV.png";
                              }
                            } else {
                              levelimage = "https://i.imgur.com/2E8BWdV.png";
                            }
                          });
                          levelinfo.push(levelimage);
                        });

                        // add dummy level image if one is still not added
                        if (!levelinfo[levelinfo.length - 1].includes("http")) levelinfo.push("https://i.imgur.com/2E8BWdV.png");

                        if (levelinfo[10].trim() === "See description") {
                          if (message.channel.type === "dm") {
                            console.log(`${message.author.tag} entered "${args.trim()}" as a level name in DMs, and "${levelinfo[0]}" by ${levelinfo[1]} was found.`);
                          } else if (message.channel.type === "group") {
                            console.log(`${message.author.tag} entered "${args.trim()}" as a level name in the ${message.channel.name} Group DM, and "${levelinfo[0]}" by ${levelinfo[1]} was found.`);
                          } else {
                            console.log(`${message.author.tag} entered "${args.trim()}" as a level name in #${message.channel.name} of ${message.guild.name}, and "${levelinfo[0]}" by ${levelinfo[1]} was found.`);
                          }
                          msg.delete();
                          if (message.guild.me.hasPermission("MANAGE_MESSAGES")) collected.first().delete();
                          message.channel.send({ content: "Here is your requested level:", embed: {
                            color: 3447003,
                            thumbnail: {
                              url: levelinfo[levelinfo.length - 1]
                            },
                            fields: [
                              {
                                name: "Name",
                                value: levelinfo[0]
                              },
                              {
                                name: "Author",
                                value: `${levelinfo[1]}\n(${levelinfo[2]}, ${levelinfo[3]})`
                              },
                              {
                                name: "Class",
                                value: levelinfo[5],
                                inline: true
                              },
                              {
                                name: "Rating",
                                value: levelinfo[6],
                                inline: true
                              },
                              {
                                name: "Votes",
                                value: levelinfo[7],
                                inline: true
                              },
                              {
                                name: "Plays",
                                value: levelinfo[8],
                                inline: true
                              },
                              {
                                name: "Favorites",
                                value: levelinfo[9].split(" ").slice(1).join(" "),
                                inline: true
                              },
                              {
                                name: "Game",
                                value: "In Description",
                                inline: true
                              },
                              {
                                name: "Difficulty",
                                value: levelinfo[11],
                                inline: true
                              },
                              {
                                name: "Published on",
                                value: `${levelinfo[12]} (EST/EDT)`,
                                inline: true
                              },
                              {
                                name: "Link",
                                value: `<${resp.request.uri.href}>`,
                                inline: true
                              }
                            ]
                          }}).catch(err => {
                            message.channel.send("**An error occurred while trying to send a message:**```" + err + "```");
                          });

                          // message.channel.send(`Level found!\n\n**${levelinfo[0]}**\nBy: **${levelinfo[1]}** (**${levelinfo[2]}**, **${levelinfo[3]}**)\n\nThis level is currently in the **${levelinfo[5]}** class, its rating is **${levelinfo[6]}**, it has **${levelinfo[7]}** vote(s), **${levelinfo[8]}** play(s), **${levelinfo[9].split(" ").slice(1).join(" ")}** favorite(s), its required game is in the description, its difficulty is **${levelinfo[11]}**, and it was published on **${levelinfo[12]}** (EST/EDT)!\n\nYou can go check out and possibly review the level here:\n<${resp.request.uri.href}>`).catch(err => {
                          //   message.channel.send("**An error occurred while trying to send a message:**```" + err + "```");
                          // });
                        } else {
                          if (message.channel.type === "dm") {
                            console.log(`${message.author.tag} entered "${args.trim()}" as a level name in DMs, and "${levelinfo[0]}" by ${levelinfo[1]} was found.`);
                          } else if (message.channel.type === "group") {
                            console.log(`${message.author.tag} entered "${args.trim()}" as a level name in the ${message.channel.name} Group DM, and "${levelinfo[0]}" by ${levelinfo[1]} was found.`);
                          } else {
                            console.log(`${message.author.tag} entered "${args.trim()}" as a level name in #${message.channel.name} of ${message.guild.name}, and "${levelinfo[0]}" by ${levelinfo[1]} was found.`);
                          }
                          msg.delete();
                          if (message.guild.me.hasPermission("MANAGE_MESSAGES")) collected.first().delete();
                          message.channel.send({ content: "Here is your requested level:", embed: {
                            color: 3447003,
                            thumbnail: {
                              url: levelinfo[levelinfo.length - 1]
                            },
                            fields: [
                              {
                                name: "Name",
                                value: levelinfo[0]
                              },
                              {
                                name: "Author",
                                value: `${levelinfo[1]}\n(${levelinfo[2]}, ${levelinfo[3]})`
                              },
                              {
                                name: "Class",
                                value: levelinfo[5],
                                inline: true
                              },
                              {
                                name: "Rating",
                                value: levelinfo[6],
                                inline: true
                              },
                              {
                                name: "Votes",
                                value: levelinfo[7],
                                inline: true
                              },
                              {
                                name: "Plays",
                                value: levelinfo[8],
                                inline: true
                              },
                              {
                                name: "Favorites",
                                value: levelinfo[9].split(" ").slice(1).join(" "),
                                inline: true
                              },
                              {
                                name: "Game",
                                value: levelinfo[10].trim(),
                                inline: true
                              },
                              {
                                name: "Difficulty",
                                value: levelinfo[11],
                                inline: true
                              },
                              {
                                name: "Published on",
                                value: `${levelinfo[12]} (EST/EDT)`,
                                inline: true
                              },
                              {
                                name: "Link",
                                value: `<${resp.request.uri.href}>`,
                                inline: true
                              }
                            ]
                          }}).catch(err => {
                            message.channel.send("**An error occurred while trying to send a message:**```" + err + "```");
                          });

                          // pmsg.edit(`Level found!\n\n**${levelinfo[0]}**\nBy: **${levelinfo[1]}** (**${levelinfo[2]}**, **${levelinfo[3]}**)\n\nThis level is currently in the **${levelinfo[5]}** class, its rating is **${levelinfo[6]}**, it has **${levelinfo[7]}** vote(s), **${levelinfo[8]}** play(s), **${levelinfo[9].split(" ").slice(1).join(" ")}** favorite(s), its required game is **${levelinfo[10].trim()}**, its difficulty is **${levelinfo[11]}**, and it was published on **${levelinfo[12]}** (EST/EDT)!\n\nYou can go check out and possibly review the level here:\n<${resp.request.uri.href}>`).catch(err => {
                          //   pmsg.edit("**An error occurred while trying to edit this message:**```" + err + "```");
                          // });
                        }
                      } else {
                        console.error(`${message.author.username} encountered an error while trying to find a level in #${message.channel.name} of ${message.guild.name}.`);
                        message.channel.send("An error has occurred, please try again.");
                      }
                    });
                  } else {
                    msg.delete();
                    if (message.guild.me.hasPermission("MANAGE_MESSAGES")) collected.first().delete();
                    message.channel.send(`**${message.author.username}**, request canceled.`);
                  }
                })
                .catch(collected => {
                  msg.delete();
                  message.channel.send(`**${message.author.username}**, your LP level request timed out.`);
                });
              })
              .catch(err => {
                console.error(`An error occurred while trying to send a message:\n${err}`);
                message.channel.send("**An error occurred while trying to send a message:**```" + err + "```");
              });
            } else if (levels.length === 9) {
              pmsg.delete();
              message.channel.send(`***Please choose the number of the LP level you are trying to specify, or reply with "cancel" to choose none:***\n\n**[0]** ${levels[0]}\n**[1]** ${levels[1]}\n**[2]** ${levels[2]}\n**[3]** ${levels[3]}\n**[4]** ${levels[4]}\n**[5]** ${levels[5]}\n**[6]** ${levels[6]}\n**[7]** ${levels[7]}\n**[8]** ${levels[8]}`)
              .then(msg => {
                // establish filter for response messages
                const filter = rmsg => {
                  if (!isNaN(rmsg.content) && levels[rmsg.content] && rmsg.author.id === message.author.id || rmsg.content.replace(/\s/g, "").toLowerCase() === "cancel" && rmsg.author.id === message.author.id) return true;
                }

                message.channel.awaitMessages(filter, { max: 1, time: 20000, errors: ["time"] })
                .then(collected => {
                  // retrieve user information if input is not "cancel"
                  if (collected.first().content !== "cancel") {

                    request({ uri: `https://www.levelpalace.com/${levellinks[collected.first().content]}`, timeout: 20000, headers: { "User-Agent": "lp-helper" } }, function(err, resp, body) {
                      if (!err && resp.statusCode === 200) {
                        let $ = cheerio.load(body);

                        if ($("div.navbar-fixed").length === 0) return message.channel.send("Level Palace is currently **down**, and so this command will not work properly right now. Please try again later!");

                        // get level title
                        $("p.truncate", "div.nav-wrapper").each(function() {
                          let title = $(this).text().trim();
                          levelinfo.push(title);
                        });

                        // get author stats and level stats
                        $("ul.level-stats", "div.level-info").each(function() {
                          // get author name
                          let author = $("p.user-username").text().trim();
                          levelinfo.push(author);

                          // get author status
                          let status = $("p.user-class").text().trim();
                          levelinfo.push(status);

                          // get author rank
                          let rank = $("p.user-rank").text().trim();
                          levelinfo.push(rank);

                          // get all level stats
                          $("li.collection-item", "ul.level-stats").each(function() {
                            let stat = $(this).text().trim().split(" ").slice(1).join(" ");
                            levelinfo.push(stat);
                          });
                        });

                        // get level image if one exists
                        $("img[src]", "ul.slides").each(function() {
                          let levelimage = $(this).attr("src");
                          urlExists(levelimage, function(err, exists) {
                            if (!err) {
                              if (!exists) {
                                levelimage = "https://i.imgur.com/2E8BWdV.png";
                              }
                            } else {
                              levelimage = "https://i.imgur.com/2E8BWdV.png";
                            }
                          });
                          levelinfo.push(levelimage);
                        });

                        // add dummy level image if one is still not added
                        if (!levelinfo[levelinfo.length - 1].includes("http")) levelinfo.push("https://i.imgur.com/2E8BWdV.png");

                        if (levelinfo[10].trim() === "See description") {
                          if (message.channel.type === "dm") {
                            console.log(`${message.author.tag} entered "${args.trim()}" as a level name in DMs, and "${levelinfo[0]}" by ${levelinfo[1]} was found.`);
                          } else if (message.channel.type === "group") {
                            console.log(`${message.author.tag} entered "${args.trim()}" as a level name in the ${message.channel.name} Group DM, and "${levelinfo[0]}" by ${levelinfo[1]} was found.`);
                          } else {
                            console.log(`${message.author.tag} entered "${args.trim()}" as a level name in #${message.channel.name} of ${message.guild.name}, and "${levelinfo[0]}" by ${levelinfo[1]} was found.`);
                          }
                          msg.delete();
                          if (message.guild.me.hasPermission("MANAGE_MESSAGES")) collected.first().delete();
                          message.channel.send({ content: "Here is your requested level:", embed: {
                            color: 3447003,
                            thumbnail: {
                              url: levelinfo[levelinfo.length - 1]
                            },
                            fields: [
                              {
                                name: "Name",
                                value: levelinfo[0]
                              },
                              {
                                name: "Author",
                                value: `${levelinfo[1]}\n(${levelinfo[2]}, ${levelinfo[3]})`
                              },
                              {
                                name: "Class",
                                value: levelinfo[5],
                                inline: true
                              },
                              {
                                name: "Rating",
                                value: levelinfo[6],
                                inline: true
                              },
                              {
                                name: "Votes",
                                value: levelinfo[7],
                                inline: true
                              },
                              {
                                name: "Plays",
                                value: levelinfo[8],
                                inline: true
                              },
                              {
                                name: "Favorites",
                                value: levelinfo[9].split(" ").slice(1).join(" "),
                                inline: true
                              },
                              {
                                name: "Game",
                                value: "In Description",
                                inline: true
                              },
                              {
                                name: "Difficulty",
                                value: levelinfo[11],
                                inline: true
                              },
                              {
                                name: "Published on",
                                value: `${levelinfo[12]} (EST/EDT)`,
                                inline: true
                              },
                              {
                                name: "Link",
                                value: `<${resp.request.uri.href}>`,
                                inline: true
                              }
                            ]
                          }}).catch(err => {
                            message.channel.send("**An error occurred while trying to send a message:**```" + err + "```");
                          });

                          // message.channel.send(`Level found!\n\n**${levelinfo[0]}**\nBy: **${levelinfo[1]}** (**${levelinfo[2]}**, **${levelinfo[3]}**)\n\nThis level is currently in the **${levelinfo[5]}** class, its rating is **${levelinfo[6]}**, it has **${levelinfo[7]}** vote(s), **${levelinfo[8]}** play(s), **${levelinfo[9].split(" ").slice(1).join(" ")}** favorite(s), its required game is in the description, its difficulty is **${levelinfo[11]}**, and it was published on **${levelinfo[12]}** (EST/EDT)!\n\nYou can go check out and possibly review the level here:\n<${resp.request.uri.href}>`).catch(err => {
                          //   message.channel.send("**An error occurred while trying to send a message:**```" + err + "```");
                          // });
                        } else {
                          if (message.channel.type === "dm") {
                            console.log(`${message.author.tag} entered "${args.trim()}" as a level name in DMs, and "${levelinfo[0]}" by ${levelinfo[1]} was found.`);
                          } else if (message.channel.type === "group") {
                            console.log(`${message.author.tag} entered "${args.trim()}" as a level name in the ${message.channel.name} Group DM, and "${levelinfo[0]}" by ${levelinfo[1]} was found.`);
                          } else {
                            console.log(`${message.author.tag} entered "${args.trim()}" as a level name in #${message.channel.name} of ${message.guild.name}, and "${levelinfo[0]}" by ${levelinfo[1]} was found.`);
                          }
                          msg.delete();
                          if (message.guild.me.hasPermission("MANAGE_MESSAGES")) collected.first().delete();
                          message.channel.send({ content: "Here is your requested level:", embed: {
                            color: 3447003,
                            thumbnail: {
                              url: levelinfo[levelinfo.length - 1]
                            },
                            fields: [
                              {
                                name: "Name",
                                value: levelinfo[0]
                              },
                              {
                                name: "Author",
                                value: `${levelinfo[1]}\n(${levelinfo[2]}, ${levelinfo[3]})`
                              },
                              {
                                name: "Class",
                                value: levelinfo[5],
                                inline: true
                              },
                              {
                                name: "Rating",
                                value: levelinfo[6],
                                inline: true
                              },
                              {
                                name: "Votes",
                                value: levelinfo[7],
                                inline: true
                              },
                              {
                                name: "Plays",
                                value: levelinfo[8],
                                inline: true
                              },
                              {
                                name: "Favorites",
                                value: levelinfo[9].split(" ").slice(1).join(" "),
                                inline: true
                              },
                              {
                                name: "Game",
                                value: levelinfo[10].trim(),
                                inline: true
                              },
                              {
                                name: "Difficulty",
                                value: levelinfo[11],
                                inline: true
                              },
                              {
                                name: "Published on",
                                value: `${levelinfo[12]} (EST/EDT)`,
                                inline: true
                              },
                              {
                                name: "Link",
                                value: `<${resp.request.uri.href}>`,
                                inline: true
                              }
                            ]
                          }}).catch(err => {
                            message.channel.send("**An error occurred while trying to send a message:**```" + err + "```");
                          });

                          // pmsg.edit(`Level found!\n\n**${levelinfo[0]}**\nBy: **${levelinfo[1]}** (**${levelinfo[2]}**, **${levelinfo[3]}**)\n\nThis level is currently in the **${levelinfo[5]}** class, its rating is **${levelinfo[6]}**, it has **${levelinfo[7]}** vote(s), **${levelinfo[8]}** play(s), **${levelinfo[9].split(" ").slice(1).join(" ")}** favorite(s), its required game is **${levelinfo[10].trim()}**, its difficulty is **${levelinfo[11]}**, and it was published on **${levelinfo[12]}** (EST/EDT)!\n\nYou can go check out and possibly review the level here:\n<${resp.request.uri.href}>`).catch(err => {
                          //   pmsg.edit("**An error occurred while trying to edit this message:**```" + err + "```");
                          // });
                        }
                      } else {
                        console.error(`${message.author.username} encountered an error while trying to find a level in #${message.channel.name} of ${message.guild.name}.`);
                        message.channel.send("An error has occurred, please try again.");
                      }
                    });
                  } else {
                    msg.delete();
                    if (message.guild.me.hasPermission("MANAGE_MESSAGES")) collected.first().delete();
                    message.channel.send(`**${message.author.username}**, request canceled.`);
                  }
                })
                .catch(collected => {
                  msg.delete();
                  message.channel.send(`**${message.author.username}**, your LP level request timed out.`);
                });
              })
              .catch(err => {
                console.error(`An error occurred while trying to send a message:\n${err}`);
                message.channel.send("**An error occurred while trying to send a message:**```" + err + "```");
              });
            } else if (levels.length === 10) {
              pmsg.delete();
              message.channel.send(`***Please choose the number of the LP level you are trying to specify, or reply with "cancel" to choose none:***\n\n**[0]** ${levels[0]}\n**[1]** ${levels[1]}\n**[2]** ${levels[2]}\n**[3]** ${levels[3]}\n**[4]** ${levels[4]}\n**[5]** ${levels[5]}\n**[6]** ${levels[6]}\n**[7]** ${levels[7]}\n**[8]** ${levels[8]}\n**[9]** ${levels[9]}\n\n***Note:*** *There may be more than 10 levels that match your search query, but only up to 10 are shown.*`)
              .then(msg => {
                // establish filter for response messages
                const filter = rmsg => {
                  if (!isNaN(rmsg.content) && levels[rmsg.content] && rmsg.author.id === message.author.id || rmsg.content.replace(/\s/g, "").toLowerCase() === "cancel" && rmsg.author.id === message.author.id) return true;
                }

                message.channel.awaitMessages(filter, { max: 1, time: 20000, errors: ["time"] })
                .then(collected => {
                  // retrieve user information if input is not "cancel"
                  if (collected.first().content !== "cancel") {

                    request({ uri: `https://www.levelpalace.com/${levellinks[collected.first().content]}`, timeout: 20000, headers: { "User-Agent": "lp-helper" } }, function(err, resp, body) {
                      if (!err && resp.statusCode === 200) {
                        let $ = cheerio.load(body);

                        if ($("div.navbar-fixed").length === 0) return message.channel.send("Level Palace is currently **down**, and so this command will not work properly right now. Please try again later!");

                        // get level title
                        $("p.truncate", "div.nav-wrapper").each(function() {
                          let title = $(this).text().trim();
                          levelinfo.push(title);
                        });

                        // get author stats and level stats
                        $("ul.level-stats", "div.level-info").each(function() {
                          // get author name
                          let author = $("p.user-username").text().trim();
                          levelinfo.push(author);

                          // get author status
                          let status = $("p.user-class").text().trim();
                          levelinfo.push(status);

                          // get author rank
                          let rank = $("p.user-rank").text().trim();
                          levelinfo.push(rank);

                          // get all level stats
                          $("li.collection-item", "ul.level-stats").each(function() {
                            let stat = $(this).text().trim().split(" ").slice(1).join(" ");
                            levelinfo.push(stat);
                          });
                        });

                        // get level image if one exists
                        $("img[src]", "ul.slides").each(function() {
                          let levelimage = $(this).attr("src");
                          urlExists(levelimage, function(err, exists) {
                            if (!err) {
                              if (!exists) {
                                levelimage = "https://i.imgur.com/2E8BWdV.png";
                              }
                            } else {
                              levelimage = "https://i.imgur.com/2E8BWdV.png";
                            }
                          });
                          levelinfo.push(levelimage);
                        });

                        // add dummy level image if one is still not added
                        if (!levelinfo[levelinfo.length - 1].includes("http")) levelinfo.push("https://i.imgur.com/2E8BWdV.png");

                        if (levelinfo[10].trim() === "See description") {
                          if (message.channel.type === "dm") {
                            console.log(`${message.author.tag} entered "${args.trim()}" as a level name in DMs, and "${levelinfo[0]}" by ${levelinfo[1]} was found.`);
                          } else if (message.channel.type === "group") {
                            console.log(`${message.author.tag} entered "${args.trim()}" as a level name in the ${message.channel.name} Group DM, and "${levelinfo[0]}" by ${levelinfo[1]} was found.`);
                          } else {
                            console.log(`${message.author.tag} entered "${args.trim()}" as a level name in #${message.channel.name} of ${message.guild.name}, and "${levelinfo[0]}" by ${levelinfo[1]} was found.`);
                          }
                          msg.delete();
                          if (message.guild.me.hasPermission("MANAGE_MESSAGES")) collected.first().delete();
                          message.channel.send({ content: "Here is your requested level:", embed: {
                            color: 3447003,
                            thumbnail: {
                              url: levelinfo[levelinfo.length - 1]
                            },
                            fields: [
                              {
                                name: "Name",
                                value: levelinfo[0]
                              },
                              {
                                name: "Author",
                                value: `${levelinfo[1]}\n(${levelinfo[2]}, ${levelinfo[3]})`
                              },
                              {
                                name: "Class",
                                value: levelinfo[5],
                                inline: true
                              },
                              {
                                name: "Rating",
                                value: levelinfo[6],
                                inline: true
                              },
                              {
                                name: "Votes",
                                value: levelinfo[7],
                                inline: true
                              },
                              {
                                name: "Plays",
                                value: levelinfo[8],
                                inline: true
                              },
                              {
                                name: "Favorites",
                                value: levelinfo[9].split(" ").slice(1).join(" "),
                                inline: true
                              },
                              {
                                name: "Game",
                                value: "In Description",
                                inline: true
                              },
                              {
                                name: "Difficulty",
                                value: levelinfo[11],
                                inline: true
                              },
                              {
                                name: "Published on",
                                value: `${levelinfo[12]} (EST/EDT)`,
                                inline: true
                              },
                              {
                                name: "Link",
                                value: `<${resp.request.uri.href}>`,
                                inline: true
                              }
                            ]
                          }}).catch(err => {
                            message.channel.send("**An error occurred while trying to send a message:**```" + err + "```");
                          });

                          // message.channel.send(`Level found!\n\n**${levelinfo[0]}**\nBy: **${levelinfo[1]}** (**${levelinfo[2]}**, **${levelinfo[3]}**)\n\nThis level is currently in the **${levelinfo[5]}** class, its rating is **${levelinfo[6]}**, it has **${levelinfo[7]}** vote(s), **${levelinfo[8]}** play(s), **${levelinfo[9].split(" ").slice(1).join(" ")}** favorite(s), its required game is in the description, its difficulty is **${levelinfo[11]}**, and it was published on **${levelinfo[12]}** (EST/EDT)!\n\nYou can go check out and possibly review the level here:\n<${resp.request.uri.href}>`).catch(err => {
                          //   message.channel.send("**An error occurred while trying to send a message:**```" + err + "```");
                          // });
                        } else {
                          if (message.channel.type === "dm") {
                            console.log(`${message.author.tag} entered "${args.trim()}" as a level name in DMs, and "${levelinfo[0]}" by ${levelinfo[1]} was found.`);
                          } else if (message.channel.type === "group") {
                            console.log(`${message.author.tag} entered "${args.trim()}" as a level name in the ${message.channel.name} Group DM, and "${levelinfo[0]}" by ${levelinfo[1]} was found.`);
                          } else {
                            console.log(`${message.author.tag} entered "${args.trim()}" as a level name in #${message.channel.name} of ${message.guild.name}, and "${levelinfo[0]}" by ${levelinfo[1]} was found.`);
                          }
                          msg.delete();
                          if (message.guild.me.hasPermission("MANAGE_MESSAGES")) collected.first().delete();
                          message.channel.send({ content: "Here is your requested level:", embed: {
                            color: 3447003,
                            thumbnail: {
                              url: levelinfo[levelinfo.length - 1]
                            },
                            fields: [
                              {
                                name: "Name",
                                value: levelinfo[0]
                              },
                              {
                                name: "Author",
                                value: `${levelinfo[1]}\n(${levelinfo[2]}, ${levelinfo[3]})`
                              },
                              {
                                name: "Class",
                                value: levelinfo[5],
                                inline: true
                              },
                              {
                                name: "Rating",
                                value: levelinfo[6],
                                inline: true
                              },
                              {
                                name: "Votes",
                                value: levelinfo[7],
                                inline: true
                              },
                              {
                                name: "Plays",
                                value: levelinfo[8],
                                inline: true
                              },
                              {
                                name: "Favorites",
                                value: levelinfo[9].split(" ").slice(1).join(" "),
                                inline: true
                              },
                              {
                                name: "Game",
                                value: levelinfo[10].trim(),
                                inline: true
                              },
                              {
                                name: "Difficulty",
                                value: levelinfo[11],
                                inline: true
                              },
                              {
                                name: "Published on",
                                value: `${levelinfo[12]} (EST/EDT)`,
                                inline: true
                              },
                              {
                                name: "Link",
                                value: `<${resp.request.uri.href}>`,
                                inline: true
                              }
                            ]
                          }}).catch(err => {
                            message.channel.send("**An error occurred while trying to send a message:**```" + err + "```");
                          });

                          // pmsg.edit(`Level found!\n\n**${levelinfo[0]}**\nBy: **${levelinfo[1]}** (**${levelinfo[2]}**, **${levelinfo[3]}**)\n\nThis level is currently in the **${levelinfo[5]}** class, its rating is **${levelinfo[6]}**, it has **${levelinfo[7]}** vote(s), **${levelinfo[8]}** play(s), **${levelinfo[9].split(" ").slice(1).join(" ")}** favorite(s), its required game is **${levelinfo[10].trim()}**, its difficulty is **${levelinfo[11]}**, and it was published on **${levelinfo[12]}** (EST/EDT)!\n\nYou can go check out and possibly review the level here:\n<${resp.request.uri.href}>`).catch(err => {
                          //   pmsg.edit("**An error occurred while trying to edit this message:**```" + err + "```");
                          // });
                        }
                      } else {
                        console.error(`${message.author.username} encountered an error while trying to find a level in #${message.channel.name} of ${message.guild.name}.`);
                        message.channel.send("An error has occurred, please try again.");
                      }
                    });
                  } else {
                    msg.delete();
                    if (message.guild.me.hasPermission("MANAGE_MESSAGES")) collected.first().delete();
                    message.channel.send(`**${message.author.username}**, request canceled.`);
                  }
                })
                .catch(collected => {
                  msg.delete();
                  message.channel.send(`**${message.author.username}**, your LP level request timed out.`);
                });
              })
              .catch(err => {
                console.error(`An error occurred while trying to send a message:\n${err}`);
                message.channel.send("**An error occurred while trying to send a message:**```" + err + "```");
              });
            }
          }
        } else {
          console.error(`${message.author.username} encountered an error while trying to find a level in #${message.channel.name} of ${message.guild.name}.`);
          pmsg.edit("An error has occurred, please try again.");
        }
      });
    }

    else if (command === "idlevel" || command === "idlevelsearch") {
      if (message.guild && message.guild.id === "752287527473381419") return;
      if (!args) return message.channel.send("You must include a level ID to look up!");

      let levelID = args.replace(/\s/g, "");

      if (/^0+$/.test(levelID)) return message.channel.send("Please enter a number other than **0**.");
      if (isNaN(levelID)) return message.channel.send("Please enter a numeric level ID.");
      if (args.length > 10) return message.channel.send("Please enter a level ID consisting of 10 digits or less!");

      log(command);

      let levelinfo = [];
      let pmsg = await message.channel.send("Retrieving level information...");

      // check level page
      request({ uri: `https://www.levelpalace.com/level?id=${levelID}`, timeout: 20000, headers: { "User-Agent": "lp-helper" } }, function(err, resp, body) {
        if (!err && resp.statusCode === 200) {
          let $ = cheerio.load(body);

          if ($("div.navbar-fixed").length === 0) return pmsg.edit("Level Palace is currently **down**, and so this command will not work properly right now. Please try again later!");

          // check to see if level exists or is private
          if ($("h3:contains('No level found.')").length > 0) {
            if (message.channel.type === "dm") {
              console.log(`${message.author.tag} entered ${levelID} as a level ID in DMs, but no level was found.`);
            } else if (message.channel.type === "group") {
              console.log(`${message.author.tag} entered ${levelID} as a level ID in the ${message.channel.name} Group DM, but no level was found.`);
            } else {
              console.log(`${message.author.tag} entered ${levelID} as a level ID in #${message.channel.name} of ${message.guild.name}, but no level was found.`);
            }
            return pmsg.edit(`No level was found with the ID of **${levelID}**, please try again.`).catch(err => {
              return pmsg.edit("**An error occurred while trying to edit this message:**```" + err + "```");
            });
          } else if ($("h3:contains('This level is private.')").length > 0) {
            if (message.channel.type === "dm") {
              console.log(`${message.author.tag} entered ${levelID} as a level ID in DMs, but the retrieved level was private.`);
            } else if (message.channel.type === "group") {
              console.log(`${message.author.tag} entered ${levelID} as a level ID in the ${message.channel.name} Group DM, but the retrieved level was private.`);
            } else {
              console.log(`${message.author.tag} entered ${levelID} as a level ID in #${message.channel.name} of ${message.guild.name}, but the retrieved level was private.`);
            }
            return pmsg.edit(`The level with the ID of **${levelID}** is private, please try again.`).catch(err => {
              return pmsg.edit("**An error occurred while trying to edit this message:**```" + err + "```");
            });
          }

          // get level title
          $("p.truncate", "div.nav-wrapper").each(function() {
            let title = $(this).text().trim();
            levelinfo.push(title);
          });

          // get author stats and level stats
          $("ul.level-stats", "div.level-info").each(function() {
            // get author name
            let author = $("p.user-username").text().trim();
            levelinfo.push(author);

            // get author status
            let status = $("p.user-class").text().trim();
            levelinfo.push(status);

            // get author rank
            let rank = $("p.user-rank").text().trim();
            levelinfo.push(rank);

            // get all level stats
            $("li.collection-item", "ul.level-stats").each(function() {
              let stat = $(this).text().trim().split(" ").slice(1).join(" ");
              levelinfo.push(stat);
            });
          });

          // get level image if one exists
          $("img[src]", "ul.slides").each(function() {
            let levelimage = $(this).attr("src");
            urlExists(levelimage, function(err, exists) {
              if (!err) {
                if (!exists) {
                  levelimage = "https://i.imgur.com/2E8BWdV.png";
                }
              } else {
                levelimage = "https://i.imgur.com/2E8BWdV.png";
              }
            });
            levelinfo.push(levelimage);
          });

          // add dummy level image if one is still not added
          if (!levelinfo[levelinfo.length - 1].includes("http")) levelinfo.push("https://i.imgur.com/2E8BWdV.png");

          if (levelinfo[10].trim() === "See description") {
            if (message.channel.type === "dm") {
              console.log(`${message.author.tag} entered ${levelID} as a level ID in DMs, and "${levelinfo[0]}" by ${levelinfo[1]} was found.`);
            } else if (message.channel.type === "group") {
              console.log(`${message.author.tag} entered ${levelID} as a level ID in the ${message.channel.name} Group DM, and "${levelinfo[0]}" by ${levelinfo[1]} was found.`);
            } else {
              console.log(`${message.author.tag} entered ${levelID} as a level ID in #${message.channel.name} of ${message.guild.name}, and "${levelinfo[0]}" by ${levelinfo[1]} was found.`);
            }
            pmsg.edit({ content: "Here is the level I found:", embed: {
              color: 3447003,
              thumbnail: {
                url: levelinfo[levelinfo.length - 1]
              },
              fields: [
                {
                  name: "Name",
                  value: levelinfo[0]
                },
                {
                  name: "Author",
                  value: `${levelinfo[1]}\n(${levelinfo[2]}, ${levelinfo[3]})`
                },
                {
                  name: "Class",
                  value: levelinfo[5],
                  inline: true
                },
                {
                  name: "Rating",
                  value: levelinfo[6],
                  inline: true
                },
                {
                  name: "Votes",
                  value: levelinfo[7],
                  inline: true
                },
                {
                  name: "Plays",
                  value: levelinfo[8],
                  inline: true
                },
                {
                  name: "Favorites",
                  value: levelinfo[9].split(" ").slice(1).join(" "),
                  inline: true
                },
                {
                  name: "Game",
                  value: "In Description",
                  inline: true
                },
                {
                  name: "Difficulty",
                  value: levelinfo[11],
                  inline: true
                },
                {
                  name: "Published on",
                  value: `${levelinfo[12]} (EST/EDT)`,
                  inline: true
                },
                {
                  name: "Link",
                  value: `<https://www.levelpalace.com/level?id=${levelID}>`,
                  inline: true
                }
              ]
            }}).catch(err => {
              pmsg.edit("**An error occurred while trying to edit this message:**```" + err + "```");
            });

            // pmsg.edit(`Level found!\n\n**${levelinfo[0]}**\nBy: **${levelinfo[1]}** (**${levelinfo[2]}**, **${levelinfo[3]}**)\n\nThis level is currently in the **${levelinfo[5]}** class, its rating is **${levelinfo[6]}**, it has **${levelinfo[7]}** vote(s), **${levelinfo[8]}** play(s), **${levelinfo[9].split(" ").slice(1).join(" ")}** favorite(s), its required game is in the description, its difficulty is **${levelinfo[11]}**, and it was published on **${levelinfo[12]}** (EST/EDT)!\n\nYou can go check out and possibly review the level here:\n<https://www.levelpalace.com/level?id=${levelID}>`).catch(err => {
            //   pmsg.edit("**An error occurred while trying to edit this message:**```" + err + "```");
            // });
          } else {
            if (message.channel.type === "dm") {
              console.log(`${message.author.tag} entered ${levelID} as a level ID in DMs, and "${levelinfo[0]}" by ${levelinfo[1]} was found.`);
            } else if (message.channel.type === "group") {
              console.log(`${message.author.tag} entered ${levelID} as a level ID in the ${message.channel.name} Group DM, and "${levelinfo[0]}" by ${levelinfo[1]} was found.`);
            } else {
              console.log(`${message.author.tag} entered ${levelID} as a level ID in #${message.channel.name} of ${message.guild.name}, and "${levelinfo[0]}" by ${levelinfo[1]} was found.`);
            }
            pmsg.edit({ content: "Here is the level I found:", embed: {
              color: 3447003,
              thumbnail: {
                url: levelinfo[levelinfo.length - 1]
              },
              fields: [
                {
                  name: "Name",
                  value: levelinfo[0]
                },
                {
                  name: "Author",
                  value: `${levelinfo[1]}\n(${levelinfo[2]}, ${levelinfo[3]})`
                },
                {
                  name: "Class",
                  value: levelinfo[5],
                  inline: true
                },
                {
                  name: "Rating",
                  value: levelinfo[6],
                  inline: true
                },
                {
                  name: "Votes",
                  value: levelinfo[7],
                  inline: true
                },
                {
                  name: "Plays",
                  value: levelinfo[8],
                  inline: true
                },
                {
                  name: "Favorites",
                  value: levelinfo[9].split(" ").slice(1).join(" "),
                  inline: true
                },
                {
                  name: "Game",
                  value: levelinfo[10].trim(),
                  inline: true
                },
                {
                  name: "Difficulty",
                  value: levelinfo[11],
                  inline: true
                },
                {
                  name: "Published on",
                  value: `${levelinfo[12]} (EST/EDT)`,
                  inline: true
                },
                {
                  name: "Link",
                  value: `<https://www.levelpalace.com/level?id=${levelID}>`,
                  inline: true
                }
              ]
            }}).catch(err => {
              pmsg.edit("**An error occurred while trying to edit this message:**```" + err + "```");
            });

            // pmsg.edit(`Level found!\n\n**${levelinfo[0]}**\nBy: **${levelinfo[1]}** (**${levelinfo[2]}**, **${levelinfo[3]}**)\n\nThis level is currently in the **${levelinfo[5]}** class, its rating is **${levelinfo[6]}**, it has **${levelinfo[7]}** vote(s), **${levelinfo[8]}** play(s), **${levelinfo[9].split(" ").slice(1).join(" ")}** favorite(s), its required game is **${levelinfo[10].trim()}**, its difficulty is **${levelinfo[11]}**, and it was published on **${levelinfo[12]}** (EST/EDT)!\n\nYou can go check out and possibly review the level here:\n<https://www.levelpalace.com/level?id=${levelID}>`).catch(err => {
            //   pmsg.edit("**An error occurred while trying to edit this message:**```" + err + "```");
            // });
          }
        } else {
          console.error(`${message.author.username} encountered an error while trying to find a level in #${message.channel.name} of ${message.guild.name}.`);
          pmsg.edit("An error has occurred, please try again.");
        }
      });
    }

    else if (command === "mp3" || command === "yt2mp3") {
      return;

      if (!args) return message.channel.send("Please enter either a URL or ID pertaining to a YouTube video for me to convert into an MP3!");
      if (args.length < 5 || args.length > 500) return message.channel.send("Please enter a YouTube URL/ID that is between 5 and 500 characters!");

      log(command);
      args = args.replace(/\s/g, "");
      let pmsg = await message.channel.send("Validating input...");

      // save the ID of the video, regardless of what is passed in
      let id = getYTID(args);

      if (!id) return pmsg.edit("Please enter a valid YouTube URL/ID for me to convert!");

      YTValidator.validateVideoID(id, (res, err) => {
        if (!err) {

          // download video from ID and save as MP3 file in chosen directory
          YD.download(id);

          // emitted while the video is converting to an MP3
          YD.on("progress", prog => {
            pmsg.edit("Converting video to MP3...");
          });

          // emitted if the video successfully converts to an MP3
          YD.on("finished", (err, data) => {
            let filePath = JSON.stringify(data).file;
            
            message.channel.send("Here is your MP3 file, **" + message.author.username + "**!\n\n***Note: To put this into the code of Super Mario Flash 2/3, set the custom music track to **19** in the Settings menu of the editor, copy the code into a word processing program such as Notepad, locate the word: `undefined`, and replace it with the provided MP3's direct link. You can also put a comma after the link followed by either an integer or decimal that represents the second or millisecond from which the music will loop.***", { files: [{
                attachment: filePath,
                name: `${id}.mp3`
              }]
            }).then(msg => {
              pmsg.delete();
              fs.unlink(filePath, err => {
                if (err) console.log(err);
              });
            }).catch(err => {
              console.error(`An error occurred while trying to upload a file:\n${err}`);
              pmsg.edit("**An error occurred while trying to upload a file:**```" + err + "```");
            });
          });

          // emitted if the video fails to convert to an MP3
          YD.on("error", err => {
           
            console.error(`${message.author.username} encountered an error while trying to convert a YouTube video to an MP3 in #${message.channel.name} of ${message.guild.name}.`);
            return pmsg.edit("An error has occurred, please try again. \n\n" + err);
          });

        } else {
          console.error(`${message.author.username} encountered an error while trying to validate a YouTube URL/ID to convert to an MP3 in #${message.channel.name} of ${message.guild.name}.`);
          return pmsg.edit("An error has occurred, please try again.");
        }
      });
    }

    else if (command  === "t") {
      let targs = args.split('"')[0];
      message.channel.send(targs);
    }

    else if (command === "color" || command === "colour") {
      if (message.channel.type === "dm") return message.channel.send("That command is not allowed in Direct Messages!");
      if (message.channel.type === "group") return message.channel.send("That command is not allowed in Group DMs!");
      if (!message.guild.me.hasPermission("MANAGE_ROLES")) {
        return message.channel.send("I need the **Manage Roles** permission in order to perform this command!").then(msg => {
          msg.delete(5000);
          // if (message.deletable && message.guild.me.hasPermission("MANAGE_MESSAGES")) message.delete(5000);
        });
      }
      if (!args) return message.channel.send("You must either specify a hex color or color name for me to add to you, enter \"random\" as the color for me to generate a random color role, or enter \"remove\" as the color for me to remove your current color role!");
      if (args.length > 100) return message.channel.send("Please enter an argument consisting of 100 characters or less!");

      log(command);
      
      if (args.trim().toLowerCase() === "remove") {
        let colorRole = message.member.roles.cache.find(r => r.color === message.member.displayColor);
        if (colorRole.color === 0) colorRole = null;
        
        if (!colorRole) return message.channel.send("You do not have an existing color role for me to remove!");

        message.member.roles.remove(colorRole.id).then(role => {
          console.log(`${message.author.tag} removed their existing color of ${colorRole.name} in #${message.channel.name} of ${message.guild.name}.`);
          message.channel.send(`Your existing color role, **${colorRole.name}**, has been removed!`, { split: true }).then(function() {
            if (colorRole.members.size === 0) {
              colorRole.delete("Unused color role.").then(r => {
                console.log(`I have deleted the ${colorRole.name} color role from ${message.guild.name}!`);
              }).catch(err => {
                console.error(`An error occurred while trying to delete a role in #${message.channel.name} of ${message.guild.name}:\n${err}`);
                return message.channel.send("**An error occurred while trying to delete a role:**```" + err + "```");
              });
            }
          }).catch(err => {
            console.error(`An error occurred while trying to send a message:\n${err}`);
            return message.channel.send("**An error occurred while trying to send a message:**```" + err + "```");
          });
        }).catch(err => {
          console.error(`An error occurred while trying to remove a role from a user in #${message.channel.name} of ${message.guild.name}:\n${err}`);
          return message.channel.send("**An error occurred while trying to remove a role from a user:**```" + err + "```");
        });
      } else {

        // instantiate hex color/color name/command feature entered by user
        let color = args.replace(/\s/g, "").toLowerCase();

        // define color names and random algorithm
        if (color === "random") {
          do {
            color = '#' + ('000000' + Math.floor(Math.random() * 16777216).toString(16)).slice(-6);
          } while (color === "#000000" || color === "#000");
        } else if (color === "pink") {
          color = "#ff1493";
        } else if (color === "lightpink") {
          color = "#ffb6c1";
        } else if (color === "hotpink") {
          color = "#ff69b4";
        } else if (color === "red") {
          color = "#ff0000";
        } else if (color === "darkred") {
          color = "#8b0000";
        } else if (color === "ruby") {
          color = "#bc1a43";
        } else if (color === "salmon") {
          color = "#fa8072";
        } else if (color === "crimson") {
          color = "#dc143c";
        } else if (color === "orange") {
          color = "#ffa500";
        } else if (color === "darkorange") {
          color = "#ff8c00";
        } else if (color === "yellow") {
          color = "#ffff00";
        } else if (color === "darkyellow") {
          color = "#daa520";
        } else if (color === "gold") {
          color = "#ffd700"
        } else if (color === "brown") {
          color = "#8b4513";
        } else if (color === "lightbrown" || color === "chocolate") {
          color = "#d2691e";
        } else if (color === "maroon" || color === "darkbrown") {
          color = "#800000";
        } else if (color === "olive") {
          color = "#808000";
        } else if (color === "lime" || color === "lightgreen") {
          color = "#00ff00";
        } else if (color === "yellowgreen" || color === "greenyellow") {
          color = "#adff2f";
        } else if (color === "green") {
          color = "#008000";
        } else if (color === "darkgreen") {
          color = "#006400";
        } else if (color === "cyan" || color === "lightblue") {
          color = "#00ffff";
        } else if (color === "turquoise") {
          color = "#40e0d0";
        } else if (color === "teal") {
          color = "#008080";
        } else if (color === "blue") {
          color = "#0000ff";
        } else if (color === "darkblue" || color === "navyblue") {
          color = "#00008b";
        } else if (color === "blurple") {
          color = "#3447003";
        } else if (color === "lavender") {
          color = "#e6e6fa";
        } else if (color === "fuchsia" || color === "magenta") {
          color = "#ff00ff";
        } else if (color === "violet") {
          color = "#9400d3";
        } else if (color === "purple" || color === "darkmagenta") {
          color = "#800080";
        } else if (color === "indigo") {
          color = "#4b0082";
        } else if (color === "white") {
          color = "#ffffff";
        } else if (color === "beige") {
          color = "#f5f5dc";
        } else if (color === "lightgray" || color === "lightgrey") {
          color = "#d3d3d3";
        } else if (color === "silver") {
          color = "#c0c0c0";
        } else if (color === "gray" || color === "grey") {
          color = "#808080";
        } else if (color === "darkgray" || color === "darkgrey") {
          color = "#696969";
        } else if (color === "black") {
          color = "#0a0a0a";
        }

        if (!color.startsWith("#")) color = "#" + color;
        if (color === "#000000" || color === "#000") return message.channel.send("**000000** and **000** don't work on Discord as valid hex colors for black, so please use something such as **0a0a0a** instead.");
        
        let isValidColor = /^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/i.test(color);

        if (!isValidColor) return message.channel.send(`**${args.replace(/\s/g, "").toLowerCase()}** is not a valid hex color, recognized color name, or command feature!`, { split: true }).catch(err => {
          console.error(`An error occurred while trying to send a message:\n${err}`);
          return message.channel.send("**An error occurred while trying to send a message:**```" + err + "```");
        });

        if (!message.guild.roles.cache.find(r => r.name === color)) {
          let oldColorRole = message.member.roles.cache.find(r => r.color === message.member.displayColor);
          if (oldColorRole.color === 0) oldColorRole = null;

          if (oldColorRole) {
            message.member.roles.remove(oldColorRole.id).then(user => {
              if (oldColorRole.members.size === 0) {
                oldColorRole.delete("Unused color role.").then(r => {
                  console.log(`I have deleted the ${oldColorRole.name} color role from ${message.guild.name}!`);
                }).catch(err => {
                  console.error(`An error occurred while trying to delete a role in #${message.channel.name} of ${message.guild.name}:\n${err}`);
                  return message.channel.send("**An error occurred while trying to delete a role:**```" + err + "```");
                });
              }
            }).catch(err => {
              console.error(`An error occurred while trying to remove a role from a user in #${message.channel.name} of ${message.guild.name}:\n${err}`);
              return message.channel.send("**An error occurred while trying to remove a role from a user:**```" + err + "```");
            });
          }

          message.guild.roles.create({
            data: {
              name: color,
              color: color,
              permissions: []
            }
          }).then(newColorRole => {
            message.member.roles.add(newColorRole).catch(err => {
              console.error(`An error occurred while trying to add a role in #${message.channel.name} of ${message.guild.name}:\n${err}`);
              return message.channel.send("**An error occurred while trying to add a role:**```" + err + "```");
            });

            if (oldColorRole) {
              console.log(`${message.author.tag} created and added the ${newColorRole.name} color role, and removed ${oldColorRole.name} in #${message.channel.name} of ${message.guild.name}.`);
              message.channel.send(`The color role **${newColorRole.name}** has been created and added to you! Your previous color role was **${oldColorRole.name}**.`, { split: true }).catch(err => {
                console.error(`An error occurred while trying to send a message:\n${err}`);
                return message.channel.send("**An error occurred while trying to send a message:**```" + err + "```");
              });
            } else {
              console.log(`${message.author.tag} created and added the ${newColorRole.name} color role in #${message.channel.name} of ${message.guild.name}.`);
              message.channel.send(`The color role **${newColorRole.name}** has been created and added to you!`, { split: true }).catch(err => {
                console.error(`An error occurred while trying to send a message:\n${err}`);
                return message.channel.send("**An error occurred while trying to send a message:**```" + err + "```");
              });
            }
          }).catch(err => {
            console.error(`An error occurred while trying to create a role in #${message.channel.name} of ${message.guild.name}:\n${err}`);
            return message.channel.send("**An error occurred while trying to create a role:**```" + err + "```");
          });
        } else {
          let newColorRole = message.guild.roles.cache.find(r => r.name === color);
          
          if (message.member.roles.cache.has(newColorRole.id)) return message.channel.send("You already have that color role!");
          
          let oldColorRole = message.member.roles.cache.find(r => r.color === message.member.displayColor);
          if (oldColorRole.color === 0) oldColorRole = null;
          
          if (oldColorRole) message.member.roles.remove(oldColorRole.id).catch(err => {
            console.error(`An error occurred while trying to remove a role from a user in #${message.channel.name} of ${message.guild.name}:\n${err}`);
            return message.channel.send("**An error occurred while trying to remove a role from a user:**```" + err + "```");
          });

          message.member.roles.add(newColorRole).catch(err => {
            console.error(`An error occurred while trying to add a role to a user in #${message.channel.name} of ${message.guild.name}:\n${err}`);
            return message.channel.send("**An error occurred while trying to add a role to a user:**```" + err + "```");
          });

          if (oldColorRole) {
            console.log(`${message.author.tag} added the ${newColorRole.name} color role, and removed ${oldColorRole.name} in #${message.channel.name} of ${message.guild.name}.`);
            message.channel.send(`The color role **${newColorRole.name}** has been added to you! Your previous color role was **${oldColorRole.name}**.`, { split: true }).then(function() {
              if (oldColorRole.members.size === 0) {
                oldColorRole.delete("Unused color role.").then(r => {
                  console.log(`I have deleted the ${oldColorRole.name} color role from ${message.guild.name}!`);
                }).catch(err => {
                  console.error(`An error occurred while trying to delete a role in #${message.channel.name} of ${message.guild.name}:\n${err}`);
                  return message.channel.send("**An error occurred while trying to delete a role:**```" + err + "```");
                });
              }
            }).catch(err => {
              console.error(`An error occurred while trying to send a message:\n${err}`);
              return message.channel.send("**An error occurred while trying to send a message:**```" + err + "```");
            });
          } else {
            console.log(`${message.author.tag} added the ${newColorRole.name} color role in #${message.channel.name} of ${message.guild.name}.`);
            message.channel.send(`The color role **${newColorRole.name}** has been added to you!`, { split: true }).catch(err => {
              console.error(`An error occurred while trying to send a message:\n${err}`);
              return message.channel.send("**An error occurred while trying to send a message:**```" + err + "```");
            });
          }
        }
      }
    }

    else if (command === "clean") {
      let messageCount = parseInt(args.replace(/\s/g, "").trim());
      
      if (message.channel.type === "dm") return message.channel.send("That command is not allowed in Direct Messages!");
      if (message.channel.type === "group") return message.channel.send("That command is not allowed in Group DMs!");
      if (!message.member.hasPermission("MANAGE_MESSAGES")) {
        return message.channel.send("You need the **Manage Messages** permission in order to use this command!").then(msg => {
          msg.delete(5000);
          // if (message.deletable && message.guild.me.hasPermission("MANAGE_MESSAGES")) message.delete(5000);
        });
      }
      if (args && isNaN(messageCount)) return message.channel.send("**Usage:**```" + config.prefix + "clean [Number of previous messages to acquire]```***Note:*** *This parameter is optional, and just typing \"" + config.prefix + "clean\" will default to acquiring the last 20 messages sent. Also, only messages newer than two weeks can be deleted. If any of your specified messages are older than this date, they will be filtered out and will remain untouched.*");
      if (args && /^0+$/.test(args) || args && messageCount <= 1) return message.channel.send("Please enter a number greater than **1**.");
      if (args && args.length > 10) return message.channel.send("Please enter a number consisting of 10 digits or less!");

      log(command);

      if (!args) {
        let twoWeeksAgo = new Date(Date.now() - 12096e5);
        message.channel.messages.fetch({ limit: 20 }).then(messages => {
          messages = messages.filter(message => message.createdTimestamp > twoWeeksAgo.getTime());
          messages = messages.filter(message => message.author.id === client.user.id);

          if (messages.size === 1) {
            messages.deleteAll();
            console.log(`${message.author.tag} deleted my last previous message in #${message.channel.name} of ${message.guild.name}.`);
            message.channel.send(`I have successfully deleted my last previous message!`, { split: true }).then(msg => {
              msg.delete(5000);
              // if (message.deletable && message.guild.me.hasPermission("MANAGE_MESSAGES")) message.delete(5000);
            });
          } else if (messages.size === 0) {
            console.log(`${message.author.tag} failed to delete any of my messages in #${message.channel.name} of ${message.guild.name}.`);
            message.channel.send(`None of my previous messages have successfully been deleted.`, { split: true }).then(msg => {
              msg.delete(5000);
              // if (message.deletable && message.guild.me.hasPermission("MANAGE_MESSAGES")) message.delete(5000);
            });
          } else {
            message.channel.bulkDelete(messages, true).then(msgs => {
              console.log(`${message.author.tag} deleted my previous ${msgs.size} messages in #${message.channel.name} of ${message.guild.name}.`);            
              message.channel.send(`I have successfully deleted my previous **${msgs.size}** messages!`, { split: true }).then(msg => {
                msg.delete(5000);
                // if (message.deletable && message.guild.me.hasPermission("MANAGE_MESSAGES")) message.delete(5000);
              });
            }).catch(err => {
              console.error(`An error occurred while trying to bulk delete messages in #${message.channel.name} of ${message.guild.name}:\n${err}`);
              return message.channel.send("**An error occurred while trying to bulk delete messages:**```" + err + "```");
            });
          }
        }).catch(err => {
          console.error(`An error occurred while trying to fetch messages in #${message.channel.name} of ${message.guild.name}:\n${err}`);
          return message.channel.send("**An error occurred while trying to fetch messages:**```" + err + "```");
        });
      } else {
        let twoWeeksAgo = new Date(Date.now() - 12096e5);
        message.channel.messages.fetch({ limit: messageCount }).then(messages => {
          messages = messages.filter(message => message.createdTimestamp > twoWeeksAgo.getTime());
          messages = messages.filter(message => message.author.id === client.user.id);

          if (messages.size === 1) {
            messages.deleteAll();
            console.log(`${message.author.tag} deleted my last previous message in #${message.channel.name} of ${message.guild.name}.`);
            message.channel.send(`I have successfully deleted my last previous message!`, { split: true }).then(msg => {
              msg.delete(5000);
              // if (message.deletable && message.guild.me.hasPermission("MANAGE_MESSAGES")) message.delete(5000);
            });
          } else if (messages.size === 0) {
            console.log(`${message.author.tag} failed to delete any of my messages in #${message.channel.name} of ${message.guild.name}.`);
            message.channel.send(`None of my previous messages have successfully been deleted.`, { split: true }).then(msg => {
              msg.delete(5000);
              // if (message.deletable && message.guild.me.hasPermission("MANAGE_MESSAGES")) message.delete(5000);
            });
          } else {
            message.channel.bulkDelete(messages, true).then(msgs => {
              console.log(`${message.author.tag} deleted my previous ${msgs.size} messages in #${message.channel.name} of ${message.guild.name}.`);
              message.channel.send(`I have successfully deleted my previous **${msgs.size}** messages!`, { split: true }).then(msg => {
                msg.delete(5000);
                // if (message.deletable && message.guild.me.hasPermission("MANAGE_MESSAGES")) message.delete(5000);
              });
            }).catch(err => {
              console.error(`An error occurred while trying to bulk delete messages in #${message.channel.name} of ${message.guild.name}:\n${err}`);
              return message.channel.send("**An error occurred while trying to bulk delete messages:**```" + err + "```");
            });
          }
        }).catch(err => {
          console.error(`An error occurred while trying to fetch messages in #${message.channel.name} of ${message.guild.name}:\n${err}`);
          return message.channel.send("**An error occurred while trying to fetch messages:**```" + err + "```");
        });
      }
    }

    else if (command === "clear") {
      if (message.channel.type === "dm") return message.channel.send("That command is not allowed in Direct Messages!");
      if (message.channel.type === "group") return message.channel.send("That command is not allowed in Group DMs!");
      if (args && /^0+$/.test(args) || args && parseInt(args) <= 1 && !args.trim().includes(" ")) return message.channel.send("Please enter a number greater than **1**.");

      let messageUser;
      let messageCount;
      args = args.trim();

      if (message.mentions.members.first() && args.split(" ").slice(1).join(" ").trim()) {
        messageUser = message.mentions.members.first();

        if (isNaN(parseInt(args.split(" ")[0]))) {
          messageCount = args.split(" ").slice(1).join(" ").trim();
        } else {
          messageCount = args.split(" ")[0].trim();
        }
      } else if (message.mentions.members.first()) {
        messageUser = message.mentions.members.first();
      } else {
        messageCount = args.trim();
      }

      if (!message.guild.me.hasPermission("MANAGE_MESSAGES")) {
        return message.channel.send("I need the **Manage Messages** permission in order to perform this command!").then(msg => {
          msg.delete(5000);
          // if (message.deletable && message.guild.me.hasPermission("MANAGE_MESSAGES")) message.delete(5000);
        });
      }
      if (!message.member.hasPermission("MANAGE_MESSAGES")) {
        return message.channel.send("You need the **Manage Messages** permission in order to use this command!").then(msg => {
          msg.delete(5000);
          // if (message.deletable && message.guild.me.hasPermission("MANAGE_MESSAGES")) message.delete(5000);
        });
      }
      if (messageCount && isNaN(parseInt(messageCount))) return message.channel.send("**Usage: (Works in either order)**```" + config.prefix + "clear [User mention of user whose messages are to be deleted] [Number of previous messages to acquire]```***Note:*** *Both of these parameters are optional, and just typing \"" + config.prefix + "clear\" will default to acquiring the last 20 messages sent. Also, only messages newer than two weeks can be deleted. If any of your specified messages are older than this date, they will be filtered out and will remain untouched.*");
      if (messageCount && /^0+$/.test(messageCount) || messageCount && messageCount <= 1) return message.channel.send("Please enter a number greater than **1**.");
      if (messageCount && messageCount.length > 10) return message.channel.send("Please enter a number consisting of 10 digits or less!");

      messageCount = parseInt(messageCount);

      if (messageCount <= 1) return message.channel.send("Please enter a number greater than **1**.");
      if (messageUser && messageUser === message.guild.me) return message.channel.send(`Please use **${config.prefix}clean** to clear my messages.`);

      log(command);

      if (!args) {
        let twoWeeksAgo = new Date(Date.now() - 12096e5);
        message.channel.messages.fetch({ limit: 20 }).then(messages => {
          messages = messages.filter(message => message.createdTimestamp > twoWeeksAgo.getTime());

          if (messages.size === 0 || messages.size === 1) {
            console.log(`${message.author.tag} failed to delete any messages in #${message.channel.name} of ${message.guild.name}.`);
            message.channel.send(`None of the previous messages have successfully been deleted.`, { split: true }).then(msg => {
              msg.delete(5000);
              // if (message.deletable && message.guild.me.hasPermission("MANAGE_MESSAGES")) message.delete(5000);
            });
          } else {
            message.channel.bulkDelete(20, true).then(msgs => {
              console.log(`${message.author.tag} deleted the previous ${msgs.size} messages in #${message.channel.name} of ${message.guild.name}.`);
              message.channel.send(`I have successfully deleted the previous **${msgs.size}** messages!`).then(msg => {
                msg.delete(5000);
                // if (message.deletable && message.guild.me.hasPermission("MANAGE_MESSAGES")) message.delete(5000);
              });
            }).catch(err => {
              console.error(`An error occurred while trying to bulk delete messages in #${message.channel.name} of ${message.guild.name}:\n${err}`);
              return message.channel.send("**An error occurred while trying to bulk delete messages:**```" + err + "```");
            });
          }
        }).catch(err => {
          console.error(`An error occurred while trying to fetch messages in #${message.channel.name} of ${message.guild.name}:\n${err}`);
          return message.channel.send("**An error occurred while trying to fetch messages:**```" + err + "```");
        });
      } else if (!messageUser && messageCount) {
        let twoWeeksAgo = new Date(Date.now() - 12096e5);
        message.channel.messages.fetch({ limit: messageCount }).then(messages => {
          messages = messages.filter(message => message.createdTimestamp > twoWeeksAgo.getTime());

          if (messages.size === 0 || messages.size === 1) {
            console.log(`${message.author.tag} failed to delete any messages in #${message.channel.name} of ${message.guild.name}.`);
            message.channel.send(`None of the previous messages have successfully been deleted.`, { split: true }).then(msg => {
              msg.delete(5000);
              // if (message.deletable && message.guild.me.hasPermission("MANAGE_MESSAGES")) message.delete(5000);
            });
          } else {
            message.channel.bulkDelete(messageCount, true).then(msgs => {
              console.log(`${message.author.tag} deleted the previous ${msgs.size} messages in #${message.channel.name} of ${message.guild.name}.`);
              message.channel.send(`I have successfully deleted the previous **${msgs.size}** messages!`).then(msg => {
                msg.delete(5000);
                // if (message.deletable && message.guild.me.hasPermission("MANAGE_MESSAGES")) message.delete(5000);
              });
            }).catch(err => {
              console.error(`An error occurred while trying to bulk delete messages in #${message.channel.name} of ${message.guild.name}:\n${err}`);
              return message.channel.send("**An error occurred while trying to bulk delete messages:**```" + err + "```");
            });
          }
        }).catch(err => {
          console.error(`An error occurred while trying to fetch messages in #${message.channel.name} of ${message.guild.name}:\n${err}`);
          return message.channel.send("**An error occurred while trying to fetch messages:**```" + err + "```");
        });
      } else if (!messageCount && messageUser) {
        let twoWeeksAgo = new Date(Date.now() - 12096e5);
        message.channel.messages.fetch({ limit: 20 }).then(messages => {
          messages = messages.filter(message => message.createdTimestamp > twoWeeksAgo.getTime());
          messages = messages.filter(message => message.author.id === messageUser.id);

          if (messages.size === 1) {
            messages.deleteAll();
            console.log(`${message.author.tag} deleted the last previous message sent by ${messageUser.displayName} in #${message.channel.name} of ${message.guild.name}.`);
            message.channel.send(`I have successfully deleted the last previous message sent by **${messageUser.displayName}**!`, { split: true }).then(msg => {
              msg.delete(5000);
              // if (message.deletable && message.guild.me.hasPermission("MANAGE_MESSAGES")) message.delete(5000);
            });
          } else if (messages.size === 0) {
            console.log(`${message.author.tag} failed to delete any messages sent by ${messageUser.displayName} in #${message.channel.name} of ${message.guild.name}.`);
            message.channel.send(`None of the previous messages sent by **${messageUser.displayName}** have successfully been deleted.`, { split: true }).then(msg => {
              msg.delete(5000);
              // if (message.deletable && message.guild.me.hasPermission("MANAGE_MESSAGES")) message.delete(5000);
            });
          } else {
            message.channel.bulkDelete(messages, true).then(msgs => {
              console.log(`${message.author.tag} deleted the previous ${msgs.size} messages sent by ${messageUser.displayName} in #${message.channel.name} of ${message.guild.name}.`);
              message.channel.send(`I have successfully deleted the previous **${msgs.size}** messages sent by **${messageUser.displayName}**!`, { split: true }).then(msg => {
                msg.delete(5000);
                // if (message.deletable && message.guild.me.hasPermission("MANAGE_MESSAGES")) message.delete(5000);
              });
            }).catch(err => {
              console.error(`An error occurred while trying to bulk delete messages in #${message.channel.name} of ${message.guild.name}:\n${err}`);
              return message.channel.send("**An error occurred while trying to bulk delete messages:**```" + err + "```");
            });
          }
        }).catch(err => {
          console.error(`An error occurred while trying to fetch messages in #${message.channel.name} of ${message.guild.name}:\n${err}`);
          return message.channel.send("**An error occurred while trying to fetch messages:**```" + err + "```");
        });
      } else {
        let twoWeeksAgo = new Date(Date.now() - 12096e5);
        message.channel.messages.fetch({ limit: messageCount }).then(messages => {
          messages = messages.filter(message => message.createdTimestamp > twoWeeksAgo.getTime());
          messages = messages.filter(message => message.author.id === messageUser.id);

          if (messages.size === 1) {
            messages.deleteAll();
            console.log(`${message.author.tag} deleted the last previous message sent by ${messageUser.displayName} in #${message.channel.name} of ${message.guild.name}.`);
            message.channel.send(`I have successfully deleted the last previous message sent by **${messageUser.displayName}**!`, { split: true }).then(msg => {
              msg.delete(5000);
              // if (message.deletable && message.guild.me.hasPermission("MANAGE_MESSAGES")) message.delete(5000);
            });
          } else if (messages.size === 0) {
            console.log(`${message.author.tag} failed to delete any messages sent by ${messageUser.displayName} in #${message.channel.name} of ${message.guild.name}.`);
            message.channel.send(`None of the previous messages sent by **${messageUser.displayName}** have successfully been deleted.`, { split: true }).then(msg => {
              msg.delete(5000);
              // if (message.deletable && message.guild.me.hasPermission("MANAGE_MESSAGES")) message.delete(5000);
            });
          } else {
            message.channel.bulkDelete(messages, true).then(msgs => {
              console.log(`${message.author.tag} deleted the previous ${msgs.size} messages sent by ${messageUser.displayName} in #${message.channel.name} of ${message.guild.name}.`);
              message.channel.send(`I have successfully deleted the previous **${msgs.size}** messages sent by **${messageUser.displayName}**!`, { split: true }).then(msg => {
                msg.delete(5000);
                // if (message.deletable && message.guild.me.hasPermission("MANAGE_MESSAGES")) message.delete(5000);
              });
            }).catch(err => {
              console.error(`An error occurred while trying to bulk delete messages in #${message.channel.name} of ${message.guild.name}:\n${err}`);
              return message.channel.send("**An error occurred while trying to bulk delete messages:**```" + err + "```");
            });
          }
        }).catch(err => {
          console.error(`An error occurred while trying to fetch messages in #${message.channel.name} of ${message.guild.name}:\n${err}`);
          return message.channel.send("**An error occurred while trying to fetch messages:**```" + err + "```");
        });
      }
    }

    else if (command === "addemoji") {
      let emojiArgs = args.split(" ");
      let emojiURL = emojiArgs[0];
      let emojiName = emojiArgs.slice(1).join(" ");

      if (message.channel.type === "dm") return message.channel.send("That command is not allowed in Direct Messages!");
      if (message.channel.type === "group") return message.channel.send("That command is not allowed in Group DMs!");
      if (!message.guild.me.hasPermission("MANAGE_EMOJIS")) {
        return message.channel.send("I need the **Manage Emojis** permission in order to perform this command!").then(msg => {
          msg.delete(5000);
          // if (message.deletable && message.guild.me.hasPermission("MANAGE_MESSAGES")) message.delete(5000);
        });
      }
      if (!message.member.hasPermission("MANAGE_EMOJIS")) {
        return message.channel.send("You need the **Manage Emojis** permission in order to use this command!").then(msg => {
          msg.delete(5000);
          // if (message.deletable && message.guild.me.hasPermission("MANAGE_MESSAGES")) message.delete(5000);
        });
      }
      if (!args) return message.channel.send("You need to include an image URL and a name for the emoji!");
      if (args.length > 1500) return message.channel.send("Please enter arguments consisting of 1500 characters or less in total!");
      if (!emojiURL || !emojiName) return message.channel.send("**Usage: (Works in either order)** ```" + config.prefix + "addemoji [Emoji URL] [Emoji Name]```");
      
      log(command);

      // switch order if necessary
      if (emojiName.toLowerCase().endsWith(".png") || emojiName.toLowerCase().endsWith(".gif") || emojiName.toLowerCase().endsWith(".jpg") || emojiName.toLowerCase().endsWith(".jpeg") || emojiName.toLowerCase().endsWith(".tiff")) {
        emojiURL = emojiArgs.slice(1).join(" ");
        emojiName = emojiArgs[0];
      }

      if (!emojiURL.toLowerCase().endsWith(".png") && !emojiURL.toLowerCase().endsWith(".gif") && !emojiURL.toLowerCase().endsWith(".jpg") && !emojiURL.toLowerCase().endsWith(".jpeg") && !emojiURL.toLowerCase().endsWith(".tiff")) return message.channel.send(`You specified an invalid link type! Your emoji image link must either end in ".png", ".gif", ".jpg", ".jpeg", or ".tiff".`);
      if (emojiName.toLowerCase().endsWith(".png") || emojiName.toLowerCase().endsWith(".gif") || emojiName.toLowerCase().endsWith(".jpg") || emojiName.toLowerCase().endsWith(".jpeg") || emojiName.toLowerCase().endsWith(".tiff")) return message.channel.send("**Usage: (Works in either order)** ```" + config.prefix + "addemoji [Emoji URL] [Emoji Name]```");

      let pmsg = await message.channel.send("Processing...");

      // check if emoji url exists
      urlExists(emojiURL, function(err, exists) {
        if (!err) {
          if (exists) {
            if (message.guild.emojis.cache.size === 50) return pmsg.edit("There are already **50** emojis in this server, and no more can be added!");
              message.guild.emojis.create(emojiURL, emojiName).then(emoji => {
                if (message.channel !== defaultChannel(message.guild)) {
                  pmsg.edit(`The emoji <:${emoji.name}:${emoji.id}> has been added!`).catch(err => {
                    console.error(`An error occurred while trying to edit a message:\n${err}`);
                    return pmsg.edit("**An error occurred while trying to edit this message:**```" + err + "```");
                  });
                } else {
                  pmsg.delete();
                }
            }).catch(err => {
              console.error(`An error occurred while trying to create an emoji in #${message.channel.name} of ${message.guild.name}:\n${err}`);
              return pmsg.edit("**An error occurred while trying to create an emoji:**```" + err + "```");
            });
          } else {
            console.log(`${message.author.tag} failed to specify a valid emoji image in #${message.channel.name} of ${message.guild.name}.`);
            pmsg.edit("The URL specified is not a valid image!");
          }
        } else {
          console.error(`${message.author.username} encountered an error while trying to verify their emoji image link in #${message.channel.name} of ${message.guild.name}.`);
          pmsg.edit("An error occurred while trying to verify whether or not your emoji image was valid. Please try again.");
        }
      });
    }

    else if (command === "delemoji" || command === "rememoji") {
      let simplifiedArgs = args.trim().toLowerCase();
      let emoji;

      if (message.channel.type === "dm") return message.channel.send("That command is not allowed in Direct Messages!");
      if (message.channel.type === "group") return message.channel.send("That command is not allowed in Group DMs!");
      if (!message.guild.me.hasPermission("MANAGE_EMOJIS")) {
        return message.channel.send("I need the **Manage Emojis** permission in order to perform this command!").then(msg => {
          msg.delete(5000);
          // if (message.deletable && message.guild.me.hasPermission("MANAGE_MESSAGES")) message.delete(5000);
        });
      }
      if (!message.member.hasPermission("MANAGE_EMOJIS")) {
        return message.channel.send("You need the **Manage Emojis** permission in order to use this command!").then(msg => {
          msg.delete(5000);
          // if (message.deletable && message.guild.me.hasPermission("MANAGE_MESSAGES")) message.delete(5000);
        });
      }
      if (!args) return message.channel.send("You need to include either the name or ID of the emoji you want to delete!\n***Note:*** *If there are multiple emojis by the same name, I will delete the first one that I come across. To avoid this and specify the correct one, use an ID.*");
      if (args.length > 100) return message.channel.send("Please enter an argument consisting of 100 characters or less!");
      
      log(command);

      if (isNaN(simplifiedArgs)) {
        emoji = message.guild.emojis.cache.find(e => e.name.toLowerCase() === simplifiedArgs);
      } else {
        emoji = message.guild.emojis.cache.find(e => e.id === simplifiedArgs.replace(/\s/g, ""));
      }

      if (!emoji) {
        if (isNaN(simplifiedArgs)) {
          console.log(`${message.author.tag} failed to delete a server emoji by entering an invalid name of "${simplifiedArgs}" in #${message.channel.name} of ${message.guild.name}.`);
          message.channel.send(`**${simplifiedArgs}** is not a valid emoji name!`, { split: true }).catch(err => {
            console.error(`An error occurred while trying to send a message:\n${err}`);
            return message.channel.send("**An error occurred while trying to send a message:**```" + err + "```");
          });
        } else {
          console.log(`${message.author.tag} failed to delete a server emoji by entering an invalid ID of "${simplifiedArgs}" in #${message.channel.name} of ${message.guild.name}.`);
          message.channel.send(`**${simplifiedArgs}** is not a valid emoji ID!`, { split: true }).catch(err => {
            console.error(`An error occurred while trying to send a message:\n${err}`);
            return message.channel.send("**An error occurred while trying to send a message:**```" + err + "```");
          });
        }
      } else {
        emoji.delete().catch(err => {
          console.error(`An error occurred while trying to delete an emoji in #${message.channel.name} of ${message.guild.name}:\n${err}`);
          return message.channel.send("**An error occurred while trying to delete an emoji:**```" + err + "```");
        });

        if (isNaN(simplifiedArgs)) {
          if (message.channel !== defaultChannel(message.guild)) {
            message.channel.send(`The emoji **${emoji.name}** has been deleted!`, { split: true }).catch(err => {
              console.error(`An error occurred while trying to send a message:\n${err}`);
              return message.channel.send("**An error occurred while trying to send a message:**```" + err + "```");
            });
          }
        } else {
          if (message.channel !== defaultChannel(message.guild)) {
            message.channel.send(`The emoji **${emoji.name}** has been deleted!`, { split: true }).catch(err => {
              console.error(`An error occurred while trying to send a message:\n${err}`);
              return message.channel.send("**An error occurred while trying to send a message:**```" + err + "```");
            });
          }
        }
      }
    }

    else if (command === "emojislots" || command === "emoteslots") {
      if (message.channel.type === "dm") return message.channel.send("That command is not allowed in Direct Messages!");
      if (message.channel.type === "group") return message.channel.send("That command is not allowed in Group DMs!");

      log(command);

      let slotsleft = 50 - message.guild.emojis.cache.size;
      if (slotsleft < 0) slotsleft = 0;
      if (message.guild.id === "325490421419606016") slotsleft = 53 - message.guild.emojis.cache.size;
      
      console.log(`${message.author.tag} was told that there are ${slotsleft}/50 emoji slots left in ${message.guild.name} in #${message.channel.name} of ${message.guild.name}.`);
      message.channel.send(`There are currently **${slotsleft}/50** emoji slots left!`);
    }

    else if (command === "pinslots") {
      log(command);

      let pmsg = await message.channel.send("Fetching pins...");

      let channelpins;
      let slotsleft;
      
      message.channel.fetchPinnedMessages().then(pins => {
        slotsleft = 50 - pins.size;

        if (message.channel.type === "dm") {
          console.log(`${message.author.tag} was told that there are ${slotsleft}/50 pin slots left in their DM with me.`);
          pmsg.edit(`There are currently **${slotsleft}/50** pin slots left in our DM!`);
        } else if (message.channel.type === "group") {
          console.log(`${message.author.tag} was told that there are ${slotsleft}/50 pin slots left in the ${message.channel.name} Group DM.`);
          pmsg.edit(`There are currently **${slotsleft}/50** pin slots left in this Group DM!`);
        } else {
          console.log(`${message.author.tag} was told that there are ${slotsleft}/50 pin slots left in #${message.channel.name} of ${message.guild.name}.`);
          pmsg.edit(`There are currently **${slotsleft}/50** pin slots left in this channel!`);
        }
      }).catch(err => {
        console.error(`An error occurred while trying to fetch pinned messages in #${message.channel.name} of ${message.guild.name}:\n${err}`);
        return pmsg.edit("**An error occurred while trying to fetch pinned messages:**```" + err + "```");
      });
    }

    else if (command === "roleslots") {
      if (message.channel.type === "dm") return message.channel.send("That command is not allowed in Direct Messages!");
      if (message.channel.type === "group") return message.channel.send("That command is not allowed in Group DMs!");

      log(command);

      let slotsleft = 250 - message.guild.roles.cache.size;
      
      console.log(`${message.author.tag} was told that there are ${slotsleft}/250 role slots left in ${message.guild.name} in #${message.channel.name} of ${message.guild.name}.`);
      message.channel.send(`There are currently **${slotsleft}/250** role slots left!`);
    }

    else if (command === "wiki" || command === "wikisearch") {
      if (message.guild && message.guild.id === "752287527473381419") return;
      if (!args) return message.channel.send("You must either include an LP wiki article to find, or enter \"random\" as the article name for me to fetch a random one!");
      if (args.length > 100) return message.channel.send("Please enter an argument consisting of 100 characters or less!");

      args = args.replace(/"/g, '\\"');
      args = args.replace(/`/g, '\\`');
      let articleName = eachWordUpper(args.trim().toLowerCase());
      let articleNameEncoded = encodeURIComponent(eachWordUpper(args.trim().toLowerCase()));
      let articleinfo = [];

      log(command);

      if (args.replace(/\s/g, "").toLowerCase() === "random") {
        let pmsg = await message.channel.send("Fetching random LP wiki article...");

        request({ uri: `http://levelpalace.wikia.com/wiki/Special:Random`, timeout: 10000, headers: { "User-Agent": "lp-helper" } }, function(err, resp, body) {
          if (!err && resp.statusCode === 200) {
            let $ = cheerio.load(body);

            // get article title
            $("h1.page-header__title").each(function() {
              let title = $(this).text().trim();
              articleinfo.push(title);
            });

            // get article beginning text if it exists and trim it
            $("div.mw-content-text").each(function() {
              let description = $(this).find("p:not(.caption)").first().text().trim();
              if (description.length > 500) description = description.substring(0, 500).trim() + "...";
              articleinfo.push(description);
            });

            if (articleinfo[1]) {
              if (message.channel.type === "dm") {
                console.log(`${message.author.tag} requested a random LP wiki article in DMs, and found one by the name of "${articleinfo[0]}".`);
              } else if (message.channel.type === "group") {
                console.log(`${message.author.tag} requested a random LP wiki article in the ${message.channel.name} Group DM, and found one by the name of "${articleinfo[0]}".`);
              } else {
                console.log(`${message.author.tag} requested a random LP wiki article in #${message.channel.name} of ${message.guild.name}, and found one by the name of "${articleinfo[0]}".`);
              }
              pmsg.edit({ content: "Here is the LP wiki article I picked:", embed: {
                color: 3447003,
                fields: [
                  {
                    name: "Name",
                    value: articleinfo[0]
                  },
                  {
                    name: "Description",
                    value: articleinfo[1]
                  },
                  {
                    name: "Link",
                    value: `<${resp.request.uri.href}>`
                  }
                ]
              }}).catch(err => {
                pmsg.edit("**An error occurred while trying to edit this message:**```" + err + "```");
              });

              // pmsg.edit(`Article found!\n\n**${articleinfo[0]}**\n\n${articleinfo[1]}\n\nYou can visit the LP wiki article here:\n<${resp.request.uri.href}>`).catch(err => {
              //   console.error(`An error occurred while trying to edit a message:\n${err}`);
              //   pmsg.edit("**An error occurred while trying to edit this message:**```" + err + "```");
              // });
            } else {
              if (message.channel.type === "dm") {
                console.log(`${message.author.tag} requested a random LP wiki article in DMs, and found one by the name of "${articleinfo[0]}".`);
              } else if (message.channel.type === "group") {
                console.log(`${message.author.tag} requested a random LP wiki article in the ${message.channel.name} Group DM, and found one by the name of "${articleinfo[0]}".`);
              } else {
                console.log(`${message.author.tag} requested a random LP wiki article in #${message.channel.name} of ${message.guild.name}, and found one by the name of "${articleinfo[0]}".`);
              }
              pmsg.edit({ content: "Here is the LP wiki article I picked:", embed: {
                color: 3447003,
                fields: [
                  {
                    name: "Name",
                    value: articleinfo[0]
                  },
                  {
                    name: "Description",
                    value: "No description found."
                  },
                  {
                    name: "Link",
                    value: `<${resp.request.uri.href}>`
                  }
                ]
              }}).catch(err => {
                pmsg.edit("**An error occurred while trying to edit this message:**```" + err + "```");
              });

              // pmsg.edit(`Article found!\n\n**${articleinfo[0]}**\n\nNo description found.\n\nYou can visit the LP wiki article here:\n<${resp.request.uri.href}>`).catch(err => {
              //   console.error(`An error occurred while trying to edit a message:\n${err}`);
              //   pmsg.edit("**An error occurred while trying to edit this message:**```" + err + "```");
              // });
            }
          } else {
            console.error(`${message.author.username} encountered an error while trying to find a random LP wiki article in #${message.channel.name} of ${message.guild.name}.`);
            pmsg.edit("An error has occurred, please try again.");
          }
        });
      } else {
        let pmsg = await message.channel.send("Finding LP wiki article...");

        // find wiki article
        request({ uri: `http://levelpalace.wikia.com/wiki/${articleNameEncoded}`, timeout: 10000, headers: { "User-Agent": "lp-helper" } }, function(err, resp, body) {
          // do this if the article does exist
          if (!err && resp.statusCode === 200) {
            let $ = cheerio.load(body);

            // get article title
            $("h1.page-header__title").each(function() {
              let title = $(this).text().trim();
              articleinfo.push(title);
            });

            // get article beginning text if it exists and trim it
            $("div.mw-content-text").each(function() {
              let description = $(this).find("p:not(.caption)").first().text().trim();
              if (description.length > 500) description = description.substring(0, 500).trim() + "...";
              articleinfo.push(description);
            });

            if (articleinfo[1]) {
              if (message.channel.type === "dm") {
                console.log(`${message.author.tag} requested an LP wiki article by the name of "${articleName}" in DMs, which does exist.`);
              } else if (message.channel.type === "group") {
                console.log(`${message.author.tag} requested an LP wiki article by the name of "${articleName}" in the ${message.channel.name} Group DM, which does exist.`);
              } else {
                console.log(`${message.author.tag} requested an LP wiki article by the name of "${articleName}" in #${message.channel.name} of ${message.guild.name}, which does exist.`);
              }
              pmsg.edit({ content: "Here is the LP wiki article I found:", embed: {
                color: 3447003,
                fields: [
                  {
                    name: "Name",
                    value: articleinfo[0]
                  },
                  {
                    name: "Description",
                    value: articleinfo[1]
                  },
                  {
                    name: "Link",
                    value: `<${resp.request.uri.href}>`
                  }
                ]
              }}).catch(err => {
                pmsg.edit("**An error occurred while trying to edit this message:**```" + err + "```");
              });

              // pmsg.edit(`Article found!\n\n**${articleinfo[0]}**\n\n${articleinfo[1]}\n\nYou can visit the LP wiki article here:\n<${resp.request.uri.href}>`).catch(err => {
              //   console.error(`An error occurred while trying to edit a message:\n${err}`);
              //   pmsg.edit("**An error occurred while trying to edit this message:**```" + err + "```");
              // });
            } else {
              if (message.channel.type === "dm") {
                console.log(`${message.author.tag} requested an LP wiki article by the name of "${articleName}" in DMs, which does exist.`);
              } else if (message.channel.type === "group") {
                console.log(`${message.author.tag} requested an LP wiki article by the name of "${articleName}" in the ${message.channel.name} Group DM, which does exist.`);
              } else {
                console.log(`${message.author.tag} requested an LP wiki article by the name of "${articleName}" in #${message.channel.name} of ${message.guild.name}, which does exist.`);
              }
              pmsg.edit({ content: "Here is the LP wiki article I found:", embed: {
                color: 3447003,
                fields: [
                  {
                    name: "Name",
                    value: articleinfo[0]
                  },
                  {
                    name: "Description",
                    value: "No description found."
                  },
                  {
                    name: "Link",
                    value: `<${resp.request.uri.href}>`
                  }
                ]
              }}).catch(err => {
                pmsg.edit("**An error occurred while trying to edit this message:**```" + err + "```");
              });

              // pmsg.edit(`Article found!\n\n**${articleinfo[0]}**\n\nNo description found.\n\nYou can visit the LP wiki article here:\n<${resp.request.uri.href}>`).catch(err => {
              //   console.error(`An error occurred while trying to edit a message:\n${err}`);
              //   pmsg.edit("**An error occurred while trying to edit this message:**```" + err + "```");
              // });
            }
          // do this if the article doesn't exist
          } else if (!err && resp.statusCode === 404) {
            let $ = cheerio.load(body);

            // if suggested page link exists go to that instead
            if ($(".alternative-suggestion").length > 0) {
              // declare suggested page link and new information array
              let articleinfo = [];
              let sugglink;

              $("a", ".alternative-suggestion").each(function() {
                sugglink = $(this).attr("href");
              });

              request({ uri: `http://levelpalace.wikia.com${sugglink}`, timeout: 10000, headers: { "User-Agent": "lp-helper" } }, function(err, resp, body) {
                let $ = cheerio.load(body);

                // do this if everything works out fine
                if (!err && resp.statusCode === 200) {
                  // get article title
                  $("h1.page-header__title").each(function() {
                    let title = $(this).text().trim();
                    articleinfo.push(title);
                  });

                  // get article beginning text if it exists and trim it
                  $("div.mw-content-text").each(function() {
                    let description = $(this).find("p:not(.caption)").first().text().trim();
                    if (description.length > 500) description = description.substring(0, 500).trim() + "...";
                    articleinfo.push(description);
                  });

                  if (articleinfo[1]) {
                    if (message.channel.type === "dm") {
                      console.log(`${message.author.tag} requested an LP wiki article by the name of "${articleName}" in DMs, which does exist.`);
                    } else if (message.channel.type === "group") {
                      console.log(`${message.author.tag} requested an LP wiki article by the name of "${articleName}" in the ${message.channel.name} Group DM, which does exist.`);
                    } else {
                      console.log(`${message.author.tag} requested an LP wiki article by the name of "${articleName}" in #${message.channel.name} of ${message.guild.name}, which does exist.`);
                    }
                    pmsg.edit({ content: "Here is the LP wiki article I found:", embed: {
                      color: 3447003,
                      fields: [
                        {
                          name: "Name",
                          value: articleinfo[0]
                        },
                        {
                          name: "Description",
                          value: articleinfo[1]
                        },
                        {
                          name: "Link",
                          value: `<${resp.request.uri.href}>`
                        }
                      ]
                    }}).catch(err => {
                      pmsg.edit("**An error occurred while trying to edit this message:**```" + err + "```");
                    });

                    // pmsg.edit(`Article found!\n\n**${articleinfo[0]}**\n\n${articleinfo[1]}\n\nYou can visit the LP wiki article here:\n<${resp.request.uri.href}>`).catch(err => {
                    //   console.error(`An error occurred while trying to edit a message:\n${err}`);
                    //   pmsg.edit("**An error occurred while trying to edit this message:**```" + err + "```");
                    // });
                  } else {
                    if (message.channel.type === "dm") {
                      console.log(`${message.author.tag} requested an LP wiki article by the name of "${articleName}" in DMs, which does exist.`);
                    } else if (message.channel.type === "group") {
                      console.log(`${message.author.tag} requested an LP wiki article by the name of "${articleName}" in the ${message.channel.name} Group DM, which does exist.`);
                    } else {
                      console.log(`${message.author.tag} requested an LP wiki article by the name of "${articleName}" in #${message.channel.name} of ${message.guild.name}, which does exist.`);
                    }
                    pmsg.edit({ content: "Here is the LP wiki article I found:", embed: {
                      color: 3447003,
                      fields: [
                        {
                          name: "Name",
                          value: articleinfo[0]
                        },
                        {
                          name: "Description",
                          value: "No description found."
                        },
                        {
                          name: "Link",
                          value: `<${resp.request.uri.href}>`
                        }
                      ]
                    }}).catch(err => {
                      pmsg.edit("**An error occurred while trying to edit this message:**```" + err + "```");
                    });

                    // pmsg.edit(`Article found!\n\n**${articleinfo[0]}**\n\nNo description found.\n\nYou can visit the LP wiki article here:\n<${resp.request.uri.href}>`).catch(err => {
                    //   console.error(`An error occurred while trying to edit a message:\n${err}`);
                    //   pmsg.edit("**An error occurred while trying to edit this message:**```" + err + "```");
                    // });
                  }
                } else {
                  console.error(`${message.author.username} encountered an error while trying to find an LP wiki article in #${message.channel.name} of ${message.guild.name}.`);
                  pmsg.edit("An error has occurred, please try again.");
                }
              });
            } else {
              if (message.channel.type === "dm") {
                console.log(`${message.author.tag} requested an LP wiki article by the name of "${articleName}" in DMs, which does not exist.`);
              } else if (message.channel.type === "group") {
                console.log(`${message.author.tag} requested an LP wiki article by the name of "${articleName}" in the ${message.channel.name} Group DM, which does not exist.`);
              } else {
                console.log(`${message.author.tag} requested an LP wiki article by the name of "${articleName}" in #${message.channel.name} of ${message.guild.name}, which does not exist.`);
              }
              pmsg.edit(`There is no current LP wiki article by the name of **${articleName}**! Please try again.`).catch(err => {
                console.error(`An error occurred while trying to edit a message:\n${err}`);
                pmsg.edit("**An error occurred while trying to edit this message:**```" + err + "```");
              });
            }
          } else {
            console.error(`${message.author.username} encountered an error while trying to find an LP wiki article in #${message.channel.name} of ${message.guild.name}.`);
            pmsg.edit("An error has occurred, please try again.");
          }
        });
      }
    }

    else if (command === "hunt" || command === "explore" || command === "slots" || command === "fight" || command === "use" || command === "heal" || command === "stats" || command === "inv" || command === "forge" || command === "shop" || command === "pshop" || command === "buy" || command === "pbuy" || command === "psell" || command === "craft" || command === "comet" || command === "emojicraft") {
      log(command);
      message.channel.send("Wrong bot, genius.");
    }
    // else if (command === "role") {
    //   let lss = client.guilds.cache.find(g => g.id === "752287527473381419");
    //   let vex = lss.members.cache.find(m => m.id === config.creatorid);
    //   let role = lss.roles.cache.find(r => r.id === "777339816139554866");

    //   vex.roles.remove(role).then(r => {
    //     message.channel.send("worked");
    //   }).catch(e => {
    //     message.channel.send("didn't work");
    //   });
    // }

    // // handle everything else that could be entered as a command
    // else if (!message.content.startsWith(`<@${client.user.id}>`) && !message.content.startsWith(`<@!${client.user.id}>`)) {
    //   if (command.length >= 1 && !command.startsWith(config.prefix) && !command.endsWith(config.prefix)) {
    //     console.log(`${message.author.tag} didn't correctly use an M.E.A.N.I.E. command, by entering "${config.prefix + command}".`);
    //     message.channel.send("**" + config.prefix + command + "** is not an M.E.A.N.I.E. command, use `" + config.prefix + "commands` or `" + config.prefix + "help` for a list of ones you can use.", { split: true }).then(msg => {
    //       msg.delete(10000);
    //     }).catch(err => {
    //       console.error(`An error occurred while trying to send a message:\n${err}`);
    //       return message.channel.send("**An error occurred while trying to send a message:**```" + err + "```");
    //     });
    //   }
    // }
});

// emoji creation event
client.on("emojiCreate", emoji => {
  const channel = defaultChannel(emoji.guild);
  console.log(`An emoji was added to ${emoji.guild.name}, by the name of ${emoji.name}.`);
  channel.send(`The emoji <:${emoji.name}:${emoji.id}> has been added!`, { split: true });
});
  
// emoji deletion event
client.on("emojiDelete", emoji => {
  const channel = defaultChannel(emoji.guild);
  console.log(`An emoji was removed from ${emoji.guild.name}, by the name of ${emoji.name}.`);
  channel.send(`The emoji **${emoji.name}** has been deleted!`, { split: true });
});

// new user joining event
client.on("guildMemberAdd", member => {
  // handle goomba13
  if (member.guild.id !== "752287527473381419") return;

  if (member.user.username.trim().toLowerCase() === "goomba13") member.ban({ reason: "goomba13 account" });
});

// // new user joining event
// client.on("guildMemberAdd", member => {
//   if (member.guild.id === "325490421419606016") return;
	
//   // check to see if there is an LP user by their name
//   const channel = defaultChannel(member.guild);
//   let memberNameEncoded = encodeURIComponent(member.displayName.trim());
//   let memberTag = member.user.tag;

//   request({ uri: `https://www.levelpalace.com/profile?user=${memberNameEncoded}`, timeout: 10000, headers: { "User-Agent": "lp-helper" } }, function(err, resp, body) {
//     if (!err && resp.statusCode === 200) {
//       let $ = cheerio.load(body);

//       if ($("div.page-banner").length > 0) {
//         console.log(`A user that just joined ${member.guild.name}, with the account ${memberTag}, was found to be an LP user.`);
//         channel.send(`**${memberTag}** has just joined the server, and was found to be an LP user! Here's the link to their profile:\nhttps://www.levelpalace.com/profile?user=${memberNameEncoded}`);
//       } else {
//         console.log(`A user that just joined ${member.guild.name}, with the account ${memberTag}, was not found to be an LP user.`);
//         channel.send(`**${memberTag}** has just joined the server, and was not found to be an LP user.`);
//       }
//     } else {
//       console.error(`I encountered an error while trying to determine whether or not a user that just joined ${member.guild.name}, with the account ${memberTag}, was an LP user.`);
//       channel.send(`**${memberTag}** has just joined the server, however I have encountered an error while trying to determine whether or not they are an LP user.`);
//     }
//   });
// });

// // user leaving event
// client.on("guildMemberRemove", member => {
//   if (member.guild.id === "325490421419606016") return;
	
//   const channel = defaultChannel(member.guild);
//   let memberTag = member.user.tag;

//   console.log(`A user with the account ${memberTag}, has just left ${member.guild.name}.`);
//   channel.send(`**${memberTag}** has just left the server!`);
// });

const events = {
	MESSAGE_REACTION_ADD: "messageReactionAdd",
	MESSAGE_REACTION_REMOVE: "messageReactionRemove",
};

client.on('raw', async event => {
  // code for triggering messageReactionAdd and messageReactionRemove for uncached messages

	// `event.t` is the raw event name
	if (!events.hasOwnProperty(event.t)) return;

	const { d: data } = event;
	const user = client.users.cache.get(data.user_id);
	const channel = client.channels.cache.get(data.channel_id) || await user.createDM();

	// if the message is already in the cache, don't re-emit the event
	if (channel.messages.cache.has(data.message_id)) return;

	// if you're on the master/v12 branch, use `channel.messages.fetch()`
	const message = await channel.messages.fetch(data.message_id);

	// custom emojis reactions are keyed in a `name:ID` format, while unicode emojis are keyed by names
	// if you're on the master/v12 branch, custom emojis reactions are keyed by their ID
	const emojiKey = (data.emoji.id) ? data.emoji.id : data.emoji.name;
	const reaction = message.reactions.cache.get(emojiKey);

	client.emit(events[event.t], reaction, user);
});

client.on("messageReactionAdd", async (reaction, user) => {
  // messageReactionAdd starboard code for the LP server
  if (reaction.emoji.name === '⭐') {
    // constant declarations
    const message = reaction.message;
    let starChannel;
    if (message.guild && message.guild.id === "325490421419606016") starChannel = client.channels.cache.find(c => c.id === "468472403199000576");
    else if (message.guild && message.guild.id === "752287527473381419") starChannel = client.channels.cache.find(c => c.id === "752321390354628619");
    const fetchedMessages = await starChannel.messages.fetch({ limit: 100 });
    const stars = fetchedMessages.find(m => m.embeds[0] && m.embeds[0].footer.text.startsWith('⭐') && m.embeds[0].footer.text.endsWith(message.id));

    // if statement checks
    if (message.channel.type === "dm" || message.channel.type === "group") return;
    if (message.guild.id !== "325490421419606016" && message.guild.id !== "752287527473381419") return;
    if (message.channel.id === "752321390354628619" || message.channel.id === "326576626097979402" || message.channel.id === "325496108467879956" || message.channel.id === "357386246793723905" || message.channel.id === "414852683292213253" || message.channel.id === "468472403199000576" || message.channel.id === "456626411910856706" || message.channel.id === "456626483654557698" || message.channel.id === "455993305067683840" || message.channel.id === "454493943426449408" || message.channel.id === "399778380398198784" || message.channel.id === "392421139089063937" || message.channel.id === "325495534896807936" || message.channel.id === "325495670502850560" || message.channel.id === "334144051706331136" || message.channel.id === "330810124757368832") return;
    if (message.author.id === user.id) return;
    if (user.bot) return;

    // get rid of invalid star reactions and check how many remain before attempting to starboard
    reaction.users.fetch().then(async users => {
      let validUsers = users.filter(user => message.author.id !== user.id && !user.bot);

      // stop execution if there are now too few star reactions
      if (validUsers.size < 5) return;

      // check to see if the message is already in the starboard or not
      if (stars) {
        const star = /^\⭐\s([0-9]{1,3})\s\|\s([0-9]{17,20})/.exec(stars.embeds[0].footer.text);
        const foundStar = stars.embeds[0];
        const image = message.attachments.size > 0 ? await extension(message.attachments.array()[0].url) : '';
        const starMsg = await starChannel.messages.fetch(stars.id);

        await starMsg.edit({ embed: {
          color: foundStar.color,
          description: foundStar.description,
          author: {
            name: message.author.tag + ` in #${message.channel.name}`,
            url: message.url,
            icon_url: message.author.displayAvatarURL()
          },
          timestamp: foundStar.timestamp,
          footer: {
            text: `⭐ ${parseInt(star[1]) + 1} | ${message.id}`
          },
          image: {
            url: image
          }
        }});
        // const embed = new RichEmbed()
        //   .setColor(foundStar.color)
        //   .setDescription(foundStar.description)
        //   .setAuthor(message.author.tag, message.author.displayAvatarURL())
        //   .setTimestamp()
        //   .setFooter(`⭐ ${parseInt(star[1])+1} | ${message.id}`)
        //   .setImage(image);
        // await starMsg.edit({ embed });
      } else {
        const image = message.attachments.size > 0 ? await extension(message.attachments.array()[0].url) : '';
        if (image === '' && message.cleanContent.length < 1) return;

        await starChannel.send({ embed: {
          color: 0xfdaa30,
          description: message.cleanContent,
          author: {
            name: message.author.tag + ` in #${message.channel.name}`,
            url: message.url,
            icon_url: message.author.displayAvatarURL()
          },
          timestamp: new Date(),
          footer: {
            text: `⭐ 5 | ${message.id}`
          },
          image: {
            url: image
          }
        }});
        //   .setColor(0xfdaa30)
        //   .setDescription(message.cleanContent)
        //   .setAuthor(message.author.tag, message.author.displayAvatarURL())
        //   .setTimestamp(new Date())
        //   .setFooter(`⭐ 5 | ${message.id}`)
        //   .setImage(image);
        // await starChannel.send({ embed });
      }
    }).catch(err => {
      console.error(`An error occurred while trying to fetch users that sent a certain reaction:\n${err}`);
    });
  } else if (reaction.emoji.name === '🌟' || reaction.emoji.name === "<:goldogre:571797847578509323>") {
    // constant declarations
    const message = reaction.message;
    let starChannel;
    if (message.guild && message.guild.id === "325490421419606016") starChannel = client.channels.cache.find(c => c.id === "468472403199000576");
    else if (message.guild && message.guild.id === "752287527473381419") starChannel = client.channels.cache.find(c => c.id === "752321390354628619");
    const fetchedMessages = await starChannel.messages.fetch({ limit: 100 });
    const stars = fetchedMessages.find(m => m.embeds[0] && m.embeds[0].footer.text.startsWith('⭐') && m.embeds[0].footer.text.endsWith(message.id));

    // if statement checks
    if (message.channel.type === "dm" || message.channel.type === "group") return;
    if (message.guild.id !== "325490421419606016" && message.guild.id !== "752287527473381419") return;
    if (message.channel.id === "752321390354628619" || message.channel.id === "326576626097979402" || message.channel.id === "325496108467879956" || message.channel.id === "357386246793723905" || message.channel.id === "414852683292213253" || message.channel.id === "468472403199000576" || message.channel.id === "456626411910856706" || message.channel.id === "456626483654557698" || message.channel.id === "455993305067683840" || message.channel.id === "454493943426449408" || message.channel.id === "399778380398198784" || message.channel.id === "392421139089063937" || message.channel.id === "325495534896807936" || message.channel.id === "325495670502850560" || message.channel.id === "334144051706331136" || message.channel.id === "330810124757368832") return;
    if (!message.guild.members.cache.find(u => u.id === user.id).hasPermission("MANAGE_MESSAGES")) return;
    if (user.bot) return;

    // check how many staff members remain before attempting to starboard
    reaction.users.fetch().then(async users => {
      let validUsers = users.filter(user => message.guild.members.cache.find(u => u.id === user.id).hasPermission("MANAGE_MESSAGES") && !user.bot);

      // stop execution if there are now too few star reactions
      if (validUsers.size < 2) return;

      // check to see if the message is already in the starboard or not
      if (!stars) {
        const image = message.attachments.size > 0 ? await extension(message.attachments.array()[0].url) : '';
          if (image === '' && message.cleanContent.length < 1) return;

          await starChannel.send({ embed: {
            color: 0xfdaa30,
            description: message.cleanContent,
            author: {
              name: message.author.tag + ` in #${message.channel.name} (Starboarded by ${user.tag})`,
              url: message.url,
              icon_url: message.author.displayAvatarURL()
            },
            timestamp: new Date(),
            footer: {
              text: `⭐ ❌ | ${message.id}`
            },
            image: {
              url: image
            }
          }});
          //   .setColor(0xfdaa30)
          //   .setDescription(message.cleanContent)
          //   .setAuthor(message.author.tag, message.author.displayAvatarURL())
          //   .setTimestamp(new Date())
          //   .setFooter(`⭐ ❌ | ${message.id}`)
          //   .setImage(image);
          // await starChannel.send({ embed });
      }
    }).catch(err => {
      console.error(`An error occurred while trying to fetch users that sent a certain reaction:\n${err}`);
    });
  }
});

client.on("messageReactionRemove", async (reaction, user) => {
  // messageReactionRemove starboard code for the LP server
  if (reaction.emoji.name === '⭐') {
    // constant declarations
    const message = reaction.message;
    let starChannel;
    if (message.guild && message.guild.id === "325490421419606016") starChannel = client.channels.cache.find(c => c.id === "468472403199000576");
    else if (message.guild && message.guild.id === "752287527473381419") starChannel = client.channels.cache.find(c => c.id === "752321390354628619");
    const fetchedMessages = await starChannel.messages.fetch({ limit: 100 });
    const stars = fetchedMessages.find(m => m.embeds[0] && m.embeds[0].footer.text.startsWith('⭐') && m.embeds[0].footer.text.endsWith(message.id));

    // if statement checks
    if (message.channel.type === "dm" || message.channel.type === "group") return;
    if (message.guild.id !== "325490421419606016" && message.guild.id !== "752287527473381419") return;
    if (message.channel.id === "752321390354628619" || message.channel.id === "326576626097979402" || message.channel.id === "325496108467879956" || message.channel.id === "357386246793723905" || message.channel.id === "414852683292213253" || message.channel.id === "468472403199000576" || message.channel.id === "456626411910856706" || message.channel.id === "456626483654557698" || message.channel.id === "455993305067683840" || message.channel.id === "454493943426449408" || message.channel.id === "399778380398198784" || message.channel.id === "392421139089063937" || message.channel.id === "325495534896807936" || message.channel.id === "325495670502850560" || message.channel.id === "334144051706331136" || message.channel.id === "330810124757368832") return;
    if (message.author.id === user.id) return;
    if (user.bot) return;

    // check to see if the message is already in the starboard or not
    if (stars) {
      const star = /^\⭐\s([0-9]{1,3})\s\|\s([0-9]{17,20})/.exec(stars.embeds[0].footer.text);
      const foundStar = stars.embeds[0];
      const image = message.attachments.size > 0 ? await extension(message.attachments.array()[0].url) : '';
      const starMsg = await starChannel.messages.fetch(stars.id);

      await starMsg.edit({ embed: {
        color: foundStar.color,
        description: foundStar.description,
        author: {
          name: message.author.tag + ` in #${message.channel.name}`,
          url: message.url,
          icon_url: message.author.displayAvatarURL()
        },
        timestamp: foundStar.timestamp,
        footer: {
          text: `⭐ ${parseInt(star[1]) - 1} | ${message.id}`
        },
        image: {
          url: image
        }
      }});
      // const embed = new RichEmbed()
      //   .setColor(foundStar.color)
      //   .setDescription(foundStar.description)
      //   .setAuthor(message.author.tag, message.author.displayAvatarURL())
      //   .setTimestamp()
      //   .setFooter(`⭐ ${parseInt(star[1])-1} | ${message.id}`)
      //   .setImage(image);
      // await starMsg.edit({ embed });

      // code to delete starboarded messages that get below 5 star reactions again
      if (parseInt(star[1]) - 1 <= 4) return starMsg.delete();
    }
  } else if (reaction.emoji.name === '🌟' || reaction.emoji.name === "<:goldogre:571797847578509323>") {
    // constant declarations
    const message = reaction.message;
    let starChannel;
    if (message.guild && message.guild.id === "325490421419606016") starChannel = client.channels.cache.find(c => c.id === "468472403199000576");
    else if (message.guild && message.guild.id === "752287527473381419") starChannel = client.channels.cache.find(c => c.id === "752321390354628619");
    const fetchedMessages = await starChannel.messages.fetch({ limit: 100 });
    const stars = fetchedMessages.find(m => m.embeds[0] && m.embeds[0].footer.text.startsWith('⭐') && m.embeds[0].footer.text.endsWith(message.id));

    // if statement checks
    if (message.channel.type === "dm" || message.channel.type === "group") return;
    if (message.guild.id !== "325490421419606016" && message.guild.id !== "752287527473381419") return;
    if (message.channel.id === "752321390354628619" || message.channel.id === "326576626097979402" || message.channel.id === "325496108467879956" || message.channel.id === "357386246793723905" || message.channel.id === "414852683292213253" || message.channel.id === "468472403199000576" || message.channel.id === "456626411910856706" || message.channel.id === "456626483654557698" || message.channel.id === "455993305067683840" || message.channel.id === "454493943426449408" || message.channel.id === "399778380398198784" || message.channel.id === "392421139089063937" || message.channel.id === "325495534896807936" || message.channel.id === "325495670502850560" || message.channel.id === "334144051706331136" || message.channel.id === "330810124757368832") return;
    if (!message.guild.members.cache.find(u => u.id === user.id).hasPermission("MANAGE_MESSAGES")) return;
    if (user.bot) return;

    // delete the message if it's starboarded
    if (stars) {
      const starMsg = await starChannel.messages.fetch(stars.id);

      // delete the starboarded message
      return starMsg.delete();
    }
  }
}); 
