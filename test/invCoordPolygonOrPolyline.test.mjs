import assert from 'assert'
import invCoordPolygonOrPolyline from '../src/invCoordPolygonOrPolyline.mjs'


describe(`invCoordPolygonOrPolyline`, function() {
    let k = -1
    let oin = {}
    let out = {}

    k++
    oin[k] = {
        pg: [[[
            [0.1, 0],
            [5.2, 1],
            [3.7, 2],
            [0.6, 3],
        ]]],
    }
    out[k] = { err: /invalid point depth\[3\]!=2/ }
    it(`should throw error when invCoordPolygonOrPolyline(multiPolygon)`, function() {
        k = 0
        assert.throws(() => {
            invCoordPolygonOrPolyline(oin[k].pg)
        }, out[k].err)
    })

    k++
    oin[k] = {
        pg: [[
            [0.1, 0],
            [5.2, 1],
            [3.7, 2],
            [0.6, 3],
        ]],
    }
    out[k] = [[[0, 0.1], [1, 5.2], [2, 3.7], [3, 0.6]]]
    it(`should invert coordinates when invCoordPolygonOrPolyline(polygon)`, function() {
        k = 1
        let r = invCoordPolygonOrPolyline(oin[k].pg)
        let rr = out[k]
        assert.strict.deepStrictEqual(r, rr)
    })

    k++
    oin[k] = {
        pg: [
            [0.1, 0],
            [5.2, 1],
            [3.7, 2],
            [0.6, 3],
        ],
    }
    out[k] = { err: /invalid point depth\[1\]!=2/ }
    it(`should throw error when invCoordPolygonOrPolyline(ringString)`, function() {
        k = 2
        assert.throws(() => {
            invCoordPolygonOrPolyline(oin[k].pg)
        }, out[k].err)
    })

})
