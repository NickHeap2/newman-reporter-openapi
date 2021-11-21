const utils = require('./utils')

module.exports.logCoverage = logCoverage

function logCoverage (coverage) {
  console.log('OpenAPI coverage')
  console.log('----------------')

  for (const path in coverage) {
    const pathValue = coverage[path]

    console.log(path + '    (' + pathValue.callCount + ' of ' + pathValue.totalCalls + ') ' + utils.percentage(pathValue.callCount, pathValue.totalCalls) + '%')
    for (const method in pathValue) {
      const methodValue = pathValue[method]
      if (typeof methodValue !== 'object') {
        continue
      }

      let responseList = ''
      for (const response in methodValue.responses) {
        const responseValue = methodValue.responses[response]

        if (responseValue.callCount === 0) {
          responseList += `-${response} `
        } else {
          responseList += `+${response} `
        }
      }

      if (responseList !== '') {
        responseList = `        Responses( ${responseList})`
      }

      console.log('    ' + method + '    (' + methodValue.callCount + ' of ' + methodValue.totalCalls + ') ' + utils.percentage(methodValue.callCount, methodValue.totalCalls) + '%' + responseList)
    }
  }
}
