const path = require('path')
const fs = require('fs')
const DATA_PATH=path.resolve(__dirname,'../config/recorder-platforms.json')
console.log("recorder-platforms.json",DATA_PATH)
const RecordPlatforms = JSON.parse(fs.readFileSync(DATA_PATH, 'utf-8'))
console.log(DATA_PATH,RecordPlatforms)

const withIs = require('class-is');//使node.js可以使用class
const RecordType = {
  Platform: 'PLATFORM',
  Flag: 'FLAG'
}

class RecorderPlatformsDB {
  constructor (dbFolder) {
    this.dbFolder = dbFolder
    this._db = this._init()

    this.read = this.read.bind(this)
    this.write = this.write.bind(this)
    this.remove = this.remove.bind(this)
    this.update = this.update.bind(this)
    this.updateAll = this.updateAll.bind(this)

    this.writeDefaultPlatforms = this.writeDefaultPlatforms.bind(this)
  }

  async writeDefaultPlatforms () {
    console.time('writeDefaultPlatforms')
    await this.doOnceIfNeed('isWriteDefaultPlatforms', () => this.write(RecordPlatforms))
    console.timeEnd('writeDefaultPlatforms')
  }

  _init () {
    let db
    try {
      const Datastore = require('nedb')
      db = new Datastore({ filename: path.join(this.dbFolder, 'Platforms.db'), autoload: true })
    } catch (err) {
      console.error('[RPDB] Init db error:', err)
      db = undefined
    }
    return db
  }

  async readFlag (flag) {
    console.log('[RPDB] readFlag:', flag)
    const flags = await this._readDB({ __RecordType: RecordType.Flag, [flag]: { $exists: true } })
    console.log(`[RPDB] readFlag ${flag} result:`, flags)
    return flags
  }

  async writeFlag (flag, value) {
    console.log('[RPDB] writeFlag:', flag, value)
    return new Promise((resolve, reject) => {
      this._db.update({ __RecordType: RecordType.Flag, [flag]: { $exists: true } }, { __RecordType: RecordType.Flag, [flag]: value }, { upsert: true }, (err, numReplaced, upsert) => {
        if (err) {
          console.error('[RPDB] write flag to db error:', err)
        } else {
          console.log('[RPDB] write flag to db result:', numReplaced, upsert)
        }
        resolve()
      })
    })
  }

  async doOnceIfNeed (flag, toDo) {
    const flags = await this.readFlag(flag)
    console.log('[RPDB] All flags:', flags)
    const isNeedDo = !(flags && flags.find(flg => flg[flag] === true))
    console.log('[RPDB] doOnceIfNeed:', flag, isNeedDo)
    if (isNeedDo) {
      if (toDo && typeof toDo === 'function') {
        try {
          await toDo()  
        } catch (err) {
          console.warn('[RPDB] doOnceIfNeed error:', err)
        } finally {
          await this.writeFlag(flag, true)
        }        
      }
    }
    return isNeedDo
  }

  _readDB (opts, filterFunc) {
    return new Promise((resolve, reject) => {
      try {
        this._db.find(opts, (err, docs) => {
          err && console.error('[RPDB] read db error:', err)
          filterFunc && docs.length && (docs = docs.filter(filterFunc)) 
          resolve(err ? [] : docs)
        }) 
      } catch (e) {
        console.error('[RPDB] read db error:', e)
        resolve([])
      }
    })
  }
  
  async read (filterFunc) {
    console.log('[RPDB] read')
    const res = await this._readDB({ __RecordType: { $exists: false } }, filterFunc)
    console.log('[RPDB] read result:', res)
    return res
  }

  write (toSavePlatform) {
    return new Promise(async (resolve, reject) => {
      try {
        if (toSavePlatform) {
          console.log('[RPDB] write to db:', toSavePlatform, typeof this._db)
          this._db.insert(toSavePlatform, (err, newDocs) => {
            if (err) {
              console.error('[RPDB] write to db error:', err)
            } else {
              console.log('[RPDB] write to db result:', newDocs, Array.isArray(newDocs) ? newDocs.length : newDocs)
            }
            resolve(err ? 0 : Array.isArray(newDocs) ? newDocs.length : 1)
          })
        } else {
          console.error('[RPDB] write error:', ' no toSavePlatform.')
          resolve(0)
        }
      } catch (err) {
        console.error('[RPDB] write to db error:', err)
        resolve(0)
      }
    })
  }

  update (toUpdate, toSet) {
    return new Promise(async (resolve, reject) => {
      try {
        if (toUpdate) {
          console.log('[RPDB] update db:', toUpdate, typeof this._db)
          this._db.update(toUpdate, { $set: toSet }, (err, numReplaced) => {
            if (err) {
              console.error('[RPDB] update db error:', err)
            } else {
              console.log('[RPDB] update db result:', numReplaced)
            }
            resolve(err ? 0 : numReplaced)
          })
        } else {
          console.error('[RPDB] update error:', ' no toUpdate.')
          resolve(0)
        }
      } catch (err) {
        console.error('[RPDB] update to db error:', err)
        resolve(0)
      }
    })
  }

  async updateAll (allPlatforms) {
    await this.remove({ name: { $exists: true }} )
    await this.write(allPlatforms)
  }

  remove (toRemove) {
    return new Promise((resolve, reject) => {
      try {
        if (toRemove) {
          this._db.remove(toRemove, { multi: true }, (err, numRemoved) => {
            if (err) {
              console.error('[RPDB] remove from db error:', err)
            } else {
              console.log('[RPDB] remove from db ok.', numRemoved)
            }
            resolve(err ? 0 : numRemoved)            
          })
        } else {
          console.error('[RPDB] remove error:', ' no toRemove.')
          resolve(0)
        }
      } catch (err) {
        console.error('[RPDB] remove record from db error:', err)
        resolve(0)
      }
    })
  }
}
 
module.exports = withIs(RecorderPlatformsDB, {
    className: 'RecorderPlatformsDB',
    symbolName: '@org/package-x/RecorderPlatformsDB',
});
//module.export=RecorderPlatformsDB
