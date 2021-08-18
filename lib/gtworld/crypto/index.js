global.navigator = {appName: 'nodejs'} // fake the navigator object
global.window = {} // fake the window object
const JSEncrypt = require("jsencrypt/bin/jsencrypt.min");

// USEFUL_CNSTS.ENC_KEY
const encKey = 'MIIBIjANBgkqhkiG9w0BAQEFAAOCAQ8AMIIBCgKCAQEAquiugN6mW6EsNIxDAVtFovN1yGHEaQNybzkgmBp+hbgfS5knFsMcPMRNE1NqM6fOLwnJue43PouBAIkdvVNfg6sKMeJpg2Lc8LyXjtSr0xnOR0JFxwHrPQGxw33G0oKdi7wFlhZYQvCdNNe59dS2uKuYx0PKgVJlcrdZdwYqdOdUTFcbt1U2WFLfjLdS5wph0CiNxMyfSbSoQzmTKsMeg4QKRO/ZZCVLjoOdhJdpAgrUL3nnLu5w90BDJDtR0AJoAbX0gi0daIh/XqU3+XRbLTPaWmpkHjGFpiN5PtOxwLr2uFrqw9sGH3aLUfGCNGGsdZKipacF5GcncRrv5rUFcQIDAQAB'

const rsaEncrypt = new JSEncrypt()

exports.encrypt = function (obj) {
    try {
        rsaEncrypt.setPublicKey(encKey)
        return rsaEncrypt.encrypt(JSON.stringify(obj))
    }
    catch (e) {
        console.log(e);
    }
}
