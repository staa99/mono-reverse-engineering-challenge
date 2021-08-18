const axios = require('axios').default
const gtCrypto = require('../crypto')
const {parseJSONString} = require("./utilities");
const {generateRandomHexString} = require("./utilities");

class GTWorldClientData {
    authToken
    deviceId
    userId
    accountNumbers

    constructor(clientData = null) {
        if (clientData) {
            this.authToken = clientData.authToken
            this.deviceId = clientData.deviceId
            this.userId = clientData.userId
            this.accountNumbers = clientData.accountNumbers
        }
    }
}

class GTWorldClient {
    constructor(clientData = null) {
        this.__clientData = clientData ? new GTWorldClientData(clientData) : new GTWorldClientData()
        this.__gtClient = axios.create({
            baseURL: 'https://gtworld.gtbank.com/GTWorldApp/api/',
            headers: {
                'content-type': 'application/json',
            }
        })
        this.__urls = {
            loginUrl: '/Authentication/login-enc',
            statementUrl: '/Account/new-account-history-two',
        }
    }

    get clientData() {
        return this.__clientData
    }

    async login(username, password) {
        const isDeviceIdKnown = !!this.__clientData.deviceId
        if (!this.__clientData.deviceId) {
            this.__clientData.deviceId = generateRandomHexString(16)
        }

        const payload = {
            Uuid: this.__clientData.deviceId,
            Platform: "Z",
            Model: "Y",
            Manufacturer: "X",
            DeviceToken: "",
            UserId: username,
            UserName: null,
            OtherParams: gtCrypto.encrypt({
                UserId: username,
                Password: password,
            }),
            isGAPSLite: "0",
            Channel: "GTWORLDv1.0",
            appVersion: "1.9.11"
        }

        const loginResult = await this.post(this.__urls.loginUrl, payload)
        const parsedData = parseJSONString(loginResult.data)

        if (parsedData.Message) {
            parsedData.Message = parseJSONString(parsedData.Message)
        }

        // call the login endpoint with the device ID from the response
        if (!isDeviceIdKnown && parsedData.Message) {
            if (parsedData.Message.DEVICE_UID !== this.__clientData.deviceId) {
                this.__clientData.deviceId = parsedData.Message.DEVICE_UID
                return await this.login(username, password)
            }
        }

        this.__clientData.authToken = parsedData.AuthToken;
        if (parsedData.Message) {
            this.__clientData.userId = parsedData.Message.USERID
            if (parsedData.Message.ACCOUNTS && parsedData.Message.ACCOUNTS.ACCOUNT) {
                this.__clientData.accountNumbers = parsedData.Message.ACCOUNTS.ACCOUNT.map(account => account.NUMBER)
            }
        }

        return { response: loginResult, data: parsedData }
    }

    async getTransactionHistory(startDate, endDate) {
        const payload = {
            UserId: this.__clientData.userId,
            SourceAccount: gtCrypto.encrypt(this.__clientData.accountNumbers[0]),
            FromDate: this.__convertDate(startDate),
            ToDate: this.__convertDate(endDate),
            AmountSearch: "",
            BeneNameSearch: "",
            AuthToken: gtCrypto.encrypt(this.__clientData.authToken),
            Udid: this.__clientData.deviceId
        }

        const statementResult = await this.post(this.__urls.statementUrl, payload)
        const parsedData = parseJSONString(statementResult.data)
        if (parsedData.Message) {
            const parsedMessage = parseJSONString(parsedData.Message)
            parsedData.Message = parsedMessage ? parsedMessage : parsedData.Message
        }
        return { response: statementResult, data: parsedData }
    }

    async get(url, config) {
        return await this.__gtClient.get(url, config)
    }

    async post(url, data, config) {
        if (!config) {
            config = {}
        }

        return this.__gtClient(url, {
            ...config,
            method: 'post',
            data: data
        })
    }

    __convertDate(date) {
        return date.toISOString().split('T')[0].split('-').reverse().join('/')
    }
}

exports.GTWorldClient = GTWorldClient
