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
![wide](https://github.com/NickHeap2/newman-reporter-openapi/blob/367b9daf8710e8e1f3f4b614604a27fecac7eaab/images/wide_report.png)

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
![wide](https://github.com/NickHeap2/newman-reporter-openapi/blob/367b9daf8710e8e1f3f4b614604a27fecac7eaab/images/wide_report.png)

tall - an option for APIs with a small number of paths otherwise it can get too tall
![tall](https://github.com/NickHeap2/newman-reporter-openapi/blob/367b9daf8710e8e1f3f4b614604a27fecac7eaab/images/tall_report.png)

summary - for a basic summary of the coverage without path or response details
![summary](https://github.com/NickHeap2/newman-reporter-openapi/blob/367b9daf8710e8e1f3f4b614604a27fecac7eaab/images/summary_report.png)