const deasync = require('deasync')
const fs = require('fs')
const refParser = require('@apidevtools/json-schema-ref-parser')

module.exports = class Tracker {
  addCallCounts () {
    this.openAPIDocument.callCount = 0
    this.openAPIDocument.totalCalls = 0

    for (const path in this.openAPIDocument.paths) {
      const pathValue = this.openAPIDocument.paths[path]
      pathValue.callCount = 0
      pathValue.totalCalls = 0

      for (const method in pathValue) {
        if (method === 'callCount' || method === 'totalCalls') {
          continue
        }

        const methodValue = pathValue[method]
        methodValue.callCount = 0
        methodValue.totalCalls = 0

        for (const response in methodValue.responses) {
          const responseValue = methodValue.responses[response]
          responseValue.callCount = 0
          pathValue.totalCalls += 1
          methodValue.totalCalls += 1
          this.openAPIDocument.totalCalls += 1
        }
      }
    }
  }

  checkPath (url, path) {
    // number of path elements must match
    if (url.split('/').length !== path.split('/').length) {
      return false
    }

    if (path.indexOf('{') > 0) {
      const regex = /{.*?}/ig
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

  createCoverage () {
    const coverage = {
      title: ''
    }
    if (this.openAPIDocument.info && this.openAPIDocument.info.title) {
      coverage.title = this.openAPIDocument.info.title
    }

    coverage.callCount = this.openAPIDocument.callCount
    coverage.totalCalls = this.openAPIDocument.totalCalls
    coverage.callPercentage = this.percentage(this.openAPIDocument.callCount, this.openAPIDocument.totalCalls)

    for (const path in this.openAPIDocument.paths) {
      const pathValue = this.openAPIDocument.paths[path]

      coverage[path] = {
        callCount: pathValue.callCount,
        totalCalls: pathValue.totalCalls,
        callPercentage: this.percentage(pathValue.callCount, pathValue.totalCalls)
      }

      for (const method in pathValue) {
        const methodValue = pathValue[method]
        if (typeof methodValue !== 'object') {
          continue
        }

        coverage[path][method] = {
          callCount: methodValue.callCount,
          totalCalls: methodValue.totalCalls,
          callPercentage: this.percentage(methodValue.callCount, methodValue.totalCalls),
          responses: {}
        }

        for (const response in methodValue.responses) {
          const responseValue = methodValue.responses[response]

          coverage[path][method].responses[response] = {
            callCount: responseValue.callCount,
            isUnexpected: responseValue.isUnexpected
          }
        }
      }
    }

    return coverage
  }

  async dereference (specFilename) {
    if (!this.isJestRunning()) {
      // use deasync to make this synchronous
      let complete = false
      refParser.dereference(specFilename, (err, schema) => {
        if (err) {
          console.error(`ERROR in RefParser: ${err.message ? err.message : err}`)
        } else {
          this.openAPIDocument = schema
          // make json unique
          this.openAPIDocument = JSON.parse(JSON.stringify(this.openAPIDocument))
          console.log(`Parsed schema file ${specFilename}`)
        }
        complete = true
      })
      deasync.loopWhile(() => {
        return !complete
      })
    } else {
      try {
        this.openAPIDocument = await refParser.dereference(specFilename)
        // make json unique
        this.openAPIDocument = JSON.parse(JSON.stringify(this.openAPIDocument))
        console.log(`Parsed schema file ${specFilename}`)
      } catch (err) {
        console.error(err)
      }
    }
  }

  getMethodCaseInsensitive (object, method) {
    for (const pathMethod in object) {
      if (pathMethod === 'callCount' || pathMethod === 'totalCalls') {
        continue
      }
      this.logDebug(`    Checking method [${pathMethod}]...`)
      if (pathMethod.toLowerCase() === method.toLowerCase()) {
        this.logDebug('        Method matches')
        return object[pathMethod]
      }
    }

    return undefined
  }

  getPath (url) {
    // check all paths
    const pathMatches = Object.keys(this.openAPIDocument.paths)
      .filter((element) => {
        return this.checkPath(url, element)
      })
    // fast first match
    if (pathMatches.length === 0) {
      return undefined
    } else if (pathMatches.length === 1) {
      const path = pathMatches[0]
      this.logDebug(`    Found matching path [${path}]...`)
      return this.openAPIDocument.paths[path]
    }

    // more than one match so we need to pick one
    const urlParts = url.split('/')
    for (let partNumber = 1; partNumber < urlParts.length; partNumber++) {
      const urlPart = urlParts[partNumber]

      // check part in each path
      for (let pathNumber = pathMatches.length - 1; pathNumber >= 0; pathNumber--) {
        const path = pathMatches[pathNumber]
        // does part match?
        const pathParts = path.split('/')
        if (pathParts[partNumber] !== urlPart) {
          pathMatches.splice(pathNumber, 1)
        }
      }

      // are we left with one value?
      if (pathMatches.length === 1) {
        const path = pathMatches[0]
        this.logDebug(`    Found matching path [${path}]...`)
        return this.openAPIDocument.paths[path]
      } else if (pathMatches.length === 0) {
        break
      }
    }

    return undefined
  }

  getSchema () {
    return this.openAPIDocument
  }

  getServer (url) {
    for (const server of this.openAPIDocument.servers) {
      this.logDebug(`    Checking server [${server.url}]...`)
      if (url.startsWith(server.url)) {
        this.logDebug('        Server matches')
        return server.url
      }
    }
    return undefined
  }

  async initialise (specFilename) {
    if (!this.isJestRunning()) {
      this.dereference(specFilename)
    } else {
      await this.dereference(specFilename)
    }
    if (!this.openAPIDocument) {
      return
    }

    this.addCallCounts()
  }

  isJestRunning () {
    return process.env.JEST_WORKER_ID !== undefined
  }

  logDebug (message) {
    if (this.debugMode) {
      console.log(message)
    }
  }

  logError (message, context) {
    const output = {
      message,
      ...context
    }
    console.error(JSON.stringify(output, null, 2))
  }

  percentage (calls, totalCalls) {
    if (totalCalls === 0) {
      return 0
    }
    return Math.round((100 * calls) / totalCalls)
  }

  setDebugMode (debugMode) {
    this.debugMode = debugMode
  }

  setSchema (schema) {
    this.openAPIDocument = schema
    if (this.openAPIDocument) {
      this.addCallCounts()
    }
  }

  specExists (specFilename) {
    return fs.existsSync(specFilename) && fs.lstatSync(specFilename).isFile()
  }

  updateOperation (url, method, code, options) {
    const fixedServerUrl = (options && options.serverUrl) || undefined

    this.logDebug(`Resolving [${url}] [${method}] [${code}] ...`)

    if (!this.openAPIDocument.servers) {
      console.error('ERROR: No servers!!!')
      return undefined
    }

    let server
    if (fixedServerUrl && url.startsWith(fixedServerUrl)) {
      this.logDebug(`    Matched fixed server [${server}]...`)
      server = fixedServerUrl
    } else {
      server = this.getServer(url)
      if (!server) {
        this.logError('Error: No matching server!!!', { method, code, url })
        return undefined
      }
    }

    let relativeUrl = url.replace(server, '')
    if (relativeUrl.endsWith('/')) {
      relativeUrl = relativeUrl.slice(0, -1)
    }

    if (!this.openAPIDocument.paths) {
      console.error('ERROR: No paths!!!')
      return undefined
    }

    this.logDebug(`Checking ${relativeUrl} for a Path`)

    const matchPath = this.getPath(relativeUrl)
    if (!matchPath) {
      this.logError('Error: Ambiguous or no matching path!!!', { method, code, url, server, relativeUrl })
      return undefined
    }

    const matchMethod = this.getMethodCaseInsensitive(matchPath, method)
    if (!matchMethod) {
      this.logError('Error: No matching method!!!', { method, code, url, server, relativeUrl })
      return undefined
    }

    let matchResponse = matchMethod.responses[code]
    if (!matchResponse) {
      // if there is no default method then we have no response match
      if (!matchMethod.responses.default) {
        // add this code in as unexpected
        matchMethod.responses[code] = {
          isUnexpected: true,
          callCount: 0
        }
        matchResponse = matchMethod.responses[code]
        this.logError('Error: No matching response!!!', { method, code, url, server, relativeUrl })
      } else {
        matchResponse = matchMethod.responses.default
      }
    }

    if (matchResponse.callCount === 0 && !matchResponse.isUnexpected) {
      matchMethod.callCount++
      matchPath.callCount++
      this.openAPIDocument.callCount++
    }
    matchResponse.callCount++

    return {
      method,
      code,
      url,
      server,
      relativeUrl,
      matchPath,
      matchMethod,
      matchResponse
    }
  }
}
