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

  getMethodCaseInsensitive (object, method, debugMode) {
    for (const pathMethod in object) {
      if (pathMethod === 'callCount' || pathMethod === 'totalCalls') {
        continue
      }
      if (debugMode) {
        console.log(`    Checking method [${pathMethod}]...`)
      }
      if (pathMethod.toLowerCase() === method.toLowerCase()) {
        if (debugMode) {
          console.log('        Method matches')
        }
        return object[pathMethod]
      }
    }

    return undefined
  }

  getPath (url, debugMode) {
    for (const path in this.openAPIDocument.paths) {
      if (debugMode) {
        console.log(`    Checking path [${path}]...`)
      }
      if (this.checkPath(url, path)) {
        if (debugMode) {
          console.log('        Path matches')
        }
        return this.openAPIDocument.paths[path]
      }
    }
    return undefined
  }

  getSchema () {
    return this.openAPIDocument
  }

  getServer (url, debugMode) {
    for (const server of this.openAPIDocument.servers) {
      if (debugMode) {
        console.log(`    Checking server [${server.url}]...`)
      }
      if (url.startsWith(server.url)) {
        if (debugMode) {
          console.log('        Server matches')
        }
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
    const debugMode = (options && options.debugMode) || false
    const fixedServerUrl = (options && options.serverUrl) || undefined

    if (debugMode) {
      console.log(`Resolving [${url}] [${method}] [${code}] ...`)
    }

    if (!this.openAPIDocument.servers) {
      console.error('ERROR: No servers!!!')
      return undefined
    }

    let server
    if (fixedServerUrl && url.startsWith(fixedServerUrl)) {
      if (debugMode) {
        console.log(`    Matched fixed server [${server}]...`)
      }
      server = fixedServerUrl
    } else {
      server = this.getServer(url, debugMode)
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

    if (debugMode) {
      console.log(`Checking ${relativeUrl} for a Path`)
    }
    const matchPath = this.getPath(relativeUrl, debugMode)
    if (!matchPath) {
      this.logError('Error: No matching path!!!', { method, code, url, server, relativeUrl })
      return undefined
    }

    const matchMethod = this.getMethodCaseInsensitive(matchPath, method, debugMode)
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
