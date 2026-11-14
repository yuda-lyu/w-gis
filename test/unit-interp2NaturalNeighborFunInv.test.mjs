import assert from 'assert'
import path from 'path'
import { pathToFileURL } from 'url'


//規則帳本: sgud/rule/rulebook.md L7(已修: funInterpFragments 之 msg.funInv 須以z軸還原正規化值)
//環境變數 W_GIS_SRC_DIR 可指定含 interp2NaturalNeighbor.mjs 等檔之資料夾(對照修前碼或變異碼), 預設為本套件 src
let dirSrc = process.env.W_GIS_SRC_DIR ? path.resolve(process.env.W_GIS_SRC_DIR) : path.resolve('src')
let interp2NaturalNeighbor = (await import(pathToFileURL(path.join(dirSrc, 'interp2NaturalNeighbor.mjs')).href)).default


//原始點: z範圍22~249(range 227), x範圍21~1151(min 21), y範圍3~371; 正規化後y之min為-378(正方形), 故x、y、z三軸之min各為21、-378、22
let ps = [{ x: 243, y: 206, z: 95 }, { x: 233, y: 225, z: 146 }, { x: 21, y: 325, z: 22 }, { x: 953, y: 28, z: 223 }, { x: 1092, y: 290, z: 39 }, { x: 744, y: 200, z: 191 }, { x: 174, y: 3, z: 22 }, { x: 537, y: 368, z: 249 }, { x: 1151, y: 371, z: 86 }, { x: 814, y: 252, z: 125 }]

//approx, 期望值為有理數精確解(以原始輸入計算, 見test/interp2NaturalNeighbor.test.mjs之說明); 本函數之z經正規化往返而有末位誤差, 以相對1e-12比對
let approx = (a, b, msg) => {
    assert.strict.equal(typeof a, 'number', msg)
    assert.ok(Math.abs(a - b) <= 1e-12 * Math.max(1, Math.abs(b)), `${msg || ''} ${a} vs ${b}`)
}

//捕捉console.log(修前碼於funInv拋錯時, addPoint之catch會console.log錯誤並使該點回傳null)
let withConsoleCaptured = (fn) => {
    let logs = []
    let saved = console.log
    console.log = (...args) => {
        logs.push(args.map(String).join(' '))
    }
    try {
        return { r: fn(), logs }
    }
    finally {
        console.log = saved
    }
}


describe(`interp2NaturalNeighbor funInterpFragments之msg.funInv(L7)`, function() {

    //spec: g_interp2NaturalNeighbor.mjs「因msg.v有正規化, 若要自行計算最終內插值須自行調用msg.funInv」: msg.v為正規化之z, funInv將其還原為原始z之尺度, 即最終回傳之z
    it(`msg.funInv(msg.v)等於最終回傳之z, 呼叫不拋錯、不印錯誤, 回呼回傳msg.v時結果同未傳回呼者`, function() {
        let vvs = []
        let { r, logs } = withConsoleCaptured(() => interp2NaturalNeighbor(ps, { x: 243, y: 207 }, {
            funInterpFragments: (msg) => {
                assert.strict.equal(typeof msg.funInv, 'function')
                vvs.push(msg.funInv(msg.v))
                return msg.v
            },
        }))
        assert.strict.deepStrictEqual(logs, [])
        assert.strict.deepStrictEqual([r.x, r.y], [243, 207])
        approx(r.z, 97.29447682486817) //有理數精確解(JSDoc範例)
        assert.strict.deepStrictEqual(vvs, [r.z])
    })

    //spec: 同上, 陣列內插點逐點呼叫(indTar), 各點之funInv(msg.v)皆等於該點之z
    it(`陣列內插點: 每個點之msg.funInv(msg.v)皆等於該點之z`, function() {
        let vvs = {}
        let pts = [{ x: 243, y: 207 }, { x: 283, y: 207 }, { x: 600, y: 250 }, { x: 900, y: 200 }]
        let { r, logs } = withConsoleCaptured(() => interp2NaturalNeighbor(ps, pts, {
            funInterpFragments: (msg) => {
                vvs[msg.indTar] = msg.funInv(msg.v)
                return msg.v
            },
        }))
        assert.strict.deepStrictEqual(logs, [])
        let zs = [97.29447682486817, 114.43040421951916, 193.6150805720753, 136.2866717607253] //有理數精確解
        r.forEach((v, i) => approx(v.z, zs[i], `i=${i}`))
        assert.strict.deepStrictEqual(r.map((v, i) => vvs[i]), r.map(v => v.z))
    })

    //spec: msg.funInv為z軸之反正規化: 正規化z之0對應原始z最小值、scale對應最大值(x軸、y軸之min為21、-378, 與z軸之22不同, 故能分辨所還原之軸)
    it(`msg.funInv(0)為原始z最小值22、msg.funInv(scale)為最大值249(scale為1與1000)`, function() {
        for (let scale of [1, 1000]) {
            let got = null
            let { logs } = withConsoleCaptured(() => interp2NaturalNeighbor(ps, { x: 243, y: 207 }, {
                scale,
                funInterpFragments: (msg) => {
                    got = [msg.funInv(0), msg.funInv(scale), msg.funInv(msg.v)]
                    return msg.v
                },
            }))
            assert.strict.deepStrictEqual(logs, [])
            assert.strict.deepStrictEqual(got.slice(0, 2), [22, 249], `scale=${scale}`)
            assert.strict.equal(typeof got[2], 'number')
        }
    })

    //spec: 同上, scale為1000時msg.v為0~1000之正規化值, funInv(msg.v)仍等於最終之z
    it(`scale為1000: msg.funInv(msg.v)等於最終回傳之z`, function() {
        let vv = null
        let { r, logs } = withConsoleCaptured(() => interp2NaturalNeighbor(ps, { x: 243, y: 207 }, {
            scale: 1000,
            funInterpFragments: (msg) => {
                vv = msg.funInv(msg.v)
                return msg.v
            },
        }))
        assert.strict.deepStrictEqual(logs, [])
        approx(r.z, 97.29447682486817) //有理數精確解(scale 1000; 權重與scale無關)
        assert.strict.equal(vv, r.z)
    })

    //spec: z範圍為0(所有原始點z相同)時不縮放(nv回傳原值), 還原後仍為該z, 與最終之z一致
    it(`所有原始點z相同(範圍為0): msg.funInv(msg.v)等於最終回傳之z`, function() {
        let flat = ps.map(v => ({ ...v, z: 5 }))
        let vv = null
        let { r, logs } = withConsoleCaptured(() => interp2NaturalNeighbor(flat, { x: 243, y: 207 }, {
            funInterpFragments: (msg) => {
                vv = msg.funInv(msg.v)
                return msg.v
            },
        }))
        assert.strict.deepStrictEqual(logs, [])
        assert.strict.equal(r.z, 5)
        assert.strict.equal(vv, 5)
    })

    //spec: funInv之輸入非數字時不拋錯(回傳null, 同interp2Normalize之inv), 不使內插點變成null
    it(`msg.funInv(非數字)回傳null且不拋錯, 內插點仍有值`, function() {
        let got = []
        let { r, logs } = withConsoleCaptured(() => interp2NaturalNeighbor(ps, { x: 243, y: 207 }, {
            funInterpFragments: (msg) => {
                got = [msg.funInv('abc'), msg.funInv(null), msg.funInv(undefined)]
                return msg.v
            },
        }))
        assert.strict.deepStrictEqual(logs, [])
        assert.strict.deepStrictEqual(got, [null, null, null])
        approx(r.z, 97.29447682486817)
    })

    //spec: JSDoc範例註解「回傳值仍須為正規化值, 若回傳msg.funInv(msg.v)會被再次還原而得錯誤之z」: 回傳值被視為正規化值而以z軸(range 227, min 22)再還原一次
    it(`回呼回傳msg.funInv(msg.v)(原始z尺度之值)時, 該值被再次還原: 最終z等於funInv(msg.v)*227+22`, function() {
        let vv = null
        let { r, logs } = withConsoleCaptured(() => interp2NaturalNeighbor(ps, { x: 243, y: 207 }, {
            funInterpFragments: (msg) => {
                vv = msg.funInv(msg.v)
                return vv
            },
        }))
        assert.strict.deepStrictEqual(logs, [])
        approx(vv, 97.29447682486817)
        assert.ok(Math.abs(r.z - (vv * 227 + 22)) < 1e-9, `r.z=${r.z}`)
    })

    //spec: 與funInterpFragment併用: 兩個回呼同時傳入時, funInterpFragments之funInv仍可用
    it(`與funInterpFragment併用: funInterpFragments之msg.funInv(msg.v)仍等於最終之z`, function() {
        let vv = null
        let { r, logs } = withConsoleCaptured(() => interp2NaturalNeighbor(ps, { x: 243, y: 207 }, {
            funInterpFragment: (msg) => msg.v,
            funInterpFragments: (msg) => {
                vv = msg.funInv(msg.v)
                return msg.v
            },
        }))
        assert.strict.deepStrictEqual(logs, [])
        assert.strict.equal(vv, r.z)
        approx(r.z, 97.29447682486817)
    })

})
