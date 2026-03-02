import assert from 'assert'
import interp2Grid from '../src/interp2Grid.mjs'


describe(`interp2Grid`, function() {
    let k = -1
    let oin = {}
    let out = {}

    // ---------
    // helpers
    // ---------

    function makeFunKrigingLinear(optIn = {}) {
        // 回傳的 ipts 必須與 vpts 順序一致
        // 這裡用可預期的線性公式產生 z
        // z = x * sx + y * sy + b
        let keyX = optIn.keyX || 'x'
        let keyY = optIn.keyY || 'y'
        let keyZ = optIn.keyZ || 'z'
        let sx = (typeof optIn.sx === 'number') ? optIn.sx : 10
        let sy = (typeof optIn.sy === 'number') ? optIn.sy : 1
        let b = (typeof optIn.b === 'number') ? optIn.b : 0

        return async (pts, vpts, opt) => {
            // opt 會帶 keyX/keyY/keyZ，但這裡以 optIn 為準也可
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
        pts: 'not array',
        xmin: 0,
        xmax: 1,
        dx: 1,
        ymin: 0,
        ymax: 1,
        dy: 1,
        opt: {},
    }
    out[k] = { err: /no pts/ }
    it(`should throw error when interp2Grid(pts, xmin, xmax, dx, ymin, ymax, dy, opt) with pts not array`, async function() {
        k = 0
        await assert.rejects(async () => {
            await interp2Grid(oin[k].pts, oin[k].xmin, oin[k].xmax, oin[k].dx, oin[k].ymin, oin[k].ymax, oin[k].dy, oin[k].opt)
        }, out[k].err)
    })

    k++
    oin[k] = {
        pts: [{ x: 0, y: 0, z: 0 }],
        xmin: 'a',
        xmax: 1,
        dx: 1,
        ymin: 0,
        ymax: 1,
        dy: 1,
        opt: {},
    }
    out[k] = { err: /xmin\[.*\] is not an effective number/ }
    it(`should throw error when interp2Grid(xmin not number)`, async function() {
        k = 1
        await assert.rejects(async () => {
            await interp2Grid(oin[k].pts, oin[k].xmin, oin[k].xmax, oin[k].dx, oin[k].ymin, oin[k].ymax, oin[k].dy, oin[k].opt)
        }, out[k].err)
    })

    k++
    oin[k] = {
        pts: [{ x: 0, y: 0, z: 0 }],
        xmin: 1,
        xmax: 0,
        dx: 1,
        ymin: 0,
        ymax: 1,
        dy: 1,
        opt: {},
    }
    out[k] = { err: /xmin\[.*\]>xmax\[.*\]/ }
    it(`should throw error when interp2Grid(xmin>xmax)`, async function() {
        k = 2
        await assert.rejects(async () => {
            await interp2Grid(oin[k].pts, oin[k].xmin, oin[k].xmax, oin[k].dx, oin[k].ymin, oin[k].ymax, oin[k].dy, oin[k].opt)
        }, out[k].err)
    })

    k++
    oin[k] = {
        pts: [{ x: 0, y: 0, z: 0 }],
        xmin: 0,
        xmax: 1,
        dx: 1,
        ymin: 1,
        ymax: 0,
        dy: 1,
        opt: {},
    }
    out[k] = { err: /ymin\[.*\]>ymax\[.*\]/ }
    it(`should throw error when interp2Grid(ymin>ymax)`, async function() {
        k = 3
        await assert.rejects(async () => {
            await interp2Grid(oin[k].pts, oin[k].xmin, oin[k].xmax, oin[k].dx, oin[k].ymin, oin[k].ymax, oin[k].dy, oin[k].opt)
        }, out[k].err)
    })

    // -----------------------
    // returnGrid=true (default)
    // -----------------------

    k++
    oin[k] = {
        pts: [{ x: 0, y: 0, z: 0 }],
        xmin: 0,
        xmax: 1,
        dx: 1,
        ymin: 0,
        ymax: 1,
        dy: 1,
        opt: {
            // stub kriging
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
            [0, 10], // y=0: (0,0)=0, (1,0)=10
            [1, 11], // y=1: (0,1)=1, (1,1)=11
        ],
    }
    it(`should return grid object when interp2Grid(returnGrid default=true)`, async function() {
        k = 4
        let r = await interp2Grid(oin[k].pts, oin[k].xmin, oin[k].xmax, oin[k].dx, oin[k].ymin, oin[k].ymax, oin[k].dy, oin[k].opt)
        let rr = out[k]
        assert.strict.deepStrictEqual(r, rr)
    })

    // -----------------------
    // inverseKeyY
    // -----------------------

    k++
    oin[k] = {
        pts: [{ x: 0, y: 0, z: 0 }],
        xmin: 0,
        xmax: 1,
        dx: 1,
        ymin: 0,
        ymax: 1,
        dy: 1,
        opt: {
            inverseKeyY: true,
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
            [1, 11], // 反轉 y：先放原本 y=1 的那列
            [0, 10], // 再放原本 y=0 的那列
        ],
    }
    it(`should return grid object when interp2Grid(inverseKeyY=true)`, async function() {
        k = 5
        let r = await interp2Grid(oin[k].pts, oin[k].xmin, oin[k].xmax, oin[k].dx, oin[k].ymin, oin[k].ymax, oin[k].dy, oin[k].opt)
        let rr = out[k]
        assert.strict.deepStrictEqual(r, rr)
    })

    // -----------------------
    // returnGrid=false
    // -----------------------

    k++
    oin[k] = {
        pts: [{ x: 0, y: 0, z: 0 }],
        xmin: 0,
        xmax: 1,
        dx: 1,
        ymin: 0,
        ymax: 1,
        dy: 1,
        opt: {
            returnGrid: false,
            funKriging: makeFunKrigingLinear({ keyX: 'x', keyY: 'y', keyZ: 'z', sx: 10, sy: 1, b: 0 }),
        },
    }
    out[k] = [
        { x: 0, y: 0, z: 0 },
        { x: 0, y: 1, z: 1 },
        { x: 1, y: 0, z: 10 },
        { x: 1, y: 1, z: 11 },
    ]
    it(`should return points array when interp2Grid(returnGrid=false)`, async function() {
        k = 6
        let r = await interp2Grid(oin[k].pts, oin[k].xmin, oin[k].xmax, oin[k].dx, oin[k].ymin, oin[k].ymax, oin[k].dy, oin[k].opt)
        let rr = out[k]
        assert.strict.deepStrictEqual(r, rr)
    })

    // -----------------------
    // funValid + returnGrid=false
    // -----------------------

    k++
    oin[k] = {
        pts: [{ x: 0, y: 0, z: 0 }],
        xmin: 0,
        xmax: 1,
        dx: 1,
        ymin: 0,
        ymax: 1,
        dy: 1,
        opt: {
            returnGrid: false,
            // 只允許 (x=0,y=0) 與 (x=1,y=1)
            funValid: (x, y) => {
                return (x === 0 && y === 0) || (x === 1 && y === 1)
            },
            funKriging: makeFunKrigingLinear({ keyX: 'x', keyY: 'y', keyZ: 'z', sx: 10, sy: 1, b: 0 }),
        },
    }
    out[k] = [
        { x: 0, y: 0, z: 0 },
        { x: 1, y: 1, z: 11 },
    ]
    it(`should return points array when interp2Grid(funValid filter + returnGrid=false)`, async function() {
        k = 7
        let r = await interp2Grid(oin[k].pts, oin[k].xmin, oin[k].xmax, oin[k].dx, oin[k].ymin, oin[k].ymax, oin[k].dy, oin[k].opt)
        let rr = out[k]
        assert.strict.deepStrictEqual(r, rr)
    })

    // -----------------------
    // funAdjust
    // -----------------------

    k++
    oin[k] = {
        pts: [{ x: 0, y: 0, z: 0 }],
        xmin: 0,
        xmax: 1,
        dx: 1,
        ymin: 0,
        ymax: 1,
        dy: 1,
        opt: {
            returnGrid: false,
            funAdjust: (x, y, z) => {
                return z + 100
            },
            funKriging: makeFunKrigingLinear({ keyX: 'x', keyY: 'y', keyZ: 'z', sx: 10, sy: 1, b: 0 }),
        },
    }
    out[k] = [
        { x: 0, y: 0, z: 100 },
        { x: 0, y: 1, z: 101 },
        { x: 1, y: 0, z: 110 },
        { x: 1, y: 1, z: 111 },
    ]
    it(`should return adjusted points array when interp2Grid(funAdjust + returnGrid=false)`, async function() {
        k = 8
        let r = await interp2Grid(oin[k].pts, oin[k].xmin, oin[k].xmax, oin[k].dx, oin[k].ymin, oin[k].ymax, oin[k].dy, oin[k].opt)
        let rr = out[k]
        assert.strict.deepStrictEqual(r, rr)
    })

    // -----------------------
    // custom keyX/keyY/keyZ
    // -----------------------

    k++
    oin[k] = {
        pts: [{ lon: 0, lat: 0, val: 0 }],
        xmin: 121.0,
        xmax: 121.1,
        dx: 0.1,
        ymin: 24.5,
        ymax: 24.6,
        dy: 0.1,
        opt: {
            keyX: 'lon',
            keyY: 'lat',
            keyZ: 'val',
            returnGrid: false,
            funKriging: makeFunKrigingLinear({ keyX: 'lon', keyY: 'lat', keyZ: 'val', sx: 10, sy: 1, b: 0 }),
        },
    }
    out[k] = [
        { lon: 121.0, lat: 24.5, val: 121.0 * 10 + 24.5 },
        { lon: 121.0, lat: 24.6, val: 121.0 * 10 + 24.6 },
        { lon: 121.1, lat: 24.5, val: 121.1 * 10 + 24.5 },
        { lon: 121.1, lat: 24.6, val: 121.1 * 10 + 24.6 },
    ]
    it(`should return points array when interp2Grid(custom keyX/keyY/keyZ + returnGrid=false)`, async function() {
        k = 9
        let r = await interp2Grid(oin[k].pts, oin[k].xmin, oin[k].xmax, oin[k].dx, oin[k].ymin, oin[k].ymax, oin[k].dy, oin[k].opt)
        let rr = out[k]
        assert.strict.deepStrictEqual(r, rr)
    })

})
