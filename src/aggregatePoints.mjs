import get from 'lodash-es/get.js'
import each from 'lodash-es/each.js'
import size from 'lodash-es/size.js'
import sortBy from 'lodash-es/sortBy.js'
import isnum from 'wsemi/src/isnum.mjs'
import isearr from 'wsemi/src/isearr.mjs'
import isestr from 'wsemi/src/isestr.mjs'
import cdbl from 'wsemi/src/cdbl.mjs'
import haskey from 'wsemi/src/haskey.mjs'


/**
 * 依照規則網格提取點數據
 *
 * Unit Test: {@link https://github.com/yuda-lyu/w-gis/blob/master/test/aggregatePoints.test.mjs Github}
 * @memberOf w-gis
 * @param {Array} ops 輸入點物件陣列
 * @param {Number} xmin 輸入網格x向最小座標數字
 * @param {Number} dx 輸入網格x向間距數字
 * @param {Number} ymin 輸入網格y向最小座標數字
 * @param {Number} dy 輸入網格y向間距數字
 * @param {Object} [opt={}] 輸入設定物件，預設{}
 * @param {String} [opt.keyX='x'] 輸入點物件之x座標欄位字串，預設'x'
 * @param {String} [opt.keyY='y'] 輸入點物件之y座標欄位字串，預設'y'
 * @param {String} [opt.keyZ='z'] 輸入點物件之z座標或值欄位字串，預設'z'
 * @param {String} [opt.modePick='min'] 輸入挑選方式字串，可選'min'、'max'，預設'min'
 * @returns {Array} 回傳點物件陣列
 * @example
 *
 * let ops
 * let r
 *
 * ops = 'not array'
 * try {
 *   r = aggregatePoints(ops, 0, 10, 0, 10)
 * }
 * catch (err) {
 *  r = err.message
 * }
 * console.log(r)
 * // => 'no ops'
 *
 * ops = [{ x: 1, y: 1, z: 10, id: 'a' }] // cell 0:0
 * r = aggregatePoints(ops, 0, 10, 0, 10, { modePick: 'min' })
 * console.log(r)
 * // => [ { x: 1, y: 1, z: 10, id: 'a' } ]
 *
 * ops = [
 *     { x: 1, y: 1, z: 10, id: 'a' }, // cell 0:0
 *     { x: 2, y: 2, z: 5, id: 'b' }, // cell 0:0 (same cell, smaller z)
 *     { x: 15, y: 1, z: 7, id: 'c' }, // cell 1:0
 * ]
 * r = aggregatePoints(ops, 0, 10, 0, 10, { modePick: 'min' })
 * console.log(r)
 * // => [ { x: 2, y: 2, z: 5, id: 'b' }, { x: 15, y: 1, z: 7, id: 'c' } ]
 *
 * ops = [
 *     { x: 1, y: 1, z: 10, id: 'a' }, // cell 0:0 (bigger z)
 *     { x: 2, y: 2, z: 5, id: 'b' }, // cell 0:0
 *     { x: 15, y: 1, z: 7, id: 'c' }, // cell 1:0
 * ]
 * r = aggregatePoints(ops, 0, 10, 0, 10, { modePick: 'max' })
 * console.log(r)
 * // => [ { x: 1, y: 1, z: 10, id: 'a' }, { x: 15, y: 1, z: 7, id: 'c' } ]
 *
 * ops = [
 *     { lon: 121.50, lat: 25.00, val: 3, id: 'p1' }, // cell 5:5  (xmin=121, dx=0.1; ymin=24.5, dy=0.1)
 *     { lon: 121.59, lat: 25.00, val: 9, id: 'p2' }, // same cell 5:5 (val bigger)
 *     { lon: 121.61, lat: 25.00, val: 1, id: 'p3' }, // cell 6:5
 * ]
 * r = aggregatePoints(ops, 121.0, 0.1, 24.5, 0.1, {
 *     keyX: 'lon',
 *     keyY: 'lat',
 *     keyZ: 'val',
 *     modePick: 'max',
 * })
 * console.log(r)
 * // => [ { lon: 121.59, lat: 25, val: 9, id: 'p2' }, { lon: 121.61, lat: 25, val: 1, id: 'p3' } ]
 *
 * ops = [
 *     { x: -1, y: -1, z: 9, id: 'n1' }, // cell -1:-1
 *     { x: -2, y: -2, z: 1, id: 'n2' }, // cell -1:-1 (min z)
 *     { x: 1, y: 1, z: 5, id: 'p1' }, // cell 0:0
 * ]
 * r = aggregatePoints(ops, 0, 10, 0, 10, { modePick: 'min' })
 * console.log(r)
 * // => [ { x: -2, y: -2, z: 1, id: 'n2' }, { x: 1, y: 1, z: 5, id: 'p1' } ]
 *
 */
function aggregatePoints(ops, xmin, dx, ymin, dy, opt = {}) {

    //check ops
    if (!isearr(ops)) {
        throw new Error(`no ops`)
    }

    //check xmin
    if (!isnum(xmin)) {
        throw new Error(`invalid xmin[${xmin}]`)
    }
    xmin = cdbl(xmin)

    //check dx
    if (!isnum(dx)) {
        throw new Error(`invalid dx[${dx}]`)
    }
    dx = cdbl(dx)

    //check ymin
    if (!isnum(ymin)) {
        throw new Error(`invalid ymin[${ymin}]`)
    }
    ymin = cdbl(ymin)

    //check dy
    if (!isnum(dy)) {
        throw new Error(`invalid dy[${dy}]`)
    }
    dy = cdbl(dy)

    //keyX
    let keyX = get(opt, 'keyX')
    if (!isestr(keyX)) {
        keyX = 'x'
    }

    //keyY
    let keyY = get(opt, 'keyY')
    if (!isestr(keyY)) {
        keyY = 'y'
    }

    //keyZ
    let keyZ = get(opt, 'keyZ')
    if (!isestr(keyZ)) {
        keyZ = 'z'
    }

    //modePick
    let modePick = get(opt, 'modePick')
    if (modePick !== 'min' && modePick !== 'max') {
        modePick = 'min'
    }

    //pts
    let pts = []
    if (true) {

        //kp
        let kp = {}
        each(ops, (m, km) => {

            //ix, iy
            let ix = (m[keyX] - xmin) / dx
            ix = Math.floor(ix)
            let iy = (m[keyY] - ymin) / dy
            iy = Math.floor(iy)
            // console.log('ix', ix, 'iy', iy, m[keyZ])

            //key
            let key = `${ix}:${iy}`

            //default
            if (!haskey(kp, key)) {
                kp[key] = []
            }

            //push
            kp[key].push({
                km,
                z: m[keyZ],
            })

        })
        // console.log('kp', kp)

        //提取網格
        pts = []
        each(kp, (ps, key) => {

            //n
            let n = size(ps)

            if (n === 1) {
                //僅1個點
                let km = ps[0].km
                let op = ops[km]
                pts.push(op)
            }
            else if (n > 1) {
                //多點須排序後取最小/最大值

                //sortBy
                // console.log('ps', ps)
                ps = sortBy(ps, 'z')
                // console.log('ps(sortBy)', ps)

                //op
                let j = 0
                if (modePick === 'max') {
                    j = size(ps) - 1
                }
                let km = ps[j].km
                let op = ops[km]

                //push
                pts.push(op)

            }
        })
        // console.log('pts', take(pts, 5), size(pts))

        // //zmin, zmax
        // let zmin = 1e20
        // let zmax = -1e20
        // each(pts, (m) => {
        //     zmin = Math.min(m[keyZ], zmin)
        //     zmax = Math.max(m[keyZ], zmax)
        // })
        // console.log('pts', 'zmin', zmin, 'zmax', zmax)

    }
    // console.log('pts', take(pts, 5), size(pts))

    return pts
}


export default aggregatePoints
