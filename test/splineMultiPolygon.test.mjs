import assert from 'assert'
import splineMultiPolygon from '../src/splineMultiPolygon.mjs'


describe(`splineMultiPolygon`, function() {
    let k = -1
    let oin = {}
    let out = {}

    k++
    oin[k] = {
        pgs: [
            [0, 0],
            [2, 0],
            [2, 1],
            [0, 1],
        ],
        opt: {},
    }
    out[k] = '[[[[0,0],[0.00009454879999999999,-5.976e-7],[0.0003771904,-0.0000023808],[0.0008464175999999999,-0.0'
    it(`should return expected result when splineMultiPolygon(polygon, default)`, function() {
        k = 0
        let r = splineMultiPolygon(oin[k].pgs, oin[k].opt)
        r = JSON.stringify(r).slice(0, 100)
        let rr = out[k]
        assert.strict.deepStrictEqual(r, rr)
    })

    k++
    oin[k] = {
        pgs: [
            [0, 0],
            [2, 0],
            [2, 1],
            [0, 1],
        ],
        opt: { resolution: 100 },
    }
    out[k] = '[[[[0,0],[0.6968000000000001,-0.0036000000000000008],[1.7824000000000002,-0.0048000000000000004],[2.'
    it(`should return expected result when splineMultiPolygon(polygon, resolution=100)`, function() {
        k = 1
        let r = splineMultiPolygon(oin[k].pgs, oin[k].opt)
        r = JSON.stringify(r).slice(0, 100)
        let rr = out[k]
        assert.strict.deepStrictEqual(r, rr)
    })

    k++
    oin[k] = {
        pgs: [
            [0, 0],
            [2, 0],
            [2, 1],
            [0, 1],
        ],
        opt: { sharpness: 1 },
    }
    out[k] = '[[[[0,0],[0.00007184,-0.000011952],[0.00028672,-0.000047616],[0.00064368,-0.000106704],[0.00114176,-'
    it(`should return expected result when splineMultiPolygon(polygon, sharpness=1)`, function() {
        k = 2
        let r = splineMultiPolygon(oin[k].pgs, oin[k].opt)
        r = JSON.stringify(r).slice(0, 100)
        let rr = out[k]
        assert.strict.deepStrictEqual(r, rr)
    })

    k++
    oin[k] = {
        pgs: [
            [0, 0],
            [2, 0],
            [2, 1],
            [0, 1],
        ],
        opt: { sharpness: 0 },
    }
    out[k] = '[[[[0,0],[0.00007542559999999999,-0.0000101592],[0.0003010048,-0.0000404736],[0.0006756911999999999,'
    it(`should return expected result when splineMultiPolygon(polygon, sharpness=0)`, function() {
        k = 3
        let r = splineMultiPolygon(oin[k].pgs, oin[k].opt)
        r = JSON.stringify(r).slice(0, 100)
        let rr = out[k]
        assert.strict.deepStrictEqual(r, rr)
    })

    k++
    oin[k] = {
        pgs: [[
            [0, 0],
            [2, 0],
            [2, 1],
            [0, 1],
        ]],
        opt: {},
    }
    out[k] = '[[[[0,0],[0.00009454879999999999,-5.976e-7],[0.0003771904,-0.0000023808],[0.0008464175999999999,-0.0'
    it(`should return expected result when splineMultiPolygon(multiPolygon, default)`, function() {
        k = 4
        let r = splineMultiPolygon(oin[k].pgs, oin[k].opt)
        r = JSON.stringify(r).slice(0, 100)
        let rr = out[k]
        assert.strict.deepStrictEqual(r, rr)
    })

    k++
    oin[k] = {
        pgs: [[
            [0, 0],
            [2, 0],
            [2, 1],
            [0, 1],
        ]],
        opt: { resolution: 100 },
    }
    out[k] = '[[[[0,0],[0.6968000000000001,-0.0036000000000000008],[1.7824000000000002,-0.0048000000000000004],[2.'
    it(`should return expected result when splineMultiPolygon(multiPolygon, resolution=100)`, function() {
        k = 5
        let r = splineMultiPolygon(oin[k].pgs, oin[k].opt)
        r = JSON.stringify(r).slice(0, 100)
        let rr = out[k]
        assert.strict.deepStrictEqual(r, rr)
    })

    k++
    oin[k] = {
        pgs: [[
            [0, 0],
            [2, 0],
            [2, 1],
            [0, 1],
        ]],
        opt: { sharpness: 1 },
    }
    out[k] = '[[[[0,0],[0.00007184,-0.000011952],[0.00028672,-0.000047616],[0.00064368,-0.000106704],[0.00114176,-'
    it(`should return expected result when splineMultiPolygon(multiPolygon, sharpness=1)`, function() {
        k = 6
        let r = splineMultiPolygon(oin[k].pgs, oin[k].opt)
        r = JSON.stringify(r).slice(0, 100)
        let rr = out[k]
        assert.strict.deepStrictEqual(r, rr)
    })

    k++
    oin[k] = {
        pgs: [[
            [0, 0],
            [2, 0],
            [2, 1],
            [0, 1],
        ]],
        opt: { sharpness: 0 },
    }
    out[k] = '[[[[0,0],[0.00007542559999999999,-0.0000101592],[0.0003010048,-0.0000404736],[0.0006756911999999999,'
    it(`should return expected result when splineMultiPolygon(multiPolygon, sharpness=0)`, function() {
        k = 7
        let r = splineMultiPolygon(oin[k].pgs, oin[k].opt)
        r = JSON.stringify(r).slice(0, 100)
        let rr = out[k]
        assert.strict.deepStrictEqual(r, rr)
    })

})
