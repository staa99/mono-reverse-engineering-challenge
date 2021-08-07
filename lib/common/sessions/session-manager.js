const sessionMap = new Map()
exports.sessionManager = {
    getSessionValue: (sessionId, key) => {
        if (sessionMap.has(sessionId) && sessionMap.get(sessionId).has(key)) {
            return sessionMap.get(sessionId).get(key)
        }
        return null
    },
    setSessionValue: (sessionId, key, value) => {
        if (!sessionMap.has(sessionId)) {
            sessionMap.set(sessionId, new Map())
        }
        sessionMap.get(sessionId).set(key, value);
    }
}
