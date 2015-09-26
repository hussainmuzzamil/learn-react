/* */ 
(function(process) {
  if (process.env.OBJECT_IMPL)
    global.TYPED_ARRAY_SUPPORT = false;
  var B = require("../index").Buffer;
  var test = require("tape");
  var isnan = require("is-nan");
  test('buffer.write string should get parsed as number', function(t) {
    var b = new B(64);
    b.writeUInt16LE('1003', 0);
    t.equal(b.readUInt16LE(0), 1003);
    t.end();
  });
  test('buffer.writeUInt8 a fractional number will get Math.floored', function(t) {
    var b = new B(1);
    b.writeInt8(5.5, 0);
    t.equal(b[0], 5);
    t.end();
  });
  test('writeUint8 with a negative number throws', function(t) {
    var buf = new B(1);
    t.throws(function() {
      buf.writeUInt8(-3, 0);
    });
    t.end();
  });
  test('hex of write{Uint,Int}{8,16,32}{LE,BE}', function(t) {
    t.plan(2 * (2 * 2 * 2 + 2));
    var hex = ['03', '0300', '0003', '03000000', '00000003', 'fd', 'fdff', 'fffd', 'fdffffff', 'fffffffd'];
    var reads = [3, 3, 3, 3, 3, -3, -3, -3, -3, -3];
    var xs = ['UInt', 'Int'];
    var ys = [8, 16, 32];
    for (var i = 0; i < xs.length; i++) {
      var x = xs[i];
      for (var j = 0; j < ys.length; j++) {
        var y = ys[j];
        var endianesses = (y === 8) ? [''] : ['LE', 'BE'];
        for (var k = 0; k < endianesses.length; k++) {
          var z = endianesses[k];
          var v1 = new B(y / 8);
          var writefn = 'write' + x + y + z;
          var val = (x === 'Int') ? -3 : 3;
          v1[writefn](val, 0);
          t.equal(v1.toString('hex'), hex.shift());
          var readfn = 'read' + x + y + z;
          t.equal(v1[readfn](0), reads.shift());
        }
      }
    }
    t.end();
  });
  test('hex of write{Uint,Int}{8,16,32}{LE,BE} with overflow', function(t) {
    if (!B.TYPED_ARRAY_SUPPORT) {
      t.pass('object impl: skipping overflow test');
      t.end();
      return;
    }
    t.plan(3 * (2 * 2 * 2 + 2));
    var hex = ['', '03', '00', '030000', '000000', '', 'fd', 'ff', 'fdffff', 'ffffff'];
    var reads = [undefined, 3, 0, NaN, 0, undefined, 253, -256, 16777213, -256];
    var xs = ['UInt', 'Int'];
    var ys = [8, 16, 32];
    for (var i = 0; i < xs.length; i++) {
      var x = xs[i];
      for (var j = 0; j < ys.length; j++) {
        var y = ys[j];
        var endianesses = (y === 8) ? [''] : ['LE', 'BE'];
        for (var k = 0; k < endianesses.length; k++) {
          var z = endianesses[k];
          var v1 = new B(y / 8 - 1);
          var next = new B(4);
          next.writeUInt32BE(0, 0);
          var writefn = 'write' + x + y + z;
          var val = (x === 'Int') ? -3 : 3;
          v1[writefn](val, 0, true);
          t.equal(v1.toString('hex'), hex.shift());
          t.equal(next.readUInt32BE(0), 0);
          next.writeInt32BE(~0, 0);
          var readfn = 'read' + x + y + z;
          var r = reads.shift();
          if (isnan(r))
            t.pass('equal');
          else
            t.equal(v1[readfn](0, true), r);
        }
      }
    }
    t.end();
  });
})(require("process"));