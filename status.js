const fs = require('fs');
const path = require('path');
const moment = require('moment-timezone');

const guildDataPath = path.join('./gmember.json');

function loadGuildData() {
    if (!fs.existsSync(guildDataPath)) {
        return {};
    }
    return JSON.parse(fs.readFileSync(guildDataPath, 'utf8'));
}

// Menyimpan data guild ke file
function saveGuildData(data) {
    fs.writeFileSync(guildDataPath, JSON.stringify(data, null, 2));
}

function determineRace(raceLevel) {
    if (raceLevel < 1) return "Faerie";
    if (raceLevel < 1000) return "Faerie";
    if (raceLevel < 2000) return "Goblin";
    if (raceLevel < 3000) return "Slime";
    if (raceLevel < 4000) return "Human";
    if (raceLevel < 5000) return "Dwarf";
    if (raceLevel < 6000) return "Elf";
    if (raceLevel < 7000) return "Orc";
    if (raceLevel < 8000) return "Troll";
    if (raceLevel < 9000) return "Vampire";
    if (raceLevel < 10000) return "Werewolf";
    if (raceLevel < 30000) return "Elemental";
    if (raceLevel < 60000) return "Demon";
    if (raceLevel < 90000) return "Dragon";
    if (raceLevel < 999999999) return "Angel";
    return "Demigod";
}

function determineTitle(level) {
    if (level < 10) return "Novice";
    if (level < 20) return "Apprentice";
    if (level < 30) return "Adept";
    if (level < 40) return "Expert";
    if (level < 50) return "Master";
    if (level < 60) return "Grandmaster";
    if (level < 70) return "Legend";
    if (level < 80) return "Myth";
    if (level < 90) return "Eternal";
    return "Immortal";
}

function getAchievementName(id, achievementNames) {
    return achievementNames[id] || "unknown";
}

async function setAchievementName({ message, event, args, usersData }) {
    const user = await usersData.get(event.senderID);
    if (!user) {
        return message.reply("User tidak ditemukan.");
    }

    if (args.length < 2) {
        return message.reply("Format perintah tidak valid. Gunakan: setn [ID] [nama achievement]");
    }

    const achievementID = parseInt(args[0], 10);
    const achievementName = args.slice(1).join(" ");

    if (isNaN(achievementID)) {
        return message.reply("ID pencapaian harus berupa angka.");
    }

    let achievementNames = user.data.achievementNames || {};
    achievementNames[achievementID] = achievementName;

    await usersData.set(event.senderID, {
        ...user,
        data: { ...user.data, achievementNames }
    });

    message.reply(`Pencapaian dengan ID ${achievementID} telah diatur sebagai "${achievementName}".`);
}

module.exports = {
    config: {
        name: "status",
        version: "1.5",
        author: "Rizky",
        countDown: 5,
        role: 0,
        description: "Cek status dan balance mu",
        category: "info",
        guide: ""
    },
    onStart: async function ({ message, event, args, usersData }) {
        const user = await usersData.get(event.senderID);
        if (!user) {
            return message.reply("Data pengguna tidak ditemukan.");
        }

        let nama = user.data.nama || "unknown";
        let fakeUid = user.data.fakeUid || 0;
        let raceLevel = user.data.race || 0;
        let race = determineRace(raceLevel);
        let trustFactor = user.data.trustFactor !== undefined ? user.data.trustFactor : 70;
        let level = user.data.level || 1;
        let exp = user.data.exp || 0;
        let title = determineTitle(level);
        let achievementNames = user.data.achievementNames || {};
        let activeAchievementID = user.data.activeAchievement || 0;
        let activeAchievement = getAchievementName(activeAchievementID, achievementNames);
        let balance = Math.floor(user.money || 0);
        let reportCount = user.data.reportCount || 0;
        let messagesSent = user.data.messagesSent || 0;
        let guildData = loadGuildData();

        const guildName = Object.keys(guildData).find(guildName => guildData[guildName].includes(event.senderID)) || "Unknown";
        
        if (fakeUid === 0) {
            const allUsers = await usersData.getAll();
            const maxFakeUid = Math.max(0, ...allUsers.map(u => u.data.fakeUid || 0));
            fakeUid = maxFakeUid + 1;
            await usersData.set(event.senderID, {
                ...user,
                data: { ...user.data, fakeUid: fakeUid }
            });
        }

        if (raceLevel === undefined) {
            raceLevel = 0;
            race = determineRace(raceLevel);
            await usersData.set(event.senderID, {
                ...user,
                data: { ...user.data, race: raceLevel }
            });
        }

        if (!args[0]) {
            return message.reply(`📝 𝖭𝖺𝗆𝖺: ${nama}\n✨ 𝗂𝖽: ${fakeUid} ✨\n💰 𝖤𝗎𝗋𝗈: ${balance}€\n🏆 Race: ${race}\n🔒 TF: ${trustFactor}%\n🔝 Level: ${level}\n⭐ Title: ${title}\n🎖 Achievement: ${activeAchievement}\n📊 Laporan: ${reportCount}\n📧 Pesan Terkirim: ${messagesSent}\n🏰 Guild: ${guildName}`);
        }

        if (args[0] === 'setn') {
            await setAchievementName({ message, event, args: args.slice(1), usersData });
            return;
        }

        if (args[0].match(regExCheckURL)) {
            let msg = '';
            for (let i = 0; i < args.length; i++) {
                msg += `${args[i]} `;
            }
            return message.reply(msg.trim());
        }

        return message.reply("Perintah tidak dikenal. Gunakan {pn} [pesan] untuk mengecek status atau {pn} setn [ID] [nama] untuk mengatur nama pencapaian.");
    },
    onJoin: async function ({ event, usersData }) {
        const { userID, threadID } = event;
        const guildData = loadGuildData();

        if (!guildData[threadID]) {
            guildData[threadID] = [];
        }

        if (!guildData[threadID].includes(userID)) {
            guildData[threadID].push(userID);
            saveGuildData(guildData);
        }
    },
    onLeave: async function ({ event, usersData }) {
        const { userID, threadID } = event;
        const guildData = loadGuildData();

        if (guildData[threadID]) {
            guildData[threadID] = guildData[threadID].filter(id => id !== userID);
            if (guildData[threadID].length === 0) {
                delete guildData[threadID];
            }
            saveGuildData(guildData);
        }
    },
    onChat: async function ({ event, usersData }) {
        const senderID = event.senderID;
        const user = await usersData.get(senderID);

        if (!user) return;

        // Update jumlah pesan yang dikirim
        let messagesSent = user.data.messagesSent || 0;
        messagesSent++;
        
        // Update level dan trust factor
        let trustFactor = user.data.trustFactor !== undefined ? user.data.trustFactor : 70;
        let level = user.data.level || 1;

        // Hitung dan tambahkan trust factor
        if (messagesSent % 5 === 0) {
            trustFactor = Math.min(100, trustFactor + 1); // Maksimal 100%
        }

        // Hitung dan tambahkan level
        if (messagesSent % 15 === 0) {
            level++;
        }

        // Simpan data pengguna yang diperbarui
        await usersData.set(senderID, {
            ...user,
            data: {
                ...user.data,
                messagesSent: messagesSent,
                trustFactor: trustFactor,
                level: level
            }
        });
    }
};
