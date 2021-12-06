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

function logCoverage (coverage, openapiFilename) {
  table.push([{ colSpan: 5, content: 'OpenAPI coverage' }])
  table.push([{ colSpan: 5, content: openapiFilename }])
  table.push([{ colSpan: 2, content: 'Path' }, { colSpan: 3, hAlign: 'center', content: 'Coverage' }])
  table.push(['', 'Method', 'Percentage', 'Covered Responses', 'Uncovered Responses'])

  for (const path in coverage) {
    if (path === 'callCount' || path === 'totalCalls' || path === 'callPercentage') {
      continue
    }

    const pathValue = coverage[path]

    const pathPercentageMessage = decoratePercentage(pathValue.callPercentage)
    table.push([{ colSpan: 2, content: path }, pathPercentageMessage])

    for (const method in pathValue) {
      const methodValue = pathValue[method]
      if (typeof methodValue !== 'object') {
        continue
      }

      let coveredResponseList = ''
      let UncoveredResponseList = ''
      for (const response in methodValue.responses) {
        const responseValue = methodValue.responses[response]

        if (responseValue.callCount === 0) {
          UncoveredResponseList += colors.red(`-${response} `)
        } else {
          coveredResponseList += colors.green(`+${response} `)
        }
      }

      const methodPercentageMessage = decoratePercentage(methodValue.callPercentage)
      table.push(['', method, methodPercentageMessage, coveredResponseList, UncoveredResponseList])
    }
  }

  const totalPercentageMessage = decoratePercentage(coverage.callPercentage)
  table.push([{ colSpan: 2, content: 'Total API Coverage' }, totalPercentageMessage])

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
