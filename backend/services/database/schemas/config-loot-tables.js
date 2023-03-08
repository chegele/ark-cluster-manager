
export default {
    parent: String,
    lootTables: [{
        container: {
            map: String,
            name: String,
            image: String
        },
        quantity: {
            min: Number,
            max: Number
        },
        collections: [{
            name: String,
            quantity: {
                min: Number,
                max: Number
            },
            chance: Number,
            sets: [{
                quantity: {
                  min: Number,
                  max: Number
                },
                chance: Number,
                items: [{
                    name: String,
                    link: String,
                    image: String,
                    quality: {
                      min: Number,
                      max: Number
                    },
                    blueprintPercent: Number,
                    chance: Number
                }]
            }]
        }]
    }]
}