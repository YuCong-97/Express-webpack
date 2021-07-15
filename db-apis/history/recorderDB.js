const path = require('path')
const fse = require('fs-extra')
const withIs = require('class-is');//使node.js可以使用class

class HistoryDB {
  constructor (dbFolder) {
    this.dbFolder = dbFolder
    this._db = this._init()

    this.cachedHistorys = null
    this.read = this.read.bind(this)
    this.write = this.write.bind(this)
    this.remove = this.remove.bind(this)
    this.update = this.update.bind(this)
  }

  _init () {
    let db
    try {
      const Datastore = require('nedb')
      db = new Datastore({ filename: path.join(this.dbFolder, 'Library.db'), autoload: true })
    } catch (err) {
      console.error('[DB] Init db error:', err)
      db = undefined
    }
    return db
  }

  _readDB (opts, filterFunc) {
    return new Promise((resolve, reject) => {
      try {
        this._db.find(opts, (err, docs) => {
          err && console.error('[DB] read db error:', err)
          filterFunc && docs.length && (docs = docs.filter(filterFunc)) 
          resolve(err ? [] : docs)
        }) 
      } catch (e) {
        console.error('[DB] read db error:', e)
        resolve([])
      }
    })
  }

  async read (isNeedReload = false,filterFunc=null) {
    console.log('[DB] read, isNeedReload:', isNeedReload)

    let res = []
    const historyFilter = { _id: { $exists: true } }
    if (isNeedReload) {
      res = await this._readDB(historyFilter,filterFunc)
      this.cachedHistorys = res
    } else {
      if (this.cachedHistorys) {
        res = this.cachedHistorys
      } else {
        res = await this._readDB(historyFilter,filterFunc)
        this.cachedHistorys = res
      }
    }
    return res
  }

  update (toUpdate, toSet) {
    return new Promise(async (resolve, reject) => {
      try {
        if (toUpdate) {
          console.log('[DB] update db:', toUpdate, typeof this._db)
          this._db.update(toUpdate, { $set: toSet }, { returnUpdatedDocs: true }, (err, numReplaced, affectedDocuments) => {
            if (err) {
              console.error('[DB] update db error:', err)
            } else {
              console.log('[DB] update db result:', numReplaced, affectedDocuments)
              if (this.cachedHistorys) {
                const index = this.cachedHistorys.findIndex(ch => ch && ['_id', 'id'].some(i => ch[i] && ch[i] === toUpdate[i]))
                console.log('[DB] also update from cache:', index)
                index !== -1 && this.cachedHistorys.splice(index, 1, affectedDocuments)
              }
            }
            resolve(err ? 0 : numReplaced)
          })
        } else {
          console.error('[DB] update error:', ' no toUpdate.')
          resolve(0)
        }
      } catch (err) {
        console.error('[DB] update to db error:', err)
        resolve(0)
      }
    })
  }
  
  write (toSaveHistory) {
    return new Promise(async (resolve, reject) => {
      try {
        if (toSaveHistory) {
          console.log('[DB] write to db:', toSaveHistory, typeof this._db)
          this._db.insert(toSaveHistory, (err, newDocs) => {
            if (err) {
              console.error('[DB] write to db error:', err)
            } else {
              console.log('[DB] write to db result:', newDocs, 'current cache:', this.cachedHistorys)
              if (this.cachedHistorys) {
                console.log('[DB] also add to cache.')
                this.cachedHistorys.unshift(newDocs)
              }
            }
            resolve(err ? 0 : Array.isArray(newDocs) ? newDocs.length : 1)
          })
        } else {
          console.error('[DB] write error:', ' no toSaveHistory.')
          resolve(0)
        }
      } catch (err) {
        console.error('[DB] write to db error:', err)
        resolve(0)
      }
    })
  }

  remove (toRemove) {
    return new Promise((resolve, reject) => {
      try {
        if (toRemove) {
          this._db.remove(toRemove, { multi: true }, (err, numRemoved) => {
            if (err) {
              console.error('[DB] remove from db error:', err)
            } else {
              console.log('[DB] remove from db ok.', numRemoved)
              if (this.cachedHistorys) {
                const index = this.cachedHistorys.findIndex(ch => ch && ch.id && ch.id === toRemove.id)
                console.log('[DB] also remove from cache:', index)
                index !== -1 && this.cachedHistorys.splice(index, 1)
              }
            }
            resolve(err ? 0 : numRemoved)            
          })
        } else {
          console.error('[DB] remove error:', ' no toRemove.')
          resolve(0)
        }
      } catch (err) {
        console.error('[DB] remove record from db error:', err)
        resolve(0)
      }
    })
  }
}

//module.export=HistoryDB
module.exports = withIs(HistoryDB, {
    className: 'HistoryDB',
    symbolName: '@org/package-x/HistoryDB',
});