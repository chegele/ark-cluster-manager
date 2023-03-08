

export default {
    owner: String,
    name: String,
    uploaded: Date,
    description: String,
    rawGameIni: {
        awsBucket: String,
        fileName: String
    },
    rawGameUser: {
        awsBucket: String,
        fileName: String
    },
    parsedGameIni: {
        awsBucket: String,
        fileName: String
    },
    parsedGameUser: {
        awsBucket: String,
        fileName: String
    },
    parsed: {
        general: String,
        lootTables: String
    }
}