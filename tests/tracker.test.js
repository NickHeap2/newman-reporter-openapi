/* globals describe it expect */
const Tracker = require('../lib/tracker')

let tracker

describe('utils dereference', function () {
  beforeEach(() => {
    tracker = new Tracker()
  })

  it('should load a valid spec and resolve it', async function () {
    await tracker.dereference('tests/valid-schema.yaml')
    const schema = tracker.getSchema()
    expect(schema).toBeDefined()

    expect(schema).toHaveProperty(['paths', '/refpath', 'get', 'summary'])
    expect(schema.paths['/refpath'].get.summary).toEqual('Get a refpath')
    expect(schema).not.toHaveProperty('callCount')

    // console.log(JSON.stringify(schema, null, 2))
  })

  it('should not dereference an invalid spec', async function () {
    await tracker.dereference('tests/invalid-schema.yaml')
    const schema = tracker.getSchema()
    expect(schema).not.toBeDefined()
  })
})
describe('utils initialise', function () {
  beforeEach(() => {
    tracker = new Tracker()
  })

  it('should initialise a valid spec', async function () {
    await tracker.initialise('tests/valid-schema.yaml')
    const schema = tracker.getSchema()
    expect(schema).toBeDefined()

    expect(schema).toHaveProperty(['paths', '/refpath', 'get', 'summary'])
    expect(schema.paths['/refpath'].get.summary).toEqual('Get a refpath')
    expect(schema).toHaveProperty('callCount')
    expect(schema.callCount).toEqual(0)

    // console.log(JSON.stringify(schema, null, 2))
  })
})

describe('utils path', function () {
  it('should match a path', function () {
    const result = tracker.checkPath('/test/path', '/test/path')
    expect(result).toBeTruthy()
  })

  it('should not match a path', function () {
    const result = tracker.checkPath('/test/path', '/whatever')
    expect(result).toBeFalsy()
  })

  it('should match a path', function () {
    const result = tracker.checkPath('/test/path', '/test/path')
    expect(result).toBeTruthy()
  })

  it('should match a path with vars', function () {
    const result = tracker.checkPath('/test/12-34-56', '/test/{id}')
    expect(result).toBeTruthy()
  })

  it('should match a path with a dash', function () {
    const result = tracker.checkPath('/pet/-93114376/uploadImage', '/pet/{petId}/uploadImage')
    expect(result).toBeTruthy()
  })

  it('shouldn\'t match a path that is longer', function () {
    const result = tracker.checkPath('/pet/-93114376/uploadImage', '/pet/{petId}')
    expect(result).toBeFalsy()
  })

  it('should match a path with percentages', function () {
    const result = tracker.checkPath('/user/ad%20labore', '/user/{username}')
    expect(result).toBeTruthy()
  })

  it('should match a path with dashes', function () {
    const result = tracker.checkPath('/users/e64e18e9-d01b-4378-bf98-b4d21e307793/modules/68d902bf-07e9-4fd1-ab18-f17362de3608', '/users/{userId}/modules/{id}')
    expect(result).toBeTruthy()
  })

  it('should match this path', function () {
    const result = tracker.checkPath('/applet-categories/7e74e7a8-a994-46c3-a79e-25ae44791983', '/applet-categories/{appletCategoryId}')
    expect(result).toBeTruthy()
  })

  it('should match a path with dashes 2', function () {
    const result = tracker.checkPath('/workplaces/bsapi-workplace/groups/b0c535f5-1b8e-4388-8819-f73a9bda652d/modules/269198e4-d36d-4236-8b5a-f4a76bcb1f43', '/workplaces/{workplaceRef}/groups/{groupid}/modules/{id}')
    expect(result).toBeTruthy()
  })

  it('should match a path with two vars', function () {
    const result = tracker.checkPath('/test/12-34-56/nested/09-87-65', '/test/{id}/nested/{nestedid}')
    expect(result).toBeTruthy()
  })
})

describe('utils updateOperation', function () {
  beforeEach(() => {
    tracker = new Tracker()
    tracker.logError = jest.fn()
    tracker.setSchema({
      servers: [
        {
          url: 'http://127.0.0.1:3000'
        }
      ],
      paths: {
        '/mittens': {
          delete: {
            responses: {
              400: {
              }
            }
          }
        },
        '/kittens': {
          post: {
            responses: {
              201: {
              },
              400: {
              },
              401: {
              },
              403: {
              },
              409: {
              },
              415: {
              }
            }
          },
          delete: {
            responses: {
              400: {
              },
              404: {
              }
            }
          }
        }
      }
    })
  })

  it('should process a valid operation', function () {
    const result = tracker.updateOperation('http://127.0.0.1:3000/kittens', 'DELETE', '404')
    expect(result).toBeDefined()
    expect(tracker.logError).not.toHaveBeenCalled()
  })

  it('should not process an operation with missing server', function () {
    const result = tracker.updateOperation('http://my-server0/kittens', 'DELETE', '404')
    expect(result).toBeUndefined()
    expect(tracker.logError).toHaveBeenCalledTimes(1)
  })

  it('should not process an operation with missing path', function () {
    const result = tracker.updateOperation('http://127.0.0.1:3000/dogs', 'DELETE', '404')
    expect(result).toBeUndefined()
    expect(tracker.logError).toHaveBeenCalledTimes(1)
  })

  it('should not process an operation with missing response', function () {
    const result = tracker.updateOperation('http://127.0.0.1:3000/kittens', 'DELETE', '401')
    expect(result).toBeDefined()
    expect(result).toHaveProperty('matchMethod')
    expect(result.matchMethod).toHaveProperty('responses')
    expect(result.matchMethod.responses).toHaveProperty('401')
    expect(result.matchMethod.responses['401']).toMatchObject({ isUnexpected: true })
    expect(tracker.logError).toHaveBeenCalledTimes(1)
  })

  it('should track responses', function () {
    let result

    // post 400
    result = tracker.updateOperation('http://127.0.0.1:3000/kittens', 'POST', '400')
    expect(result).toBeDefined()

    // check call counts
    expect(result).toHaveProperty('matchPath.callCount')
    expect(result.matchPath.callCount).toEqual(1)

    expect(result.matchPath).toHaveProperty('post.callCount')
    expect(result.matchPath.post.callCount).toEqual(1)

    expect(result.matchPath.post).toHaveProperty('responses.400.callCount')
    expect(result.matchPath.post.responses['400'].callCount).toEqual(1)

    // delete 400
    result = tracker.updateOperation('http://127.0.0.1:3000/kittens', 'DELETE', '400')
    expect(result).toBeDefined()

    // check call counts
    expect(result).toHaveProperty('matchPath.callCount')
    expect(result.matchPath.callCount).toEqual(2)

    expect(result.matchPath).toHaveProperty('delete.callCount')
    expect(result.matchPath.delete.callCount).toEqual(1)

    expect(result.matchPath.delete).toHaveProperty('responses.400.callCount')
    expect(result.matchPath.delete.responses['400'].callCount).toEqual(1)

    const coverage = tracker.createCoverage()
    // expect(coverage).toEqual('')
    expect(coverage).toHaveProperty('/kittens')
    expect(coverage['/kittens']).toHaveProperty('callCount')
    expect(coverage['/kittens'].callCount).toEqual(2)

    expect(coverage['/kittens']).toHaveProperty('post')
    expect(coverage['/kittens'].post).toHaveProperty('callCount')
    expect(coverage['/kittens'].post.callCount).toEqual(1)

    expect(coverage['/kittens'].post).toHaveProperty('responses.400.callCount')
    expect(coverage['/kittens'].post.responses['400'].callCount).toEqual(1)

    expect(coverage['/kittens']).toHaveProperty('delete')
    expect(coverage['/kittens'].delete).toHaveProperty('callCount')
    expect(coverage['/kittens'].delete.callCount).toEqual(1)

    expect(coverage['/kittens'].delete).toHaveProperty('responses.400')
    expect(coverage['/kittens'].delete.responses['400'].callCount).toEqual(1)
  })

  it('should track multiple responses', function () {
    let result

    // first make some calls to things that don't exist
    result = tracker.updateOperation('http://127.0.0.1:3001/kittens', 'POST', '201')
    expect(result).toBeUndefined()
    result = tracker.updateOperation('http://127.0.0.1:3000/kittensaaa', 'GET', '404')
    expect(result).toBeUndefined()
    result = tracker.updateOperation('http://127.0.0.1:3000/kittens', 'PUT', '404')
    expect(result).toBeUndefined()

    // post 201
    result = tracker.updateOperation('http://127.0.0.1:3000/kittens', 'POST', '201')
    expect(result).toBeDefined()

    // check total calls from schema
    expect(result).toHaveProperty('matchPath.totalCalls')
    expect(result.matchPath.totalCalls).toEqual(8)

    expect(result).toHaveProperty('matchPath.post.totalCalls')
    expect(result.matchPath.post.totalCalls).toEqual(6)

    expect(result).toHaveProperty('matchPath.delete.totalCalls')
    expect(result.matchPath.delete.totalCalls).toEqual(2)

    // check call counts
    expect(result).toHaveProperty('matchPath.callCount')
    expect(result.matchPath.callCount).toEqual(1)

    expect(result.matchPath).toHaveProperty('post.callCount')
    expect(result.matchPath.callCount).toEqual(1)

    expect(result.matchPath.post).toHaveProperty('responses.201.callCount')
    expect(result.matchPath.post.responses['201'].callCount).toEqual(1)

    // post 201
    result = tracker.updateOperation('http://127.0.0.1:3000/kittens', 'POST', '201')
    expect(result).toBeDefined()

    // check call counts
    expect(result).toHaveProperty('matchPath.callCount')
    expect(result.matchPath.callCount).toEqual(1)

    expect(result.matchPath).toHaveProperty('post.callCount')
    expect(result.matchPath.callCount).toEqual(1)

    expect(result.matchPath.post).toHaveProperty('responses.201.callCount')
    expect(result.matchPath.post.responses['201'].callCount).toEqual(2)

    // post 400
    result = tracker.updateOperation('http://127.0.0.1:3000/kittens', 'POST', '400')
    expect(result).toBeDefined()

    // check call counts
    expect(result).toHaveProperty('matchPath.callCount')
    expect(result.matchPath.callCount).toEqual(2)

    expect(result.matchPath).toHaveProperty('post.callCount')
    expect(result.matchPath.callCount).toEqual(2)

    expect(result.matchPath.post).toHaveProperty('responses.400.callCount')
    expect(result.matchPath.post.responses['400'].callCount).toEqual(1)

    // post 404
    result = tracker.updateOperation('http://127.0.0.1:3000/kittens', 'POST', '404')
    expect(result).toBeDefined()

    // check call counts
    expect(result).toHaveProperty('matchPath.callCount')
    expect(result.matchPath.callCount).toEqual(2)

    expect(result.matchPath).toHaveProperty('post.callCount')
    expect(result.matchPath.post.callCount).toEqual(2)

    expect(result.matchPath.post).toHaveProperty('responses.404.callCount')
    expect(result.matchPath.post.responses['404'].callCount).toEqual(1)

    // delete 400
    result = tracker.updateOperation('http://127.0.0.1:3000/mittens', 'DELETE', '400')
    expect(result).toBeDefined()

    // check call counts
    expect(result).toHaveProperty('matchPath.callCount')
    expect(result.matchPath.callCount).toEqual(1)

    expect(result.matchPath).toHaveProperty('delete.callCount')
    expect(result.matchPath.delete.callCount).toEqual(1)

    expect(result.matchPath.delete).toHaveProperty('responses.400.callCount')
    expect(result.matchPath.delete.responses['400'].callCount).toEqual(1)

    // delete 400
    result = tracker.updateOperation('http://127.0.0.1:3000/kittens', 'DELETE', '400')
    expect(result).toBeDefined()

    // check call counts
    expect(result).toHaveProperty('matchPath.callCount')
    expect(result.matchPath.callCount).toEqual(3)

    expect(result.matchPath).toHaveProperty('delete.callCount')
    expect(result.matchPath.delete.callCount).toEqual(1)

    expect(result.matchPath.delete).toHaveProperty('responses.400.callCount')
    expect(result.matchPath.delete.responses['400'].callCount).toEqual(1)
  })

  describe('utils coverage', function () {
    beforeEach(() => {
      tracker.logError = jest.fn()
      tracker.setSchema({
        servers: [
          {
            url: 'http://127.0.0.1:3000'
          }
        ],
        paths: {
          '/products': {
            post: {
              responses: {
                201: {
                },
                400: {
                },
                401: {
                },
                403: {
                },
                409: {
                },
                415: {
                }
              }
            },
            get: {
              responses: {
                200: {
                },
                400: {
                },
                401: {
                },
                403: {
                }
              }
            }
          }
        }
      })
    })

    it('should get correct coverage for /products scenario', function () {
      // post 201 * 4
      for (let o = 0; o < 4; o++) {
        tracker.updateOperation('http://127.0.0.1:3000/products', 'POST', '201')
      }

      // post 409 * 3
      for (let o = 0; o < 3; o++) {
        tracker.updateOperation('http://127.0.0.1:3000/products', 'POST', '409')
      }

      // post 400 * 31
      for (let o = 0; o < 31; o++) {
        tracker.updateOperation('http://127.0.0.1:3000/products', 'POST', '400')
      }

      // post 415 * 1
      for (let o = 0; o < 1; o++) {
        tracker.updateOperation('http://127.0.0.1:3000/products', 'POST', '415')
      }

      // post 401 * 1
      for (let o = 0; o < 1; o++) {
        tracker.updateOperation('http://127.0.0.1:3000/products', 'POST', '401')
      }

      // get 200 * 3
      for (let o = 0; o < 3; o++) {
        tracker.updateOperation('http://127.0.0.1:3000/products', 'GET', '200')
      }

      // get 400 * 8
      for (let o = 0; o < 8; o++) {
        tracker.updateOperation('http://127.0.0.1:3000/products', 'GET', '400')
      }

      // get 403 * 1
      for (let o = 0; o < 1; o++) {
        tracker.updateOperation('http://127.0.0.1:3000/products', 'GET', '403')
      }

      // get 400 * 1
      for (let o = 0; o < 1; o++) {
        tracker.updateOperation('http://127.0.0.1:3000/products', 'GET', '400')
      }

      // get 401 * 1
      for (let o = 0; o < 1; o++) {
        tracker.updateOperation('http://127.0.0.1:3000/products', 'GET', '401')
      }

      const coverage = tracker.createCoverage()
      // expect(coverage).toEqual('')
      expect(coverage).toHaveProperty('/products')
      expect(coverage['/products']).toHaveProperty('callCount')
      expect(coverage['/products'].callCount).toEqual(9)

      expect(coverage['/products']).toHaveProperty('post')
      expect(coverage['/products'].post).toHaveProperty('callCount')
      expect(coverage['/products'].post.callCount).toEqual(5)

      expect(coverage['/products'].post).toHaveProperty('responses.201.callCount')
      expect(coverage['/products'].post.responses['201'].callCount).toEqual(4)

      expect(coverage['/products'].post).toHaveProperty('responses.409.callCount')
      expect(coverage['/products'].post.responses['409'].callCount).toEqual(3)

      expect(coverage['/products'].post).toHaveProperty('responses.400.callCount')
      expect(coverage['/products'].post.responses['400'].callCount).toEqual(31)

      expect(coverage['/products'].post).toHaveProperty('responses.415.callCount')
      expect(coverage['/products'].post.responses['415'].callCount).toEqual(1)

      expect(coverage['/products'].post).toHaveProperty('responses.401.callCount')
      expect(coverage['/products'].post.responses['401'].callCount).toEqual(1)

      expect(coverage['/products']).toHaveProperty('get')
      expect(coverage['/products'].get).toHaveProperty('callCount')
      expect(coverage['/products'].get.callCount).toEqual(4)

      expect(coverage['/products'].get).toHaveProperty('responses.200')
      expect(coverage['/products'].get.responses['200'].callCount).toEqual(3)

      expect(coverage['/products'].get).toHaveProperty('responses.400')
      expect(coverage['/products'].get.responses['400'].callCount).toEqual(9)

      expect(coverage['/products'].get).toHaveProperty('responses.403')
      expect(coverage['/products'].get.responses['403'].callCount).toEqual(1)

      expect(coverage['/products'].get).toHaveProperty('responses.401')
      expect(coverage['/products'].get.responses['401'].callCount).toEqual(1)
    })
  })
})

describe('dupe ref scenario', function () {
  beforeEach(() => {
    tracker = new Tracker()
    tracker.logError = jest.fn()
  })

  it('should work correctly', async function () {
    await tracker.initialise('tests/dupe-schema.yaml')
    const schema = tracker.getSchema()
    expect(schema).toBeDefined()

    const server = '/api'

    tracker.updateOperation(`${server}/refpath`, 'POST', '201')
    tracker.updateOperation(`${server}/refpath`, 'POST', '400')
    tracker.updateOperation(`${server}/refpath`, 'GET', '200')
    tracker.updateOperation(`${server}/refpath`, 'GET', '400')

    const coverage = tracker.createCoverage()
    expect(coverage).toHaveProperty('/refpath')
    expect(coverage['/refpath']).toHaveProperty('callCount')
    expect(coverage['/refpath'].callCount).toEqual(4)

    expect(coverage['/refpath']).toHaveProperty('post')
    expect(coverage['/refpath'].post).toHaveProperty('callCount')
    expect(coverage['/refpath'].post.callCount).toEqual(2)

    expect(coverage['/refpath'].post).toHaveProperty('responses.201.callCount')
    expect(coverage['/refpath'].post.responses['201'].callCount).toEqual(1)

    expect(coverage['/refpath'].post).toHaveProperty('responses.400.callCount')
    expect(coverage['/refpath'].post.responses['400'].callCount).toEqual(1)

    expect(coverage['/refpath']).toHaveProperty('get')
    expect(coverage['/refpath'].get).toHaveProperty('callCount')
    expect(coverage['/refpath'].get.callCount).toEqual(2)

    expect(coverage['/refpath'].get).toHaveProperty('responses.200')
    expect(coverage['/refpath'].get.responses['200'].callCount).toEqual(1)

    expect(coverage['/refpath'].get).toHaveProperty('responses.400')
    expect(coverage['/refpath'].get.responses['400'].callCount).toEqual(1)
  })

  it('should work correctly', async function () {
    await tracker.initialise('tests/dupe-schema.json')
    const schema = tracker.getSchema()
    expect(schema).toBeDefined()

    const server = '/api'

    tracker.updateOperation(`${server}/refpath`, 'POST', '201')
    tracker.updateOperation(`${server}/refpath`, 'POST', '400')
    tracker.updateOperation(`${server}/refpath`, 'GET', '200')
    tracker.updateOperation(`${server}/refpath`, 'GET', '400')

    const coverage = tracker.createCoverage()
    expect(coverage).toHaveProperty('/refpath')
    expect(coverage['/refpath']).toHaveProperty('callCount')
    expect(coverage['/refpath'].callCount).toEqual(4)

    expect(coverage['/refpath']).toHaveProperty('post')
    expect(coverage['/refpath'].post).toHaveProperty('callCount')
    expect(coverage['/refpath'].post.callCount).toEqual(2)

    expect(coverage['/refpath'].post).toHaveProperty('responses.201.callCount')
    expect(coverage['/refpath'].post.responses['201'].callCount).toEqual(1)

    expect(coverage['/refpath'].post).toHaveProperty('responses.400.callCount')
    expect(coverage['/refpath'].post.responses['400'].callCount).toEqual(1)

    expect(coverage['/refpath']).toHaveProperty('get')
    expect(coverage['/refpath'].get).toHaveProperty('callCount')
    expect(coverage['/refpath'].get.callCount).toEqual(2)

    expect(coverage['/refpath'].get).toHaveProperty('responses.200')
    expect(coverage['/refpath'].get.responses['200'].callCount).toEqual(1)

    expect(coverage['/refpath'].get).toHaveProperty('responses.400')
    expect(coverage['/refpath'].get.responses['400'].callCount).toEqual(1)
  })
})
