const { limitCount } = require('../lib/settings');
const { User } = require('./model');

async function addUser(username, password, apikey) {
    let obj = { username, password, apikey, defaultKey: apikey, premium: [], limit: limitCount };
    await User.create(obj); // Tambahkan 'await' agar operasi asinkron selesai
}
module.exports.addUser = addUser

async function checkUsername(username) {
    let users = await User.findOne({ username: username });
    if (users !== null) {
        return users.username;
    } else {
        return false;
    }
}
module.exports.checkUsername = checkUsername;

async function getApikey(id) {
    let users = await User.findOne({ _id: id });
    return { apikey: users.apikey, username: users.username };
}
module.exports.getApikey = getApikey;

async function cekKey(apikey) {
    let user = await User.findOne({ apikey: apikey }); // Ambil seluruh objek user
    if (user === null) {
        return false;
    } else {
        return user; // Kembalikan seluruh objek user
    }
}
module.exports.cekKey = cekKey;

async function updateApiKeyStatus(apikey, status) {
    try {
        const user = await User.findOneAndUpdate({ apikey: apikey }, { status: status }, { new: true });
        if (!user) {
            return false; // API key tidak ditemukan
        }
        return true; // Berhasil diperbarui
    } catch (error) {
        console.error("Gagal memperbarui status API key:", error);
        return false;
    }
}

async function deactivateKey(apikey) {
    return updateApiKeyStatus(apikey, 'inactive');
}

async function reactivateKey(apikey) {
    return updateApiKeyStatus(apikey, 'active');
}


module.exports = {
    addUser,
    checkUsername,
    getApikey,
    cekKey,
    updateApiKeyStatus,
    deactivateKey,
    reactivateKey
};
