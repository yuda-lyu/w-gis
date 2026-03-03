import assert from 'assert'
import buildFindPointInGeojson from '../src/buildFindPointInGeojson.mjs'


describe(`buildFindPointInGeojson`, function() {
    let k = -1
    let oin = {}
    let out = {}

    k++
    oin[k] = {
        geojson: `
        {
            'type': 'FeatureCollection',
            'name': 'pgs',
            'features': [
                {
                    'type': 'Feature',
                    'properties': {
                        'name': 'pgs1',
                    },
                    'geometry': {
                        'type': 'MultiPolygon',
                        'coordinates': [
                            [
                                [
                                    [0, 0],
                                    [0, 1],
                                    [1, 1],
                                    [1, 0],
                                    [0, 0],
                                ]
                            ]
                        ]
                    }
                },
                {
                    'type': 'Feature',
                    'properties': {
                        'name': 'pgs2',
                    },
                    'geometry': {
                        'type': 'MultiPolygon',
                        'coordinates': [
                            [
                                [
                                    [1, 1],
                                    [1, 2],
                                    [2, 2],
                                    [2, 1],
                                    [1, 1],
                                ]
                            ]
                        ]
                    }
                },
            ]
        }
        `,
        p: [0.5, 0.5],
        optInit: { keysPick: 'properties.name' },
        optGet: {},
    }
    out[k] = 'pgs1'
    it(`should return pgs1 when buildFindPointInGeojson(getPoint in pgs1)`, async function() {
        k = 0
        let BD = buildFindPointInGeojson
        let bd = new BD()
        await bd.init(oin[k].geojson, oin[k].optInit)
        let r = await bd.getPoint(oin[k].p, oin[k].optGet)
        let rr = out[k]
        assert.strict.deepStrictEqual(r, rr)
    })

    k++
    oin[k] = {
        geojson: oin[0].geojson,
        p: [1.5, 1.5],
        optInit: { keysPick: 'properties.name' },
        optGet: {},
    }
    out[k] = 'pgs2'
    it(`should return pgs2 when buildFindPointInGeojson(getPoint in pgs2)`, async function() {
        k = 1
        let BD = buildFindPointInGeojson
        let bd = new BD()
        await bd.init(oin[k].geojson, oin[k].optInit)
        let r = await bd.getPoint(oin[k].p, oin[k].optGet)
        let rr = out[k]
        assert.strict.deepStrictEqual(r, rr)
    })

    k++
    oin[k] = {
        geojson: oin[0].geojson,
        p: [1.5, 0.5],
        optInit: { keysPick: 'properties.name' },
        optGet: {},
    }
    out[k] = 'unknow'
    it(`should return unknow when buildFindPointInGeojson(getPoint outside polygons)`, async function() {
        k = 2
        let BD = buildFindPointInGeojson
        let bd = new BD()
        await bd.init(oin[k].geojson, oin[k].optInit)
        let r = await bd.getPoint(oin[k].p, oin[k].optGet)
        let rr = out[k]
        assert.strict.deepStrictEqual(r, rr)
    })

    k++
    oin[k] = {
        geojson: oin[0].geojson,
        p: [1.5, 0.5],
        optInit: { keysPick: 'properties.name' },
        optGet: { def: '未知' },
    }
    out[k] = '未知'
    it(`should return custom def when buildFindPointInGeojson(getPoint outside polygons with def)`, async function() {
        k = 3
        let BD = buildFindPointInGeojson
        let bd = new BD()
        await bd.init(oin[k].geojson, oin[k].optInit)
        let r = await bd.getPoint(oin[k].p, oin[k].optGet)
        let rr = out[k]
        assert.strict.deepStrictEqual(r, rr)
    })

})
