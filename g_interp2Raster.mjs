import interp2Raster from './src/interp2Raster.mjs'


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


async function test() {

    let ops
    let r

    // ----------------
    // invalid inputs
    // ----------------

    ops = 'not array'
    try {
        r = await interp2Raster(ops, {})
    }
    catch (err) {
        r = err.message
    }
    console.log(r)
    // => 'ops'


    // -----------------------
    // modePick='min'
    // -----------------------

    ops = [
        { x: 0, y: 0, z: 5, id: 'a' },
        { x: 0, y: 0, z: 2, id: 'b' },
        { x: 1, y: 1, z: 9, id: 'c' },
    ]
    r = await interp2Raster(ops, {
        dx: 1,
        dy: 1,
        dxAgr: 1,
        dyAgr: 1,
        modePick: 'min',
        funKriging: makeFunKrigingLinear({ keyX: 'x', keyY: 'y', keyZ: 'z', sx: 10, sy: 1, b: 0 }),
    })
    console.log(r)
    // => {
    //      xnum: 2, xmin: 0, xmax: 1, dx: 1,
    //      ynum: 2, ymin: 0, ymax: 1, dy: 1,
    //      zmin: 0, zmax: 11,
    //      grds: [ [1, 11], [0, 10] ],
    //      pts: [ { x: 0, y: 0, z: 2, id: 'b' }, { x: 1, y: 1, z: 9, id: 'c' } ]
    //    }


    // -----------------------
    // modePick='max'
    // -----------------------

    ops = [
        { x: 0, y: 0, z: 5, id: 'a' },
        { x: 0, y: 0, z: 2, id: 'b' },
        { x: 1, y: 1, z: 9, id: 'c' },
    ]
    r = await interp2Raster(ops, {
        dx: 1,
        dy: 1,
        dxAgr: 1,
        dyAgr: 1,
        modePick: 'max',
        funKriging: makeFunKrigingLinear({ keyX: 'x', keyY: 'y', keyZ: 'z', sx: 10, sy: 1, b: 0 }),
    })
    console.log(r)
    // => {
    //      xnum: 2, xmin: 0, xmax: 1, dx: 1,
    //      ynum: 2, ymin: 0, ymax: 1, dy: 1,
    //      zmin: 0, zmax: 11,
    //      grds: [ [1, 11], [0, 10] ],
    //      pts: [ { x: 0, y: 0, z: 5, id: 'a' }, { x: 1, y: 1, z: 9, id: 'c' } ]
    //    }


    // -----------------------
    // funAdjust(async)
    // -----------------------

    ops = [
        { x: 0, y: 0, z: 1 },
        { x: 1, y: 1, z: 2 },
    ]
    r = await interp2Raster(ops, {
        dx: 1,
        dy: 1,
        dxAgr: 1,
        dyAgr: 1,
        funAdjust: async (x, y, z) => {
            return z + 100
        },
        funKriging: makeFunKrigingLinear({ keyX: 'x', keyY: 'y', keyZ: 'z', sx: 10, sy: 1, b: 0 }),
    })
    console.log(r)
    // => {
    //      xnum: 2, xmin: 0, xmax: 1, dx: 1,
    //      ynum: 2, ymin: 0, ymax: 1, dy: 1,
    //      zmin: 100, zmax: 111,
    //      grds: [ [101, 111], [100, 110] ],
    //      pts: [ { x: 0, y: 0, z: 1 }, { x: 1, y: 1, z: 2 } ]
    //    }

}

test()
    .catch((err) => {
        console.log(err)
    })


//node g_interp2Raster.mjs
