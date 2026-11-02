/* eslint-disable no-new-wrappers */ //測試刻意以new Number(...)作為無效輸入(包裝物件)
import assert from 'assert'
import interp1 from '../src/interp1.mjs'


describe(`interp1`, function() {
    let k = -1
    let oin = {}
    let out = {}

    k++
    oin[k] = { ps: [{ x: 243, y: 206 }, { x: 233, y: 225 }, { x: 21, y: 325 }, { x: 953, y: 28 }, { x: 1092, y: 290 }, { x: 744, y: 200 }, { x: 174, y: 3 }, { x: 537, y: 368 }, { x: 1151, y: 371 }, { x: 814, y: 252 }], p: { x: 243 }, opt: {} }
    out[k] = { x: 243, y: 206 }
    it(`should return point value when interp1(p at known x)`, async function() {
        k = 0
        let r = await interp1(oin[k].ps, oin[k].p, oin[k].opt)
        assert.strict.deepStrictEqual(r, out[k])
    })

    k++
    oin[k] = { ps: oin[0].ps, p: { x: 283 }, opt: {} }
    out[k] = { x: 283, y: 228.0408163265306 }
    it(`should interpolate value when interp1(p at unknown x)`, async function() {
        k = 1
        let r = await interp1(oin[k].ps, oin[k].p, oin[k].opt)
        assert.strict.deepStrictEqual(r, out[k])
    })

    k++
    oin[k] = { ps: oin[0].ps, p: { x: 1160 }, opt: {} }
    out[k] = { x: 1160, y: null }
    it(`should return null y when interp1(p out of range)`, async function() {
        k = 2
        let r = await interp1(oin[k].ps, oin[k].p, oin[k].opt)
        assert.strict.deepStrictEqual(r, out[k])
    })

    k++
    oin[k] = { ps: [{ a: 243, b: 206 }, { a: 233, b: 225 }, { a: 21, b: 325 }, { a: 953, b: 28 }, { a: 1092, b: 290 }, { a: 744, b: 200 }, { a: 174, b: 3 }, { a: 537, b: 368 }, { a: 1151, b: 371 }, { a: 814, b: 252 }], p: { a: 243 }, opt: { keyX: 'a', keyY: 'b' } }
    out[k] = { a: 243, b: 206 }
    it(`should support custom keys when interp1(keyX/keyY)`, async function() {
        k = 3
        let r = await interp1(oin[k].ps, oin[k].p, oin[k].opt)
        assert.strict.deepStrictEqual(r, out[k])
    })

    k++
    oin[k] = { ps: oin[0].ps, p: [{ x: 243 }, { x: 283 }], opt: {} }
    out[k] = [{ x: 243, y: 206 }, { x: 283, y: 228.0408163265306 }]
    it(`should interpolate array targets when interp1(psTar array)`, async function() {
        k = 4
        let r = await interp1(oin[k].ps, oin[k].p, oin[k].opt)
        assert.strict.deepStrictEqual(r, out[k])
    })

    k++
    oin[k] = { ps: [{ x: 0.000243, y: 0.000206 }, { x: 0.000233, y: 0.000225 }, { x: 0.000021, y: 0.000325 }, { x: 0.000953, y: 0.000028 }, { x: 0.001092, y: 0.00029 }, { x: 0.000744, y: 0.000200 }, { x: 0.000174, y: 0.000003 }, { x: 0.000537, y: 0.000368 }, { x: 0.001151, y: 0.000371 }, { x: 0.000814, y: 0.000252 }], p: { x: 0.000243 }, opt: {} }
    out[k] = { x: 0.000243, y: 0.00020600000000000002 }
    it(`should keep full float precision when interp1(small coordinates)`, async function() {
        k = 5
        let r = await interp1(oin[k].ps, oin[k].p, oin[k].opt)
        assert.strict.deepStrictEqual(r, out[k])
    })

    k++
    oin[k] = { ps: oin[0].ps, p: { x: 243 }, opt: { useSync: true } }
    out[k] = { x: 243, y: 206 }
    it(`should return sync result when interp1(useSync=true)`, function() {
        k = 6
        let r = interp1(oin[k].ps, oin[k].p, oin[k].opt)
        assert.strict.deepStrictEqual(r, out[k])
    })

    //有效數字: 原始型別number且為有限數, 或去頭尾空白後為十進位寫法之字串, 字串轉為數字後使用(JSDoc首段)
    k++
    oin[k] = { ps: oin[0].ps, p: ' 283 ', opt: {} }
    out[k] = { x: 283, y: 228.0408163265306 }
    it(`should accept padded numeric string as scalar target when interp1(psTar=' 283 ')`, async function() {
        k = 7
        let r = await interp1(oin[k].ps, oin[k].p, oin[k].opt)
        assert.strict.deepStrictEqual(r, out[k])
    })

    k++
    oin[k] = { ps: oin[0].ps, p: [243, '283', [300], { x: '  300' }, ['4e2'], { x: '+500' }, '.6e3', '5.'], opt: {} }
    out[k] = [{ x: 243, y: 206 }, { x: 283, y: 228.0408163265306 }, { x: 300, y: 237.40816326530611 }, { x: 300, y: 237.40816326530611 }, { x: 400, y: 292.51020408163265 }, { x: 500, y: 347.61224489795916 }, { x: 600, y: 316.8695652173913 }, { x: 5, y: null }]
    it(`should accept numeric, numeric string, [x] and {x} targets when interp1(psTar mixed forms)`, async function() {
        k = 8
        let r = await interp1(oin[k].ps, oin[k].p, oin[k].opt)
        assert.strict.deepStrictEqual(r, out[k])
    })

    k++
    oin[k] = { ps: [{ x: '21', y: '325' }, { x: ' 174 ', y: '3' }, { x: '233', y: ' 225' }, { x: '243', y: '206' }, { x: '537.0', y: '3.68e2' }, { x: '+744', y: '200' }, { x: '814', y: '252' }, { x: '953', y: '28' }, { x: '1092', y: '290' }, { x: '1151', y: '371' }], p: [{ x: 243 }, { x: 283 }, { x: 600 }, { x: 1160 }], opt: {} }
    out[k] = [{ x: 243, y: 206 }, { x: 283, y: 228.0408163265306 }, { x: 600, y: 316.8695652173913 }, { x: 1160, y: null }]
    it(`should accept numeric string data points when interp1(ps with numeric strings)`, async function() {
        k = 9
        let r = await interp1(oin[k].ps, oin[k].p, oin[k].opt)
        assert.strict.deepStrictEqual(r, out[k])
    })

    //內插點無效值略過、不輸出, 其餘各點與其內插值仍逐點對位(JSDoc無效值處置第3點)
    k++
    oin[k] = { ps: oin[0].ps, p: [{ x: 243 }, { x: Infinity }, { x: '0x10' }, { x: 'abc' }, { x: null }, { x: -Infinity }, { x: 'Infinity' }, { x: '1e400' }, { x: '1e-400' }, { x: '0b11' }, { x: NaN }, { x: new Number(300) }, { x: ' 283 ' }, { x: 600 }], opt: {} }
    out[k] = [{ x: 243, y: 206 }, { x: 283, y: 228.0408163265306 }, { x: 600, y: 316.8695652173913 }]
    it(`should skip invalid targets and keep valid targets aligned when interp1(psTar with invalid values)`, async function() {
        k = 10
        let r = await interp1(oin[k].ps, oin[k].p, oin[k].opt)
        assert.strict.deepStrictEqual(r, out[k])
        let rSync = interp1(oin[k].ps, oin[k].p, { ...oin[k].opt, useSync: true })
        assert.strict.deepStrictEqual(rSync, out[k])
    })

    k++
    oin[k] = { ps: oin[0].ps, p: [[Infinity], ['0x10'], [243], [], [283, 99]], opt: {} }
    out[k] = [{ x: 243, y: 206 }, { x: 283, y: 228.0408163265306 }]
    it(`should skip invalid [x] targets when interp1(psTar array of arrays)`, async function() {
        k = 11
        let r = await interp1(oin[k].ps, oin[k].p, oin[k].opt)
        assert.strict.deepStrictEqual(r, out[k])
    })

    k++
    oin[k] = { ps: oin[0].ps, p: [{ a: Infinity }, { a: 'abc' }, { a: 283 }], opt: { keyX: 'a', keyY: 'b' } }
    out[k] = [{ a: 283, b: 228.0408163265306 }]
    it(`should skip invalid targets by custom key when interp1(keyX='a')`, async function() {
        k = 12
        let r = await interp1([{ a: 243, b: 206 }, { a: 233, b: 225 }, { a: 21, b: 325 }, { a: 953, b: 28 }, { a: 1092, b: 290 }, { a: 744, b: 200 }, { a: 174, b: 3 }, { a: 537, b: 368 }, { a: 1151, b: 371 }, { a: 814, b: 252 }], oin[k].p, oin[k].opt)
        assert.strict.deepStrictEqual(r, out[k])
    })

    //全無有效內插點(JSDoc無效值處置第3點)
    k++
    oin[k] = { ps: oin[0].ps, p: [{ x: Infinity }, { x: '0x10' }, { x: 'abc' }, { x: new Number(5) }, null, 'z'], opt: {} }
    out[k] = { err: 'psTar has no effective data' }
    it(`should return err when interp1(psTar has no valid point)`, async function() {
        k = 13
        let r = await interp1(oin[k].ps, oin[k].p, oin[k].opt)
        assert.strict.deepStrictEqual(r, out[k])
        let rSync = interp1(oin[k].ps, oin[k].p, { ...oin[k].opt, useSync: true })
        assert.strict.deepStrictEqual(rSync, out[k])
    })

    k++
    oin[k] = { ps: oin[0].ps, p: { x: Infinity }, opt: {} }
    out[k] = { err: 'psTar has no effective data' }
    it(`should return err when interp1(psTar object with invalid x)`, async function() {
        k = 14
        let r = await interp1(oin[k].ps, oin[k].p, oin[k].opt)
        assert.strict.deepStrictEqual(r, out[k])
        r = await interp1(oin[k].ps, { x: '0x10' }, oin[k].opt)
        assert.strict.deepStrictEqual(r, out[k])
    })

    //單值內插點無效(JSDoc無效值處置第2點)
    k++
    oin[k] = { ps: oin[0].ps, p: [Infinity, -Infinity, NaN, 'Infinity', '-Infinity', '0x10', '0b11', '0o7', '1e400', '1e-400', new Number(283), true, null, undefined, '', ' ', 'abc'], opt: {} }
    out[k] = { err: 'psTar is not a number or an effective object or array' }
    it(`should return err when interp1(psTar scalar is not a valid number)`, async function() {
        k = 15
        for (let v of oin[k].p) {
            let r = await interp1(oin[k].ps, v, oin[k].opt)
            assert.strict.deepStrictEqual(r, out[k], `async psTar=${String(v)}`)
            let rSync = interp1(oin[k].ps, v, { useSync: true })
            assert.strict.deepStrictEqual(rSync, out[k], `sync psTar=${String(v)}`)
        }
    })

    //數據點x或y無效則該點略過, 結果同僅含有效點(JSDoc無效值處置第1點)
    k++
    oin[k] = { ps: [{ x: 243, y: 206 }, { x: Infinity, y: 1 }, { x: 233, y: 225 }, { x: 21, y: 325 }, { x: 1, y: -Infinity }, { x: 953, y: 28 }, { x: '0x10', y: 5 }, { x: 1092, y: 290 }, { x: 744, y: 200 }, { x: 174, y: 3 }, { x: '9', y: 'Infinity' }, { x: 537, y: 368 }, { x: 1151, y: 371 }, { x: new Number(77), y: 4 }, { x: 814, y: 252 }, { x: '1e400', y: 1 }, { x: '1e-400', y: 1 }, { x: '0b11', y: 1 }, { x: NaN, y: 1 }, { x: 55, y: new Number(3) }, { x: 66, y: null }, { x: 'abc', y: 1 }], p: [{ x: 5 }, { x: 12 }, { x: 55 }, { x: 77 }, { x: 100 }, { x: 243 }, { x: 283 }, { x: 1160 }], opt: {} }
    out[k] = [{ x: 5, y: null }, { x: 12, y: null }, { x: 55, y: 325 + (55 - 21) * (3 - 325) / (174 - 21) }, { x: 77, y: 325 + (77 - 21) * (3 - 325) / (174 - 21) }, { x: 100, y: 325 + (100 - 21) * (3 - 325) / (174 - 21) }, { x: 243, y: 206 }, { x: 283, y: 228.0408163265306 }, { x: 1160, y: null }]
    it(`should skip invalid data points when interp1(ps with Infinity, hex, wrapper, underflow points)`, async function() {
        k = 16
        let r = await interp1(oin[k].ps, oin[k].p, oin[k].opt)
        assert.strict.equal(r.length, out[k].length)
        for (let i = 0; i < r.length; i++) {
            assert.strict.equal(r[i].x, out[k][i].x)
            if (out[k][i].y === null) {
                assert.strict.equal(r[i].y, null)
            }
            else {
                assert.ok(Math.abs(r[i].y - out[k][i].y) < 1e-9, `x=${r[i].x}: ${r[i].y}`) //僅含有效點時之線性內插值
            }
        }
        //結果同僅含有效點
        let psEff = [{ x: 243, y: 206 }, { x: 233, y: 225 }, { x: 21, y: 325 }, { x: 953, y: 28 }, { x: 1092, y: 290 }, { x: 744, y: 200 }, { x: 174, y: 3 }, { x: 537, y: 368 }, { x: 1151, y: 371 }, { x: 814, y: 252 }]
        let rEff = await interp1(psEff, oin[k].p, oin[k].opt)
        assert.strict.deepStrictEqual(r, rEff)
    })

    k++
    oin[k] = { ps: [[1, 2], [Infinity, 3], [3, 4], [5, '0x10'], [7, 8]], p: [{ x: 2 }, { x: 5 }, { x: 7 }], opt: {} }
    out[k] = [{ x: 2, y: 3 }, { x: 5, y: 6 }, { x: 7, y: 8 }]
    it(`should skip invalid array data points when interp1(ps array form with invalid values)`, async function() {
        k = 17
        let r = await interp1(oin[k].ps, oin[k].p, oin[k].opt)
        assert.strict.deepStrictEqual(r, out[k])
    })

    k++
    oin[k] = { ps: [{ x: Infinity, y: 1 }, { x: '0x10', y: 2 }, { x: 5, y: 'Infinity' }, { x: 6, y: new Number(1) }], p: { x: 5 }, opt: {} }
    out[k] = { err: 'psSrc has no effective data' }
    it(`should return err when interp1(ps has no valid point)`, async function() {
        k = 18
        let r = await interp1(oin[k].ps, oin[k].p, oin[k].opt)
        assert.strict.deepStrictEqual(r, out[k])
    })

    //無效y不得被轉成極值參與內插, 僅剩1個有效點時各點內插值為null
    k++
    oin[k] = { ps: [{ x: 1, y: '0x10' }, { x: 3, y: 4 }], p: [{ x: 1 }, { x: 2 }, { x: 3 }], opt: {} }
    out[k] = [{ x: 1, y: null }, { x: 2, y: null }, { x: 3, y: null }]
    it(`should not use invalid y value when interp1(ps with y='0x10')`, async function() {
        k = 19
        let r = await interp1(oin[k].ps, oin[k].p, oin[k].opt)
        assert.strict.deepStrictEqual(r, out[k])
    })

})
