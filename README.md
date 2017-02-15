# API FileStore Adapter

[![npm (scoped)](https://img.shields.io/npm/v/@dadi/api-filestore.svg?maxAge=10800&style=flat-square)](https://www.npmjs.com/package/@dadi/api-filestore)
[![coverage](https://img.shields.io/badge/coverage-79%25-yellow.svg?style=flat-square)](https://github.com/dadi/api-filestore)
[![Build Status](https://travis-ci.org/dadi/api-filestore.svg?branch=master)](https://travis-ci.org/dadi/api-filestore)
[![JavaScript Style Guide](https://img.shields.io/badge/code%20style-standard-brightgreen.svg?style=flat-square)](http://standardjs.com/)
[![semantic-release](https://img.shields.io/badge/%20%20%F0%9F%93%A6%F0%9F%9A%80-semantic--release-e10079.svg?style=flat-square)](https://github.com/semantic-release/semantic-release)

## Requirements

* [DADI API](https://www.npmjs.com/package/@dadi/api) Version 2.0.0 or greater

## Usage

To use this adapter with your DADI API installation, you'll need to add it to your API's dependencies:

```bash
$ cd my-api
$ npm install --save @dadi/api-filestore
```

## Tests

Run the tests:

```bash
$ git clone https://github.com/dadi/api-filestore.git
$ cd api-filestore
$ npm test
```

## Configure

### Configuration Files

Configuration settings are defined in JSON files within a `/config` directory at the root of your API application. DADI API has provision for multiple configuration files, one for each environment that your API is expected to run under: `development`, `qa` and `production`.

The naming convention for filestore configuration files follows the format `filestore.<environment>.json`

For example:

```
filestore.development.json
filestore.qa.json
filestore.production.json
```

### Application Anatomy

```sh
my-api/
  config/            # contains environment-specific
                     # configuration properties
    config.development.json
    config.qa.json
    config.production.json
    filestore.development.json
    filestore.qa.json
    filestore.production.json

  main.js            # the entry point of the app

  package.json

  workspace/
    collections/     # collection schema files
    endpoints/       # custom Javascript endpoints

```

### Configuration

```
{
  "path": "path/to/your/database.db"
}
```
