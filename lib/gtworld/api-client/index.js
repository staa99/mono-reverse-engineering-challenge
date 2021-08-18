const {buildGetTransactionHistoryData} = require("./utilities");
const {responseCodes} = require("../../common/response-codes");
const {sessionManager} = require('../../common/sessions/session-manager')
const {GTWorldClient} = require('./gtworldclient')
const {v4: uuid4} = require('uuid')

const gtworldSessionKeys = exports.gtSessionKeys = {
    clientData: 'client-data'
}

exports.apiClient = {
    // load login screen
    login: async (username, password) => {
        try {
            const client = new GTWorldClient()

            const result = await client.login(username, password)
            if (result.data.StatusCode === 0) {
                // store client data in session for subsequent requests
                const sessionId = uuid4()
                sessionManager.setSessionValue(sessionId, gtworldSessionKeys.clientData, client.clientData)
                return {
                    status: responseCodes.success.status,
                    code: responseCodes.success.code,
                    message: 'Login completed successfully',
                    data: {
                        sessionId
                    }
                }
            }

            return {
                status: responseCodes.gtworldLoginFailed.status,
                code: responseCodes.gtworldLoginFailed.code,
                message: responseCodes.gtworldLoginFailed.defaultMessage
            }
        } catch (error) {
            console.log(error)
            return {
                status: responseCodes.serverError.status,
                code: responseCodes.serverError.code,
                message: 'An error occurred while logging into your account'
            }
        }
    },
    getTransactions: async (sessionId) => {
        try {
            const clientData = sessionManager.getSessionValue(sessionId, gtworldSessionKeys.clientData)

            if (!clientData) {
                return {
                    status: responseCodes.sessionExpired.status,
                    code: responseCodes.sessionExpired.code,
                    message: responseCodes.sessionExpired.defaultMessage
                }
            }

            const client = new GTWorldClient(clientData)

            const today = new Date()
            const sixMonthsAgo = new Date()
            sixMonthsAgo.setDate(today.getDate() - 7)

            let result = await client.getTransactionHistory(sixMonthsAgo, today)
            if (parseInt(result.data.StatusCode) === -1) {
                return {
                    status: responseCodes.gtworldGetTransactionsFailed,
                    code: responseCodes.gtworldGetTransactionsFailed.code,
                    message: `Failed to retrieve transactions: ${result.data.Message}`
                }
            }

            const tableRowData = buildGetTransactionHistoryData(result.data);

            return {
                status: responseCodes.success.status,
                code: responseCodes.success.code,
                message: "Successfully retrieved transactions",
                data: tableRowData
            }
        } catch (error) {
            console.log(error)
            return {
                status: responseCodes.serverError.status,
                code: responseCodes.serverError.code,
                message: 'An error occurred while querying the transactions'
            }
        }
    },
}
