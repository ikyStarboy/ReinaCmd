module.exports = {
  config: {
    name: "spin",
    aliases: [],
    version: "1.0",
    role: 0,
    author: "Rizky",
    shortDescription: "Spin menang atau kalah.",
    longDescription: "Spin menang atau kalah.",
    category: "game",
    usage: "-spin (amount)",
  },
  onStart: async function({ api, event, args, usersData, message }) {
    if (args.length !== 1 || isNaN(args[0])) {
      api.sendMessage("gunakan -spin (jumlah)", event.threadID);
      return;
    }

    let amount = parseInt(args[0]);
    if (amount <= 0) {
      api.sendMessage("tidak bisa di isi 0.", event.threadID);
      return;
    }

    const userID = event.senderID;
    const userData = await usersData.get(userID);

    if (!userData) {
      return api.sendMessage("User not found.", event.threadID);
    }

    if (userData.money < amount) {
      return api.sendMessage("Uang kamu tidak cukup.", event.threadID);
    }

    let spinMessage = await message.reply("Memulai spin...");

    await new Promise(resolve => setTimeout(resolve, 3000));

    let isWin = Math.random() < 0.5;

    if (isWin) {
      amount *= 2;
      await usersData.set(userID, {
        money: userData.money + amount
      });
        setTimeout(() => {
      api.editMessage(`Anda memenangkan ${amount} dollar!`, spinMessage.messageID); 
        }, 3000);
    } else {
      await usersData.set(userID, {
        money: userData.money - amount
      });
        setTimeout(() => {
      api.editMessage(`Anda kalah dan kehilangan ${amount} dollar.`, spinMessage.messageID); 
        }, 4000);
    }
  },
};
