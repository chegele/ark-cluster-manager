
export default {
    username: String,
    salt: String,
    hash: String,
    verified: Boolean,
    sessions: [{
        key: String,
        address: String,
        created: Date,
        expires: Date
    }],
    lastActive: Date,
    associatedAddresses: [String]
}