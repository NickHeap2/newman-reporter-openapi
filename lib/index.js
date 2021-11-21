const utils = require('./utils')
const cliReporter = require('./clireporter')

const OpenAPICoverage = function (emitter, reporterOptions, collectionRunOptions) {
  console.log('openapi coverage reporter loaded')
  // emitter is is an event emitter that triggers the following events: https://github.com/postmanlabs/newman#newmanrunevents
  // reporterOptions is an object of the reporter specific options. See usage examples below for more details.
  // collectionRunOptions is an object of all the collection run options:
  // https://github.com/postmanlabs/newman#newmanrunoptions-object--callback-function--run-eventemitter

  // console.log(reporterOptions)
  // console.log(collectionRunOptions)
  // console.log(reporterOptions.openapispec)
  const openapiFilename = reporterOptions.spec
  const exportFilename = reporterOptions.export

  emitter.on('start', function (err, args) {
    if (err) {
      return
    }

    if (typeof openapiFilename !== 'string') {
      console.error('ERROR: An openapi spec path must be included with --reporter-openapi-spec {filename}')
      process.exit(1)
    }

    utils.initialise(openapiFilename)
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

    utils.updateOperation(url, req.method, res.code)
  })

  emitter.on('beforeDone', function (err, o) {
    if (err) {
      return
    }
    const coverage = utils.createCoverage()
    cliReporter.logCoverage(coverage)

    if (exportFilename) {
      emitter.exports.push({
        name: 'openapi-coverage',
        default: 'newman-openapi-coverage.json',
        path: exportFilename,
        content: JSON.stringify(coverage, 0, 2)
      })
    }
  })
}

module.exports = OpenAPICoverage
