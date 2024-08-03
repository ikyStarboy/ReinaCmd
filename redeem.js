const fs = require('fs');

module.exports = {
  config: {
    name: "redeem",
    aliases: ['Redeem'],
    version: "1.0",
    author: "Rizky",
    role: 0,
    shortDescription: {
      id: "redeem"
    },
    longDescription: {
      id: "redeem"
    },
    category: "admin",
    guide: {
      id: "{pn} add (kode) (hadiah) - Tambah kode redeem baru\n{pn} (kode) - Klaim hadiah dengan kode redeem\n{pn} edit (kode) (hadiah baru) - Ubah hadiah dari kode redeem"
    }
  },

  onStart: async function ({ args, event, api, usersData }) {
    const { senderID, threadID } = event;
    const action = args[0];

    if (!action) {
      return api.sendMessage("Perintah tidak valid. Gunakan: add, (kode), atau edit.", threadID);
    }

    let redeemData = {};
    if (fs.existsSync('redeem.json')) {
      redeemData = JSON.parse(fs.readFileSync('redeem.json', 'utf8'));
    }

    if (action === 'add') {
      const kode = args[1];
      const hadiah = parseInt(args[2]);

      if (!kode || isNaN(hadiah)) {
        return api.sendMessage("Argumen perintah tidak valid. Penggunaan: add [kode] [hadiah]", threadID);
      }

      const waktuTambah = Date.now();
      redeemData[kode] = { hadiah: hadiah, diklaim: [], waktuTambah: waktuTambah };
      fs.writeFileSync('redeem.json', JSON.stringify(redeemData, null, 2));

      setTimeout(() => {
        let updatedRedeemData = JSON.parse(fs.readFileSync('redeem.json', 'utf8'));
        if (updatedRedeemData[kode] && updatedRedeemData[kode].waktuTambah === waktuTambah) {
          delete updatedRedeemData[kode];
          fs.writeFileSync('redeem.json', JSON.stringify(updatedRedeemData, null, 2));
        }
      }, 12 * 60 * 60 * 1000);

      return api.sendMessage(`Kode redeem ${kode} dengan hadiah ${hadiah} berhasil ditambahkan.`, threadID);
    }

    if (action === 'edit') {
      const kode = args[1];
      const hadiahBaru = parseInt(args[2]);

      if (!kode || isNaN(hadiahBaru)) {
        return api.sendMessage("Argumen perintah tidak valid. Penggunaan: edit [kode] [hadiah baru]", threadID);
      }

      if (!redeemData[kode]) {
        return api.sendMessage(`Kode redeem ${kode} tidak ditemukan.`, threadID);
      }

      redeemData[kode].hadiah = hadiahBaru;
      fs.writeFileSync('redeem.json', JSON.stringify(redeemData, null, 2));

      return api.sendMessage(`Hadiah dari kode redeem ${kode} berhasil diubah menjadi ${hadiahBaru}.`, threadID);
    }

    // Default action: claim redeem
    const kode = action;

    if (!redeemData[kode]) {
      return api.sendMessage(`Kode redeem ${kode} tidak ditemukan.`, threadID);
    }

    if (redeemData[kode].diklaim.includes(senderID)) {
      return api.sendMessage("Anda sudah pernah mengklaim kode redeem ini.", threadID);
    }

    redeemData[kode].diklaim.push(senderID);
    fs.writeFileSync('redeem.json', JSON.stringify(redeemData, null, 2));

    const userData = await usersData.get(senderID);
    const newAmount = userData.money + redeemData[kode].hadiah;

    await usersData.set(senderID, { money: newAmount });

    return api.sendMessage(`Anda berhasil mengklaim ${redeemData[kode].hadiah} koin. Saldo Anda sekarang adalah ${newAmount}.`, threadID);
  }
};
