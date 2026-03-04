import assert from 'assert'
import toMultiPoint from '../src/toMultiPoint.mjs'


describe(`toMultiPoint`, function() {
    let k = -1
    let oin = {}
    let out = {}

    k++
    oin[k] = {
        pgs: [[0, 0], [100, 0], [100, 1], [0, 1], [0, 0]],
    }
    out[k] = { type: 'Feature', properties: {}, geometry: { type: 'MultiPoint', coordinates: [[0, 0], [100, 0], [100, 1], [0, 1], [0, 0]] } }
    it(`should convert closed ringString when toMultiPoint(ringString)`, function() {
        k = 0
        let r = toMultiPoint(oin[k].pgs)
        let rr = out[k]
        assert.strict.deepStrictEqual(r, rr)
    })

    k++
    oin[k] = {
        pgs: [[0, 0], [100, 0], [100, 1], [0, 1]],
    }
    out[k] = { type: 'Feature', properties: {}, geometry: { type: 'MultiPoint', coordinates: [[0, 0], [100, 0], [100, 1], [0, 1]] } }
    it(`should convert open ringString when toMultiPoint(ringString)`, function() {
        k = 1
        let r = toMultiPoint(oin[k].pgs)
        let rr = out[k]
        assert.strict.deepStrictEqual(r, rr)
    })

    k++
    oin[k] = {
        pgs: [
            [[0, 0], [100, 0], [100, 1], [0, 1]],
        ],
    }
    out[k] = { type: 'Feature', properties: {}, geometry: { type: 'MultiPoint', coordinates: [[0, 0], [100, 0], [100, 1], [0, 1]] } }
    it(`should convert single polygon when toMultiPoint(polygon)`, function() {
        k = 2
        let r = toMultiPoint(oin[k].pgs)
        let rr = out[k]
        assert.strict.deepStrictEqual(r, rr)
    })

    k++
    oin[k] = {
        pgs: [
            [[0, 0], [10, 0], [10, 1], [0, 1]],
        ],
    }
    out[k] = { type: 'Feature', properties: {}, geometry: { type: 'MultiPoint', coordinates: [[0, 0], [10, 0], [10, 1], [0, 1]] } }
    it(`should convert polygon width=10 when toMultiPoint(polygon)`, function() {
        k = 3
        let r = toMultiPoint(oin[k].pgs)
        let rr = out[k]
        assert.strict.deepStrictEqual(r, rr)
    })

    k++
    oin[k] = {
        pgs: [
            [[0, 0], [100, 0], [100, 1], [0, 1]],
            [[0, 0], [10, 0], [10, 1], [0, 1]],
        ],
    }
    out[k] = { type: 'Feature', properties: {}, geometry: { type: 'MultiPoint', coordinates: [[0, 0], [100, 0], [100, 1], [0, 1], [0, 0], [10, 0], [10, 1], [0, 1]] } }
    it(`should convert two polygons when toMultiPoint(polygon array)`, function() {
        k = 4
        let r = toMultiPoint(oin[k].pgs)
        let rr = out[k]
        assert.strict.deepStrictEqual(r, rr)
    })

    k++
    oin[k] = {
        pgs: [[
            [[0, 0], [100, 0], [100, 1], [0, 1]],
            [[0, 0], [10, 0], [10, 1], [0, 1]],
        ]],
    }
    out[k] = { type: 'Feature', properties: {}, geometry: { type: 'MultiPoint', coordinates: [[0, 0], [100, 0], [100, 1], [0, 1], [0, 0], [10, 0], [10, 1], [0, 1]] } }
    it(`should convert multiPolygon when toMultiPoint(multiPolygon)`, function() {
        k = 5
        let r = toMultiPoint(oin[k].pgs)
        let rr = out[k]
        assert.strict.deepStrictEqual(r, rr)
    })

})
