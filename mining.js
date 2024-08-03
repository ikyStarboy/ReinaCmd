const fs = require('fs');
const path = require('path');

module.exports = {
  config: {
    name: "mining",
    aliases: ['mine'],
    version: "1.0",
    author: "Rizky",
    role: 0,
    shortDescription: {
      en: "Menambang untuk mendapatkan item imut"
    },
    longDescription: {
      en: "Menambang untuk mendapatkan emas, berlian, emerald, atau item imut lainnya."
    },
    category: "games",
    guide: {
      en: "{pn} mining: Menambang untuk mendapatkan item imut."
    }
  },

  onStart: async function ({ args, event, api, usersData }) {
    const { senderID, threadID } = event;
    const user = await usersData.get(senderID);
    const userMoney = user.money || 0;

    if (userMoney < 800) {
      return api.sendMessage("Uang kamu tidak cukup untuk menambang. Harga sekali mining adalah 800.", threadID);
    }

    const items = [
      { name: '✨ Emas ✨', value: 1200, chance: 25 },
      { name: '💎 Berlian 💎', value: 3000, chance: 15 },
      { name: '💚 Emerald 💚', value: 6009, chance: 10 },
      { name: '🔥 Charcoal 🔥', value: 100, chance: 20 },
      { name: '🪨 Batu 🪨', value: 0, chance: 20 },
      { name: '🪨 Granite 🪨', value: 0, chance: 5 },
      { name: '🪨 Diorit 🪨', value: 0, chance: 5 }
    ];

    const randomItem = getRandomItem(items);

    api.sendMessage("Kamu pergi ke goa🏃...", threadID, async (err, info) => {
      if (err) return console.error(err);

      await editMessageSequence(api, info.messageID, [
        "[ 🔥 |💚 |💎 ]\n\n Dapat apa ya",
        "[ ✨ |🔥 |💚 ]\n\n Coba tebak",
        "[ 💎 | ✨ |🔥 ]\n\n Cie Udah kepo",
        "[ 💚 | 💎 | ✨ ]\n\n Ini hasilnya",
        async () => {
          const totalValue = randomItem.value;
          const newMoney = userMoney + totalValue - 800;
          await usersData.set(senderID, { money: newMoney });

          return `[ ${randomItem.name} ] \n\n Senilai ${totalValue} 💰.`;
        }
      ]);
    });
  }
};

async function editMessageSequence(api, messageID, messages) {
  for (const message of messages) {
    await new Promise(resolve => setTimeout(resolve, 1000));

    const content = typeof message === 'function' ? await message() : message;
    api.editMessage(content, messageID, (err) => {
      if (err) console.error(err);
    });
  }
}

function getRandomItem(items) {
  const totalChance = items.reduce((sum, item) => sum + item.chance, 0);
  const randomChance = Math.random() * totalChance;
  let accumulatedChance = 0;

  for (const item of items) {
    accumulatedChance += item.chance;
    if (randomChance <= accumulatedChance) {
      return item;
    }
  }
  return items[items.length - 1];
}
