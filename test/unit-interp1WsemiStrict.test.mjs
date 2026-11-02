/* eslint-disable no-new-wrappers */ //測試刻意以new Number(...)作為無效輸入(包裝物件)
import assert from 'assert'
import { spawnSync } from 'child_process'
import { fileURLToPath, pathToFileURL } from 'url'
import { dirname, resolve } from 'path'
import interp1Strict from './tools/wsemiInterp1Strict.mjs'


//wsemi interp1第3輪將改為: px陣列之無效元素原位輸出{err}(長度恆等於px)。本檔以替身(test/tools/wsemiInterp1Strict.mjs)
//先行驗證本套件src/interp1.mjs交給wsemi之值皆已清理: 嚴格版下結果不變、不拋錯, 且交付值皆為原始型別number之有限數。
//子行程以ESM載入鉤(test/tools/registerWsemiStrict.mjs)把src/interp1.mjs對wsemi/src/interp1.mjs之引用導向替身。
//環境變數W_GIS_INTERP1_SRC可指定其他interp1.mjs路徑(供修前碼對照與變異驗證)。

const dirTest = dirname(fileURLToPath(import.meta.url))
const MARK = '@@interp1Child@@'


function runChild({ strict, variant }) {
    let args = []
    if (strict) {
        args.push('--import', pathToFileURL(resolve(dirTest, 'tools/registerWsemiStrict.mjs')).href)
    }
    args.push(resolve(dirTest, 'tools/runInterp1Child.mjs'))
    if (process.env.W_GIS_INTERP1_SRC) {
        args.push(resolve(process.env.W_GIS_INTERP1_SRC))
    }
    let env = { ...process.env }
    delete env.W_GIS_WSEMI_STRICT
    if (variant) {
        env.W_GIS_WSEMI_STRICT = variant
    }
    let p = spawnSync(process.execPath, args, { env, encoding: 'utf8', windowsHide: true, maxBuffer: 256 * 1024 * 1024, timeout: 150000 })
    let line = String(p.stdout).split('\n').find((s) => s.startsWith(MARK))
    if (!line) {
        throw new Error(`child failed: status=${p.status}, stderr=${String(p.stderr).slice(0, 2000)}`)
    }
    return JSON.parse(line.slice(MARK.length))
}


describe(`interp1 with strict wsemi stand-in`, function() {

    describe(`stand-in contract`, function() {
        let envOld
        let ps = [[0, 0], [10, 10]]

        beforeEach(function() {
            envOld = process.env.W_GIS_WSEMI_STRICT
            delete globalThis.__interp1Spy
        })

        afterEach(function() {
            if (envOld === undefined) {
                delete process.env.W_GIS_WSEMI_STRICT
            }
            else {
                process.env.W_GIS_WSEMI_STRICT = envOld
            }
            delete globalThis.__interp1Spy
        })

        it(`should output err in place and keep length when px has invalid elements (faithful)`, function() {
            process.env.W_GIS_WSEMI_STRICT = 'faithful'
            let px = [1, Infinity, '0x10', null, 'abc', '2', { x: 3 }, [4], new Number(5), -Infinity, 'Infinity', NaN]
            let r = interp1Strict(ps, px)
            assert.strict.equal(r.length, px.length)
            let bad = (i) => ({ err: `invalid px[${i}]: must be a valid number` })
            assert.strict.deepStrictEqual(r, [1, bad(1), bad(2), bad(3), bad(4), 2, 3, 4, bad(8), bad(9), bad(10), bad(11)])
        })

        it(`should treat object and array elements as invalid (numberOnly)`, function() {
            process.env.W_GIS_WSEMI_STRICT = 'numberOnly'
            let r = interp1Strict(ps, [1, { x: 3 }, [4], '2'])
            assert.strict.deepStrictEqual(r, [1, { err: 'invalid px[1]: must be a valid number' }, { err: 'invalid px[2]: must be a valid number' }, 2])
        })

        it(`should return err when px is a single invalid value`, function() {
            for (let v of [Infinity, '0x10', null, 'abc', NaN]) {
                let r = interp1Strict(ps, v)
                assert.strict.equal(typeof r.err, 'string', String(v))
            }
            assert.strict.equal(interp1Strict(ps, '5'), 5)
        })

        it(`should record values that are not finite primitive numbers (spy sanity)`, function() {
            interp1Strict([{ x: Infinity, y: 1 }, { x: '2', y: 3 }, { x: 4, y: 5 }, { x: 6, y: 7 }], [{ x: 1 }, 2, '3', Infinity, new Number(4)], {})
            let spy = globalThis.__interp1Spy
            assert.strict.equal(spy.calls, 1)
            assert.strict.deepStrictEqual(spy.badPs.map((o) => `${o.i}:${o.type}`), ['0:x:Infinity', '1:x:string'])
            assert.strict.deepStrictEqual(spy.badPx.map((o) => `${o.i}:${o.type}`), ['0:object', '2:string', '3:Infinity', '4:object'])
        })
    })

    describe(`src/interp1.mjs under real and strict wsemi`, function() {
        let real
        let faithful
        let numberOnly

        before(function() {
            this.timeout(180000)
            real = runChild({ strict: false })
            faithful = runChild({ strict: true, variant: 'faithful' })
            numberOnly = runChild({ strict: true, variant: 'numberOnly' })
        })

        it(`should hand only finite primitive numbers to wsemi interp1 (px, data points)`, function() {
            for (let [name, o] of [['faithful', faithful], ['numberOnly', numberOnly]]) {
                assert.strict.ok(o.spy.calls > 100, `${name}: stand-in must be used, calls=${o.spy.calls}`)
                assert.strict.deepStrictEqual(o.spy.badPx, [], `${name}: px`)
                assert.strict.deepStrictEqual(o.spy.badPs, [], `${name}: data points`)
            }
        })

        it(`should give the same results as real wsemi for all cases when wsemi turns strict`, function() {
            assert.strict.ok(real.rs.length > 100)
            for (let [name, o] of [['faithful', faithful], ['numberOnly', numberOnly]]) {
                assert.strict.equal(o.rs.length, real.rs.length, name)
                for (let i = 0; i < real.rs.length; i++) {
                    assert.strict.equal(o.rs[i].name, real.rs[i].name)
                    assert.strict.equal(o.rs[i].sync, real.rs[i].sync, `${name}: ${real.rs[i].name} (sync)`)
                    assert.strict.equal(o.rs[i].async, real.rs[i].async, `${name}: ${real.rs[i].name} (async)`)
                }
            }
        })

        it(`should not throw or reject for any case under strict wsemi`, function() {
            for (let [name, o] of [['real', real], ['faithful', faithful], ['numberOnly', numberOnly]]) {
                for (let r of o.rs) {
                    assert.strict.ok(!r.sync.startsWith('THROW'), `${name}: ${r.name} (sync)`)
                    assert.strict.ok(!r.async.startsWith('rej'), `${name}: ${r.name} (async)`)
                }
            }
        })
    })

})
