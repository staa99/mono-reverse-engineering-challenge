const {buildLoginData, buildGetTransactionsData, generateStatement, selectStatementPeriod} = require("./utilities");
const {sessionManager} = require('../../common/sessions/session-manager')
const {GTClient} = require('./gtclient')
const {v4: uuid4} = require('uuid')

const gtSessionKeys = {
    sessionId: 'session-id'
}

exports.scraper = {
    // load login screen
    login: async (username, password) => {
        try {
            const client = new GTClient()

            // load without parsing first to populate cookies
            await client.loadLoginPageWithoutParsing();

            // login with credentials
            const loginPageResult = await client.getLoginPageWithInputs();
            const loginData = buildLoginData(loginPageResult, username, password)
            const submitLoginResult = await client.postLoginForm(loginData)

            if (submitLoginResult && submitLoginResult.data && submitLoginResult.data.indexOf('loginButton11') !== -1 && submitLoginResult.data.toLowerCase().indexOf('proceed to internet banking') !== -1) {
                // store cookies in session for subsequent requests
                const sessionId = uuid4()
                sessionManager.setSessionValue(sessionId, gtSessionKeys.sessionId, client.savedCookies)
                return {
                    status: 'success',
                    message: 'login completed successfully',
                    sessionId
                }
            }

            return {
                status: 'failed',
                message: 'login failed'
            }
        } catch (error) {
            console.log(error)
            return {
                status: 'failed',
                message: 'An error occurred while logging into your account'
            }
        }
    },
    getTransactions: async (sessionId) => {
        try {
            const sessionCookies = sessionManager.getSessionValue(sessionId, gtSessionKeys.sessionId)

            if (!sessionCookies) {
                return {
                    status: 'failed',
                    message: 'The session has expired'
                }
            }

            const client = new GTClient(sessionCookies)

            const today = new Date()
            const sixMonthsAgo = new Date()
            sixMonthsAgo.setMonth(today.getMonth() - 6)

            const todayISODate = today.toISOString().split('T')[0]
            const todayLocalDate = todayISODate.split('-').reverse().join('/')
            const sixMonthsAgoISODate = sixMonthsAgo.toISOString().split('T')[0]
            const sixMonthsAgoLocalDate = sixMonthsAgoISODate.split('-').reverse().join('/')

            let pageResults = await client.getStatementPageWithInputs()
            pageResults = await selectStatementPeriod(pageResults, client)
            pageResults = await generateStatement(pageResults, sixMonthsAgoLocalDate, sixMonthsAgoISODate, todayLocalDate, todayISODate, client)
            const tableRowData = buildGetTransactionsData(pageResults);
            return {
                status: "success",
                message: "Successfully retrieved transactions",
                data: tableRowData
            }
        } catch (error) {
            console.log(error)
            return {
                status: 'failed',
                message: 'An error occurred while querying the transactions'
            }
        }
    }
}
