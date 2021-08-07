const { encrypt: gtBankEncrypt } = require("../gtbank-crypto")

exports.loadInputElements = (loadedCheerio) => {
    const inputs = new Map()
    loadedCheerio.each((i, el) => {
        const name = el.attribs.name
        const value = el.attribs.value
        inputs.set(name, value ? value : '')
    })
    return inputs
}

exports.buildLoginData = (loginPageResult, username, password) => {
    const encryptCallArguments = loginPageResult.page.data.match(/Encrypt\(document\.getElementById\("Keypad1_txtPasswordResult"\)\.value,\s*'(\w+)'\s*,\s*'(\w+)'\s*\)/)
    const encryptedPassword = gtBankEncrypt(password, encryptCallArguments[1], encryptCallArguments[2])

    const loginData = loginPageResult.inputs;
    loginData.set('txtUserName', username)
    loginData.set('Keypad1:txtPasswordResult', encryptedPassword)
    loginData.set('hdDevicePrint', 'version=3.4.0.0_1&pm_fpua=mozilla/5.0 (windows nt 10.0; win64; x64) applewebkit/537.36 (khtml, like gecko) chrome/92.0.4515.131 safari/537.36|5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/92.0.4515.131 Safari/537.36|Win32&pm_fpsc=24|1920|1080|1080&pm_fpsw=&pm_fptz=1&pm_fpln=lang=en-US|syslang=|userlang=&pm_fpjv=0&pm_fpco=1&pm_fpasw=internal-pdf-viewer|mhjfbmdgcfjbbpaeojofohoefgiehjai|internal-nacl-plugin&pm_fpan=Netscape&pm_fpacn=Mozilla&pm_fpol=true&pm_fposp=&pm_fpup=&pm_fpsaw=1920&pm_fpspd=24&pm_fpsbd=&pm_fpsdx=&pm_fpsdy=&pm_fpslx=&pm_fpsly=&pm_fpsfse=&pm_fpsui=&pm_os=Windows&pm_brmjv=92&pm_br=Chrome&pm_inpt=&pm_expt=')
    loginData.set('_EVENTTARGET', '')
    loginData.set('_EVENTARGUMENT', '')
    loginData.set('_SCROLLPOSITIONX', 0)
    loginData.set('_SCROLLPOSITIONY', 0)

    for (const [key] of loginData.entries()) {
        if (!key) {
            loginData.delete(key)
            continue
        }
        if (key.indexOf('Keypad1:k') === 0) {
            loginData.delete(key)
        }
    }
    return loginData;
}
