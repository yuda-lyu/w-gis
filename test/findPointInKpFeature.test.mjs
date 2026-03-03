import assert from 'assert'
import findPointInKpFeature from '../src/findPointInKpFeature.mjs'


describe(`findPointInKpFeature`, function() {
    let k = -1
    let oin = {}
    let out = {}

    k++
    oin[k] = {
        p: [0.5, 0.5],
        kpFt: {
            ft1: {
                type: 'Feature',
                properties: {
                    name: 'pgs1',
                },
                geometry: {
                    type: 'MultiPolygon',
                    coordinates: [
                        [
                            [
                                [0, 0],
                                [0, 1],
                                [1, 1],
                                [1, 0],
                                [0, 0],
                            ],
                        ],
                    ],
                },
            },
            ft2: {
                type: 'Feature',
                properties: {
                    name: 'pgs2',
                },
                geometry: {
                    type: 'MultiPolygon',
                    coordinates: [
                        [
                            [
                                [1, 1],
                                [1, 2],
                                [2, 2],
                                [2, 1],
                                [1, 1],
                            ],
                        ],
                    ],
                },
            },
        },
        opt: {},
    }
    out[k] = 'ft1'
    it(`should return ft1 when findPointInKpFeature(point in ft1)`, function() {
        k = 0
        let r = findPointInKpFeature(oin[k].p, oin[k].kpFt, oin[k].opt)
        let rr = out[k]
        assert.strict.deepStrictEqual(r, rr)
    })

    k++
    oin[k] = {
        p: [1.5, 1.5],
        kpFt: oin[0].kpFt,
        opt: {},
    }
    out[k] = 'ft2'
    it(`should return ft2 when findPointInKpFeature(point in ft2)`, function() {
        k = 1
        let r = findPointInKpFeature(oin[k].p, oin[k].kpFt, oin[k].opt)
        let rr = out[k]
        assert.strict.deepStrictEqual(r, rr)
    })

    k++
    oin[k] = {
        p: [2.5, 2.5],
        kpFt: oin[0].kpFt,
        opt: {},
    }
    out[k] = 'unknow'
    it(`should return unknow when findPointInKpFeature(point outside all features)`, function() {
        k = 2
        let r = findPointInKpFeature(oin[k].p, oin[k].kpFt, oin[k].opt)
        let rr = out[k]
        assert.strict.deepStrictEqual(r, rr)
    })

    k++
    oin[k] = {
        p: [0.5, 0.5],
        kpFt: {
            ft1: [
                [0, 0],
                [0, 1],
                [1, 1],
                [1, 0],
                [0, 0],
            ],
        },
        opt: {},
    }
    out[k] = 'unknow'
    it(`should return unknow when findPointInKpFeature(kpFt value is not feature object)`, function() {
        k = 3
        let r = findPointInKpFeature(oin[k].p, oin[k].kpFt, oin[k].opt)
        let rr = out[k]
        assert.strict.deepStrictEqual(r, rr)
    })

    k++
    oin[k] = {
        p: [0.5, 0.5],
        kpFt: {
            ft1: [
                [0, 0],
                [0, 1],
                [1, 1],
                [1, 0],
                [0, 0],
            ],
        },
        opt: { def: '未知' },
    }
    out[k] = '未知'
    it(`should return custom def when findPointInKpFeature(kpFt value invalid with def)`, function() {
        k = 4
        let r = findPointInKpFeature(oin[k].p, oin[k].kpFt, oin[k].opt)
        let rr = out[k]
        assert.strict.deepStrictEqual(r, rr)
    })

})
