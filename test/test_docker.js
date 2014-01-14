var exec = require('child_process').exec
var expect = require('chai').expect
var dockerfu = require('../index.js')
var os = require('os')

var tests = function() {

  it('should do foo', function(done) {
    done()
  })

}

function whichDocker(cb) {
  exec('which docker', cb)
}

whichDocker(function(err) {
  if (err || process.getuid() !== 0) {
    tests = function() {
      console.log("WARNING: Docker not found, not running as root or not on UNIX. Skipping Docker integration tests.")
    }
  }
  describe('#dockerfu docker integration', tests)
})


