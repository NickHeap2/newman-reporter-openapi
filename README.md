# newman-reporter-openapi
## Newman reporter for openapi spec coverage
---

This is a Newman OpenAPI reporter for generating coverage reports from a Newman run based on an OpenAPI specification.

It was inspired by the openapi-backend projects route matching and a desire to see how much of the OpenAPI spec automated test generators were producing.

It determines coverage as how much of the path/method/response tree has requests made during the run.

```
├── path
|   └── method
|       ├── response
|       ├── response
|       └── response
└── path
    └── method
        ├── response
        └── response
```

It produces output like this:
``` console
┌─────────────────────────────────────────────────────────────────────────────────────────────────────────────────┐
│ Swagger Petstore - OpenAPI 3.0 OpenAPI coverage                                                                 │
├─────────────────────────────────────────────────────────────────────────────────────────────────────────────────┤
│ .\petstore-openapi.yaml                                                                                         │
├──────────────────────────┬──────────────────────────────────────────────────────────────────────────────────────┤
│                          │                                       Coverage                                       │
├──────────────────────────┼─────────┬───────────────────────────┬─────────────────┬─────────────────┬────────────┤
│ Path                     │ Covered │ PUT                       │ POST            │ GET             │ DELETE     │
├──────────────────────────┼─────────┼───────────────────────────┼─────────────────┼─────────────────┼────────────┤
│ /pet                     │ 0%      │ -200 -400 -404 -405 ?401  │ -200 -405 ?401  │                 │            │
├──────────────────────────┼─────────┼───────────────────────────┼─────────────────┼─────────────────┼────────────┤
│ /pet/findByStatus        │ 0%      │                           │                 │ -200 -400 ?401  │            │
├──────────────────────────┼─────────┼───────────────────────────┼─────────────────┼─────────────────┼────────────┤
│ /pet/findByTags          │ 0%      │                           │                 │ -200 -400 ?401  │            │
├──────────────────────────┼─────────┼───────────────────────────┼─────────────────┼─────────────────┼────────────┤
│ /pet/{petId}             │ 20%     │                           │ -405 ?401       │ +200 -400 -404  │ -400 ?401  │
├──────────────────────────┼─────────┼───────────────────────────┼─────────────────┼─────────────────┼────────────┤
│ /pet/{petId}/uploadImage │ 0%      │                           │ -200 ?401       │                 │            │
├──────────────────────────┼─────────┼───────────────────────────┼─────────────────┼─────────────────┼────────────┤
│ /store/inventory         │ 100%    │                           │                 │ +200            │            │
├──────────────────────────┼─────────┼───────────────────────────┼─────────────────┼─────────────────┼────────────┤
│ /store/order             │ 50%     │                           │ +200 -405       │                 │            │
├──────────────────────────┼─────────┼───────────────────────────┼─────────────────┼─────────────────┼────────────┤
│ /store/order/{orderId}   │ 40%     │                           │                 │ +200 -400 -404  │ +400 -404  │
├──────────────────────────┼─────────┼───────────────────────────┼─────────────────┼─────────────────┼────────────┤
│ /user                    │ 100%    │                           │ +default        │                 │            │
├──────────────────────────┼─────────┼───────────────────────────┼─────────────────┼─────────────────┼────────────┤
│ /user/createWithList     │ 50%     │                           │ +200 -default   │                 │            │
├──────────────────────────┼─────────┼───────────────────────────┼─────────────────┼─────────────────┼────────────┤
│ /user/login              │ 50%     │                           │                 │ +200 -400       │            │
├──────────────────────────┼─────────┼───────────────────────────┼─────────────────┼─────────────────┼────────────┤
│ /user/logout             │ 100%    │                           │                 │ +default        │            │
├──────────────────────────┼─────────┼───────────────────────────┼─────────────────┼─────────────────┼────────────┤
│ /user/{username}         │ 50%     │ +default                  │                 │ +200 -400 -404  │ +400 -404  │
├──────────────────────────┼─────────┼───────────────────────────┴─────────────────┴─────────────────┴────────────┤
│ Total API Coverage       │ 33%     │                                                                            │
└──────────────────────────┴─────────┴────────────────────────────────────────────────────────────────────────────┘
```

### Install the reporter
---
```console
npm install newman-reporter-openapi
or
npm install -g newman-reporter-openapi
```

### Reporter options
---

Add the report as a custom Newman reporter:
```console
newman --reporters openapi
```

You can include multiple Newman reporters like this:
```console
newman --reporters "cli,openapi"
```

The only required parameter for the OpenAPI reporter is the OpenAPI spec using --reporter-openapi-spec:
```console
--reporter-openapi-spec ./openapi.yaml
```

The reporter will check each Newman API call against the server list in your OpenAPI spec.

If the server isn't in that list, for local testing for example, you can specify it via --reporter-openapi-serverUrl
```console
--reporter-openapi-serverUrl http://127.0.0.1/3000
```

The reporter has three different report styles with different layouts. The default is wide.

```console
--reporter-openapi-reportstyle wide
--reporter-openapi-reportstyle tall
--reporter-openapi-reportstyle summary
```

Coming soon --exportFilename for a json based export of the coverage.

### Report symbols
---

In the reports the response codes have the following symbols:
  * \+ shows a response that was received
  * \- shows a response that was not received
  * \? shows a received response that was not part of the spec

### Report styles
---

There are three different versions of the report.

wide - best for when your spec has many different paths (the default)
```
┌─────────────────────────────────────────────────────────────────────────────────────────────────────────────────┐
│ Swagger Petstore - OpenAPI 3.0 OpenAPI coverage                                                                 │
├─────────────────────────────────────────────────────────────────────────────────────────────────────────────────┤
│ .\petstore-openapi.yaml                                                                                         │
├──────────────────────────┬──────────────────────────────────────────────────────────────────────────────────────┤
│                          │                                       Coverage                                       │
├──────────────────────────┼─────────┬───────────────────────────┬─────────────────┬─────────────────┬────────────┤
│ Path                     │ Covered │ PUT                       │ POST            │ GET             │ DELETE     │
├──────────────────────────┼─────────┼───────────────────────────┼─────────────────┼─────────────────┼────────────┤
│ /pet                     │ 0%      │ -200 -400 -404 -405 ?401  │ -200 -405 ?401  │                 │            │
├──────────────────────────┼─────────┼───────────────────────────┼─────────────────┼─────────────────┼────────────┤
│ /pet/findByStatus        │ 0%      │                           │                 │ -200 -400 ?401  │            │
├──────────────────────────┼─────────┼───────────────────────────┼─────────────────┼─────────────────┼────────────┤
│ /pet/findByTags          │ 0%      │                           │                 │ -200 -400 ?401  │            │
├──────────────────────────┼─────────┼───────────────────────────┼─────────────────┼─────────────────┼────────────┤
│ /pet/{petId}             │ 20%     │                           │ -405 ?401       │ +200 -400 -404  │ -400 ?401  │
├──────────────────────────┼─────────┼───────────────────────────┼─────────────────┼─────────────────┼────────────┤
│ /pet/{petId}/uploadImage │ 0%      │                           │ -200 ?401       │                 │            │
├──────────────────────────┼─────────┼───────────────────────────┼─────────────────┼─────────────────┼────────────┤
│ /store/inventory         │ 100%    │                           │                 │ +200            │            │
├──────────────────────────┼─────────┼───────────────────────────┼─────────────────┼─────────────────┼────────────┤
│ /store/order             │ 50%     │                           │ +200 -405       │                 │            │
├──────────────────────────┼─────────┼───────────────────────────┼─────────────────┼─────────────────┼────────────┤
│ /store/order/{orderId}   │ 40%     │                           │                 │ +200 -400 -404  │ +400 -404  │
├──────────────────────────┼─────────┼───────────────────────────┼─────────────────┼─────────────────┼────────────┤
│ /user                    │ 100%    │                           │ +default        │                 │            │
├──────────────────────────┼─────────┼───────────────────────────┼─────────────────┼─────────────────┼────────────┤
│ /user/createWithList     │ 50%     │                           │ +200 -default   │                 │            │
├──────────────────────────┼─────────┼───────────────────────────┼─────────────────┼─────────────────┼────────────┤
│ /user/login              │ 50%     │                           │                 │ +200 -400       │            │
├──────────────────────────┼─────────┼───────────────────────────┼─────────────────┼─────────────────┼────────────┤
│ /user/logout             │ 100%    │                           │                 │ +default        │            │
├──────────────────────────┼─────────┼───────────────────────────┼─────────────────┼─────────────────┼────────────┤
│ /user/{username}         │ 50%     │ +default                  │                 │ +200 -400 -404  │ +400 -404  │
├──────────────────────────┼─────────┼───────────────────────────┴─────────────────┴─────────────────┴────────────┤
│ Total API Coverage       │ 33%     │                                                                            │
└──────────────────────────┴─────────┴────────────────────────────────────────────────────────────────────────────┘
```

tall - an option for APIs with a small number of paths otherwise it can get too tall
```
┌──────────────────────────────────────────────────────────────────────────────────────────────────────┐
│ Swagger Petstore - OpenAPI 3.0 OpenAPI coverage                                                      │
├──────────────────────────────────────────────────────────────────────────────────────────────────────┤
│ .\petstore-openapi.yaml                                                                              │
├──────────────────────────┬───────────────────────────────────────────────────────────────────────────┤
│ Path                     │                                 Coverage                                  │
├──────────┬───────────────┼─────────┬───────────────────┬──────────────────────┬──────────────────────┤
│          │ Method        │ Covered │ Covered Responses │ Uncovered Responses  │ Unexpected Responses │
├──────────┴───────────────┼─────────┼───────────────────┴──────────────────────┴──────────────────────┤
│ /pet                     │ 0%      │                                                                 │
├──────────┬───────────────┼─────────┼───────────────────┬──────────────────────┬──────────────────────┤
│          │ put           │ 0%      │                   │ -200 -400 -404 -405  │ ?401                 │
├──────────┼───────────────┼─────────┼───────────────────┼──────────────────────┼──────────────────────┤
│          │ post          │ 0%      │                   │ -200 -405            │ ?401                 │
├──────────┴───────────────┼─────────┼───────────────────┴──────────────────────┴──────────────────────┤
│ /pet/findByStatus        │ 0%      │                                                                 │
├──────────┬───────────────┼─────────┼───────────────────┬──────────────────────┬──────────────────────┤
│          │ get           │ 0%      │                   │ -200 -400            │ ?401                 │
├──────────┴───────────────┼─────────┼───────────────────┴──────────────────────┴──────────────────────┤
│ /pet/findByTags          │ 0%      │                                                                 │
├──────────┬───────────────┼─────────┼───────────────────┬──────────────────────┬──────────────────────┤
│          │ get           │ 0%      │                   │ -200 -400            │ ?401                 │
├──────────┴───────────────┼─────────┼───────────────────┴──────────────────────┴──────────────────────┤
│ /pet/{petId}             │ 20%     │                                                                 │
├──────────┬───────────────┼─────────┼───────────────────┬──────────────────────┬──────────────────────┤
│          │ get           │ 33%     │ +200              │ -400 -404            │                      │
├──────────┼───────────────┼─────────┼───────────────────┼──────────────────────┼──────────────────────┤
│          │ post          │ 0%      │                   │ -405                 │ ?401                 │
├──────────┼───────────────┼─────────┼───────────────────┼──────────────────────┼──────────────────────┤
│          │ delete        │ 0%      │                   │ -400                 │ ?401                 │
├──────────┴───────────────┼─────────┼───────────────────┴──────────────────────┴──────────────────────┤
│ /pet/{petId}/uploadImage │ 0%      │                                                                 │
├──────────┬───────────────┼─────────┼───────────────────┬──────────────────────┬──────────────────────┤
│          │ post          │ 0%      │                   │ -200                 │ ?401                 │
├──────────┴───────────────┼─────────┼───────────────────┴──────────────────────┴──────────────────────┤
│ /store/inventory         │ 100%    │                                                                 │
├──────────┬───────────────┼─────────┼───────────────────┬──────────────────────┬──────────────────────┤
│          │ get           │ 100%    │ +200              │                      │                      │
├──────────┴───────────────┼─────────┼───────────────────┴──────────────────────┴──────────────────────┤
│ /store/order             │ 50%     │                                                                 │
├──────────┬───────────────┼─────────┼───────────────────┬──────────────────────┬──────────────────────┤
│          │ post          │ 50%     │ +200              │ -405                 │                      │
├──────────┴───────────────┼─────────┼───────────────────┴──────────────────────┴──────────────────────┤
│ /store/order/{orderId}   │ 40%     │                                                                 │
├──────────┬───────────────┼─────────┼───────────────────┬──────────────────────┬──────────────────────┤
│          │ get           │ 33%     │ +200              │ -400 -404            │                      │
├──────────┼───────────────┼─────────┼───────────────────┼──────────────────────┼──────────────────────┤
│          │ delete        │ 50%     │ +400              │ -404                 │                      │
├──────────┴───────────────┼─────────┼───────────────────┴──────────────────────┴──────────────────────┤
│ /user                    │ 100%    │                                                                 │
├──────────┬───────────────┼─────────┼───────────────────┬──────────────────────┬──────────────────────┤
│          │ post          │ 100%    │ +default          │                      │                      │
├──────────┴───────────────┼─────────┼───────────────────┴──────────────────────┴──────────────────────┤
│ /user/createWithList     │ 50%     │                                                                 │
├──────────┬───────────────┼─────────┼───────────────────┬──────────────────────┬──────────────────────┤
│          │ post          │ 50%     │ +200              │ -default             │                      │
├──────────┴───────────────┼─────────┼───────────────────┴──────────────────────┴──────────────────────┤
│ /user/login              │ 50%     │                                                                 │
├──────────┬───────────────┼─────────┼───────────────────┬──────────────────────┬──────────────────────┤
│          │ get           │ 50%     │ +200              │ -400                 │                      │
├──────────┴───────────────┼─────────┼───────────────────┴──────────────────────┴──────────────────────┤
│ /user/logout             │ 100%    │                                                                 │
├──────────┬───────────────┼─────────┼───────────────────┬──────────────────────┬──────────────────────┤
│          │ get           │ 100%    │ +default          │                      │                      │
├──────────┴───────────────┼─────────┼───────────────────┴──────────────────────┴──────────────────────┤
│ /user/{username}         │ 50%     │                                                                 │
├──────────┬───────────────┼─────────┼───────────────────┬──────────────────────┬──────────────────────┤
│          │ get           │ 33%     │ +200              │ -400 -404            │                      │
├──────────┼───────────────┼─────────┼───────────────────┼──────────────────────┼──────────────────────┤
│          │ put           │ 100%    │ +default          │                      │                      │
├──────────┼───────────────┼─────────┼───────────────────┼──────────────────────┼──────────────────────┤
│          │ delete        │ 50%     │ +400              │ -404                 │                      │
├──────────┴───────────────┼─────────┼───────────────────┴──────────────────────┴──────────────────────┤
│ Total API Coverage       │ 33%     │                                                                 │
└──────────────────────────┴─────────┴─────────────────────────────────────────────────────────────────┘
```

summary - for a basic summary of the coverage without path or response details
```
┌─────────────────────────────────────────────────┐
│ Swagger Petstore - OpenAPI 3.0 OpenAPI coverage │
├─────────────────────────────────────────────────┤
│ .\petstore-openapi.yaml                         │
├────────────────────────────────┬────────────────┤
│ Path                           │    Coverage    │
├────────────────────────────────┼────────────────┤
│ /pet                           │ 0%             │
├────────────────────────────────┼────────────────┤
│ /pet/findByStatus              │ 0%             │
├────────────────────────────────┼────────────────┤
│ /pet/findByTags                │ 0%             │
├────────────────────────────────┼────────────────┤
│ /pet/{petId}                   │ 20%            │
├────────────────────────────────┼────────────────┤
│ /pet/{petId}/uploadImage       │ 0%             │
├────────────────────────────────┼────────────────┤
│ /store/inventory               │ 100%           │
├────────────────────────────────┼────────────────┤
│ /store/order                   │ 50%            │
├────────────────────────────────┼────────────────┤
│ /store/order/{orderId}         │ 40%            │
├────────────────────────────────┼────────────────┤
│ /user                          │ 100%           │
├────────────────────────────────┼────────────────┤
│ /user/createWithList           │ 50%            │
├────────────────────────────────┼────────────────┤
│ /user/login                    │ 50%            │
├────────────────────────────────┼────────────────┤
│ /user/logout                   │ 100%           │
├────────────────────────────────┼────────────────┤
│ /user/{username}               │ 50%            │
├────────────────────────────────┼────────────────┤
│ Total API Coverage             │ 33%            │
└────────────────────────────────┴────────────────┘
```
