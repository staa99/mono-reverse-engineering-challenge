exports.responseCodes = {
    success: {
        code: '0',
        status: 'success',
        description: 'The operation completed successfully',
        defaultMessage: 'The operation completed successfully',
        scopes: ['gtbank', 'ecobank']
    },
    processingAwaitingOTP: {
        code: '1',
        status: 'processing',
        description: 'The operation is processing. An OTP needs to be supplied to proceed.',
        defaultMessage: 'Kindly supply your OTP',
        scopes: ['gtbank', 'ecobank']
    },
    processingAwaitingOTPAndSecretAnswer: {
        code: '2',
        status: 'processing',
        description: 'The operation is processing. An OTP and a secret answer needs to be supplied to proceed.',
        defaultMessage: 'Kindly supply your OTP and secret answer',
        scopes: ['gtbank']
    },
    sessionExpired: {
        code: '101',
        status: 'failed',
        description: 'The session has already expired.',
        defaultMessage: 'Your session has expired',
        scopes: ['gtbank', 'ecobank']
    },
    sessionStateInvalid: {
        code: '102',
        status: 'failed',
        description: 'The session is in an invalid state for the current request.',
        defaultMessage: 'The operation is invalid for your current session',
        scopes: ['gtbank', 'ecobank']
    },
    transferFailed: {
        code: '103',
        status: 'failed',
        description: 'The transfer failed: (A success response was not gotten from the provider)',
        defaultMessage: 'Transfer failed',
        scopes: ['gtbank', 'ecobank']
    },
    serverError: {
        code: '500',
        status: 'failed',
        description: 'An unknown error occurred',
        defaultMessage: 'An unknown error occurred',
        scopes: ['gtbank', 'ecobank']
    },
    gtbankLoginFailed: {
        code: '201',
        status: 'failed',
        description: 'Login failed',
        defaultMessage: 'Login failed: invalid credentials',
        scopes: ['gtbank']
    },
    gtbankCompleteTransferOtpInputNotFound: {
        code: '202',
        status: 'failed',
        description: 'OTP input not found on page after initiating transfer',
        defaultMessage: 'Transfer failed, please try again later',
        scopes: ['gtbank']
    },
    gtbankBeneficiaryCreationFailed: {
        code: '203',
        status: 'failed',
        description: 'Beneficiary creation failed. (Success alert not found in create beneficiary response).',
        defaultMessage: 'Beneficiary creation failed',
        scopes: ['gtbank']
    },
    gtworldLoginFailed: {
        code: '301',
        status: 'failed',
        description: 'Login failed',
        defaultMessage: 'Login failed: invalid credentials',
        scopes: ['gtworld']
    },
    gtworldGetTransactionsFailed: {
        code: '301',
        status: 'failed',
        description: 'Failed to load transactions from GTWorld API.',
        defaultMessage: 'Failed to load transactions from GTWorld API',
        scopes: ['gtworld']
    },
}
