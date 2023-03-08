

export default {
    owner: String,
    active: Boolean,
    created: Date,
    configId: String,
    memberCount: Number,
    memberIds: [String],
    generalInformation: {
        name: String,
        shortDescription: String,
        pvp: Boolean,
        public: Boolean,
        version: String,
        platform: {
            type: String,
            default: 'STEAM',
            enum: ['STEAM', 'XBOX', 'PLAYSTATION']
        },
        lastWipe: Date,
        nextWipe: Date,
        hostType: {
            type: String,
            default: 'NITRADO',
            enum: ['NITRADO', 'SELF_HOSTED', 'OTHER']
        },
    },
    homepage: {
        title: String,
        logo: String,
        announcements: [{
            id: String,
            date: Date,
            content: String
        }],
        body: String
    }
}