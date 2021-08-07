const {encrypt: gtBankEncrypt} = require("../gtbank-crypto")

exports.loadInputElements = (parent) => {
    const inputs = new Map()
    parent('input').each((i, el) => {
        const name = el.attribs.name
        const value = el.attribs.value
        inputs.set(name, value ? value : '')
    })
    parent('select').each(function (i, el) {
        const name = el.attribs.name
        const options = el.children.filter(c => c.type === 'tag' && c.name === 'option')
        let selectedOption = options.find(option => option.attribs.selected)
        if (!selectedOption) {
            selectedOption = options[0]
        }
        const value = selectedOption.attribs.value
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

exports.buildGetTransactionsData = (pageResults) => {
    const table = pageResults.parsedPage('#_ctl0_dgtrans')
    const tableRowData = []
    const rowDataKeys = ['transactionDate', 'reference', 'valueDate', 'debit', 'credit', 'balance', 'remarks']
    table.find('tr').each((i, el) => {
        // skip the header row
        if (i === 0) return
        const rowData = {}

        const columns = el.children.filter(t => t.type === 'tag' && t.name === 'td').map((t, i) => {
            const font = t.children.find(t => t.type === 'tag' && t.name === 'font');
            if (!font) {
                console.log('Non font tag found in cell: ', t)
                const field = t.children[0]
                rowData[rowDataKeys[i]] = field ? field.data : null
            } else {
                const field = font.children[0]
                rowData[rowDataKeys[i]] = field ? field.data : null
            }
        })
        tableRowData.push(rowData)
    })
    return tableRowData;
}

exports.selectStatementPeriod = async (pageResults, client) => {
    const periodSelectionInputs = new Map([
        ["__EVENTTARGET", "_ctl0$dpPeriod"],
        ["__EVENTARGUMENT", ""],
        ["h_pro7", ""],
        ["h_pro7scroll", ""],
        ["__LASTFOCUS", ""],
        ["__VIEWSTATE", pageResults.inputs.get('__VIEWSTATE')],
        ["__VIEWSTATEGENERATOR", pageResults.inputs.get('__VIEWSTATEGENERATOR')],
        ["__SCROLLPOSITIONX", "0"],
        ["__SCROLLPOSITIONY", "0"],
        ["__EVENTVALIDATION", pageResults.inputs.get('__EVENTVALIDATION')],
        ["Navbar1:searchText", ""],
        ["_ctl0:dpAccounts", pageResults.inputs.get('_ctl0:dpAccounts')],
        ["_ctl0:dpPeriod", "Specify Period"],
        ["_ctl0:dpFormat", "Excel"],
    ])

    return await client.postStatementPageWithInputs(periodSelectionInputs)
}

exports.generateStatement = async (pageResults, sixMonthsAgoLocalDate, sixMonthsAgoISODate, todayLocalDate, todayISODate, client) => {
    const queryInputs = new Map([
        ["__EVENTTARGET", ""],
        ["__EVENTARGUMENT", ""],
        ["h_osm", ""],
        ["h_osmscroll", ""],
        ["__LASTFOCUS", ""],
        ["__eo_obj_states", "ASECIyJfY3RsMF9kdEZyb206MjAyMS0wNy0wMXwyMDIxLTA3LTA4ISBfY3RsMF9kdFRvOjIwMTEt\r\nMDgtMDF8MjAyMS0wOC0wNw=="],
        ["__eo_sc", ""],
        ["__VIEWSTATE", pageResults.inputs.get('__VIEWSTATE')],
        ["__VIEWSTATEGENERATOR", pageResults.inputs.get('__VIEWSTATEGENERATOR')],
        ["__SCROLLPOSITIONX", "0"],
        ["__SCROLLPOSITIONY", "0"],
        ["__EVENTVALIDATION", pageResults.inputs.get('__EVENTVALIDATION')],
        ["Navbar1:searchText", ""],
        ["_ctl0:dpAccounts", pageResults.inputs.get('_ctl0:dpAccounts')],
        ["_ctl0:dpPeriod", "Specify Period"],
        ["eo_version", "12.0.10.2"],
        ["eo_style_keys", "\/wFk"],
        ["_eo__ctl0_dtFrom_picker", sixMonthsAgoLocalDate],
        ["_eo__ctl0_dtFrom_h", sixMonthsAgoISODate],
        ["_eo__ctl0_dtTo_picker", todayLocalDate],
        ["_eo__ctl0_dtTo_h", todayISODate],
        ["_ctl0:btnGo", "Generate"],
        ["_ctl0:dpFormat", "Excel"]
    ])

    return await client.postStatementPageWithInputs(queryInputs)
}
