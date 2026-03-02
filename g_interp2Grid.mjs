import interp2Grid from './src/interp2Grid.mjs'


function makeFunKrigingLinear(optIn = {}) {
    // 回傳 ipts 必須與 vpts 順序一致
    // z = x * sx + y * sy + b
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

    let pts
    let r

    // ----------------
    // invalid inputs
    // ----------------

    pts = 'not array'
    try {
        r = await interp2Grid(pts, 0, 1, 1, 0, 1, 1, {})
    }
    catch (err) {
        r = err.message
    }
    console.log(r)
    // => 'no pts'

    pts = [{ x: 0, y: 0, z: 0 }]
    try {
        r = await interp2Grid(pts, 'a', 1, 1, 0, 1, 1, {})
    }
    catch (err) {
        r = err.message
    }
    console.log(r)
    // => 'xmin[a] is not an effective number'

    pts = [{ x: 0, y: 0, z: 0 }]
    try {
        r = await interp2Grid(pts, 1, 0, 1, 0, 1, 1, {})
    }
    catch (err) {
        r = err.message
    }
    console.log(r)
    // => 'xmin[1]>xmax[0]'

    pts = [{ x: 0, y: 0, z: 0 }]
    try {
        r = await interp2Grid(pts, 0, 1, 1, 1, 0, 1, {})
    }
    catch (err) {
        r = err.message
    }
    console.log(r)
    // => 'ymin[1]>ymax[0]'


    // -----------------------
    // returnGrid=true (default)
    // -----------------------

    pts = [{ x: 0, y: 0, z: 0 }]
    r = await interp2Grid(pts, 0, 1, 1, 0, 1, 1, {
        funKriging: makeFunKrigingLinear({ keyX: 'x', keyY: 'y', keyZ: 'z', sx: 10, sy: 1, b: 0 }),
    })
    console.log(r)
    // => {
    //      xnum: 2, xmin: 0, xmax: 1, dx: 1,
    //      ynum: 2, ymin: 0, ymax: 1, dy: 1,
    //      zmin: 0, zmax: 11,
    //      grds: [ [0, 10], [1, 11] ]
    //    }


    // -----------------------
    // inverseKeyY
    // -----------------------

    pts = [{ x: 0, y: 0, z: 0 }]
    r = await interp2Grid(pts, 0, 1, 1, 0, 1, 1, {
        inverseKeyY: true,
        funKriging: makeFunKrigingLinear({ keyX: 'x', keyY: 'y', keyZ: 'z', sx: 10, sy: 1, b: 0 }),
    })
    console.log(r)
    // => {
    //      ...
    //      grds: [ [1, 11], [0, 10] ]
    //    }


    // -----------------------
    // returnGrid=false
    // -----------------------

    pts = [{ x: 0, y: 0, z: 0 }]
    r = await interp2Grid(pts, 0, 1, 1, 0, 1, 1, {
        returnGrid: false,
        funKriging: makeFunKrigingLinear({ keyX: 'x', keyY: 'y', keyZ: 'z', sx: 10, sy: 1, b: 0 }),
    })
    console.log(r)
    // => [
    //      { x: 0, y: 0, z: 0 },
    //      { x: 0, y: 1, z: 1 },
    //      { x: 1, y: 0, z: 10 },
    //      { x: 1, y: 1, z: 11 },
    //    ]


    // -----------------------
    // funValid + returnGrid=false
    // -----------------------

    pts = [{ x: 0, y: 0, z: 0 }]
    r = await interp2Grid(pts, 0, 1, 1, 0, 1, 1, {
        returnGrid: false,
        funValid: (x, y) => {
            return (x === 0 && y === 0) || (x === 1 && y === 1)
        },
        funKriging: makeFunKrigingLinear({ keyX: 'x', keyY: 'y', keyZ: 'z', sx: 10, sy: 1, b: 0 }),
    })
    console.log(r)
    // => [
    //      { x: 0, y: 0, z: 0 },
    //      { x: 1, y: 1, z: 11 },
    //    ]


    // -----------------------
    // funAdjust
    // -----------------------

    pts = [{ x: 0, y: 0, z: 0 }]
    r = await interp2Grid(pts, 0, 1, 1, 0, 1, 1, {
        returnGrid: false,
        funAdjust: (x, y, z) => {
            return z + 100
        },
        funKriging: makeFunKrigingLinear({ keyX: 'x', keyY: 'y', keyZ: 'z', sx: 10, sy: 1, b: 0 }),
    })
    console.log(r)
    // => [
    //      { x: 0, y: 0, z: 100 },
    //      { x: 0, y: 1, z: 101 },
    //      { x: 1, y: 0, z: 110 },
    //      { x: 1, y: 1, z: 111 },
    //    ]


    // -----------------------
    // custom keyX/keyY/keyZ
    // -----------------------

    pts = [{ lon: 0, lat: 0, val: 0 }]
    r = await interp2Grid(pts, 121.0, 121.1, 0.1, 24.5, 24.6, 0.1, {
        keyX: 'lon',
        keyY: 'lat',
        keyZ: 'val',
        returnGrid: false,
        funKriging: makeFunKrigingLinear({ keyX: 'lon', keyY: 'lat', keyZ: 'val', sx: 10, sy: 1, b: 0 }),
    })
    console.log(r)
    // => [
    //      { lon: 121.0, lat: 24.5, val: 121.0*10 + 24.5 },
    //      { lon: 121.0, lat: 24.6, val: 121.0*10 + 24.6 },
    //      { lon: 121.1, lat: 24.5, val: 121.1*10 + 24.5 },
    //      { lon: 121.1, lat: 24.6, val: 121.1*10 + 24.6 },
    //    ]

}

test()
    .catch((err) => {
        console.log(err)
    })


//node g_interp2Grid.mjs
