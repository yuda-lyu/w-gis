import fs from 'fs'
import path from 'path'
import vm from 'vm'
import assert from 'assert'
import { spawn } from 'child_process'
import getDistOpts from '../toolg/distConfig.mjs'
import getIndexNames from '../toolg/getIndexNames.mjs'
import { findBadWarns, getUmdExternals, checkMain, checkWorker } from '../toolg/checkDist.mjs'
import convertCoordinate from '../src/convertCoordinate.mjs'
import getCentroidMultiPolygon from '../src/getCentroidMultiPolygon.mjs'
import interp2 from '../src/interp2.mjs'


//由目前src以發布選項建出之產物, 對應規則帳本R-ENTRY-2、R-ENTRY-3、R-D9
describe(`unit-entryDist`, function() {

    let fdSrc = path.resolve('./src')
    let fdTmp = path.resolve('./test/_tmp/unit-entryDist')
    let names = getIndexNames('./src/')
    let { externalsMain, externalsWorker } = getDistOpts()
    let codeTurf = fs.readFileSync(path.resolve('./node_modules/@turf/turf/turf.min.js'), 'utf8')
    let res = null
    let codeMain = ''

    let pg = [[[0, 0], [2, 0], [2, 2], [0, 2]]]
    let ps = [{ x: 243, y: 206, z: 95 }, { x: 233, y: 225, z: 146 }, { x: 21, y: 325, z: 22 }, { x: 953, y: 28, z: 223 }, { x: 1092, y: 290, z: 39 }, { x: 744, y: 200, z: 191 }, { x: 174, y: 3, z: 22 }, { x: 537, y: 368, z: 249 }, { x: 1151, y: 371, z: 86 }, { x: 814, y: 252, z: 125 }]
    let p = { x: 243, y: 207 }

    //norm, vm內產生之物件與本realm之原型不同, 先以JSON正規化再比對
    let norm = (v) => JSON.parse(JSON.stringify(v))

    function runChild(args, cwd) {
        return new Promise((resolve, reject) => {
            let se = ''
            let cp = spawn(process.execPath, args, { cwd })
            cp.stderr.on('data', (d) => {
                se += d
            })
            cp.on('error', reject)
            cp.on('close', (code) => {
                if (code === 0) {
                    resolve()
                }
                else {
                    reject(new Error(`build exited with code ${code}: ${se.slice(-2000)}`))
                }
            })
        })
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
        fs.rmSync(fdTmp, { recursive: true, force: true })
        fs.mkdirSync(fdTmp, { recursive: true })
        fs.copyFileSync(path.resolve('./package.json'), path.resolve(fdTmp, 'package.json'))
        await runChild([path.resolve('./test/tools/buildDist.mjs'), fdSrc], fdTmp)
        res = JSON.parse(fs.readFileSync(path.resolve(fdTmp, 'build-result.json'), 'utf8'))
        codeMain = fs.readFileSync(res.fpMain, 'utf8')
    })

    after(function() {
        fs.rmSync(fdTmp, { recursive: true, force: true })
    })

    it(`case1 should build without unresolved imports or missing global names (R-ENTRY-2)`, function() {
        assert.strict.deepStrictEqual(findBadWarns(res.warns), [])
    })

    it(`case2 should declare exactly the configured externals in the main UMD header (R-ENTRY-2)`, function() {
        assert.strict.deepStrictEqual(getUmdExternals(codeMain).sort(), [...externalsMain].sort())
    })

    it(`case3 should require the main bundle with the index names and the same results as src (R-ENTRY-3)`, function() {
        let r = checkMain({ fp: res.fpMain, names, externals: externalsMain })
        assert.strict.deepStrictEqual(r.problems, [])
        assert.strict.deepStrictEqual(r.mod.convertCoordinate('WGS84', 'TWD97TM2', [121, 24]), convertCoordinate('WGS84', 'TWD97TM2', [121, 24]))
        assert.strict.deepStrictEqual(r.mod.getCentroidMultiPolygon(pg), getCentroidMultiPolygon(pg))
        assert.strict.deepStrictEqual(r.mod.interp2(ps, p, { useSync: true }), interp2(ps, p, { useSync: true }))
    })

    it(`case4 should load the UMD global branch in a bare vm context with the index names (R-ENTRY-3)`, function() {
        let ctx = vm.createContext({})
        vm.runInContext(codeMain, ctx)
        assert.strict.deepStrictEqual(Object.keys(ctx['w-gis']).sort(), [...names].sort())
    })

    it(`case5 should build the worker bundle with the configured externals and the same result as src interp2 (R-ENTRY-2, R-ENTRY-3)`, async function() {
        let r = await checkWorker({ fp: res.fpWorker, externals: externalsWorker })
        assert.strict.deepStrictEqual(r.problems, [])
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

})
