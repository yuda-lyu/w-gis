import distilMultiPolygon from './src/distilMultiPolygon.mjs'


async function test() {

    let data
    let r

    data = null
    r = distilMultiPolygon(data)
    console.log(r)
    // => []

    data = {
        geometry: {
            type: 'Polygon',
            coordinates: [
                [[0, 0], [1, 0], [1, 1], [0, 1], [0, 0]],
            ],
        },
    }
    r = distilMultiPolygon(data)
    console.log(JSON.stringify(r))
    // => [[[[0,0],[1,0],[1,1],[0,1],[0,0]]]]

    data = {
        geometry: {
            type: 'MultiPolygon',
            coordinates: [
                [
                    [[0, 0], [1, 0], [1, 1], [0, 1], [0, 0]],
                ],
                [
                    [[2, 0], [3, 0], [3, 1], [2, 1], [2, 0]],
                ],
            ],
        },
    }
    r = distilMultiPolygon(data)
    console.log(JSON.stringify(r))
    // => [[[[0,0],[1,0],[1,1],[0,1],[0,0]]],[[[2,0],[3,0],[3,1],[2,1],[2,0]]]]

    data = {
        geometry: {
            type: 'GeometryCollection',
            geometries: [
                { type: 'LineString', coordinates: [[0, 0], [1, 1]] },
                { type: 'Polygon', coordinates: [[[0, 0], [2, 0], [2, 2], [0, 2], [0, 0]]] },
                { type: 'MultiPolygon', coordinates: [[[[10, 0], [11, 0], [11, 1], [10, 1], [10, 0]]]] },
            ],
        },
    }
    r = distilMultiPolygon(data)
    console.log(JSON.stringify(r))
    // => [[[[0,0],[2,0],[2,2],[0,2],[0,0]]],[[[10,0],[11,0],[11,1],[10,1],[10,0]]]]

    data = {
        geometry: {
            type: 'LineString',
            coordinates: [[0, 0], [1, 1]],
        },
    }
    r = distilMultiPolygon(data)
    console.log(r)
    // => []

}

test()
    .catch((err) => {
        console.log(err)
    })


//node g_distilMultiPolygon.mjs
