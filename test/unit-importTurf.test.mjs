import assert from 'assert'
import importTurf from '../src/importTurf.mjs'
import { injectTurf } from '../src/_importTurfBrowser.mjs'


//importTurf與瀏覽器端之turf注入邏輯, 對應規則帳本R-D9-a、R-D9-c
describe(`unit-importTurf`, function() {

    //makeG, 假之瀏覽器全域: appendChild模擬瀏覽器執行注入之turf UMD(設定全域turf)
    function makeG(opt = {}) {
        let injected = { injectedTurf: true }
        let codes = []
        let g = {}
        if ('hostTurf' in opt) {
            g.turf = opt.hostTurf
        }
        let head = {
            appendChild: (ele) => {
                if (!opt.noExec) { //noExec模擬CSP禁inline或AMD頁: 注入之script未設定全域turf
                    g.turf = injected
                }
            },
        }
        g.document = {
            createElement: () => {
                let ele = {}
                Object.defineProperty(ele, 'innerHTML', {
                    get: () => codes[codes.length - 1],
                    set: (v) => {
                        if (opt.ttThrow) { //模擬Trusted Types
                            throw new TypeError(`Failed to set the 'innerHTML' property on 'Element': This document requires 'TrustedHTML' assignment.`)
                        }
                        codes.push(v)
                    },
                })
                return ele
            },
            getElementsByTagName: () => [head],
        }
        return { g, injected, codes }
    }

    //withWarns, 收集console.warn
    function withWarns(fn) {
        let warns = []
        let _warn = console.warn
        console.warn = (...args) => {
            warns.push(args.join(' '))
        }
        let r
        try {
            r = fn()
        }
        finally {
            console.warn = _warn
        }
        return { r, warns }
    }

    it(`should be the @turf/turf namespace in Node.js`, function() {
        assert.strict.equal(typeof importTurf, 'object')
        assert.strict.equal(typeof importTurf.area, 'function')
    })

    it(`should inject the given code, return the injected turf and leave it as the global turf on a page without turf`, function() {
        let { g, injected, codes } = makeG()
        let { r, warns } = withWarns(() => injectTurf(g, 'CODE'))
        assert.strict.deepStrictEqual(codes, ['CODE'])
        assert.strict.equal(r, injected)
        assert.strict.equal(g.turf, injected)
        assert.strict.deepStrictEqual(warns, [])
    })

    it(`should restore the host page turf and return its own injected turf (R-D9-a)`, function() {
        let hostTurf = { hostTurf: true }
        let { g, injected } = makeG({ hostTurf })
        let { r, warns } = withWarns(() => injectTurf(g, 'CODE'))
        assert.strict.equal(r, injected)
        assert.strict.equal(g.turf, hostTurf)
        assert.strict.deepStrictEqual(warns, [])
    })

    it(`should return null with a warning and keep the host turf when setting innerHTML throws under Trusted Types (R-D9-c)`, function() {
        let hostTurf = { hostTurf: true }
        let { g } = makeG({ hostTurf, ttThrow: true })
        let { r, warns } = withWarns(() => injectTurf(g, 'CODE'))
        assert.strict.equal(r, null)
        assert.strict.equal(g.turf, hostTurf)
        assert.strict.equal(warns.length, 1)
        assert.strict.ok(warns[0].includes('turf is unavailable'), warns[0])
        assert.strict.ok(warns[0].includes('TrustedHTML'), warns[0])
    })

    it(`should return null with a warning when the injected script does not run (R-D9-c)`, function() {
        let { g } = makeG({ noExec: true })
        let { r, warns } = withWarns(() => injectTurf(g, 'CODE'))
        assert.strict.equal(r, null)
        assert.strict.equal(g.turf, undefined)
        assert.strict.equal(warns.length, 1)
        assert.strict.ok(warns[0].includes('turf is unavailable'), warns[0])
    })

    it(`should not return the host turf when the injected script does not run on a page with turf (R-D9-a, R-D9-c)`, function() {
        let hostTurf = { hostTurf: true }
        let { g } = makeG({ hostTurf, noExec: true })
        let { r, warns } = withWarns(() => injectTurf(g, 'CODE'))
        assert.strict.equal(r, null)
        assert.strict.equal(g.turf, hostTurf)
        assert.strict.equal(warns.length, 1)
    })

})
