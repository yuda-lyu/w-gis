import aggregatePoints from './src/aggregatePoints.mjs'


async function test() {

    let ops
    let r

    ops = 'not array'
    try {
        r = aggregatePoints(ops, 0, 10, 0, 10)
    }
    catch (err) {
        r = err.message
    }
    console.log(r)
    // => 'no ops'

    ops = [{ x: 1, y: 1, z: 10, id: 'a' }] // cell 0:0
    r = aggregatePoints(ops, 0, 10, 0, 10, { modePick: 'min' })
    console.log(r)
    // => [ { x: 1, y: 1, z: 10, id: 'a' } ]

    ops = [
        { x: 1, y: 1, z: 10, id: 'a' }, // cell 0:0
        { x: 2, y: 2, z: 5, id: 'b' }, // cell 0:0 (same cell, smaller z)
        { x: 15, y: 1, z: 7, id: 'c' }, // cell 1:0
    ]
    r = aggregatePoints(ops, 0, 10, 0, 10, { modePick: 'min' })
    console.log(r)
    // => [ { x: 2, y: 2, z: 5, id: 'b' }, { x: 15, y: 1, z: 7, id: 'c' } ]

    ops = [
        { x: 1, y: 1, z: 10, id: 'a' }, // cell 0:0 (bigger z)
        { x: 2, y: 2, z: 5, id: 'b' }, // cell 0:0
        { x: 15, y: 1, z: 7, id: 'c' }, // cell 1:0
    ]
    r = aggregatePoints(ops, 0, 10, 0, 10, { modePick: 'max' })
    console.log(r)
    // => [ { x: 1, y: 1, z: 10, id: 'a' }, { x: 15, y: 1, z: 7, id: 'c' } ]

    ops = [
        { lon: 121.50, lat: 25.00, val: 3, id: 'p1' }, // cell 5:5  (xmin=121, dx=0.1; ymin=24.5, dy=0.1)
        { lon: 121.59, lat: 25.00, val: 9, id: 'p2' }, // same cell 5:5 (val bigger)
        { lon: 121.61, lat: 25.00, val: 1, id: 'p3' }, // cell 6:5
    ]
    r = aggregatePoints(ops, 121.0, 0.1, 24.5, 0.1, {
        keyX: 'lon',
        keyY: 'lat',
        keyZ: 'val',
        modePick: 'max',
    })
    console.log(r)
    // => [ { lon: 121.59, lat: 25, val: 9, id: 'p2' }, { lon: 121.61, lat: 25, val: 1, id: 'p3' } ]

    ops = [
        { x: -1, y: -1, z: 9, id: 'n1' }, // cell -1:-1
        { x: -2, y: -2, z: 1, id: 'n2' }, // cell -1:-1 (min z)
        { x: 1, y: 1, z: 5, id: 'p1' }, // cell 0:0
    ]
    r = aggregatePoints(ops, 0, 10, 0, 10, { modePick: 'min' })
    console.log(r)
    // => [ { x: -2, y: -2, z: 1, id: 'n2' }, { x: 1, y: 1, z: 5, id: 'p1' } ]

}
test()
    .catch((err) => {
        console.log(err)
    })


//node g_aggregatePoints.mjs
