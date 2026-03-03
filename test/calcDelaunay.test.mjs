import assert from 'assert'
import calcDelaunay from '../src/calcDelaunay.mjs'


describe(`calcDelaunay`, function() {
    let k = -1
    let oin = {}
    let out = {}

    k++
    oin[k] = {
        ps: [{ x: 243, y: 206 }, { x: 233, y: 225 }, { x: 21, y: 325 }, { x: 953, y: 283 }, { x: 1092, y: 290 }, { x: 744, y: 200 }, { x: 174, y: 3 }, { x: 537, y: 368 }, { x: 1151, y: 371, ext: 'abc' }, { x: 814, y: 252 }],
        opt: {},
    }
    out[k] = {
        triangles: [
            { n0: 5, n1: 7, n2: 9 },
            { n0: 7, n1: 3, n2: 9 },
            { n0: 9, n1: 3, n2: 5 },
            { n0: 8, n1: 4, n2: 3 },
            { n0: 3, n1: 4, n2: 5 },
            { n0: 7, n1: 8, n2: 3 },
            { n0: 5, n1: 0, n2: 7 },
            { n0: 0, n1: 1, n2: 7 },
            { n0: 5, n1: 6, n2: 0 },
            { n0: 0, n1: 6, n2: 1 }
        ]
    }
    it(`should return triangles when calcDelaunay(ps)`, function() {
        k = 0
        let r = calcDelaunay(oin[k].ps, oin[k].opt)
        let rr = out[k]
        assert.strict.deepStrictEqual(r, rr)
    })

    k++
    oin[k] = {
        ps: [{ x: 243, y: 206 }, { x: 233, y: 225 }, { x: 21, y: 325 }, { x: 953, y: 283 }, { x: 1092, y: 290 }, { x: 744, y: 200 }, { x: 174, y: 3 }, { x: 537, y: 368 }, { x: 1151, y: 371, ext: 'abc' }, { x: 814, y: 252 }],
        opt: { withFinder: true },
        p: { x: 1151, y: 371 },
        optFind: {},
    }
    out[k] = 8
    it(`should return nearest index when calcDelaunay(withFinder).funFindIn(p)`, function() {
        k = 1
        let o = calcDelaunay(oin[k].ps, oin[k].opt)
        let r = o.funFindIn(oin[k].p, oin[k].optFind)
        let rr = out[k]
        assert.strict.deepStrictEqual(r, rr)
    })

    k++
    oin[k] = {
        ps: [{ x: 243, y: 206 }, { x: 233, y: 225 }, { x: 21, y: 325 }, { x: 953, y: 283 }, { x: 1092, y: 290 }, { x: 744, y: 200 }, { x: 174, y: 3 }, { x: 537, y: 368 }, { x: 1151, y: 371, ext: 'abc' }, { x: 814, y: 252 }],
        opt: { withFinder: true },
        p: { x: 1071, y: 371 },
        optFind: { returnPoint: true },
    }
    out[k] = { x: 1151, y: 371, ext: 'abc' }
    it(`should return nearest point when calcDelaunay(withFinder).funFindIn(p, returnPoint=true)`, function() {
        k = 2
        let o = calcDelaunay(oin[k].ps, oin[k].opt)
        let r = o.funFindIn(oin[k].p, oin[k].optFind)
        let rr = out[k]
        assert.strict.deepStrictEqual(r, rr)
    })

    k++
    oin[k] = {
        ps: [{ x: 243, y: 206 }, { x: 233, y: 225 }, { x: 21, y: 325 }, { x: 953, y: 283 }, { x: 1092, y: 290 }, { x: 744, y: 200 }, { x: 174, y: 3 }, { x: 537, y: 368 }, { x: 1151, y: 371, ext: 'abc' }, { x: 814, y: 252 }],
        opt: { withFinder: true },
        p: { x: 1061, y: 371 },
        optFind: {},
    }
    out[k] = 4
    it(`should return nearest index when calcDelaunay(withFinder).funFindIn(near pgs4)`, function() {
        k = 3
        let o = calcDelaunay(oin[k].ps, oin[k].opt)
        let r = o.funFindIn(oin[k].p, oin[k].optFind)
        let rr = out[k]
        assert.strict.deepStrictEqual(r, rr)
    })

})
