
import { Document } from "mongoose";

/** @typedef {Object} Session
 * @property {String} key,
 * @property {String} address,
 * @property {Date} created,
 * @property {Date} expires
 */

/** @typedef {Object} ClusterAnnouncement 
 * @property {String} id
 * @property {Date} date
 * @property {String} content
*/

/** @typedef {Object} ClusterHomepage
 * @property {String} title
 * @property {String} logo
 * @property {ClusterAnnouncement[]} announcements
 * @property {String} body
 */

/** @typedef {Object} ClusterGenInformation
 * @property {String} name
 * @property {String} shortDescription
 * @property {Boolean} pvp
 * @property {Boolean} public
 * @property {String} version
 * @property {Date} lastWipe
 * @property {Date} nextWipe
 * @property {('STEAM' | 'PLAYSTATION' | 'XBOX')} platform
 * @property {('NITRADO' | 'SELF_HOSTED' | 'OTHER')} hostType
 */

/** @typedef {Object} ClusterType
 * @property {String} _id
 * @property {String} owner
 * @property {Boolean} active
 * @property {Date} created
 * @property {String} configId
 * @property {Number} memberCount
 * @property {String[]} memberIds
 * @property {ClusterGenInformation} generalInformation
 * @property {ClusterHomepage} homepage
 */

/** @typedef {Object} ClusterCreator
 * @property {String} name
 * @property {Boolean} pvp
 * @property {('STEAM' | 'PLAYSTATION' | 'XBOX')} platform
 * @property {('NITRADO' | 'SELF_HOSTED' | 'OTHER')} hostType
 * @property {String} configId
 * @property {String} [description]
 * @property {Boolean} [public]
 * @property {Date} [lastWipe]
 * @property {Date} [nextWipe]
 * @property {String} [body]
 * @property {String} [logo]
 */

/** @typedef {Object} ProfileType
 * @property {String} _id
 * @property {String} username
 * @property {String} email
 * @property {String[]} ownedClusterIds
 * @property {String[]} membershipClusterIds
 * @property {String[]} configurations
 */

/** @typedef {Object} AuthUserType
 * @property {String} _id
 * @property {String} username
 * @property {String} salt
 * @property {String} hash
 * @property {Boolean} verified
 * @property {Session[]} sessions
 * @property {Date} lastActive
 * @property {String[]} associatedAddresses
 */

/** @typedef {Object} EmailVerificationType 
 * @property {String} _id
 * @property {String} email
 * @property {String} key
 * @property {Date} expires 
*/

/** @typedef {Object} S3File
 * @property {String} awsBucket
 * @property {String} fileName
 */

/** @typedef {Object} ConfigFileType
 * @property {String} _id
 * @property {String} owner
 * @property {String} name
 * @property {String} description
 * @property {S3File} rawGameIni
 * @property {S3File} rawGameUser
 * @property {S3File} parsedGameIni
 * @property {S3File} parsedGameUser
 * @property {Object} parsed
 */
 
/** @typedef {Object} LootQuantity
 * @property {Number} min
 * @property {Number} max
 */

/** @typedef {Object} LootItem
 * @property {String} name
 * @property {String} link
 * @property {String} image
 * @property {LootQuantity} quality
 * @property {Number} blueprintPercent
 * @property {Number} chance
 */

/** @typedef {Object} LootSet
 * @property {LootQuantity} quantity
 * @property {Number} chance
 * @property {LootItem[]} items
 */

/** @typedef {Object} LootCollection
 * @property {String} name
 * @property {LootQuantity} quantity
 * @property {Number} chance
 * @property {LootSet[]} sets
 */

/** @typedef {Object} LootContainer
 * @property {String} map
 * @property {String} name
 * @property {String} image
 */

/** @typedef {Object} LootTable
 * @property {LootContainer} container
 * @property {LootQuantity} quantity
 * @property {LootCollection[]} collections
 */

/** @typedef {Object} ConfigLootType
 * @property {String} _id
 * @property {String} parent
 * @property {LootTable[]} lootTables
*/

/** @typedef {Object} ConfigGenAdministration
 * 
 */

/** @typedef {Object} ConfigGenBreeding
 * 
 */

/** @typedef {Object} ConfigGenCluster
 * 
 */

/** @typedef {Object} ConfigGenConsumption
 * 
 */

/** @typedef {Object} ConfigGenCreatures
 * 
 */

/** @typedef {Object} ConfigGenEngrams
 * 
 */

/** @typedef {Object} ConfigGenEnvironment
 * 
 */

/** @typedef {Object} ConfigGenEquipment
 * 
 */

/** @typedef {Object} ConfigGenLooting
 * 
 */

/** @typedef {Object} ConfigGenOther
 * 
 */

/** @typedef {Object} ConfigGenPlayers
 * 
 */

/** @typedef {Object} ConfigGenPvevp
 * 
 */

/** @typedef {Object} ConfigGenStructures
 * 
 */

/** @typedef {Object} ConfigGenTribes
 * 
 */

/** @typedef {Object} ConfigGeneralType
 * @property {ConfigGenAdministration} administration
 * @property {ConfigGenBreeding} breeding
 * @property {ConfigGenCluster} cluster
 * @property {ConfigGenConsumption} consumption
 * @property {ConfigGenCreatures} creatures
 * @property {ConfigGenEngrams} engrams
 * @property {ConfigGenEnvironment} environment
 * @property {ConfigGenEquipment} equipment
 * @property {ConfigGenLooting} looting
 * @property {ConfigGenOther} other
 * @property {ConfigGenPlayers} players
 * @property {ConfigGenPvevp} pvevp
 * @property {ConfigGenStructures} structures
 * @property {ConfigGenTribes} tribes
 */


/**
 * @typedef {Document & ProfileType} Profile
 * @typedef {Document & AuthUserType} AuthUser
 * @typedef {Document & EmailVerificationType} EmailVerification
 * @typedef {Document & ClusterType} Cluster
 * @typedef {Document & ConfigFileType} ConfigFile
 * @typedef {Document & ConfigLootType} ConfigLoot
 * @typedef {Document & ConfigGeneralType} ConfigGeneral
 */