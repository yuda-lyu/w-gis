import fs from 'fs'
import assert from 'assert'
import b642u8arr from 'wsemi/src/b642u8arr.mjs'
import buildFindPointInTiff from '../src/buildFindPointInTiff.mjs'


describe(`buildFindPointInTiff`, function() {
    let k = -1
    let oin = {}
    let out = {}

    function getU8aFromGFile() {
        let s = fs.readFileSync('./g_buildFindPointInTiff.mjs', 'utf8')
        let m = s.match(/let b64Tif = \`([\s\S]*?)\`/)
        if (!m || !m[1]) {
            throw new Error('can not parse b64Tif from g_buildFindPointInTiff.mjs')
        }
        return b642u8arr(m[1])
    }

    k++
    oin[k] = {
        u8a: getU8aFromGFile(),
        p: [121.51353, 25.04987],
        optGet: {},
    }
    out[k] = 3.1814956665039062
    it(`should return value when buildFindPointInTiff(getPoint in tiff area #1)`, async function() {
        k = 0
        let BD = buildFindPointInTiff
        let bd = new BD()
        await bd.init(oin[k].u8a)
        let r = await bd.getPoint(oin[k].p, oin[k].optGet)
        let rr = out[k]
        assert.strict.deepStrictEqual(r, rr)
    })

    k++
    oin[k] = {
        u8a: getU8aFromGFile(),
        p: [121.51835, 25.04608],
        optGet: {},
    }
    out[k] = 2.9800331592559814
    it(`should return value when buildFindPointInTiff(getPoint in tiff area #2)`, async function() {
        k = 1
        let BD = buildFindPointInTiff
        let bd = new BD()
        await bd.init(oin[k].u8a)
        let r = await bd.getPoint(oin[k].p, oin[k].optGet)
        let rr = out[k]
        assert.strict.deepStrictEqual(r, rr)
    })

    k++
    oin[k] = {
        u8a: getU8aFromGFile(),
        p: [121.51353, 25.05016],
        optGet: {},
    }
    out[k] = 'unknow'
    it(`should return unknow when buildFindPointInTiff(getPoint outside tiff area)`, async function() {
        k = 2
        let BD = buildFindPointInTiff
        let bd = new BD()
        await bd.init(oin[k].u8a)
        let r = await bd.getPoint(oin[k].p, oin[k].optGet)
        let rr = out[k]
        assert.strict.deepStrictEqual(r, rr)
    })

    k++
    oin[k] = {
        u8a: getU8aFromGFile(),
        p: [121.51353, 25.05016],
        optGet: { def: '未知' },
    }
    out[k] = '未知'
    it(`should return custom def when buildFindPointInTiff(getPoint outside tiff area with def)`, async function() {
        k = 3
        let BD = buildFindPointInTiff
        let bd = new BD()
        await bd.init(oin[k].u8a)
        let r = await bd.getPoint(oin[k].p, oin[k].optGet)
        let rr = out[k]
        assert.strict.deepStrictEqual(r, rr)
    })

})
