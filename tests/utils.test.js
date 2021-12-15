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

  it('should match a path with a dash', function () {
    const result = utils.checkPath('/pet/-93114376/uploadImage', '/pet/{petId}/uploadImage')
    expect(result).toBeTruthy()
  })

  it('shouldn\'t match a path that is longer', function () {
    const result = utils.checkPath('/pet/-93114376/uploadImage', '/pet/{petId}')
    expect(result).toBeFalsy()
  })

  it('should match a path with percentages', function () {
    const result = utils.checkPath('/user/ad%20labore', '/user/{username}')
    expect(result).toBeTruthy()
  })

  it('should match a path with dashes', function () {
    const result = utils.checkPath('/users/e64e18e9-d01b-4378-bf98-b4d21e307793/modules/68d902bf-07e9-4fd1-ab18-f17362de3608', '/users/{userId}/modules/{id}')
    expect(result).toBeTruthy()
  })

  it('should match this path', function () {
    const result = utils.checkPath('/applet-categories/7e74e7a8-a994-46c3-a79e-25ae44791983', '/applet-categories/{appletCategoryId}')
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

describe('utils updateOperation', function () {
  beforeEach(() => {
    utils.logError = jest.fn()
    utils.setSchema({
      servers: [
        {
          url: 'http://127.0.0.1:3000'
        }
      ],
      paths: {
        '/kittens': {
          delete: {
            responses: {
              404: {
              }
            }
          }
        }
      }
    })
  })

  it('should process a valid operation', function () {
    const result = utils.updateOperation('http://127.0.0.1:3000/kittens', 'DELETE', '404')
    expect(result).toBeDefined()
    expect(utils.logError).not.toHaveBeenCalled()
  })

  it('should not process an operation with missing server', function () {
    const result = utils.updateOperation('http://my-server0/kittens', 'DELETE', '404')
    expect(result).toBeUndefined()
    expect(utils.logError).toHaveBeenCalledTimes(1)
  })

  it('should not process an operation with missing path', function () {
    const result = utils.updateOperation('http://127.0.0.1:3000/dogs', 'DELETE', '404')
    expect(result).toBeUndefined()
    expect(utils.logError).toHaveBeenCalledTimes(1)
  })

  it('should not process an operation with missing response', function () {
    const result = utils.updateOperation('http://127.0.0.1:3000/kittens', 'DELETE', '401')
    expect(result).toBeDefined()
    expect(result).toHaveProperty('matchMethod')
    expect(result.matchMethod).toHaveProperty('responses')
    expect(result.matchMethod.responses).toHaveProperty('401')
    expect(result.matchMethod.responses['401']).toMatchObject({ isUnexpected: true })
    expect(utils.logError).toHaveBeenCalledTimes(1)
  })
})
