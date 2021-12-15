const Table = require('cli-table3')
const colors = require('colors/safe')

// sets theme for colors for console logging
colors.setTheme({
  log: 'grey',
  info: 'cyan',
  warn: 'yellow',
  debug: 'blue',
  error: 'red'
})

const table = new Table({
  head: [],
  style: {
    head: [],
    border: []
  }
})

module.exports.logCoverage = logCoverage

function logCoverage (coverage, openapiFilename, options) {
  const reportTitle = options.title || coverage.title

  const logPathsOnly = options.reportStyle === 'summary'
  const wideMode = options.reportStyle === 'wide'

  const columns = []

  // get full list of unique methods to build widemode
  const wideModeMethods = []
  if (wideMode) {
    for (const path in coverage) {
      if (path === 'callCount' || path === 'totalCalls' || path === 'callPercentage') {
        continue
      }
      const pathValue = coverage[path]

      for (const method in pathValue) {
        const methodValue = pathValue[method]
        if (typeof methodValue !== 'object') {
          continue
        }

        if (wideModeMethods.indexOf(method) === -1) {
          wideModeMethods.push(method)
        }
      }
    }

    columns.push('Path', 'Covered')
    for (const method of wideModeMethods) {
      columns.push(method.toUpperCase())
    }

    table.push([{ colSpan: columns.length, content: `${reportTitle + ' '}OpenAPI coverage` }])
    table.push([{ colSpan: columns.length, content: openapiFilename }])
    table.push([{ colSpan: 1, content: '' }, { colSpan: columns.length - 1, hAlign: 'center', content: 'Coverage' }])

    // write the generated columns
    table.push(columns)
  } else {
    columns.push('', 'Method', 'Covered', 'Covered Responses', 'Uncovered Responses', 'Unexpected Responses')

    table.push([{ colSpan: logPathsOnly ? 2 : columns.length, content: `${reportTitle + ' '}OpenAPI coverage` }])
    table.push([{ colSpan: logPathsOnly ? 2 : columns.length, content: openapiFilename }])
    table.push([{ colSpan: logPathsOnly ? 1 : 2, content: 'Path' }, { colSpan: logPathsOnly ? 1 : columns.length - 2, hAlign: 'center', content: 'Coverage' }])

    if (!logPathsOnly) {
      table.push(columns)
    }
  }

  for (const path in coverage) {
    if (path === 'callCount' || path === 'totalCalls' || path === 'callPercentage' || path === 'title') {
      continue
    }

    const pathValue = coverage[path]

    const pathPercentageMessage = decoratePercentage(pathValue.callPercentage)

    const pathColumns = []
    if (wideMode) {
      pathColumns.push({ colSpan: 1, content: path }, pathPercentageMessage)
    } else {
      pathColumns.push({ colSpan: logPathsOnly ? 1 : 2, content: path }, pathPercentageMessage)
      table.push(pathColumns)
    }

    if (logPathsOnly) {
      continue
    }

    const wideModeMethodResponses = {}
    for (const method in pathValue) {
      const methodValue = pathValue[method]
      if (typeof methodValue !== 'object') {
        continue
      }

      let coveredResponseList = ''
      let UncoveredResponseList = ''
      let UnexpectedResponseList = ''
      for (const response in methodValue.responses) {
        const responseValue = methodValue.responses[response]

        if (responseValue.isUnexpected) {
          UnexpectedResponseList += colors.red(`?${response} `)
        } else if (responseValue.callCount === 0) {
          UncoveredResponseList += colors.red(`-${response} `)
        } else {
          coveredResponseList += colors.green(`+${response} `)
        }
      }
      const allResponses = `${coveredResponseList}${UncoveredResponseList}${UnexpectedResponseList}`

      const methodPercentageMessage = decoratePercentage(methodValue.callPercentage)
      if (wideMode) {
        wideModeMethodResponses[method] = allResponses
      } else {
        table.push(['', method, methodPercentageMessage, coveredResponseList, UncoveredResponseList, UnexpectedResponseList])
      }
    }

    if (wideMode) {
      for (const method of wideModeMethods) {
        const methodValue = wideModeMethodResponses[method]
        if (methodValue) {
          pathColumns.push(methodValue)
        } else {
          pathColumns.push('')
        }
      }
      table.push(pathColumns)
    }
  }

  const totalPercentageMessage = decoratePercentage(coverage.callPercentage)
  if (wideMode) {
    table.push([{ colSpan: 1, content: 'Total API Coverage' }, totalPercentageMessage])
  } else {
    table.push([{ colSpan: logPathsOnly ? 1 : 2, content: 'Total API Coverage' }, totalPercentageMessage])
  }

  console.log(table.toString())
}

function decoratePercentage (percentageValue) {
  let percentageMessage = `${percentageValue}%`
  if (percentageValue >= 100) {
    percentageMessage = colors.green(percentageMessage)
  } else if (percentageValue <= 0) {
    percentageMessage = colors.red(percentageMessage)
  }

  return percentageMessage
}
