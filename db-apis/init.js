const RecordPlatformsDB = require('./history/recorderPlatformsDB.js')
const RecordDB = require('./history/recorderDB.js')
const path = require('path')
const withIs = require('class-is');

class APIFactory {
  constructor (appInfo) {
    this._init(appInfo)

    this.query = this.query.bind(this)
    this.execute = this.execute.bind(this)
  }

  _init (appInfo) {
    try {
      const { mainApp, appData } = appInfo
      if (mainApp.includes('recorder')) {
        this.RPDB = new RecordPlatformsDB(appData)
        this.Library = new RecordDB(appData)
      } else {
        console.error('[R-API] mainApp error:', mainApp)
      }


      // this.History = new History(appData)
    } catch (err) {
      console.error('[R-API] Init error:', err)
    }
    console.log(path.resolve('./'),this)
  }

  query (str) {
    let func = null
    if (str) {
      const cs = str.split('.')
      let [r, i] = [this, 0]
      for (i = 0; i < cs.length && r; i++) {
        r = r[cs[i]]
      }

      func = i === cs.length ? r : null
    }
    return func
  }
  async execute (str, ...args) {
    console.log('[R-API] execute:', str, args.length)
    let r
    const func = this.query(str)
    if (func) {
      r = await func(...args)
    } else {
      console.error('[R-API] execute error:', str)
    }
    return r
  }
}


 

 
module.exports = withIs(APIFactory, {
    className: 'APIFactory',
    symbolName: '@org/package-x/APIFactory',
});
//module.export=APIFactory
