import assert from 'assert'
import invCoordMultiPolygonOrMultiPolyline from '../src/invCoordMultiPolygonOrMultiPolyline.mjs'


describe(`invCoordMultiPolygonOrMultiPolyline`, function() {
    let k = -1
    let oin = {}
    let out = {}

    k++
    oin[k] = {
        pgs: [[[
            [0.1, 0],
            [5.2, 1],
            [3.7, 2],
            [0.6, 3],
        ]]],
    }
    out[k] = [[[[0, 0.1], [1, 5.2], [2, 3.7], [3, 0.6]]]]
    it(`should invert coordinates when invCoordMultiPolygonOrMultiPolyline(multiPolygon)`, function() {
        k = 0
        let r = invCoordMultiPolygonOrMultiPolyline(oin[k].pgs)
        let rr = out[k]
        assert.strict.deepStrictEqual(r, rr)
    })

    k++
    oin[k] = {
        pgs: [[
            [0.1, 0],
            [5.2, 1],
            [3.7, 2],
            [0.6, 3],
        ]],
    }
    out[k] = { err: /invalid point depth\[2\]!=3/ }
    it(`should throw error when invCoordMultiPolygonOrMultiPolyline(polygon)`, function() {
        k = 1
        assert.throws(() => {
            invCoordMultiPolygonOrMultiPolyline(oin[k].pgs)
        }, out[k].err)
    })

    k++
    oin[k] = {
        pgs: [
            [0.1, 0],
            [5.2, 1],
            [3.7, 2],
            [0.6, 3],
        ],
    }
    out[k] = { err: /invalid point depth\[1\]!=3/ }
    it(`should throw error when invCoordMultiPolygonOrMultiPolyline(ringString)`, function() {
        k = 2
        assert.throws(() => {
            invCoordMultiPolygonOrMultiPolyline(oin[k].pgs)
        }, out[k].err)
    })

})
