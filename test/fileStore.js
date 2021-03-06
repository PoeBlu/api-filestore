var EventEmitter = require('events').EventEmitter
var FileStoreAdapter = require('../lib')
var fs = require('fs')
var path = require('path')
var querystring = require('querystring')
var should = require('should')
var url = require('url')
var uuid = require('uuid')

var config = require(__dirname + '/../config')

describe('FileStore', function () {
  this.timeout(15000)

  beforeEach(function (done) {
    done()
  })

  afterEach(function(done) {
    setTimeout(function() {
      done()
    }, 1000)
  })

  after(function (done) {
    console.log('\n  Finished, waiting for database to be written to disk...')
    setTimeout(function() {
      try {
        fs.unlinkSync(path.resolve(path.join(config.get('database.path'), 'auth.db')))
        fs.unlinkSync(path.resolve(path.join(config.get('database.path'), 'content.db')))
        fs.rmdirSync(path.resolve(config.get('database.path')))
        fs.rmdirSync(path.resolve(config.get('database.path') + '2'))
      } catch(err) {
        console.log(err)
      }

      done()
    }, 7000)
  })

  describe('constructor', function () {
    it('should be exposed', function (done) {
      FileStoreAdapter.should.be.Function
      done()
    })

    it('should inherit from EventEmitter', function (done) {
      var fileStore = new FileStoreAdapter()
      fileStore.should.be.an.instanceOf(EventEmitter)
      fileStore.emit.should.be.Function
      done()
    })

    it('should load config if no options supplied', function (done) {
      var fileStore = new FileStoreAdapter()
      should.exist(fileStore.config)
      fileStore.config.database.path.should.eql('test/workspace')
      done()
    })

    it('should load config from options supplied', function (done) {
      var fileStore = new FileStoreAdapter({ database: { path: 'test/workspace2' } })
      should.exist(fileStore.config)
      fileStore.config.database.path.should.eql('test/workspace2')
      done()
    })

    it('should have readyState == 0 when initialised', function (done) {
      var fileStore = new FileStoreAdapter()
      fileStore.readyState.should.eql(0)
      done()
    })
  })

  describe('connect', function () {
    it('should create and return database when connecting', function (done) {
      var fileStore = new FileStoreAdapter()
      fileStore.connect({ database: 'content' })
      should.exist(fileStore.database)
      done()
    })

    it('should have readyState == 1 when connected', function (done) {
      var fileStore = new FileStoreAdapter()
      fileStore.connect({ database: 'content', collection: 'posts' }).then(() => {
        fileStore.readyState.should.eql(1)
        done()
      })
    })
  })

  describe('insert', function () {
    it('should insert a single document into the database', function (done) {
      var fileStore = new FileStoreAdapter()
      fileStore.connect({ database: 'content', collection: 'users' }).then(() => {
        var user = { name: 'David' }

        fileStore.insert({ data: user, collection: 'users', schema: {}}).then((results) => {
          results.constructor.name.should.eql('Array')
          results[0].name.should.eql('David')
          done()
        })
      })
    })

    it('should insert an array of documents into the database', function (done) {
      var fileStore = new FileStoreAdapter()
      fileStore.connect({ database: 'content', collection: 'users' }).then(() => {
        var users = [{ name: 'Ernest' }, { name: 'Wallace' }]

        fileStore.insert({ data: users, collection: 'users', schema: {}}).then((results) => {
          results.constructor.name.should.eql('Array')
          results.length.should.eql(2)
          results[0].name.should.eql('Ernest')
          results[1].name.should.eql('Wallace')
          done()
        })
      })
    })

    it('should add _id property if one isn\'t specified', function (done) {
      var fileStore = new FileStoreAdapter()
      fileStore.connect({ database: 'content', collection: 'users' }).then(() => {
        var users = [{ name: 'Ernest' }, { name: 'Wallace' }]

        fileStore.insert({ data: users, collection: 'users', schema: {}}).then((results) => {
          results.constructor.name.should.eql('Array')
          results.length.should.eql(2)
          results[0].name.should.eql('Ernest')
          should.exist(results[0]._id)
          done()
        })
      })
    })

    it('should use specified _id property if one is specified', function (done) {
      var fileStore = new FileStoreAdapter()
      fileStore.connect({ database: 'content', collection: 'users' }).then(() => {
        var users = [{ _id: uuid.v4(), name: 'Ernest' }, { name: 'Wallace' }]

        fileStore.insert({ data: users, collection: 'users', schema: {}}).then((results) => {
          results.constructor.name.should.eql('Array')
          results.length.should.eql(2)
          results[0].name.should.eql('Ernest')
          results[0]._id.should.eql(users[0]._id)
          done()
        })
      })
    })
  })

  describe('find', function () {
    it('should find a single document in the database', function (done) {
      var fileStore = new FileStoreAdapter()
      fileStore.connect({ database: 'content', collection: 'users' }).then(() => {
        var users = [{ name: 'Ernest' }, { name: 'Wallace' }]

        fileStore.insert({ data: users, collection: 'users', schema: {}}).then((results) => {
          fileStore.find({ query: { name: 'Wallace' }, collection: 'users', options: {}}).then((results) => {
            results.results.constructor.name.should.eql('Array')
            results.results[0].name.should.eql('Wallace')
            done()
          })
        })
      })
    })

    it('should return the number of records requested when using `limit`', function (done) {
      var fileStore = new FileStoreAdapter()
      fileStore.connect({ database: 'content', collection: 'users' }).then(() => {

        fileStore.getCollection('users').then((collection) => {
          collection.clear()

          var users = [{ name: 'BigBird' }, { name: 'Ernie' }, { name: 'Oscar' }]

          fileStore.insert({ data: users, collection: 'users', schema: {}}).then((results) => {
            fileStore.find({ query: {}, collection: 'users', options: { limit: 2 }}).then((results) => {
              results.results.constructor.name.should.eql('Array')
              results.results.length.should.eql(2)
              done()
            }).catch((err) => {
              done(err)
            })
          }).catch((err) => {
            done(err)
          })
        })
      })
    })

    it('should sort records in ascending order by the `$loki` property when no query or sort are provided', function (done) {
      var fileStore = new FileStoreAdapter()
      fileStore.connect({ database: 'content', collection: 'users' }).then(() => {

        fileStore.getCollection('users').then((collection) => {
          collection.clear()

          var users = [{ name: 'Ernie' }, { name: 'Oscar' }, { name: 'BigBird' }]

          fileStore.insert({ data: users, collection: 'users', schema: {}}).then((results) => {
            fileStore.find({ query: {}, collection: 'users'}).then((results) => {

              results.results.constructor.name.should.eql('Array')
              results.results.length.should.eql(3)

              results.results[0].name.should.eql('Ernie')
              results.results[1].name.should.eql('Oscar')
              results.results[2].name.should.eql('BigBird')
              done()
            }).catch((err) => {
              done(err)
            })
          }).catch((err) => {
            done(err)
          })
        })
      })
    })

    it('should sort records in ascending order by the query property when no sort is provided', function (done) {
      var fileStore = new FileStoreAdapter()
      fileStore.connect({ database: 'content', collection: 'users' }).then(() => {

        fileStore.getCollection('users').then((collection) => {
          collection.clear()

          var users = [{ name: 'BigBird 3' }, { name: 'BigBird 1' }, { name: 'BigBird 2' }]

          fileStore.insert({ data: users, collection: 'users', schema: {}}).then((results) => {
            fileStore.find({ query: { name: { '$regex': 'Big' } }, collection: 'users'}).then((results) => {
              results.results.constructor.name.should.eql('Array')
              results.results.length.should.eql(3)
              results.results[0].name.should.eql('BigBird 3')
              results.results[1].name.should.eql('BigBird 1')
              results.results[2].name.should.eql('BigBird 2')
              done()
            }).catch((err) => {
              done(err)
            })
          }).catch((err) => {
            done(err)
          })
        })
      })
    })

    it('should sort records in ascending order by the specified property', function (done) {
      var fileStore = new FileStoreAdapter()
      fileStore.connect({ database: 'content', collection: 'users' }).then(() => {

        fileStore.getCollection('users').then((collection) => {
          collection.clear()

          var users = [{ name: 'Ernie' }, { name: 'Oscar' }, { name: 'BigBird' }]

          fileStore.insert({ data: users, collection: 'users', schema: {}}).then((results) => {
            fileStore.find({ query: {}, collection: 'users', options: { sort: { name: 1 } }}).then((results) => {
              results.results.constructor.name.should.eql('Array')
              results.results.length.should.eql(3)
              results.results[0].name.should.eql('BigBird')
              results.results[1].name.should.eql('Ernie')
              results.results[2].name.should.eql('Oscar')
              done()
            }).catch((err) => {
              done(err)
            })
          }).catch((err) => {
            done(err)
          })
        })
      })
    })

    it('should sort records in descending order by the specified property', function (done) {
      var fileStore = new FileStoreAdapter()
      fileStore.connect({ database: 'content', collection: 'users' }).then(() => {

        fileStore.getCollection('users').then(collection => {
          collection.clear()

          var users = [{ name: 'Ernie' }, { name: 'Oscar' }, { name: 'BigBird' }]

          fileStore.insert({ data: users, collection: 'users', schema: {}}).then(results => {
            fileStore.find({ query: {}, collection: 'users', options: { sort: { name: -1 } }}).then(results => {
              results.results.constructor.name.should.eql('Array')
              results.results.length.should.eql(3)
              results.results[0].name.should.eql('Oscar')
              results.results[1].name.should.eql('Ernie')
              results.results[2].name.should.eql('BigBird')
              done()
            }).catch((err) => {
              done(err)
            })
          }).catch((err) => {
            done(err)
          })
        })
      })
    })

    it('should return only the fields specified by the `fields` property', function (done) {
      var fileStore = new FileStoreAdapter()
      fileStore.connect({ database: 'content', collection: 'users' }).then(() => {

        fileStore.getCollection('users').then((collection) => {
          collection.clear()

          var users = [{ name: 'Ernie', age: 7, colour: 'yellow' }, { name: 'Oscar', age: 9, colour: 'green' }, { name: 'BigBird', age: 13, colour: 'yellow' }]

          fileStore.insert({ data: users, collection: 'users', schema: {}}).then((results) => {
            fileStore.find({ query: { colour: 'yellow' }, collection: 'users', options: { sort: { name: 1 }, fields: { name: 1, age: 1 } }}).then((results) => {
              results.results.constructor.name.should.eql('Array')
              results.results.length.should.eql(2)

              var bigBird = results.results[0]
              should.exist(bigBird.name)
              should.exist(bigBird.age)
              should.exist(bigBird._id)
              should.not.exist(bigBird.colour)
              done()
            }).catch((err) => {
              done(err)
            })
          }).catch((err) => {
            done(err)
          })
        })
      })
    })
  })

  describe('update', function () {
    describe('$set', function () {
      it('should update documents matching the query', function (done) {
        var fileStore = new FileStoreAdapter()
        fileStore.connect({ database: 'content', collection: 'users' }).then(() => {

          fileStore.getCollection('users').then((collection) => {
            collection.clear()

            var users = [{ name: 'Ernie', age: 7, colour: 'yellow' }, { name: 'Oscar', age: 9, colour: 'green' }, { name: 'BigBird', age: 13, colour: 'yellow' }]

            fileStore.insert({ data: users, collection: 'users', schema: {}}).then((results) => {
              fileStore.update({ query: { colour: 'green' }, collection: 'users', update: { '$set': { colour: 'yellow' } }}).then((results) => {
                fileStore.find({ query: { colour: 'yellow' }, collection: 'users', options: {}}).then((results) => {
                  results.results.constructor.name.should.eql('Array')
                  results.results.length.should.eql(3)
                  done()
                }).catch((err) => {
                  done(err)
                })
              }).catch((err) => {
                done(err)
              })
            }).catch((err) => {
              done(err)
            })
          })
        })
      })
    })

    describe('$inc', function () {
      it('should update documents matching the query', function (done) {
        var fileStore = new FileStoreAdapter()
        fileStore.connect({ database: 'content', collection: 'users' }).then(() => {

          fileStore.getCollection('users').then((collection) => {
            collection.clear()

            var users = [{ name: 'Ernie', age: 7, colour: 'yellow' }, { name: 'Oscar', age: 9, colour: 'green' }, { name: 'BigBird', age: 13, colour: 'yellow' }]

            fileStore.insert({ data: users, collection: 'users', schema: {}}).then((results) => {
              fileStore.update({ query: { colour: 'green' }, collection: 'users', update: { '$inc': { age: 10 } }}).then((results) => {
                fileStore.find({ query: { colour: 'green' }, collection: 'users', options: {}}).then((results) => {
                  results.results.constructor.name.should.eql('Array')
                  results.results.length.should.eql(1)
                  results.results[0].age.should.eql(19)
                  done()
                }).catch((err) => {
                  done(err)
                })
              }).catch((err) => {
                done(err)
              })
            }).catch((err) => {
              done(err)
            })
          })
        })
      })
    })
  })

  describe('delete', function () {
    it('should delete documents matching the query', function (done) {
      var fileStore = new FileStoreAdapter()
      fileStore.connect({ database: 'content', collection: 'users' }).then(() => {

        fileStore.getCollection('users').then((collection) => {
          collection.clear()

          var users = [{ name: 'Ernie', age: 7, colour: 'yellow' }, { name: 'Oscar', age: 9, colour: 'green' }, { name: 'BigBird', age: 13, colour: 'yellow' }]

          fileStore.insert({ data: users, collection: 'users', schema: {}}).then((results) => {
            fileStore.delete({ query: { colour: 'green' }, collection: 'users'}).then((results) => {
              fileStore.find({ query: {}, collection: 'users', options: {}}).then((results) => {
                results.results.constructor.name.should.eql('Array')
                results.results.length.should.eql(2)
                done()
              }).catch((err) => {
                done(err)
              })
            }).catch((err) => {
              done(err)
            })
          }).catch((err) => {
            done(err)
          })
        })
      })
    })
  })

  describe('index', function () {
    it('should add indexes to the collection specified and return index names', function (done) {
      var fileStore = new FileStoreAdapter()
      fileStore.connect({ database: 'content', collection: 'users' }).then(() => {
        fileStore.getCollection('users').then(collection => {
          collection.clear()

          let indexes = [
            {
              keys: {
                name: 1
              }
            }
          ]

          fileStore.index(collection, indexes).then(results => {
            results[0].index.should.eql('name')

            fileStore.getIndexes(collection).then(results => {
              results[0].name.should.eql('name')
              done()
            })
          }).catch((err) => {
            done(err)
          })
        })
      })
    })
  })

  describe('database', function () {
    it('should contain all collections that have been inserted into', function (done) {
      var fileStore = new FileStoreAdapter()
      fileStore.connect({ database: 'content', collection: 'users' }).then(() => {
        var user = { name: 'David' }

        fileStore.insert({ data: user, collection: 'users', schema: {}}).then((results) => {
          results.constructor.name.should.eql('Array')
          results[0].name.should.eql('David')

          fileStore.connect({ database: 'content', collection: 'posts' }).then(() => {
            var post = { title: 'David on Holiday' }

            fileStore.insert({ data: post, collection: 'posts',  schema: {}}).then((results) => {
              results.constructor.name.should.eql('Array')
              results[0].title.should.eql('David on Holiday')

              var u = fileStore.database.getCollection('users')
              var p = fileStore.database.getCollection('posts')
              should.exist(u)
              should.exist(p)
              done()
            }).catch((err) => {
              done(err)
            })
          }).catch((err) => {
            done(err)
          })
        })
      })
    })

    it('should handle connection to multiple databases', function (done) {
      var contentStore = new FileStoreAdapter()
      var authStore = new FileStoreAdapter()

      contentStore.connect({ database: 'content' }).then(() => {
        authStore.connect({ database: 'auth' }).then(() => {
          contentStore.insert({ data: { name: 'Jim' }, collection: 'users', schema: {}}).then((results) => {
            authStore.insert({ data: { token: '123456123456123456123456' }, collection: 'token-store', schema: {}}).then((results) => {
              contentStore.find({ query: { name: 'Jim' }, collection: 'users', options: {}}).then((results) => {
                results.results.constructor.name.should.eql('Array')
                results.results[0].name.should.eql('Jim')

                authStore.find({ query: { token: '123456123456123456123456' }, collection: 'token-store', options: {}}).then((results) => {
                  results.results.constructor.name.should.eql('Array')
                  results.results[0].token.should.eql('123456123456123456123456')
                  done()
                })
              })
            })
          })
        })
      })
    })
  })
})
