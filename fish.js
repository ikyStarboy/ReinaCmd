const fishRewards = [
  { name: 'ikan mas', price: 3000, rate: 0.4 },
  { name: 'ikan salmon', price: 8000, rate: 0.2 },
  { name: 'ikan bawal', price: 100, rate: 0.3 },
  { name: 'ikan mujair', price: 700, rate: 0.1 },
];

const junkRewards = [
  { name: 'sempak bolong' },
  { name: 'bh hanyut' },
  { name: 'baju bolong' },
  { name: 'baju bolong' },
];

const goldReward = { name: 'emas', price: 99999999999, rate: 0.000000000001 };

module.exports = {
  config: {
    name: "fish",
    aliases: ['mancing'],
    version: "1.0",
    author: "Rizky",
    role: 0,
    shortDescription: {
      id: "memancing ikan"
    },
    longDescription: {
      id: "memancing ikan dan beli umpan."
    },
    category: "games",
    guide: {
      id: "{pn} untuk memancing ikan | {pn} beli untuk membeli umpan | {pn} lihat untuk melihat jumlah umpan"
    }
  },

  onStart: async function ({ args, event, api, usersData }) {
    const query = args[0];
    const { senderID, threadID } = event;

    if (senderID === api.getCurrentUserID()) return;

    const currentUserData = await usersData.get(senderID);
    let userBait = currentUserData.data.bait || 0;

    if (!query) {
      if (userBait <= 0) {
        return api.sendMessage("Kamu tidak punya umpan untuk memancing. Beli umpan dengan perintah 'fish beli'. 🐟", threadID);
      }

      userBait -= 1;
      await usersData.set(senderID, { ...currentUserData, data: { ...currentUserData.data, bait: userBait } });

      const rand = Math.random();
      let prize;
      if (rand < goldReward.rate) {
        prize = goldReward;
      } else {
        const rewardPool = fishRewards.concat(junkRewards);
        prize = rewardPool.find((reward) => {
          if (!reward.rate) return false;
          const randForPrize = Math.random();
          return randForPrize < reward.rate;
        }) || junkRewards[Math.floor(Math.random() * junkRewards.length)];
      }

      currentUserData.money = (currentUserData.money || 0) + (prize.price || 0);
      await usersData.set(senderID, { ...currentUserData, money: currentUserData.money });

      return api.sendMessage(`Kamu mendapatkan ${prize.name}${prize.price ? ` senilai $${prize.price}` : ''}. 🎣`, threadID);

    } else if (query === 'beli') {
      if (currentUserData.money < 100) {
        return api.sendMessage("Uang kamu tidak cukup untuk membeli umpan. 🐟", threadID);
      }

      currentUserData.money -= 100;
      userBait += 1;

      await usersData.set(senderID, { ...currentUserData, data: { ...currentUserData.data, bait: userBait } });

      return api.sendMessage("Kamu telah membeli umpan! 🎣", threadID);

    } else if (query === 'lihat') {
      return api.sendMessage(`Jumlah umpan yang kamu miliki: ${userBait}. 🐟`, threadID);
    } else {
      return api.sendMessage("Perintah tidak dikenali. Gunakan 'fish', 'fish beli', atau 'fish lihat'. 🎣", threadID);
    }
  }
};
