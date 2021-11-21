const refParser = require('@apidevtools/json-schema-ref-parser')
const fs = require('fs')

let openAPIDocument = {}

function initialise (specFilename) {
  if (!fs.existsSync(specFilename) && fs.lstatSync(specFilename).isFile()) {
    console.error(`OpenAPI spec ${specFilename} does not exist!`)
  }

  refParser.dereference(specFilename, (err, schema) => {
    if (err) {
      console.error(err)
    } else {
      // `schema` is just a normal JavaScript object that contains your entire JSON Schema,
      // including referenced files, combined into a single object
      // console.log(schema.definitions.person.properties.firstName);
      openAPIDocument = schema
      console.log('parsed schema')

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

function getServer (url) {
  for (const server of openAPIDocument.servers) {
    if (url.startsWith(server.url)) {
      return server.url
    }
  }
  return undefined
}

function checkPath (url, path) {
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

function getPath (url) {
  for (const path in openAPIDocument.paths) {
    if (checkPath(url, path)) {
      return openAPIDocument.paths[path]
    }
  }
  return undefined
}

function getMethodCaseInsensitive (object, method) {
  return object[Object.keys(object)
    .find(m => m.toLowerCase() === method.toLowerCase())
  ]
}

function updateOperation (url, method, code) {
  if (!openAPIDocument.servers) {
    console.error('ERROR: No servers!!!')
    return
  }
  const server = getServer(url)
  if (!server) {
    logError(url, method, code, 'Error: No matching server!!!')
    return
  }

  let relativeUrl = url.replace(server, '')
  if (relativeUrl.endsWith('/')) {
    relativeUrl = relativeUrl.slice(0, -1)
  }
  const matchPath = getPath(relativeUrl)
  if (!matchPath) {
    logError(url, method, code, 'Error: No matching path!!!')
    return
  }

  const matchMethod = getMethodCaseInsensitive(matchPath, method)
  if (!matchMethod) {
    logError(url, method, code, 'Error: No matching method!!!')
    return
  }

  const matchResponse = matchMethod.responses[code]
  if (!matchResponse) {
    logError(url, method, code, 'Error: No matching response!!!')
    return
  }

  if (matchResponse.callCount === 0) {
    matchMethod.callCount++
    matchPath.callCount++
  }
  matchResponse.callCount++
}

function logError (url, method, code, msg) {
  const output = {
    url,
    method,
    code,
    msg
  }
  console.error(JSON.stringify(output))
}

function createCoverage () {
  const coverage = {}

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
