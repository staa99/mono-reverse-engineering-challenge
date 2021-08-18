exports.generateRandomHexString = (length) => [...Array(length)].map(() => Math.floor(Math.random() * 16).toString(16)).join('').toUpperCase();

exports.parseJSONString = (jsonString) => {
    if (typeof jsonString !== "string" && !(jsonString instanceof String)) {
        return jsonString
    }

    try {
        return JSON.parse(jsonString)
    } catch (e) {
        console.log('Invalid JSON not parsed')
        return null
    }
}

function matchDateInTransactionHistoryString(dateString) {
    const match = dateString.match(/(\d+)\/(\d+)\/(\d+)/)
    if (!match) {
        return dateString
    }

    const result = new Date()
    result.setTime(0)
    result.setFullYear(parseInt(match[3]), parseInt(match[1]) - 1, parseInt(match[2]))
    return result.toISOString().split('T')[0]
}

exports.buildGetTransactionHistoryData = (parsedData) => {
    const result = []
    for (const item of parsedData.Message.TRANSACTIONS.TRANSACTION) {
        const referenceMatch = item.REMARKS.match(/\d{15,}/g)
        const reference = referenceMatch ? referenceMatch[0] : null

        const rowData = {
            transactionDate: matchDateInTransactionHistoryString(item.TRADATE),
            reference: reference,
            valueDate: matchDateInTransactionHistoryString(item.VALDATE),
            debit: item.TRASTATUS === "DEB" ? item.TRAAMT : null,
            credit: item.TRASTATUS === "CRE" ? item.TRAAMT : null,
            balance: item.CURRENTBAL,
            remarks: item.REMARKS,
        }
        result.push(rowData)
    }
    return result
}
