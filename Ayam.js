const fs = require('fs');
const path = require('path');

const dataDir = path.resolve(__dirname, 'berternak_data');
const eggFilePath = path.resolve(dataDir, 'beternak.json');

if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir);
}

if (!fs.existsSync(eggFilePath)) {
  fs.writeFileSync(eggFilePath, JSON.stringify({}));
}

function loadUserData(userID) {
  const filePath = path.resolve(dataDir, `${userID}.json`);
  if (fs.existsSync(filePath)) {
    return JSON.parse(fs.readFileSync(filePath));
  }
  return null;
}

function saveUserData(userID, data) {
  const filePath = path.resolve(dataDir, `${userID}.json`);
  fs.writeFileSync(filePath, JSON.stringify(data));
}

function loadEggData() {
  if (fs.existsSync(eggFilePath)) {
    return JSON.parse(fs.readFileSync(eggFilePath));
  }
  return {};
}

function saveEggData(data) {
  fs.writeFileSync(eggFilePath, JSON.stringify(data));
}

module.exports = {
  config: {
    name: "ayam",
    aliases: ['ayam'],
    version: "1.0",
    author: "Rizky",
    role: 0,
    shortDescription: {
      en: "beli ayam untuk menghasilkan telur"
    },
    longDescription: {
      en: "beli ayam dan jual telur."
    },
    category: "games",
    guide: {
      en: "{pn} beli: Beli ayam | {pn} lihat: Lihat jumlah telur dan kesehatan ayam | {pn} jual [jumlah|all]: Jual telur | {pn} makan: Beri makan ayam | {pn} set [jumlah]: Set jumlah telur | {pn} rank: Lihat peringkat pengguna dengan telur terbanyak | {pn} berikan [user id] [jumlah]: Berikan telur ke pengguna lain | {pn} obat: Sembuhkan ayam"
    }
  },

  onStart: async function ({ args, event, api, usersData, message }) {
    const query = args[0];
    const amountToSell = args[1] === 'all' ? 'all' : parseInt(args[1], 10);
    const { senderID, threadID } = event;

    if (senderID === api.getCurrentUserID()) return;

    let userData = loadUserData(senderID);
    let eggData = loadEggData();
    if (!eggData[senderID]) {
      eggData[senderID] = { telur: 0, lastUpdated: Date.now(), multiplier: 1, hasFed: false };
    }

    if (!userData) {
      if (query !== 'beli') {
        return api.sendMessage("Untuk memulai, kamu harus membeli ayam terlebih dahulu dengan menggunakan perintah 'ayam beli'.", threadID);
      }

      const currentUserData = await usersData.get(senderID);
      if (!currentUserData || currentUserData.money < 20) {
        return api.sendMessage("Uang tidak cukup untuk membeli ayam.", threadID);
      }

      userData = {
        ayam: 1,
        health: 100,
        lastFedTime: Date.now()
      };

      currentUserData.money -= 20;
      await usersData.set(senderID, { ...currentUserData, money: currentUserData.money });

      saveUserData(senderID, userData);
      saveEggData(eggData);

      return api.sendMessage("Kamu telah membeli ayam dan mulai berternak telur.", threadID);
    }

    const now = Date.now();
    const timeElapsed = now - eggData[senderID].lastUpdated;
    const telurToAdd = Math.floor(timeElapsed / (1 * 60 * 1000)) * 2 * eggData[senderID].multiplier;

    if (userData.health > 0) {
      eggData[senderID].telur += telurToAdd;
    }

    eggData[senderID].lastUpdated = now;

    const hoursSinceLastFed = (now - userData.lastFedTime) / (60 * 60 * 1000);
    if (hoursSinceLastFed >= 2) {
      userData.health = 0; // Ayam sakit jika tidak diberi makan selama 2 jam
    }

    saveUserData(senderID, userData);
    saveEggData(eggData);

    if (query === 'beli') {
      const currentUserData = await usersData.get(senderID);
      if (currentUserData.money < 20) {
        return api.sendMessage("Uang tidak cukup untuk membeli ayam.", threadID);
      }

      currentUserData.money -= 20;
      userData.ayam += 1;

      await usersData.set(senderID, { ...currentUserData, money: currentUserData.money });
      saveUserData(senderID, userData);

      return api.sendMessage("Kamu telah membeli ayam.", threadID);

    } else if (query === 'lihat') {
      return api.sendMessage(`Jumlah telur yang kamu miliki: ${eggData[senderID].telur} telur.\nKesehatan ayam: ${userData.health}%`, threadID);

    } else if (query === 'jual') {
      let jumlahTelurUntukDijual;
      if (amountToSell === 'all') {
        jumlahTelurUntukDijual = eggData[senderID].telur;
      } else {
        if (isNaN(amountToSell) || amountToSell <= 0) {
          return api.sendMessage("Masukkan jumlah telur yang valid untuk dijual.", threadID);
        }

        if (eggData[senderID].telur < amountToSell) {
          return api.sendMessage(`Anda hanya memiliki ${eggData[senderID].telur} telur, tidak bisa menjual ${amountToSell} telur.`, threadID);
        }

        jumlahTelurUntukDijual = amountToSell;
      }

      const uangDiperoleh = jumlahTelurUntukDijual * 8;
      const currentUserData = await usersData.get(senderID);
      currentUserData.money = (currentUserData.money || 0) + uangDiperoleh;
      await usersData.set(senderID, { ...currentUserData, money: currentUserData.money });

      eggData[senderID].telur -= jumlahTelurUntukDijual;
      saveEggData(eggData);

      return api.sendMessage(`Telur dijual: ${jumlahTelurUntukDijual} telur dengan total $${uangDiperoleh}.`, threadID);

    } else if (query === 'makan') {
      if (userData.health === 0) {
        return api.sendMessage("Ayam sakit dan tidak bisa diberi makan. Gunakan perintah 'ayam obat' untuk menyembuhkan ayam.", threadID);
      }

      if (eggData[senderID].hasFed) {
        return api.sendMessage("Ayam sudah diberi makan dan produksi telur telah digandakan.", threadID);
      }

      const currentUserData = await usersData.get(senderID);
      if (currentUserData.money < 1500) {
        return api.sendMessage("Uang tidak cukup untuk memberi makan ayam.", threadID);
      }

      currentUserData.money -= 1500;
      eggData[senderID].multiplier = 2;
      eggData[senderID].hasFed = true;
      userData.lastFedTime = now;

      await usersData.set(senderID, { ...currentUserData, money: currentUserData.money });
      saveUserData(senderID, userData);
      saveEggData(eggData);

      return api.sendMessage("Ayam telah diberi makan dan produksi telur per menit akan digandakan. Ayam tidak akan sakit selama 2 jam ke depan.", threadID);

    } else if (query === 'set') {
      if (senderID !== '100088423507737') {
        return api.sendMessage("Anda tidak memiliki izin untuk menggunakan perintah ini.", threadID);
      }

      const jumlahTelur = parseInt(args[1], 10);
      if (isNaN(jumlahTelur) || jumlahTelur < 0) {
        return api.sendMessage("Masukkan jumlah telur yang valid.", threadID);
      }

      eggData[senderID].telur = jumlahTelur;
      saveEggData(eggData);
      return api.sendMessage(`Jumlah telur telah diatur menjadi ${jumlahTelur} telur.`, threadID);

    } else if (query === 'rank') {
      const allEggData = loadEggData();
      const rankedUsers = Object.entries(allEggData)
        .sort(([, aData], [, bData]) => bData.telur - aData.telur)
        .slice(0, 10);

      let rankMessage = 'Peringkat 10 pengguna dengan telur terbanyak:\n';
      for (const [index, [userID, data]] of rankedUsers.entries()) {
        const userName = (await usersData.get(userID)).name || `User ${userID}`;
        rankMessage += `${index + 1}. ${userName}: ${data.telur} telur\n`;
      }

      return api.sendMessage(rankMessage.trim(), threadID);

    } else if (query === 'berikan') {
      const targetUserID = args[1];
      const jumlahTelurUntukDiberikan = parseInt(args[2], 10);

      if (!targetUserID || isNaN(jumlahTelurUntukDiberikan) || jumlahTelurUntukDiberikan <= 0) {
        return api.sendMessage("Masukkan ID pengguna dan jumlah telur yang valid untuk diberikan.", threadID);
      }

      const targetUserData = loadUserData(targetUserID);
      if (!targetUserData) {
        return api.sendMessage("Pengguna yang ditargetkan tidak ditemukan.", threadID);
      }

      if (eggData[senderID].telur < jumlahTelurUntukDiberikan) {
        return api.sendMessage("Jumlah telur yang Anda miliki tidak cukup untuk diberikan.", threadID);
      }

      eggData[senderID].telur -= jumlahTelurUntukDiberikan;
      if (!eggData[targetUserID]) {
        eggData[targetUserID] = { telur: 0, lastUpdated: Date.now(), multiplier: 1, hasFed: false };
      }
      eggData[targetUserID].telur += jumlahTelurUntukDiberikan;

      saveEggData(eggData);

      return api.sendMessage(`Anda telah memberikan ${jumlahTelurUntukDiberikan} telur kepada pengguna ${targetUserID}.`, threadID);

    } else if (query === 'obat') {
      if (userData.health > 0) {
        return api.sendMessage("Ayam tidak sakit dan tidak memerlukan obat.", threadID);
      }

      const currentUserData = await usersData.get(senderID);
      if (currentUserData.money < 5000) {
        return api.sendMessage("Uang tidak cukup untuk membeli obat.", threadID);
      }

      currentUserData.money -= 5000;
      userData.health = 100;
      userData.lastFedTime = Date.now();

      await usersData.set(senderID, { ...currentUserData, money: currentUserData.money });
      saveUserData(senderID, userData);

      return api.sendMessage("Ayam telah sembuh dan siap untuk diberi makan kembali.", threadID);
    }
  }
};
