import assert from 'assert'
import interp2Raster from '../src/interp2Raster.mjs'


describe(`interp2Raster`, function() {
    let k = -1
    let oin = {}
    let out = {}

    // ---------
    // helpers
    // ---------

    function makeFunKrigingLinear(optIn = {}) {
        let keyX = optIn.keyX || 'x'
        let keyY = optIn.keyY || 'y'
        let keyZ = optIn.keyZ || 'z'
        let sx = (typeof optIn.sx === 'number') ? optIn.sx : 10
        let sy = (typeof optIn.sy === 'number') ? optIn.sy : 1
        let b = (typeof optIn.b === 'number') ? optIn.b : 0

        return async (pts, vpts, opt) => {
            return vpts.map((m) => {
                let x = m[keyX]
                let y = m[keyY]
                return {
                    ...m,
                    [keyZ]: x * sx + y * sy + b,
                }
            })
        }
    }

    // ----------------
    // invalid inputs
    // ----------------

    k++
    oin[k] = {
        ops: 'not array',
        opt: {},
    }
    out[k] = { err: /ops/ }
    it(`should throw error when interp2Raster(ops, opt) with ops not array`, async function() {
        k = 0
        await assert.rejects(async () => {
            await interp2Raster(oin[k].ops, oin[k].opt)
        }, out[k].err)
    })

    // -----------------------
    // modePick='min'
    // -----------------------

    k++
    oin[k] = {
        ops: [
            { x: 0, y: 0, z: 5, id: 'a' },
            { x: 0, y: 0, z: 2, id: 'b' },
            { x: 1, y: 1, z: 9, id: 'c' },
        ],
        opt: {
            dx: 1,
            dy: 1,
            dxAgr: 1,
            dyAgr: 1,
            modePick: 'min',
            funKriging: makeFunKrigingLinear({ keyX: 'x', keyY: 'y', keyZ: 'z', sx: 10, sy: 1, b: 0 }),
        },
    }
    out[k] = {
        xnum: 2,
        xmin: 0,
        xmax: 1,
        dx: 1,
        ynum: 2,
        ymin: 0,
        ymax: 1,
        dy: 1,
        zmin: 0,
        zmax: 11,
        grds: [
            [1, 11],
            [0, 10],
        ],
        pts: [
            { x: 0, y: 0, z: 2, id: 'b' },
            { x: 1, y: 1, z: 9, id: 'c' },
        ],
    }
    it(`should return raster object when interp2Raster(modePick='min')`, async function() {
        k = 1
        let r = await interp2Raster(oin[k].ops, oin[k].opt)
        let rr = out[k]
        assert.strict.deepStrictEqual(r, rr)
    })

    // -----------------------
    // modePick='max'
    // -----------------------

    k++
    oin[k] = {
        ops: [
            { x: 0, y: 0, z: 5, id: 'a' },
            { x: 0, y: 0, z: 2, id: 'b' },
            { x: 1, y: 1, z: 9, id: 'c' },
        ],
        opt: {
            dx: 1,
            dy: 1,
            dxAgr: 1,
            dyAgr: 1,
            modePick: 'max',
            funKriging: makeFunKrigingLinear({ keyX: 'x', keyY: 'y', keyZ: 'z', sx: 10, sy: 1, b: 0 }),
        },
    }
    out[k] = {
        xnum: 2,
        xmin: 0,
        xmax: 1,
        dx: 1,
        ynum: 2,
        ymin: 0,
        ymax: 1,
        dy: 1,
        zmin: 0,
        zmax: 11,
        grds: [
            [1, 11],
            [0, 10],
        ],
        pts: [
            { x: 0, y: 0, z: 5, id: 'a' },
            { x: 1, y: 1, z: 9, id: 'c' },
        ],
    }
    it(`should return raster object when interp2Raster(modePick='max')`, async function() {
        k = 2
        let r = await interp2Raster(oin[k].ops, oin[k].opt)
        let rr = out[k]
        assert.strict.deepStrictEqual(r, rr)
    })

    // -----------------------
    // funAdjust(async)
    // -----------------------

    k++
    oin[k] = {
        ops: [
            { x: 0, y: 0, z: 1 },
            { x: 1, y: 1, z: 2 },
        ],
        opt: {
            dx: 1,
            dy: 1,
            dxAgr: 1,
            dyAgr: 1,
            funAdjust: async (x, y, z) => {
                return z + 100
            },
            funKriging: makeFunKrigingLinear({ keyX: 'x', keyY: 'y', keyZ: 'z', sx: 10, sy: 1, b: 0 }),
        },
    }
    out[k] = {
        xnum: 2,
        xmin: 0,
        xmax: 1,
        dx: 1,
        ynum: 2,
        ymin: 0,
        ymax: 1,
        dy: 1,
        zmin: 100,
        zmax: 111,
        grds: [
            [101, 111],
            [100, 110],
        ],
        pts: [
            { x: 0, y: 0, z: 1 },
            { x: 1, y: 1, z: 2 },
        ],
    }
    it(`should return adjusted raster object when interp2Raster(funAdjust async)`, async function() {
        k = 3
        let r = await interp2Raster(oin[k].ops, oin[k].opt)
        let rr = out[k]
        assert.strict.deepStrictEqual(r, rr)
    })

})
