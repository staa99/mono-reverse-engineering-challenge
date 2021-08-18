const {sessionManager} = require("../../common/sessions/session-manager");
const {responseCodes} = require("../../common/response-codes");
const {encrypt: gtBankLoginEncrypt} = require("../crypto")
const {encrypt: gtBankTransferEncrypt} = require("../crypto/transfer")

const gtSessionKeys = exports.gtSessionKeys = {
    savedCookies: 'saved-cookies',
    currentPage: 'current-page',
    sessionState: 'session-state',
    transactionData: 'transaction-data'
}

const gtSessionStates = exports.gtSessionStates = {
    normal: 'normal',
    awaitingOTPAndSecret: 'awaiting-otp-and-secret',
    awaitingOTP: 'awaiting-otp',
}

exports.loadInputElements = (parent) => {
    const inputs = new Map()
    parent('input').each((i, el) => {
        const name = el.attribs.name
        const value = el.attribs.value
        inputs.set(name, value ? value : '')
    })
    parent('textarea').each((i, el) => {
        const name = el.attribs.name
        const value = parent(el).html()
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
    const encryptedPassword = gtBankLoginEncrypt(password, encryptCallArguments[1], encryptCallArguments[2])

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
    return loginData
}

exports.buildGetTransactionsData = (pageResults) => {
    const table = pageResults.parsedPage('#_ctl0_dgtrans')
    const tableRowData = []
    const rowDataKeys = ['transactionDate', 'reference', 'valueDate', 'debit', 'credit', 'balance', 'remarks']
    table.find('tr').each((i, el) => {
        // skip the header row
        if (i === 0) return

        const rowData = {}
        el.children.filter(t => t.type === 'tag' && t.name === 'td').map((t, i) => {
            const font = t.children.find(t => t.type === 'tag' && t.name === 'font');
            if (!font) {
                const field = t.children[0]
                rowData[rowDataKeys[i]] = field ? field.data : null
            } else {
                const field = font.children[0]
                rowData[rowDataKeys[i]] = field ? field.data : null
            }
        })
        tableRowData.push(rowData)
    })
    return tableRowData
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

    return await client.postStatementPage(periodSelectionInputs)
}

exports.generateStatement = async (pageResults, sixMonthsAgoLocalDate, sixMonthsAgoISODate, todayLocalDate, todayISODate, client) => {
    const queryInputs = new Map([
        ["__EVENTTARGET", ""],
        ["__EVENTARGUMENT", ""],
        ["h_osm", ""],
        ["h_osmscroll", ""],
        ["__LASTFOCUS", ""],
        ["__eo_obj_states", Buffer.from(`\u0001!\u0002#\"_ctl0_dtFrom:2011-08-01|${sixMonthsAgoISODate}! _ctl0_dtTo:2011-08-01|${todayISODate}`, 'binary').toString('base64')],
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

    return await client.postStatementPage(queryInputs)
}

const submitNotificationForm = exports.submitNotificationForm = async (pageResults, client) => {
    const formData = new Map([
        ["__EVENTTARGET", "lkContinue"],
        ["__EVENTARGUMENT", ""],
        ["__VIEWSTATE", pageResults.inputs.get('__VIEWSTATE')],
        ["__VIEWSTATEGENERATOR", pageResults.inputs.get('__VIEWSTATEGENERATOR')],
        ["__EVENTVALIDATION", pageResults.inputs.get('__EVENTVALIDATION')],
    ])
    pageResults = await client.postNotificationsPage(formData)
    return pageResults;
}

exports.loadBeneficiaryCreationPage = async (pageResults, client) => {
    const formData = new Map([
        ["__EVENTTARGET", "_ctl0$lnkRegisterBene"],
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
        ["_ctl0:dpFrom", pageResults.inputs.get('_ctl0:dpFrom')],
        ["_ctl0:dpBeneList", "-1"],
        ["_ctl0:hdNuban", ""],
        ["_ctl0:hdAmount", ""],
        ["_ctl0:hdSet", "0"]
    ])
    return await client.postGTMainForm(formData)
}

exports.submitOTPAndSecretAnswer = async (pageResults, accountNumber, client, otp, secretAnswer) => {
    const formData = new Map([
        ["__EVENTTARGET", ""],
        ["__EVENTARGUMENT", ""],
        ["h_osm", ""],
        ["h_osmscroll", ""],
        ["__LASTFOCUS", ""],
        ["__VIEWSTATE", pageResults.inputs.get('__VIEWSTATE')],
        ["__VIEWSTATEGENERATOR", pageResults.inputs.get('__VIEWSTATEGENERATOR')],
        ["__SCROLLPOSITIONX", "0"],
        ["__SCROLLPOSITIONY", "0"],
        ["__EVENTVALIDATION", pageResults.inputs.get('__EVENTVALIDATION')],
        ["Navbar1:searchText", ""],
        ["_ctl0:dpAcctSystem", "1"],
        ["_ctl0:txtNUBANNo", accountNumber],
        ["_ctl0:txtNickName", ""],
        ["_ctl0:txtAnswer", secretAnswer],
        ["_ctl0:txtToken", otp],
        ["_ctl0:btnContinue", "Continue"],
        ["_ctl0:revisitid", ""]
    ])
    return await client.postGTMainForm(formData)
}

exports.selectNUBANAccountSystem = async (pageResults, client) => {
    const formData = new Map([
        ["__EVENTTARGET", "_ctl0$dpAcctSystem"],
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
        ["_ctl0:dpAcctSystem", "1"],
        ["_ctl0:revisitid", ""],
    ])
    return await client.postGTMainForm(formData)
}

exports.getBeneficiaryName = async (pageResults, accountNumber, client) => {
    const formData = new Map([
        ["__EVENTTARGET", ""],
        ["__EVENTARGUMENT", ""],
        ["h_osm", ""],
        ["h_osmscroll", ""],
        ["__LASTFOCUS", ""],
        ["__VIEWSTATE", pageResults.inputs.get('__VIEWSTATE')],
        ["__VIEWSTATEGENERATOR", pageResults.inputs.get('__VIEWSTATEGENERATOR')],
        ["__SCROLLPOSITIONX", "0"],
        ["__SCROLLPOSITIONY", "0"],
        ["__EVENTVALIDATION", pageResults.inputs.get('__EVENTVALIDATION')],
        ["Navbar1:searchText", ""],
        ["_ctl0:dpAcctSystem", "1"],
        ["_ctl0:txtNUBANNo", accountNumber],
        ["_ctl0:btnGetGTBNameNUBAN", "Get Beneficiary Name"],
        ["_ctl0:revisitid", ""],
    ])
    return await client.postGTMainForm(formData)
}

exports.setBeneficiaryForTransfer = async (pageResults, client, beneficiaryIdValue) => {
    const formData = new Map([
        ["__EVENTTARGET", "_ctl0$dpBeneList"],
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
        ["_ctl0:dpFrom", pageResults.inputs.get('_ctl0:dpFrom')],
        ["_ctl0:dpBeneList", beneficiaryIdValue],
        ["_ctl0:hdNuban", ""],
        ["_ctl0:hdAmount", ""],
        ["_ctl0:hdSet", "0"],
    ])
    return await client.postGTMainForm(formData)
}

exports.initiateTransfer = async (pageResults, client, amount) => {
    const formData = new Map([
        ["__EVENTTARGET", ""],
        ["__EVENTARGUMENT", ""],
        ["h_osm", ""],
        ["h_osmscroll", ""],
        ["__LASTFOCUS", ""],
        ["__VIEWSTATE", pageResults.inputs.get('__VIEWSTATE')],
        ["__VIEWSTATEGENERATOR", pageResults.inputs.get('__VIEWSTATEGENERATOR')],
        ["__SCROLLPOSITIONX", "0"],
        ["__SCROLLPOSITIONY", "0"],
        ["__EVENTVALIDATION", pageResults.inputs.get('__EVENTVALIDATION')],
        ["Navbar1:searchText", ""],
        ["_ctl0:dpFrom", pageResults.inputs.get('_ctl0:dpFrom')],
        ["_ctl0:dpBeneList", pageResults.inputs.get('_ctl0:dpBeneList')],
        ["_ctl0:txtNUBANNo", pageResults.inputs.get('_ctl0:txtNUBANNo')],
        ["_ctl0:hdNubanAcct", gtBankTransferEncrypt(pageResults.inputs.get('_ctl0:txtNUBANNo')).toString()],
        ["_ctl0:txtAmount", ""],
        ["_ctl0:hdTraAmt", gtBankTransferEncrypt(amount.toString()).toString()],
        ["_ctl0:txtRemark", ""],
        ["_ctl0:chkStoreBeneDetails", "on"],
        ["_ctl0:btnContinue", "Continue"],
        ["_ctl0:revisitid", ""],
        ["_ctl0:hdNuban", ""],
        ["_ctl0:hdAmount", ""],
        ["_ctl0:hdSet", "0"],
    ])

    return await client.postGTMainForm(formData)
}

exports.submitOTP = async (pageResults, client, otp) => {
    const formData = new Map([
        ["__EVENTTARGET", "_ctl0$btnPayment"],
        ["__EVENTARGUMENT", ""],
        ["h_pro7", ""],
        ["h_pro7scroll", ""],
        ["__VIEWSTATE", pageResults.inputs.get('__VIEWSTATE')],
        ["__VIEWSTATEGENERATOR", pageResults.inputs.get('__VIEWSTATEGENERATOR')],
        ["__SCROLLPOSITIONX", "0"],
        ["__SCROLLPOSITIONY", "0"],
        ["__EVENTVALIDATION", pageResults.inputs.get('__EVENTVALIDATION')],
        ["Navbar1:searchText", ""],
        ["_ctl0:txtConfirm", pageResults.inputs.get('_ctl0:txtConfirm')],
        ["_ctl0:txtTransCode", otp],
        ["_ctl0:pageName", ""],
    ])

    return await client.postGTMainForm(formData)
}

const getBeneficiaryValue = exports.getBeneficiaryValue = (beneficiaryList, accountNumber) => {
    let beneficiaryIdValue = null
    beneficiaryList.find('option').each(((i, el) => {
        const value = el.attribs.value
        if (value.indexOf(accountNumber) === 0) {
            beneficiaryIdValue = value
            return false
        }
    }))
    return beneficiaryIdValue
}

exports.getBeneficiaryFromTransferPage = (pageResults, accountNumber) => {
    const beneficiaryList = pageResults.parsedPage('#_ctl0_dpBeneList')
    if (!beneficiaryList) {
        console.log(`Unknown state. Current page data:\n${pageResults.page.data}`)
        throw new Error('Unknown state. Current page data:\n${pageResults.page.data}')
    }
    return getBeneficiaryValue(beneficiaryList, accountNumber);
}

exports.loadTransferPage = async (client) => {
    let pageResults = await client.getTransferPageWithInputs()

    // we may get a notification prompt, handle it
    const notificationBox = pageResults.parsedPage('#notification')
    if (notificationBox && notificationBox.find('#lkContinue')) {
        // submit form to continue
        pageResults = await submitNotificationForm(pageResults, client);
    }
    return pageResults;
}

exports.getOTPCreationMessage = (pageResults) => {
    let message = null
    pageResults.parsedPage('script').each((i, el) => {
        const htmlContent = pageResults.parsedPage(el).html().trim()
        if (htmlContent.indexOf('alert') !== 0) {
            return
        }
        const match = htmlContent.match(/alert\(['"]([^'"]+)['"]\)/)
        if (match && match[1]) {
            message = match[1]
            return false
        }
    })
    return message;
}

exports.processTransferInitiationResult = (pageResults, sessionId) => {
    const otpInput = pageResults.inputs.get('_ctl0:txtTransCode')
    if (otpInput === null || otpInput === undefined) {
        return {
            status: responseCodes.gtbankCompleteTransferOtpInputNotFound.status,
            code: responseCodes.gtbankCompleteTransferOtpInputNotFound.code,
            message: 'Unable to complete transfer now. Please try again later.'
        }
    } else {
        sessionManager.setSessionValue(sessionId, gtSessionKeys.currentPage, pageResults)
        sessionManager.setSessionValue(sessionId, gtSessionKeys.sessionState, gtSessionStates.awaitingOTP)
        return {
            status: responseCodes.processingAwaitingOTP.status,
            code: responseCodes.processingAwaitingOTP.code,
            message: responseCodes.processingAwaitingOTP.defaultMessage,
            data: {
                confirmationText: pageResults.inputs.get('_ctl0:txtConfirm')
            }
        }
    }
}
