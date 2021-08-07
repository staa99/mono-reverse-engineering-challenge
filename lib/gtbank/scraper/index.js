const { sessionManager } = require('../../common/sessions/session-manager')
const { buildLoginData } = require("./utilities")
const { GTClient } = require('./gtclient')
const { v4: uuid4 } = require('uuid')


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
            const submitLoginResult = await client.submitLoginForm(loginData)

            if (submitLoginResult && submitLoginResult.data && submitLoginResult.data.indexOf('loginButton11') !== -1 && submitLoginResult.data.toLowerCase().indexOf('proceed to internet banking') !== -1) {
                // store cookies in session for subsequent requests
                const sessionId = uuid4()
                sessionManager.setSessionValue(sessionId, client.savedCookies)
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
        }
        catch (error) {
            console.log(error)
            return {
                status: 'failed',
                message: 'An error occurred while logging into your account'
            }
        }
    }
}
