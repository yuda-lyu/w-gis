import assert from 'assert'
import buildFindPointInKpBoxPolygons from '../src/buildFindPointInKpBoxPolygons.mjs'


describe(`buildFindPointInKpBoxPolygons`, function() {
    let k = -1
    let oin = {}
    let out = {}

    k++
    oin[k] = {
        kpPgs: {
            pgs1: [
                [0, 0],
                [0, 1],
                [1, 1],
                [1, 0],
                [0, 0],
            ],
            pgs2: [
                [1, 1],
                [1, 2],
                [2, 2],
                [2, 1],
                [1, 1],
            ],
        },
        p: [0.5, 0.5],
        optGet: {},
    }
    out[k] = 'pgs1'
    it(`should return pgs1 when buildFindPointInKpBoxPolygons(getPoint in pgs1)`, async function() {
        k = 0
        let BD = buildFindPointInKpBoxPolygons
        let bd = new BD()
        await bd.add('pgs1', oin[k].kpPgs.pgs1)
        await bd.add('pgs2', oin[k].kpPgs.pgs2)
        let r = await bd.getPoint(oin[k].p, oin[k].optGet)
        let rr = out[k]
        assert.strict.deepStrictEqual(r, rr)
    })

    k++
    oin[k] = {
        kpPgs: oin[0].kpPgs,
        p: [1.5, 1.5],
        optGet: {},
    }
    out[k] = 'pgs2'
    it(`should return pgs2 when buildFindPointInKpBoxPolygons(getPoint in pgs2)`, async function() {
        k = 1
        let BD = buildFindPointInKpBoxPolygons
        let bd = new BD()
        await bd.add('pgs1', oin[k].kpPgs.pgs1)
        await bd.add('pgs2', oin[k].kpPgs.pgs2)
        let r = await bd.getPoint(oin[k].p, oin[k].optGet)
        let rr = out[k]
        assert.strict.deepStrictEqual(r, rr)
    })

    k++
    oin[k] = {
        kpPgs: oin[0].kpPgs,
        p: [1.5, 0.5],
        optGet: {},
    }
    out[k] = 'unknow'
    it(`should return unknow when buildFindPointInKpBoxPolygons(getPoint outside polygons)`, async function() {
        k = 2
        let BD = buildFindPointInKpBoxPolygons
        let bd = new BD()
        await bd.add('pgs1', oin[k].kpPgs.pgs1)
        await bd.add('pgs2', oin[k].kpPgs.pgs2)
        let r = await bd.getPoint(oin[k].p, oin[k].optGet)
        let rr = out[k]
        assert.strict.deepStrictEqual(r, rr)
    })

    k++
    oin[k] = {
        kpPgs: oin[0].kpPgs,
        p: [1.5, 0.5],
        optGet: { def: '未知' },
    }
    out[k] = '未知'
    it(`should return custom def when buildFindPointInKpBoxPolygons(getPoint outside polygons with def)`, async function() {
        k = 3
        let BD = buildFindPointInKpBoxPolygons
        let bd = new BD()
        await bd.add('pgs1', oin[k].kpPgs.pgs1)
        await bd.add('pgs2', oin[k].kpPgs.pgs2)
        let r = await bd.getPoint(oin[k].p, oin[k].optGet)
        let rr = out[k]
        assert.strict.deepStrictEqual(r, rr)
    })

})
