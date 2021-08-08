const CryptoJS = require("crypto-js");

const key = CryptoJS.enc.Utf8.parse('8080808080808080');
const iv = CryptoJS.enc.Utf8.parse('8080808080808080');

exports.encrypt = (plaintext) => {
    return CryptoJS.AES.encrypt(CryptoJS.enc.Utf8.parse(plaintext), key,
        {
            keySize: 12 / 8,
            iv: iv,
            mode: CryptoJS.mode.CBC,
            padding: CryptoJS.pad.Pkcs7
        });
}
