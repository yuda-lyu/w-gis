import assert from 'assert'
import aggregatePoints from '../src/aggregatePoints.mjs'


describe(`aggregatePoints`, function() {
    let k = -1
    let oin = {}
    let out = {}

    k++
    oin[k] = {
        ops: 'not array',
        xmin: 0,
        dx: 10,
        ymin: 0,
        dy: 10,
        opt: {},
    }
    out[k] = { err: /no ops/ }
    it(`should throw error when aggregatePoints(ops, xmin, dx, ymin, dy, opt) with ops not array`, async function() {
        k = 0
        await assert.rejects(async () => {
            aggregatePoints(oin[k].ops, oin[k].xmin, oin[k].dx, oin[k].ymin, oin[k].dy, oin[k].opt)
        }, out[k].err)
    })

    k++
    oin[k] = {
        ops: [
            { x: 1, y: 1, z: 10, id: 'a' }, // cell 0:0
        ],
        xmin: 0,
        dx: 10,
        ymin: 0,
        dy: 10,
        opt: { modePick: 'min' },
    }
    out[k] = [
        { x: 1, y: 1, z: 10, id: 'a' },
    ]
    it(`should return ${JSON.stringify(out[k])} when aggregatePoints(1 point in one grid)`, function() {
        k = 1
        let r = aggregatePoints(oin[k].ops, oin[k].xmin, oin[k].dx, oin[k].ymin, oin[k].dy, oin[k].opt)
        let rr = out[k]
        assert.strict.deepStrictEqual(r, rr)
    })

    k++
    oin[k] = {
        ops: [
            { x: 1, y: 1, z: 10, id: 'a' }, // cell 0:0
            { x: 2, y: 2, z: 5, id: 'b' }, // cell 0:0 (same cell, smaller z)
            { x: 15, y: 1, z: 7, id: 'c' }, // cell 1:0
        ],
        xmin: 0,
        dx: 10,
        ymin: 0,
        dy: 10,
        opt: { modePick: 'min' },
    }
    out[k] = [
        { x: 2, y: 2, z: 5, id: 'b' }, // pick min z in 0:0
        { x: 15, y: 1, z: 7, id: 'c' }, // only one point in 1:0
    ]
    it(`should return ${JSON.stringify(out[k])} when aggregatePoints(modePick='min')`, function() {
        k = 2
        let r = aggregatePoints(oin[k].ops, oin[k].xmin, oin[k].dx, oin[k].ymin, oin[k].dy, oin[k].opt)
        let rr = out[k]
        assert.strict.deepStrictEqual(r, rr)
    })

    k++
    oin[k] = {
        ops: [
            { x: 1, y: 1, z: 10, id: 'a' }, // cell 0:0 (bigger z)
            { x: 2, y: 2, z: 5, id: 'b' }, // cell 0:0
            { x: 15, y: 1, z: 7, id: 'c' }, // cell 1:0
        ],
        xmin: 0,
        dx: 10,
        ymin: 0,
        dy: 10,
        opt: { modePick: 'max' },
    }
    out[k] = [
        { x: 1, y: 1, z: 10, id: 'a' }, // pick max z in 0:0
        { x: 15, y: 1, z: 7, id: 'c' },
    ]
    it(`should return ${JSON.stringify(out[k])} when aggregatePoints(modePick='max')`, function() {
        k = 3
        let r = aggregatePoints(oin[k].ops, oin[k].xmin, oin[k].dx, oin[k].ymin, oin[k].dy, oin[k].opt)
        let rr = out[k]
        assert.strict.deepStrictEqual(r, rr)
    })

    k++
    oin[k] = {
        ops: [
            { lon: 121.50, lat: 25.00, val: 3, id: 'p1' }, // cell 5:5 (if xmin=121, dx=0.1; ymin=24.5, dy=0.1)
            { lon: 121.59, lat: 25.00, val: 9, id: 'p2' }, // same cell 5:5 (val bigger)
            { lon: 121.61, lat: 25.00, val: 1, id: 'p3' }, // cell 6:5
        ],
        xmin: 121.0,
        dx: 0.1,
        ymin: 24.5,
        dy: 0.1,
        opt: { keyX: 'lon', keyY: 'lat', keyZ: 'val', modePick: 'max' },
    }
    out[k] = [
        { lon: 121.59, lat: 25.00, val: 9, id: 'p2' }, // pick max val in 5:5
        { lon: 121.61, lat: 25.00, val: 1, id: 'p3' }, // only one in 6:5
    ]
    it(`should return ${JSON.stringify(out[k])} when aggregatePoints(custom keyX/keyY/keyZ)`, function() {
        k = 4
        let r = aggregatePoints(oin[k].ops, oin[k].xmin, oin[k].dx, oin[k].ymin, oin[k].dy, oin[k].opt)
        let rr = out[k]
        assert.strict.deepStrictEqual(r, rr)
    })

})
