const {responseCodes} = require("../../common/response-codes");
const {
    buildLoginData,
    buildGetTransactionsData,
    generateStatement,
    getBeneficiaryFromTransferPage,
    getBeneficiaryName,
    getOTPCreationMessage,
    gtSessionKeys,
    gtSessionStates,
    initiateTransfer,
    loadBeneficiaryCreationPage,
    loadTransferPage,
    processTransferInitiationResult,
    selectNUBANAccountSystem,
    selectStatementPeriod,
    setBeneficiaryForTransfer,
    submitOTP,
    submitOTPAndSecretAnswer,
} = require("./utilities");
const {sessionManager} = require('../../common/sessions/session-manager')
const {GTClient} = require('./gtclient')
const {v4: uuid4} = require('uuid')


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
                sessionManager.setSessionValue(sessionId, gtSessionKeys.savedCookies, client.savedCookies)
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
                status: responseCodes.gtbankLoginFailed.status,
                code: responseCodes.gtbankLoginFailed.code,
                message: responseCodes.gtbankLoginFailed.defaultMessage
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
            const sessionCookies = sessionManager.getSessionValue(sessionId, gtSessionKeys.savedCookies)

            if (!sessionCookies) {
                return {
                    status: responseCodes.sessionExpired.status,
                    code: responseCodes.sessionExpired.code,
                    message: responseCodes.sessionExpired.defaultMessage
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
    initiateTransfer: async (sessionId, accountNumber, amount) => {
        try {
            const sessionCookies = sessionManager.getSessionValue(sessionId, gtSessionKeys.savedCookies)
            if (!sessionCookies) {
                return {
                    status: responseCodes.sessionExpired.status,
                    code: responseCodes.sessionExpired.code,
                    message: responseCodes.sessionExpired.defaultMessage
                }
            }

            const client = new GTClient(sessionCookies)
            let pageResults = await loadTransferPage(client);
            const beneficiaryIdValue = getBeneficiaryFromTransferPage(pageResults, accountNumber);
            if (!beneficiaryIdValue) {
                // we don't have the beneficiary, we need to create them
                pageResults = await loadBeneficiaryCreationPage(pageResults, client);
                pageResults = await selectNUBANAccountSystem(pageResults, client);
                pageResults = await getBeneficiaryName(pageResults, accountNumber, client);
                sessionManager.setSessionValue(sessionId, gtSessionKeys.currentPage, pageResults)
                sessionManager.setSessionValue(sessionId, gtSessionKeys.sessionState, gtSessionStates.awaitingOTPAndSecret)
                sessionManager.setSessionValue(sessionId, gtSessionKeys.transactionData, {accountNumber, amount})

                return {
                    status: responseCodes.processingAwaitingOTPAndSecretAnswer.status,
                    code: responseCodes.processingAwaitingOTPAndSecretAnswer.code,
                    message: responseCodes.processingAwaitingOTPAndSecretAnswer.defaultMessage
                }
            }

            // complete the transfer
            pageResults = await setBeneficiaryForTransfer(pageResults, client, beneficiaryIdValue)
            pageResults = await initiateTransfer(pageResults, client, amount)
            return processTransferInitiationResult(pageResults, sessionId)
        } catch (error) {
            console.log(error)
            return {
                status: responseCodes.serverError.status,
                code: responseCodes.serverError.code,
                message: 'An error occurred while querying the transactions'
            }
        }
    },
    completeBeneficiaryCreation: async (sessionId, otp, secretAnswer) => {
        try {
            let pageResults = sessionManager.getSessionValue(sessionId, gtSessionKeys.currentPage)
            const sessionState = sessionManager.getSessionValue(sessionId, gtSessionKeys.sessionState)
            const sessionCookies = sessionManager.getSessionValue(sessionId, gtSessionKeys.savedCookies)
            const transactionData = sessionManager.getSessionValue(sessionId, gtSessionKeys.transactionData)

            if (!sessionCookies) {
                return {
                    status: responseCodes.sessionExpired.status,
                    code: responseCodes.sessionExpired.code,
                    message: responseCodes.sessionExpired.defaultMessage
                }
            }

            if (!transactionData || sessionState !== gtSessionStates.awaitingOTPAndSecret) {
                return {
                    status: responseCodes.sessionStateInvalid.status,
                    code: responseCodes.sessionStateInvalid.code,
                    message: 'The session is not awaiting an OTP and secret answer'
                }
            }

            const {accountNumber, amount} = transactionData
            const client = new GTClient(sessionCookies)
            pageResults = await submitOTPAndSecretAnswer(pageResults, accountNumber, client, otp, secretAnswer)
            const message = getOTPCreationMessage(pageResults);

            const successful = message && message.toLowerCase().indexOf('succes') !== -1

            if (!successful) {
                return {
                    status: responseCodes.gtbankBeneficiaryCreationFailed.status,
                    code: responseCodes.gtbankBeneficiaryCreationFailed.code,
                    message: message ? message : responseCodes.gtbankBeneficiaryCreationFailed.defaultMessage
                }
            }

            // Complete the transfer (this flow is currently only used for transfers)
            pageResults = await loadTransferPage(client)
            const beneficiaryIdValue = getBeneficiaryFromTransferPage(pageResults, accountNumber)
            if (!beneficiaryIdValue) {
                return {
                    status: responseCodes.gtbankBeneficiaryCreationFailed.code,
                    code: responseCodes.gtbankBeneficiaryCreationFailed.code,
                    message: responseCodes.gtbankBeneficiaryCreationFailed.defaultMessage
                }
            }
            pageResults = await setBeneficiaryForTransfer(pageResults, client, beneficiaryIdValue)
            pageResults = await initiateTransfer(pageResults, client, amount)
            return processTransferInitiationResult(pageResults, sessionId)
        } catch (error) {
            console.log(error)
            return {
                status: responseCodes.serverError.status,
                code: responseCodes.serverError.code,
                message: 'An error occurred while creating the beneficiary'
            }
        }
    },
    completeTransfer: async (sessionId, otp) => {
        try {
            let pageResults = sessionManager.getSessionValue(sessionId, gtSessionKeys.currentPage)
            const sessionState = sessionManager.getSessionValue(sessionId, gtSessionKeys.sessionState)
            const sessionCookies = sessionManager.getSessionValue(sessionId, gtSessionKeys.savedCookies)

            if (!sessionCookies) {
                return {
                    status: responseCodes.sessionExpired.status,
                    code: responseCodes.sessionExpired.code,
                    message: responseCodes.sessionExpired.defaultMessage
                }
            }

            if (sessionState !== gtSessionStates.awaitingOTP) {
                return {
                    status: responseCodes.sessionStateInvalid.status,
                    code: responseCodes.sessionStateInvalid.code,
                    message: 'The session is not awaiting an OTP'
                }
            }

            const client = new GTClient(sessionCookies)
            pageResults = await submitOTP(pageResults, client, otp)
            const message = getOTPCreationMessage(pageResults);

            const successful = message && message.toLowerCase().indexOf('success') !== -1

            if (!successful) {
                return {
                    status: responseCodes.transferFailed.status,
                    code: responseCodes.transferFailed.code,
                    message: message ? message : responseCodes.transferFailed.defaultMessage
                }
            }

            // Complete the transfer (this flow is currently only used for transfers)
            return {
                status: responseCodes.success.status,
                code: responseCodes.success.code,
                message: 'Transfer completed successfully'
            }
        } catch (error) {
            console.log(error)
            return {
                status: responseCodes.serverError.status,
                code: responseCodes.serverError.code,
                message: 'An error occurred while processing the transfer'
            }
        }
    },
}
