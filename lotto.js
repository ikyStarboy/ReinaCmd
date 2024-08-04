module.exports = {
  config: {
    name: "lotto",
    aliases: ['lotto'],
    version: "1.0",
    author: "Rizky",
    role: 0,
    shortDescription: {
      id: "🎰 Mainkan lotto dan menangkan hadiah! 🎉"
    },
    longDescription: {
      id: "🎰 Mainkan lotto dengan memilih 4 angka dari 1 sampai 9. Jika ada angka yang benar, Anda akan mendapatkan hadiah. 💰"
    },
    category: "games",
    guide: {
      id: "✨ {pn} 1 5 7 8: Pilih 4 angka dan coba keberuntungan Anda. 🍀"
    }
  },

  onStart: async function ({ args, event, api, usersData }) {
    const { senderID, threadID } = event;
    
    if (args.length !== 4) {
      return api.sendMessage("⚠️ Masukkan 4 angka untuk bermain lotto. Contoh: 'lotto 1 5 7 8' ⚠️", threadID);
    }

    const userNumbers = args.map(Number);
    if (userNumbers.some(isNaN) || userNumbers.some(num => num < 1 || num > 9)) {
      return api.sendMessage("🚫 Pastikan semua angka antara 1 dan 9. 🚫", threadID);
    }

    const randomNumbers = [];
    while (randomNumbers.length < 4) {
      const randomNum = Math.floor(Math.random() * 9) + 1;
      if (!randomNumbers.includes(randomNum)) {
        randomNumbers.push(randomNum);
      }
    }

    const matchingNumbers = userNumbers.filter(num => randomNumbers.includes(num));
    const reward = matchingNumbers.length * 1000;
    const ticketPrice = 890;

    const currentUserData = await usersData.get(senderID);

    if (currentUserData.money < ticketPrice) {
      return api.sendMessage("💸 Uang tidak cukup untuk membeli tiket lotto. 💸", threadID);
    }

    currentUserData.money -= ticketPrice;
    currentUserData.money += reward;
    await usersData.set(senderID, { ...currentUserData, money: currentUserData.money });

    api.sendMessage("✨ Kamu mendapatkan hasil lotto... ✨", threadID, async (err, info) => {
      if (err) return console.error(err);

      await editMessageSequence(api, info.messageID, [
        async () => {
          const resultMessage = `[ ${randomNumbers.join(', ')} ]\n\nKamu mendapatkan ${reward} euro`;
          return resultMessage.trim();
        }
      ], 2000);
    });
  }
};

async function editMessageSequence(api, messageID, messages, delay = 2000) {
  for (const message of messages) {
    await new Promise(resolve => setTimeout(resolve, delay));

    const content = typeof message === 'function' ? await message() : message;
    api.editMessage(content, messageID, (err) => {
      if (err) console.error(err);
    });
  }
}
