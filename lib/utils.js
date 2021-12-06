const refParser = require('@apidevtools/json-schema-ref-parser')
const fs = require('fs')

let openAPIDocument = {}

function initialise (specFilename) {
  if (!fs.existsSync(specFilename) && fs.lstatSync(specFilename).isFile()) {
    console.error(`OpenAPI spec ${specFilename} does not exist!`)
  }

  refParser.parse(specFilename, (err, schema) => {
    if (err) {
      console.error(err)
    } else {
      // `schema` is just a normal JavaScript object that contains your entire JSON Schema,
      // including referenced files, combined into a single object
      // console.log(schema.definitions.person.properties.firstName);
      openAPIDocument = schema
      console.log('parsed schema')

      openAPIDocument.callCount = 0
      openAPIDocument.totalCalls = 0

      for (const path in openAPIDocument.paths) {
        const pathValue = openAPIDocument.paths[path]
        pathValue.callCount = 0
        pathValue.totalCalls = 0

        for (const method in pathValue) {
          const methodValue = pathValue[method]
          methodValue.callCount = 0
          methodValue.totalCalls = 0

          for (const response in methodValue.responses) {
            const responseValue = methodValue.responses[response]
            responseValue.callCount = 0
            pathValue.totalCalls += 1
            methodValue.totalCalls += 1
            openAPIDocument.totalCalls += 1
          }
        }
      }
    }
  })
}

function percentage (calls, totalCalls) {
  if (totalCalls === 0) {
    return 0
  }
  return Math.round((100 * calls) / totalCalls)
}

function getServer (url, verboseLogging) {
  for (const server of openAPIDocument.servers) {
    if (verboseLogging) {
      console.log(`    Checking server [${server.url}]...`)
    }
    if (url.startsWith(server.url)) {
      if (verboseLogging) {
        console.log('        Server matches')
      }
      return server.url
    }
  }
  return undefined
}

function checkPath (url, path) {
  // number of path elements must match
  if (url.split('/').length !== path.split('/').length) {
    return false
  }

  if (path.indexOf('{') > 0) {
    const regex = /{.*?}/ig
    // const matchPath = new RegExp('^' + path.replace(regex, '[/.:\'"a-zA-Z0-9-]+') + '$')
    const matchPath = new RegExp('^' + path.replace(regex, '[^/]+') + '$')

    if (matchPath.test(url)) {
      return true
    }
  } else {
    if (url === path) {
      return true
    }
  }
  return false
}

function getPath (url, verboseLogging) {
  for (const path in openAPIDocument.paths) {
    if (verboseLogging) {
      console.log(`    Checking path [${path}]...`)
    }
    if (checkPath(url, path)) {
      if (verboseLogging) {
        console.log('        Path matches')
      }
      return openAPIDocument.paths[path]
    }
  }
  return undefined
}

function getMethodCaseInsensitive (object, method, verboseLogging) {
  for (const pathMethod in object) {
    if (pathMethod === 'callCount' || pathMethod === 'totalCalls') {
      continue
    }
    if (verboseLogging) {
      console.log(`    Checking method [${pathMethod}]...`)
    }
    if (pathMethod.toLowerCase() === method.toLowerCase()) {
      console.log('        Method matches')
      return object[pathMethod]
    }
  }

  return undefined
}

function updateOperation (url, method, code, options) {
  const verboseLogging = (options && options.verboseMode) || false
  const fixedServerUrl = (options && options.serverUrl) || undefined

  if (verboseLogging) {
    console.log(`Resolving [${url}] [${method}] [${code}] ...`)
  }

  if (!openAPIDocument.servers) {
    console.error('ERROR: No servers!!!')
    return
  }

  let server
  if (fixedServerUrl && url.startsWith(fixedServerUrl)) {
    server = {
      url: fixedServerUrl
    }
    console.log(`    Matched fixed server [${server.url}]...`)
  } else {
    server = getServer(url, verboseLogging)
    if (!server) {
      logError('Error: No matching server!!!', { method, code, url })
      return
    }
  }

  let relativeUrl = url.replace(server, '')
  if (relativeUrl.endsWith('/')) {
    relativeUrl = relativeUrl.slice(0, -1)
  }
  const matchPath = getPath(relativeUrl, verboseLogging)
  if (!matchPath) {
    logError('Error: No matching path!!!', { method, code, url, server, relativeUrl })
    return
  }

  const matchMethod = getMethodCaseInsensitive(matchPath, method, verboseLogging)
  if (!matchMethod) {
    logError('Error: No matching method!!!', { method, code, url, server, relativeUrl })
    return
  }

  let matchResponse = matchMethod.responses[code]
  if (!matchResponse) {
    // if there is no default method then we have no response match
    if (!matchMethod.responses.default) {
      logError('Error: No matching response!!!', { method, code, url, server, relativeUrl })
      return
    }
    matchResponse = matchMethod.responses.default
  }

  if (matchResponse.callCount === 0) {
    matchMethod.callCount++
    matchPath.callCount++
    openAPIDocument.callCount++
  }
  matchResponse.callCount++
}

function logError (message, context) {
  const output = {
    message,
    ...context
  }
  console.error(JSON.stringify(output, null, 2))
}

function createCoverage () {
  const coverage = {}

  coverage.callCount = openAPIDocument.callCount
  coverage.totalCalls = openAPIDocument.totalCalls
  coverage.callPercentage = percentage(openAPIDocument.callCount, openAPIDocument.totalCalls)

  for (const path in openAPIDocument.paths) {
    const pathValue = openAPIDocument.paths[path]

    coverage[path] = {
      callCount: pathValue.callCount,
      totalCalls: pathValue.totalCalls,
      callPercentage: percentage(pathValue.callCount, pathValue.totalCalls)
    }

    for (const method in pathValue) {
      const methodValue = pathValue[method]
      if (typeof methodValue !== 'object') {
        continue
      }

      coverage[path][method] = {
        callCount: methodValue.callCount,
        totalCalls: methodValue.totalCalls,
        callPercentage: percentage(methodValue.callCount, methodValue.totalCalls),
        responses: {}
      }

      for (const response in methodValue.responses) {
        const responseValue = methodValue.responses[response]

        coverage[path][method].responses[response] = {
          callCount: responseValue.callCount
        }
      }
    }
  }

  return coverage
}

module.exports.initialise = initialise
module.exports.percentage = percentage
module.exports.getServer = getServer
module.exports.checkPath = checkPath
module.exports.getPath = getPath
module.exports.getMethodCaseInsensitive = getMethodCaseInsensitive
module.exports.updateOperation = updateOperation
module.exports.logError = logError
module.exports.createCoverage = createCoverage
