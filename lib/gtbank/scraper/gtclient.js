const cheerio = require('cheerio')
const {loadInputElements} = require("./utilities")
const axios = require('axios').default

class GTClient {
    constructor(cookies = null) {
        this.__cookies = cookies ? new Map(cookies) : new Map()
        this.__gtClient = axios.create({
            baseURL: 'https://ibank.gtbank.com/ibank3/',
            responseType: 'document',
            headers: {
                accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.9',
                'Content-Type': 'application/x-www-form-urlencoded',
            }
        })
        this.__urls = {
            loginUrl: '/login.aspx',
            landingUrl: '/landing.aspx',
            statementPageUrl: '/main.aspx?sm=a_a',
        }
    }

    get savedCookies() {
        return this.__cookies;
    }

    async loadLoginPageWithoutParsing() {
        return await this.get(this.__urls.loginUrl)
    }

    async getLoginPageWithInputs() {
        const page = await this.get(this.__urls.loginUrl)
        const parsedPage = cheerio.load(page.data)
        const inputs = loadInputElements(parsedPage)
        return {inputs, page, parsedPage}
    }

    async getStatementPageWithInputs() {
        const page = await this.get(this.__urls.statementPageUrl)
        const parsedPage = cheerio.load(page.data)
        const inputs = loadInputElements(parsedPage)
        return {inputs, page, parsedPage}
    }

    async postLoginForm(data) {
        return await this.post(this.__urls.loginUrl, data)
    }

    async postStatementPageWithInputs(data) {
        const page = await this.post(this.__urls.statementPageUrl, data)
        const parsedPage = cheerio.load(page.data)
        const inputs = loadInputElements(parsedPage)
        return {inputs, page, parsedPage}
    }

    async get(url, config) {
        let normalizedConfig = this.__normalizeConfig(config)
        const result = await this.__gtClient.get(url, normalizedConfig)
        this.__setCookies(result.headers['set-cookie'])
        return result
    }

    async post(url, data, config) {
        let normalizedConfig = this.__normalizeConfig(config)
        const result = await this.__gtClient(url, {
            ...normalizedConfig,
            method: 'post',
            data: this.__urlEncodeFormData(data)
        })
        this.__setCookies(result.headers['set-cookie'])
        return result
    }

    __normalizeConfig(config) {
        let normalizedConfig = config ? config : {}
        normalizedConfig.headers = normalizedConfig.headers ? normalizedConfig.headers : {}
        normalizedConfig.headers.cookie = normalizedConfig.headers.cookie ? normalizedConfig.headers.cookie : ''
        if (normalizedConfig.headers.cookie.length > 0) {
            normalizedConfig.headers.cookie += '; '
        }
        normalizedConfig.headers.cookie += this.__serializeCookieHeader()
        return normalizedConfig;
    }

    __serializeCookieHeader() {
        let result = ''
        for (const [key, value] of this.__cookies.entries()) {
            result += `${key}=${value}; `
        }
        return result.substring(0, result.length - 2);
    }

    __setCookies(setCookieHeaders) {
        if (!setCookieHeaders) {
            return
        }
        for (const cookieHeader of setCookieHeaders) {
            const key = cookieHeader.substring(0, cookieHeader.indexOf('='))
            const value = cookieHeader.substring(cookieHeader.indexOf('=') + 1)
            this.__cookies.set(key, value)
        }
    }

    __urlEncodeFormData(data) {
        let result = ''
        for (const [key, value] of data.entries()) {
            result += `${key}=${encodeURIComponent(value)}&`
        }
        return result.substring(0, result.length - 1)
    }
}

exports.GTClient = GTClient
