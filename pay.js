module.exports = {
    config: {
        name: "pay",
        version: "1.0",
        author: "Rizky",
        countDown: 5,
        role: 0,
        description: "Berikan uang kepada pengguna lain",
        category: "fitur",
        guide: "{pn} [fakeuid] [jumlah] - Berikan uang kepada pengguna lain dengan fakeuid yang ditentukan"
    },

    onStart: async function ({ message, event, args, usersData, api }) {
        if (args.length < 2) {
            return message.reply("Format perintah tidak valid. Gunakan: {pn} [fakeuid] [jumlah]");
        }

        const senderID = event.senderID;
        const targetFakeUid = parseInt(args[0], 10);
        const jumlah = parseInt(args[1], 10);

        if (isNaN(targetFakeUid) || isNaN(jumlah) || jumlah <= 0) {
            return message.reply("Masukkan fakeuid dan jumlah uang yang valid.");
        }

        const senderData = await usersData.get(senderID);
        if (senderData.data.fakeUid === targetFakeUid) {
            return message.reply("Kamu tidak bisa memberikan uang kepada diri sendiri.");
        }

        const totalBiaya = jumlah * 1.845;
        const jumlahSetelahPajak = jumlah * 0.845;
        const pajak = jumlah - jumlahSetelahPajak;

        if (!senderData || senderData.money < totalBiaya) {
            return message.reply("Uang kamu nggak cukup buat ngasih.");
        }

        const allUsers = await usersData.getAll();
        const targetUser = allUsers.find(user => user.data.fakeUid === targetFakeUid);

        if (!targetUser) {
            return message.reply(`Pengguna dengan fakeuid ${targetFakeUid} nggak ketemu.`);
        }

        const targetUserID = targetUser.userID;

        senderData.money -= totalBiaya;
        await usersData.set(senderID, { ...senderData });

        const targetUserData = await usersData.get(targetUserID);
        targetUserData.money = (targetUserData.money || 0) + jumlahSetelahPajak;
        await usersData.set(targetUserID, { ...targetUserData });

        const senderName = senderData.data.nama || 'Pengirim';
        const receiverName = targetUser.data.nama || 'Pengguna';

        // Cek apakah akun penerima bisa di-chat atau tidak
        try {
            await api.sendMessage(`${senderName} berhasil mengirimkan ${jumlahSetelahPajak.toFixed(2)}€ ke ${receiverName}. Pajak: ${pajak.toFixed(2)}€.`, targetUserID);
        } catch (error) {
            // Jika tidak bisa mengirim pesan, hanya lakukan log tanpa kirim pesan ke penerima
            console.log(`Gagal mengirim pesan ke pengguna dengan ID: ${targetUserID}.`);
        }
        
        return message.reply(`${senderName} berhasil mengirimkan ${jumlahSetelahPajak.toFixed(2)}€ ke ${receiverName}. Pajak: ${pajak.toFixed(2)}€.`);
    }
};
