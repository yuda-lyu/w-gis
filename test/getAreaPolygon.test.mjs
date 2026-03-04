import assert from 'assert'
import getAreaPolygon from '../src/getAreaPolygon.mjs'


describe(`getAreaPolygon`, function() {
    let k = -1
    let oin = {}
    let out = {}

    k++
    oin[k] = {
        pg: [[0, 0], [100, 0], [100, 1], [0, 1], [0, 0]],
    }
    out[k] = 100
    it(`should return area when getAreaPolygon(closed ringString)`, function() {
        k = 0
        let r = getAreaPolygon(oin[k].pg)
        let rr = out[k]
        assert.strict.deepStrictEqual(r, rr)
    })

    k++
    oin[k] = {
        pg: [[0, 0], [100, 0], [100, 1], [0, 1]],
    }
    out[k] = 100
    it(`should return same area when getAreaPolygon(open ringString)`, function() {
        k = 1
        let r = getAreaPolygon(oin[k].pg)
        let rr = out[k]
        assert.strict.deepStrictEqual(r, rr)
    })

    k++
    oin[k] = {
        pg: [
            [[0, 0], [100, 0], [100, 1], [0, 1]],
        ],
    }
    out[k] = 100
    it(`should return area when getAreaPolygon(single polygon)`, function() {
        k = 2
        let r = getAreaPolygon(oin[k].pg)
        let rr = out[k]
        assert.strict.deepStrictEqual(r, rr)
    })

    k++
    oin[k] = {
        pg: [
            [[0, 0], [10, 0], [10, 1], [0, 1]],
        ],
    }
    out[k] = 10
    it(`should return area when getAreaPolygon(polygon width=10)`, function() {
        k = 3
        let r = getAreaPolygon(oin[k].pg)
        let rr = out[k]
        assert.strict.deepStrictEqual(r, rr)
    })

    k++
    oin[k] = {
        pg: [
            [[0, 0], [100, 0], [100, 1], [0, 1]],
            [[0, 0], [10, 0], [10, 1], [0, 1]],
        ],
    }
    out[k] = 90
    it(`should subtract inner ring when getAreaPolygon(two ringStrings)`, function() {
        k = 4
        let r = getAreaPolygon(oin[k].pg)
        let rr = out[k]
        assert.strict.deepStrictEqual(r, rr)
    })

    k++
    oin[k] = {
        pg: [
            [[0, 0], [100, 0], [100, 1], [0, 1]],
            [[200, 0], [210, 0], [210, 1], [200, 1]],
        ],
    }
    out[k] = 90
    it(`should keep current behavior when getAreaPolygon(disjoint second ringString)`, function() {
        k = 5
        let r = getAreaPolygon(oin[k].pg)
        let rr = out[k]
        assert.strict.deepStrictEqual(r, rr)
    })

})
