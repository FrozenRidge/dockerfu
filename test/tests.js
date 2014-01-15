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

  describe('parsePrefixMaps', function() {

    it('should correctly parse prefix maps', function() {

      dockerfu.config.prefixMaps = "frozenridge:frozenridge.co,stridercd:stridercd.com"
      var r = dockerfu.parsePrefixMaps(dockerfu.config)

      expect(r).to.have.length(2)
      expect(r[0]).to.have.length(2)
      expect(r[0][0]).to.eql("frozenridge")
      expect(r[0][1]).to.eql("frozenridge.co")

    })

  })




})
