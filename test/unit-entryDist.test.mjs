import fs from 'fs'
import path from 'path'
import vm from 'vm'
import assert from 'assert'
import { createRequire } from 'module'
import runNode from './tools/runNode.mjs'
import getIndexNames from './tools/getIndexNames.mjs'
import convertCoordinate from '../src/convertCoordinate.mjs'
import getCentroidMultiPolygon from '../src/getCentroidMultiPolygon.mjs'
import interp2 from '../src/interp2.mjs'


let require = createRequire(import.meta.url)


//以副本並指定cwd執行toolg/gDistRollup.mjs後, 驗證其產出之dist, 對應規則帳本R-ENTRY-2、R-ENTRY-3、R-D9
describe(`unit-entryDist`, function() {

    let fdTmp = path.resolve('./test/_tmp/unit-entryDist')
    let fdDist = path.resolve(fdTmp, 'dist')
    let fpMain = path.resolve(fdDist, 'w-gis.umd.js')
    let fpWorker = path.resolve(fdDist, 'interp2.wk.umd.js')
    let names = getIndexNames('./src/')
    let externalsMain = ['@turf/turf'] //主產物UMD檔頭應有之外部清單(turf官方打包檔於前端另行注入)
    let externalsWorker = ['worker_threads'] //rollupWorker之runin='both'自行注入
    let codeTurf = fs.readFileSync(path.resolve('./node_modules/@turf/turf/turf.min.js'), 'utf8')
    let buildOut = ''
    let codeMain = ''

    let pg = [[[0, 0], [2, 0], [2, 2], [0, 2]]]
    let ps = [{ x: 243, y: 206, z: 95 }, { x: 233, y: 225, z: 146 }, { x: 21, y: 325, z: 22 }, { x: 953, y: 28, z: 223 }, { x: 1092, y: 290, z: 39 }, { x: 744, y: 200, z: 191 }, { x: 174, y: 3, z: 22 }, { x: 537, y: 368, z: 249 }, { x: 1151, y: 371, z: 86 }, { x: 814, y: 252, z: 125 }]
    let p = { x: 243, y: 207 }

    //norm, vm內產生之物件與本realm之原型不同, 先以JSON正規化再比對
    let norm = (v) => JSON.parse(JSON.stringify(v))

    //getUmdExternals, 解析UMD產物檔頭CommonJS分支之外部引用清單(檔頭至AMD判斷define.amd之前之require)
    function getUmdExternals(code) {
        let i = code.indexOf('define.amd')
        if (i < 0) {
            throw new Error('invalid umd code: define.amd not found')
        }
        let head = code.slice(0, i)
        return [...head.matchAll(/require\((["'])([^"']+)\1\)/g)].map((m) => m[2])
    }

    //findBadWarns, 取出不得出現之建置訊息: 無法解析之引用(UNRESOLVED_IMPORT)與未給全域名之外部模組(MISSING_GLOBAL_NAME), 不比對警告總數(Browserslist過期等噪音會隨環境出現或消失)
    function findBadWarns(out) {
        return out.split(/\r?\n/).filter((m) => /could not be resolved|No name was provided for external module/.test(m))
    }

    //makeCtx, 以vm模擬UMD之全域分支執行環境: window為瀏覽器主執行緒(含可執行注入script之假DOM), 否則為worker(只有self)
    function makeCtx(opt = {}) {
        let warns = []
        let ctx = {
            console: {
                log: () => {},
                error: () => {},
                warn: (...args) => {
                    warns.push(args.join(' '))
                },
            },
        }
        vm.createContext(ctx)
        ctx.self = ctx
        if (opt.window) {
            let head = {
                appendChild: (ele) => {
                    if (!opt.noExec) { //noExec模擬CSP禁inline: 注入之script不執行
                        vm.runInContext(ele.code, ctx)
                    }
                },
            }
            ctx.window = ctx
            ctx.document = {
                createElement: () => {
                    let ele = {}
                    Object.defineProperty(ele, 'innerHTML', {
                        get: () => ele.code,
                        set: (v) => {
                            if (opt.ttThrow) { //模擬Trusted Types
                                throw new TypeError(`Failed to set the 'innerHTML' property on 'Element': This document requires 'TrustedHTML' assignment.`)
                            }
                            ele.code = v
                        },
                    })
                    return ele
                },
                getElementsByTagName: () => [head],
            }
        }
        if (opt.hostTurf) {
            ctx.turf = opt.hostTurf
        }
        if (opt.preloadTurf) { //worker內先importScripts官方turf.min.js
            vm.runInContext(codeTurf, ctx)
        }
        return { ctx, warns }
    }

    before(async function() {
        this.timeout(180000)

        //副本: 把src、toolg與package.json複製到暫存資料夾, 以其為cwd執行toolg/gDistRollup.mjs(腳本以cwd相對之./src、./dist運作; rollupFile自cwd讀package.json作banner, rollupWorker之temp-*.js亦落於cwd, 故不可以repo根為cwd)
        fs.rmSync(fdTmp, { recursive: true, force: true })
        fs.mkdirSync(fdTmp, { recursive: true })
        fs.copyFileSync(path.resolve('./package.json'), path.resolve(fdTmp, 'package.json'))
        fs.cpSync(path.resolve('./src'), path.resolve(fdTmp, 'src'), { recursive: true })
        fs.cpSync(path.resolve('./toolg'), path.resolve(fdTmp, 'toolg'), { recursive: true })

        let r = await runNode(['./toolg/gDistRollup.mjs'], fdTmp)
        buildOut = r.out
        if (r.code !== 0) {
            throw new Error(`toolg/gDistRollup.mjs exited with code ${r.code}: ${r.out.slice(-2000)}`)
        }
        codeMain = fs.readFileSync(fpMain, 'utf8')
    })

    after(function() {
        fs.rmSync(fdTmp, { recursive: true, force: true })
    })

    it(`case1 should build without unresolved imports or missing global names (R-ENTRY-2)`, function() {
        assert.strict.deepStrictEqual(findBadWarns(buildOut), [])
    })

    it(`case2 should declare exactly the configured externals in the main UMD header (R-ENTRY-2)`, function() {
        assert.strict.deepStrictEqual(getUmdExternals(codeMain).sort(), [...externalsMain].sort())
    })

    it(`case3 should require the main bundle with the index names and the same results as src (R-ENTRY-3)`, function() {
        let mod = require(fpMain)
        assert.strict.deepStrictEqual(Object.keys(mod).sort(), [...names].sort())
        for (let k of names) {
            let want = k === 'importTurf' ? 'object' : 'function'
            let got = mod[k] === null ? 'null' : typeof mod[k]
            assert.strict.equal(got, want, `export ${k}`)
        }
        assert.strict.deepStrictEqual(mod.convertCoordinate('WGS84', 'TWD97TM2', [121, 24]), convertCoordinate('WGS84', 'TWD97TM2', [121, 24]))
        assert.strict.deepStrictEqual(mod.getCentroidMultiPolygon(pg), getCentroidMultiPolygon(pg))
        assert.strict.deepStrictEqual(mod.interp2(ps, p, { useSync: true }), interp2(ps, p, { useSync: true }))
    })

    it(`case4 should load the UMD global branch in a bare vm context with the index names (R-ENTRY-3)`, function() {
        let ctx = vm.createContext({})
        vm.runInContext(codeMain, ctx)
        assert.strict.deepStrictEqual(Object.keys(ctx['w-gis']).sort(), [...names].sort())
    })

    it(`case5 should build the worker bundle with the configured externals and the same result as src interp2 (R-ENTRY-2, R-ENTRY-3)`, async function() {
        assert.strict.deepStrictEqual(getUmdExternals(fs.readFileSync(fpWorker, 'utf8')).sort(), [...externalsWorker].sort())
        let fun = require(fpWorker)
        assert.strict.equal(typeof fun, 'function')
        let expected = interp2(ps, p, { useSync: true })
        let result = await fun(ps, p)
        assert.strict.deepStrictEqual(result, expected)
    })

    it(`case6 should use the preloaded global turf in a worker-like context (R-D9-b)`, function() {
        let { ctx } = makeCtx({ preloadTurf: true })
        vm.runInContext(codeMain, ctx)
        let g = ctx['w-gis']
        assert.strict.equal(typeof g.importTurf.area, 'function')
        assert.strict.deepStrictEqual(norm(g.getCentroidMultiPolygon(pg)), getCentroidMultiPolygon(pg))
    })

    it(`case7 should inject its own turf and leave it as the global turf on a page without turf (R-D9)`, function() {
        let { ctx, warns } = makeCtx({ window: true })
        vm.runInContext(codeMain, ctx)
        let g = ctx['w-gis']
        assert.strict.equal(typeof g.importTurf.area, 'function')
        assert.strict.equal(ctx.turf, g.importTurf)
        assert.strict.deepStrictEqual(norm(g.getCentroidMultiPolygon(pg)), getCentroidMultiPolygon(pg))
        assert.strict.deepStrictEqual(warns, [])
    })

    it(`case8 should restore the host page turf and use its own injected turf (R-D9-a)`, function() {
        let hostTurf = { hostTurf: true }
        let { ctx, warns } = makeCtx({ window: true, hostTurf })
        vm.runInContext(codeMain, ctx)
        let g = ctx['w-gis']
        assert.strict.equal(ctx.turf, hostTurf)
        assert.strict.notEqual(g.importTurf, hostTurf)
        assert.strict.deepStrictEqual(norm(g.getCentroidMultiPolygon(pg)), getCentroidMultiPolygon(pg))
        assert.strict.deepStrictEqual(warns, [])
    })

    it(`case9 should still load all exports with null importTurf and a warning when setting innerHTML throws under Trusted Types (R-D9-c)`, function() {
        let { ctx, warns } = makeCtx({ window: true, ttThrow: true })
        vm.runInContext(codeMain, ctx)
        let g = ctx['w-gis']
        assert.strict.deepStrictEqual(Object.keys(g).sort(), [...names].sort())
        assert.strict.equal(g.importTurf, null)
        assert.strict.equal(warns.length, 1)
        assert.strict.ok(warns[0].includes('turf is unavailable'), warns[0])
        assert.strict.deepStrictEqual(norm(g.convertCoordinate('WGS84', 'TWD97TM2', [121, 24])), convertCoordinate('WGS84', 'TWD97TM2', [121, 24]))
    })

    it(`case10 should load with null importTurf and a warning when the injected script does not run under CSP (R-D9-c)`, function() {
        let { ctx, warns } = makeCtx({ window: true, noExec: true })
        vm.runInContext(codeMain, ctx)
        let g = ctx['w-gis']
        assert.strict.deepStrictEqual(Object.keys(g).sort(), [...names].sort())
        assert.strict.equal(g.importTurf, null)
        assert.strict.equal(warns.length, 1)
        assert.strict.ok(warns[0].includes('turf is unavailable'), warns[0])
    })

    it(`case11 should produce exactly dist/w-gis.umd.js, its sourcemap and dist/interp2.wk.umd.js, the latter referenced directly by downstream pages (R-ENTRY-2)`, function() {
        assert.strict.deepStrictEqual(fs.readdirSync(fdDist).sort(), ['interp2.wk.umd.js', 'w-gis.umd.js', 'w-gis.umd.js.map'])
    })

})
