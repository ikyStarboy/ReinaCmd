const fs = require('fs');
const path = require('path');

function getResult(userChoice, botChoice) {
  if (userChoice === botChoice) return 'draw';
  if (
    (userChoice === '✋' && botChoice === '✊') ||
    (userChoice === '✊' && botChoice === '✌') ||
    (userChoice === '✌' && botChoice === '✋')
  ) {
    return 'win';
  }
  return 'lose';
}

module.exports = {
  config: {
    name: "rps",
    aliases: ['suit', 'guntingbatu'],
    version: "1.0",
    author: "Rizky",
    role: 0,
    shortDescription: {
      id: "Main kertas-gunting-batu dengan bot"
    },
    longDescription: {
      id: "Main kertas-gunting-batu (✋/✌/✊) dengan bot. Jika menang, kamu akan mendapatkan uang sebesar 100.000.000."
    },
    category: "games",
    guide: {
      id: "{pn} ✋/✌/✊: Main kertas-gunting-batu dengan bot."
    }
  },

  onStart: async function ({ args, event, api, usersData }) {
    const pilihanUser = args[0];
    const pilihanValid = ['✋', '✌', '✊'];
    const { senderID, threadID } = event;

    if (!pilihanValid.includes(pilihanUser)) {
      return api.sendMessage("Pilihan tidak valid. Gunakan salah satu dari ini: ✋, ✌, ✊.", threadID);
    }

    const pilihanBot = pilihanValid[Math.floor(Math.random() * pilihanValid.length)];
    const hasil = getResult(pilihanUser, pilihanBot);

    const userData = await usersData.get(senderID);
    let pesan = `Kamu memilih: ${pilihanUser}\nBot memilih: ${pilihanBot}\n`;

    if (hasil === 'win') {
      userData.money = (userData.money || 0) + 100000000;
      await usersData.set(senderID, { ...userData });
      pesan += "Kamu menang! 🥳 Kamu mendapatkan uang sebesar 100.000.000. 💰";
    } else if (hasil === 'lose') {
      pesan += "Kamu kalah. 😢 Coba lagi ya!";
    } else {
      pesan += "Seri! 😮 Tidak ada yang menang.";
    }

    return api.sendMessage(pesan, threadID);
  }
};
