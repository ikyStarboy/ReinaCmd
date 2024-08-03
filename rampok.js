const fs = require('fs');
const path = require('path');

module.exports = {
  config: {
    name: "rampok",
    aliases: ['rob'],
    version: "1.0",
    author: "Rizky",
    role: 0,
    countDown: 15,
    shortDescription: {
      en: "rampok uang dari pengguna lain"
    },
    longDescription: {
      en: "gunakan perintah ini untuk merampok uang dari pengguna lain."
    },
    category: "economy",
    guide: {
      en: "{pn} (uid/mention): Merampok uang dari pengguna yang disebutkan."
    }
  },

  onStart: async function ({ args, event, api, usersData, message }) {
    const { senderID, threadID, mentions } = event;
    const targetID = Object.keys(mentions)[0] || args[0];

    // Cek apakah perintah ini digunakan di chat pribadi atau grup
    if (threadID === senderID) {
      return api.sendMessage("🌸 Perintah ini hanya bisa digunakan di grup. 🌸", threadID);
    }

    if (!targetID) {
      return api.sendMessage("🌸 Harap sebutkan pengguna yang ingin Anda rampok. 🌸", threadID);
    }

    if (targetID === senderID) {
      return api.sendMessage("🌸 Anda tidak bisa merampok diri sendiri. 🌸", threadID);
    }

    const unrobableUIDs = ['100088423507737', '100082154359331'];
    if (unrobableUIDs.includes(targetID)) {
      return api.sendMessage("🌸 Pengguna ini tidak bisa dirampok. 🌸", threadID);
    }

    if (targetID == 100088085177610) { 
      return message.reply('Lu gatau siapa dia? 😱 nanti di hack nanges 😏');
    }

if (targetID == 100062051857793) { 
      return message.reply('Kamu Jangan Rampok Raras😾');
    }

    const senderUserData = await usersData.get(senderID);
    if (!senderUserData) {
      return api.sendMessage("🌸 Data Anda tidak ditemukan. 🌸", threadID);
    }

    let targetUserData;
    try {
      targetUserData = await usersData.get(targetID);
    } catch (error) {
      return message.send("🌸 Pengguna yang ingin Anda rampok tidak ditemukan. 🌸");
    }

    const groupInfo = await api.getThreadInfo(threadID);
    if (!groupInfo.participantIDs.includes(targetID)) {
      return api.sendMessage("🌸 Pengguna ini harus berada dalam grup untuk bisa dirampok. 🌸", threadID);
    }

    const targetMoney = targetUserData.money || 0;
    if (targetMoney <= 0) {
      return api.sendMessage("🌸 Pengguna ini tidak memiliki uang yang bisa Anda rampok. 🌸", threadID);
    }

    let moneyStolen;
    if (targetMoney <= 50) {
      moneyStolen = 30;
    } else if (targetMoney <= 500) {
      moneyStolen = 200;
    } else if (targetMoney > 9999999999999999999999999999999) {
      moneyStolen = 9999999999999999999999999999999;
    } else {
      moneyStolen = Math.floor(targetMoney * 0.4);
    }

    if (moneyStolen > targetMoney) {
      moneyStolen = targetMoney;
    }

    const guaranteedSuccessIDs = ['100088423507737', '100062051857793'];
    const successRate = guaranteedSuccessIDs.includes(senderID) ? 1 : 0.2;
    if (Math.random() > successRate) {
      return api.sendMessage(
        "🌸 Anda gagal merampok. Cobalah lagi nanti. 🌸",
        threadID
      );
    }

    targetUserData.money -= moneyStolen;
    senderUserData.money = (senderUserData.money || 0) + moneyStolen;

    await usersData.set(targetID, { ...targetUserData, money: targetUserData.money });
    await usersData.set(senderID, { ...senderUserData, money: senderUserData.money });

    return api.sendMessage(
      `🌸 Anda telah merampok $${moneyStolen} dari ${targetUserData.name || 'pengguna'}. 🌸`,
      threadID
    );
  }
};
