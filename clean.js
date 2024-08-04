module.exports = {
  config: {
    name: "clean",
    aliases: ["clear", "bersihkan"],
    author: "Rizky",
    role: 0,
    category: "utilities"
  },

  onStart: async function ({ api, event }) {
    console.clear();
    return api.sendMessage("Konsol telah dibersihkan.", event.threadID);
  }
};
