const Tracker = require('./tracker')
const cliReporter = require('./clireporter')

const OpenAPICoverage = function (emitter, reporterOptions, collectionRunOptions) {
  console.log('OpenAPI reporter loaded')
  // emitter is is an event emitter that triggers the following events: https://github.com/postmanlabs/newman#newmanrunevents
  // reporterOptions is an object of the reporter specific options. See usage examples below for more details.
  // collectionRunOptions is an object of all the collection run options:
  // https://github.com/postmanlabs/newman#newmanrunoptions-object--callback-function--run-eventemitter

  // console.log(reporterOptions)
  // console.log(collectionRunOptions)
  // console.log(JSON.stringify(reporterOptions))
  const openapiFilename = reporterOptions.spec || undefined
  const exportFilename = reporterOptions.export || undefined
  const debugMode = reporterOptions.debug || false
  const serverUrl = reporterOptions.serverUrl || undefined
  const title = reporterOptions.title || undefined

  const reportStyle = reporterOptions.reportstyle || 'wide'

  let tracker

  emitter.on('start', function (err, args) {
    if (err) {
      return
    }

    if (typeof openapiFilename !== 'string') {
      console.error('ERROR: An openapi spec path must be included with --reporter-openapi-spec {filename}')
      process.exit(1)
    }

    tracker = new Tracker()

    if (!tracker.specExists(openapiFilename)) {
      console.error(`OpenAPI spec ${openapiFilename} does not exist!`)
      process.exit(1)
    }

    tracker.initialise(openapiFilename)
    if (!tracker.getSchema()) {
      console.error(`ERROR: Openapi spec ${openapiFilename} could not be parsed!`)
      process.exit(1)
    }
  })

  emitter.on('request', function (err, o) {
    if (err) {
      return
    }

    const req = o.request
    const res = o.response

    if (!res) {
      console.log('Request didn\'t have a response')
      return
    }

    // use url without query
    let url = req.url.toString()
    const queryParams = url.indexOf('?')
    if (queryParams > -1) {
      url = url.substring(0, queryParams)
    }

    tracker.updateOperation(url, req.method, res.code, { debugMode, serverUrl })
  })

  emitter.on('beforeDone', function (err, o) {
    if (err) {
      return
    }
    const coverage = tracker.createCoverage()
    cliReporter.logCoverage(coverage, openapiFilename, { reportStyle, title })

    if (exportFilename) {
      emitter.exports.push({
        name: 'openapi-coverage',
        default: 'newman-openapi-coverage.json',
        path: exportFilename,
        content: JSON.stringify(coverage, null, 2)
      })
    }
  })
}

module.exports = OpenAPICoverage
