/* globals describe it expect */

const utils = require('../lib/utils')

describe('utils path', function () {
  it('should match a path', function () {
    const result = utils.checkPath('/test/path', '/test/path')
    expect(result).toBeTruthy()
  })

  it('should not match a path', function () {
    const result = utils.checkPath('/test/path', '/whatever')
    expect(result).toBeFalsy()
  })

  it('should match a path', function () {
    const result = utils.checkPath('/test/path', '/test/path')
    expect(result).toBeTruthy()
  })

  it('should match a path with vars', function () {
    const result = utils.checkPath('/test/12-34-56', '/test/{id}')
    expect(result).toBeTruthy()
  })

  it('should match a path with dashes', function () {
    const result = utils.checkPath('/users/e64e18e9-d01b-4378-bf98-b4d21e307793/modules/68d902bf-07e9-4fd1-ab18-f17362de3608', '/users/{userId}/modules/{id}')
    expect(result).toBeTruthy()
  })

  it('should match a path with dashes 2', function () {
    const result = utils.checkPath('/workplaces/bsapi-workplace/groups/b0c535f5-1b8e-4388-8819-f73a9bda652d/modules/269198e4-d36d-4236-8b5a-f4a76bcb1f43', '/workplaces/{workplaceRef}/groups/{groupid}/modules/{id}')
    expect(result).toBeTruthy()
  })

  it('should match a path with two vars', function () {
    const result = utils.checkPath('/test/12-34-56/nested/09-87-65', '/test/{id}/nested/{nestedid}')
    expect(result).toBeTruthy()
  })
})
