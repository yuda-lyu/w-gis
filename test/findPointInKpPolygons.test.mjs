import assert from 'assert'
import findPointInKpPolygons from '../src/findPointInKpPolygons.mjs'


describe(`findPointInKpPolygons`, function() {
    let k = -1
    let oin = {}
    let out = {}

    k++
    oin[k] = {
        p: [0.5, 0.5],
        kpPgs: {
            pgs1: [
                [0, 0],
                [0, 1],
                [1, 1],
                [1, 0],
                [0, 0],
            ],
        },
        opt: {},
    }
    out[k] = 'pgs1'
    it(`should return pgs1 when findPointInKpPolygons(point in polygon)`, function() {
        k = 0
        let r = findPointInKpPolygons(oin[k].p, oin[k].kpPgs, oin[k].opt)
        let rr = out[k]
        assert.strict.deepStrictEqual(r, rr)
    })

    k++
    oin[k] = {
        p: [1.5, 0.5],
        kpPgs: {
            pgs1: [
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
    it(`should return unknow when findPointInKpPolygons(point outside polygon)`, function() {
        k = 1
        let r = findPointInKpPolygons(oin[k].p, oin[k].kpPgs, oin[k].opt)
        let rr = out[k]
        assert.strict.deepStrictEqual(r, rr)
    })

    k++
    oin[k] = {
        p: [1.5, 0.5],
        kpPgs: {
            pgs1: [
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
    it(`should return custom def when findPointInKpPolygons(point outside polygon with def)`, function() {
        k = 2
        let r = findPointInKpPolygons(oin[k].p, oin[k].kpPgs, oin[k].opt)
        let rr = out[k]
        assert.strict.deepStrictEqual(r, rr)
    })

})
