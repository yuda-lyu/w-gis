import assert from 'assert'
import path from 'path'
import { pathToFileURL } from 'url'
import { convex, featureCollection, point, booleanPointInPolygon } from '@turf/turf'


//規則帳本: sgud/rule/rulebook.md R-NN1-m(src/_makeHullTester.mjs: 凸包判定, 供interp2NaturalNeighbor之opt.limitInsideHull使用)
//環境變數 W_GIS_SRC_DIR 可指定含 _makeHullTester.mjs 之資料夾(對照變異碼), 預設為本套件 src
let dirSrc = process.env.W_GIS_SRC_DIR ? path.resolve(process.env.W_GIS_SRC_DIR) : path.resolve('src')
let _makeHullTester = (await import(pathToFileURL(path.join(dirSrc, '_makeHullTester.mjs')).href)).default

let mkRnd = (seed) => {
    let s = seed
    return () => {
        s = (s * 1664525 + 1013904223) % 4294967296
        return s / 4294967296
    }
}


describe(`_makeHullTester(R-NN1-m)`, function() {

    //spec: 凸包含邊界, 凸包外為false
    it(`單位正方形: 內部、邊上、頂點為true, 外部為false`, function() {
        let f = _makeHullTester([{ x: 0, y: 0 }, { x: 1, y: 0 }, { x: 1, y: 1 }, { x: 0, y: 1 }])
        assert.strict.equal(f(0.5, 0.5), true)
        assert.strict.equal(f(0.5, 0), true) //邊上
        assert.strict.equal(f(1, 0.3), true) //邊上
        assert.strict.equal(f(0, 0), true) //頂點
        assert.strict.equal(f(1, 1), true) //頂點
        assert.strict.equal(f(1.0000001, 0.5), false)
        assert.strict.equal(f(0.5, -0.0000001), false)
        assert.strict.equal(f(2, 2), false)
        assert.strict.equal(f(-1, 0.5), false)
    })

    //spec: 輸入點順序(順時針、逆時針、亂序)不影響凸包
    it(`三角形: 順時針、逆時針、亂序輸入之判定相同`, function() {
        let a = { x: 0, y: 0 }
        let b = { x: 10, y: 0 }
        let c = { x: 0, y: 10 }
        let fs = [[a, b, c], [a, c, b], [c, a, b], [b, c, a]].map(v => _makeHullTester(v))
        for (let f of fs) {
            assert.strict.equal(f(2, 2), true)
            assert.strict.equal(f(5, 5), true) //斜邊上
            assert.strict.equal(f(5, 0), true)
            assert.strict.equal(f(6, 6), false)
            assert.strict.equal(f(-0.1, 5), false)
        }
    })

    //spec: 重複點與共線之中間點不改變凸包
    it(`重複點與邊上之共線中間點不影響判定`, function() {
        let sq = [{ x: 0, y: 0 }, { x: 1, y: 0 }, { x: 1, y: 1 }, { x: 0, y: 1 }]
        let sq2 = [...sq, { x: 0, y: 0 }, { x: 1, y: 1 }, { x: 0.5, y: 0 }, { x: 1, y: 0.5 }, { x: 0.5, y: 0.5 }, { x: 0.5, y: 1 }]
        let f1 = _makeHullTester(sq)
        let f2 = _makeHullTester(sq2)
        for (let p of [[0.5, 0.5], [0.5, 0], [1.1, 0.5], [-0.1, -0.1], [0, 1], [0.99, 0.99]]) {
            assert.strict.equal(f2(p[0], p[1]), f1(p[0], p[1]), JSON.stringify(p))
        }
    })

    //spec: 凸包為凸多邊形, 凹形點集之凹口位於凸包內
    it(`L形點集: 凹口位於凸包內為true`, function() {
        let f = _makeHullTester([{ x: 0, y: 0 }, { x: 2, y: 0 }, { x: 2, y: 1 }, { x: 1, y: 1 }, { x: 1, y: 2 }, { x: 0, y: 2 }])
        assert.strict.equal(f(1.5, 1.5), true) //凹口, 在凸包(斜邊(2,1)-(1,2))內
        assert.strict.equal(f(1.6, 1.6), false) //超出斜邊
    })

    //spec: 原始點不足3個相異點或全部共線時無凸包面積, 恆為false(含原始點本身, 由呼叫端先行處理原始點座標)
    it(`退化: 0點、1點、重複點、2點、水平共線、垂直共線、斜線共線: 任何位置皆為false`, function() {
        let sets = [
            [],
            [{ x: 3, y: 4 }],
            [{ x: 3, y: 4 }, { x: 3, y: 4 }, { x: 3, y: 4 }],
            [{ x: 0, y: 0 }, { x: 1, y: 1 }],
            [{ x: 0, y: 0 }, { x: 1, y: 0 }, { x: 2, y: 0 }, { x: 5, y: 0 }],
            [{ x: 0, y: 0 }, { x: 0, y: 1 }, { x: 0, y: 2 }],
            [{ x: 0, y: 0 }, { x: 1, y: 1 }, { x: 2, y: 2 }, { x: 3, y: 3 }],
        ]
        for (let [i, ps] of sets.entries()) {
            let f = _makeHullTester(ps, 1e-9)
            for (let p of [[3, 4], [0, 0], [1, 1], [0.5, 0], [0, 0.5], [1.5, 1.5], [2, 0], [10, 10]]) {
                assert.strict.equal(f(p[0], p[1]), false, `sets[${i}] ${JSON.stringify(p)}`)
            }
        }
    })

    //spec: 容許距離為點至邊所在直線之外側距離(與邊長無關)
    it(`容許距離tol: 外側距離不大於tol視為在內, 大於tol為在外, 與邊長無關`, function() {
        let tol = 1e-3
        let fs = _makeHullTester([{ x: 0, y: 0 }, { x: 10, y: 0 }, { x: 0, y: 10 }], tol)
        assert.strict.equal(fs(5, -0.0005), true) //底邊外側0.0005
        assert.strict.equal(fs(5, -0.002), false) //外側0.002
        //長邊(長度1e6)
        let fl = _makeHullTester([{ x: 0, y: 0 }, { x: 1e6, y: 0 }, { x: 0, y: 1e6 }], tol)
        assert.strict.equal(fl(5e5, -0.0005), true)
        assert.strict.equal(fl(5e5, -0.002), false)
        //tol為0: 外側任何距離皆為false(邊上為true)
        let f0 = _makeHullTester([{ x: 0, y: 0 }, { x: 10, y: 0 }, { x: 0, y: 10 }], 0)
        assert.strict.equal(f0(5, 0), true)
        assert.strict.equal(f0(5, -1e-12), false)
    })

    //spec: 寬度(約4倍面積除以周長)不大於tol視為共線(無凸包面積)
    it(`窄凸包: 寬度不大於tol視為共線而恆為false, 大於tol則有凸包面積`, function() {
        let ps = [{ x: 0, y: 0 }, { x: 10, y: 0.0001 }, { x: 20, y: 0 }] //寬度約0.00005
        assert.strict.equal(_makeHullTester(ps, 1e-3)(10, 0.00003), false)
        assert.strict.equal(_makeHullTester(ps, 1e-6)(10, 0.00003), true)
        assert.strict.equal(_makeHullTester(ps, 0)(10, 0.00003), true)
    })

    //spec: 非有限數字之查詢點不在凸包內
    it(`查詢點非有限數字(NaN、Infinity、字串、null、undefined)為false`, function() {
        let f = _makeHullTester([{ x: 0, y: 0 }, { x: 1, y: 0 }, { x: 0, y: 1 }])
        for (let v of [NaN, Infinity, -Infinity, '0.2', null, undefined, {}, []]) {
            assert.strict.equal(f(v, 0.2), false)
            assert.strict.equal(f(0.2, v), false)
        }
        assert.strict.equal(f(0.2, 0.2), true)
    })

    //spec: 無效tol(非數字、負數、NaN、Infinity)視為0
    it(`tol非有限且大於等於0之數字視為0`, function() {
        for (let tol of ['a', -1, NaN, Infinity, null, undefined, [], {}]) {
            let f = _makeHullTester([{ x: 0, y: 0 }, { x: 10, y: 0 }, { x: 0, y: 10 }], tol)
            assert.strict.equal(f(5, 0), true, `tol=${String(tol)}`)
            assert.strict.equal(f(5, -1e-9), false, `tol=${String(tol)}`)
        }
    })

    //spec: 結果不受座標平移量與尺度影響(內部座標先平移並縮放), 面積與外積不下溢、不溢位、不因平移而數值抵銷
    it(`尺度(1e-165、1e155)與平移(±1e9、±1e15)不影響判定: 內部、邊上為true, 外部為false`, function() {
        let cases = []
        for (let k of [1e-165, 1, 1e155]) {
            cases.push({ k, dx: 0, dy: 0 })
        }
        for (let d of [1e9, -1e9, 1e15, -1e15]) {
            cases.push({ k: 1, dx: d, dy: d })
        }
        for (let { k, dx, dy } of cases) {
            let f = _makeHullTester([{ x: dx, y: dy }, { x: dx + 10 * k, y: dy }, { x: dx, y: dy + 10 * k }])
            let tag = JSON.stringify({ k, dx, dy })
            assert.strict.equal(f(dx + 2 * k, dy + 2 * k), true, `內部 ${tag}`)
            assert.strict.equal(f(dx + 5 * k, dy + 5 * k), true, `斜邊上 ${tag}`)
            assert.strict.equal(f(dx + 6 * k, dy + 6 * k), false, `斜邊外 ${tag}`)
            assert.strict.equal(f(dx - 1 * k, dy + 2 * k), false, `左外 ${tag}`)
        }
    })

    //spec: 非有限數之點不參與凸包; 運算結果非有限數時判為在外而非在內
    it(`非有限數(NaN、Infinity、非數字)之原始點不參與凸包; 範圍溢位(±1e308)視為無凸包面積`, function() {
        let tri = [{ x: 0, y: 0 }, { x: 10, y: 0 }, { x: 0, y: 10 }]
        let f = _makeHullTester([...tri, { x: Infinity, y: 5 }, { x: 3, y: NaN }, { x: '4', y: 4 }, { x: null, y: 1 }, { x: -Infinity, y: -Infinity }])
        assert.strict.equal(f(2, 2), true)
        assert.strict.equal(f(6, 6), false)
        assert.strict.equal(f(11, 0), false) //Infinity與'4'皆未被納入凸包
        let fh = _makeHullTester([{ x: -1e308, y: 0 }, { x: 1e308, y: 0 }, { x: 0, y: 1e308 }])
        for (let p of [[0, 1e300], [0, 0], [1e308, 0], [0, -1e307]]) {
            assert.strict.equal(fh(p[0], p[1]), false, JSON.stringify(p))
        }
    })

    //spec: 不改寫輸入
    it(`不改變輸入陣列之順序與內容`, function() {
        let ps = [{ x: 10, y: 0, z: 5 }, { x: 0, y: 10, z: 6 }, { x: 0, y: 0, z: 7 }, { x: 3, y: 3, z: 8 }]
        let snap = JSON.stringify(ps)
        _makeHullTester(ps, 1e-9)
        assert.strict.equal(JSON.stringify(ps), snap)
    })

    //spec: 以獨立判準(turf convex 與 booleanPointInPolygon)交叉核對, 隨機點不落於邊界
    it(`隨機點集與隨機查詢點: 與turf之凸包內外判定一致(200點集 x 20查詢點)`, function() {
        let rnd = mkRnd(11)
        let ng = 0
        for (let k = 0; k < 200; k++) {
            let n = 3 + Math.floor(rnd() * 12)
            let ps = []
            for (let i = 0; i < n; i++) {
                ps.push({ x: rnd() * 100 - 50, y: rnd() * 100 - 50 })
            }
            let hull = convex(featureCollection(ps.map(v => point([v.x, v.y]))))
            let f = _makeHullTester(ps, 0)
            for (let j = 0; j < 20; j++) {
                let q = { x: rnd() * 140 - 70, y: rnd() * 140 - 70 }
                let rr = booleanPointInPolygon(point([q.x, q.y]), hull)
                assert.strict.equal(f(q.x, q.y), rr, `k=${k} j=${j}`)
                ng++
            }
        }
        assert.strict.equal(ng, 4000)
    })

})
