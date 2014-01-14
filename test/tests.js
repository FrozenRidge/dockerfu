var expect = require('chai').expect
var dockerfu = require('../index.js')



describe('#dockerfu', function() {

  describe('findHttpPorts', function() {

    it('should correctly find http ports', function() {

      var oldPorts = dockerfu.config.webPorts
      dockerfu.config.webPorts = "123,456"
      var samplePorts = [{PublicPort:123, PrivatePort:123}]
      var r = dockerfu.findHttpPorts(samplePorts)
      expect(r).to.eql(123)
    })

  })




})
