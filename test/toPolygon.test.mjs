import assert from 'assert'
import toPolygon from '../src/toPolygon.mjs'


describe(`toPolygon`, function() {
    let k = -1
    let oin = {}
    let out = {}

    k++
    oin[k] = {
        rs: [[0, 0], [100, 0], [100, 1], [0, 1], [0, 0]],
    }
    out[k] = [[[0, 0], [100, 0], [100, 1], [0, 1], [0, 0]]]
    it(`should convert closed ringString when toPolygon(ringString)`, function() {
        k = 0
        let r = toPolygon(oin[k].rs)
        let rr = out[k]
        assert.strict.deepStrictEqual(r, rr)
    })

    k++
    oin[k] = {
        rs: [[0, 0], [100, 0], [100, 1], [0, 1]],
    }
    out[k] = [[[0, 0], [100, 0], [100, 1], [0, 1]]]
    it(`should convert open ringString when toPolygon(ringString)`, function() {
        k = 1
        let r = toPolygon(oin[k].rs)
        let rr = out[k]
        assert.strict.deepStrictEqual(r, rr)
    })

    k++
    oin[k] = {
        rs: [
            [[0, 0], [100, 0], [100, 1], [0, 1]],
        ],
    }
    out[k] = [[[0, 0], [100, 0], [100, 1], [0, 1]]]
    it(`should keep single polygon when toPolygon(polygon)`, function() {
        k = 2
        let r = toPolygon(oin[k].rs)
        let rr = out[k]
        assert.strict.deepStrictEqual(r, rr)
    })

    k++
    oin[k] = {
        rs: [
            [[0, 0], [10, 0], [10, 1], [0, 1]],
        ],
    }
    out[k] = [[[0, 0], [10, 0], [10, 1], [0, 1]]]
    it(`should keep polygon width=10 when toPolygon(polygon)`, function() {
        k = 3
        let r = toPolygon(oin[k].rs)
        let rr = out[k]
        assert.strict.deepStrictEqual(r, rr)
    })

    k++
    oin[k] = {
        rs: [
            [[0, 0], [100, 0], [100, 1], [0, 1]],
            [[0, 0], [10, 0], [10, 1], [0, 1]],
        ],
    }
    out[k] = [[[0, 0], [100, 0], [100, 1], [0, 1]], [[0, 0], [10, 0], [10, 1], [0, 1]]]
    it(`should keep polygon with two rings when toPolygon(polygon)`, function() {
        k = 4
        let r = toPolygon(oin[k].rs)
        let rr = out[k]
        assert.strict.deepStrictEqual(r, rr)
    })

    k++
    oin[k] = {
        rs: [[
            [[0, 0], [100, 0], [100, 1], [0, 1]],
            [[0, 0], [10, 0], [10, 1], [0, 1]],
        ]],
    }
    out[k] = [[[0, 0], [100, 0], [100, 1], [0, 1]], [[0, 0], [10, 0], [10, 1], [0, 1]]]
    it(`should flatten one multiPolygon when toPolygon(multiPolygon)`, function() {
        k = 5
        let r = toPolygon(oin[k].rs)
        let rr = out[k]
        assert.strict.deepStrictEqual(r, rr)
    })

})
