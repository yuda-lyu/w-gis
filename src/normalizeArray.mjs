import get from 'lodash-es/get.js'
import each from 'lodash-es/each.js'
import map from 'lodash-es/map.js'
import min from 'lodash-es/min.js'
import max from 'lodash-es/max.js'
import filter from 'lodash-es/filter.js'
import size from 'lodash-es/size.js'
import range from 'lodash-es/range.js'
import mean from 'lodash-es/mean.js'
import isearr from 'wsemi/src/isearr.mjs'
import isnum from 'wsemi/src/isnum.mjs'
import cdbl from 'wsemi/src/cdbl.mjs'
import iseobj from 'wsemi/src/iseobj.mjs'


function normalizeArrayCore(arr) {

    //check psSrc
    if (!isearr(arr)) {
        return {
            err: 'arr is not an effective array'
        }
    }

    //v0
    let v0 = get(arr, 0)

    //n
    let n = 0 //1d array
    if (isearr(v0)) {
        n = size(v0) //nd array
    }

    //earr
    let earr = []
    if (n === 0) {
        earr = filter(arr, isnum)
        earr = map(earr, cdbl)
    }
    else {
        each(arr, (vs) => {

            //b
            let b = true
            let cs = []
            each(range(n), (i) => {

                //v
                let v = get(vs, i)

                //check
                if (!isnum(v)) {
                    b = false
                    //跳出換下一個
                }

                //push
                cs.push(cdbl(v))

            })

            //check
            if (b) {
                earr.push(cs)
            }

        })
    }

    //check
    if (size(earr) === 0) {
        return {
            err: 'arr has no effective data'
        }
    }

    //sta
    let sta = (arr) => {
        let rmin = min(arr)
        let rmax = max(arr)
        return {
            min: rmin,
            max: rmax,
            range: rmax - rmin,
            mid: (rmax + rmin) / 2,
            avg: mean(arr),
        }
    }

    //nmarr
    let nmarr = (arr, rmin, rmax, rrng) => {
        return map(arr, (v) => {
            return (v - rmin) / rrng
        })
    }

    //nm
    let nm = (arr) => {
        let s = sta(arr)
        let arrt = nmarr(arr, s.min, s.max, s.range)
        return {
            arr: arrt,
            ...s,
        }
    }

    //r
    let r = null
    if (n === 0) {
        r = nm(earr)
    }
    else {
        r = map(range(n), (i) => {
            let earrt = map(earr, i)
            return nm(earrt)
        })
    }

    return r
}


/**
 * 針對一維或二維陣列正規化
 *
 * Unit Test: {@link https://github.com/yuda-lyu/w-gis/blob/master/test/normalizeArray.test.mjs Github}
 * @memberOf w-gis
 * @param {Array} arr 輸入資料陣列，為[x1,x2,...]之一維陣列，或[[x1,y1],[x2,y2],...]之二維陣列
 * @returns {Array|Object} 回傳正規化數據之物件或陣列
 * @example
 *
 * let arr
 * let r
 *
 * arr = [
 *     [243, 206, 95],
 *     [233, 225, 146],
 *     [21, 325, 22],
 *     [953, 28, 223],
 *     [1092, 290, 39],
 *     [744, 200, 191],
 *     [174, 3, 22],
 *     [537, 368, 249],
 *     [1151, 371, 86],
 *     [814, 252, 125]
 * ]
 * r = normalizeArray(arr)
 * console.log(r)
 * // => [
 * //   {
 * //     arr: [
 * //       0.19646017699115045,
 * //       0.18761061946902655,
 * //       0,
 * //       0.8247787610619469,
 * //       0.947787610619469,
 * //       0.6398230088495576,
 * //       0.13539823008849558,
 * //       0.45663716814159294,
 * //       1,
 * //       0.7017699115044248
 * //     ],
 * //     min: 21,
 * //     max: 1151,
 * //     range: 1130,
 * //     avg: 596.2
 * //   },
 * //   {
 * //     arr: [
 * //       0.5516304347826086,
 * //       0.6032608695652174,
 * //       0.875,
 * //       0.06793478260869565,
 * //       0.779891304347826,
 * //       0.5353260869565217,
 * //       0,
 * //       0.9918478260869565,
 * //       1,
 * //       0.6766304347826086
 * //     ],
 * //     min: 3,
 * //     max: 371,
 * //     range: 368,
 * //     avg: 226.8
 * //   },
 * //   {
 * //     arr: [
 * //       0.32158590308370044,
 * //       0.5462555066079295,
 * //       0,
 * //       0.8854625550660793,
 * //       0.07488986784140969,
 * //       0.7444933920704846,
 * //       0,
 * //       1,
 * //       0.28193832599118945,
 * //       0.45374449339207046
 * //     ],
 * //     min: 22,
 * //     max: 249,
 * //     range: 227,
 * //     avg: 119.8
 * //   }
 * // ]
 *
 * arr = [
 *     243, 233, 21,
 *     953, 1092, 744,
 *     174, 537, 1151,
 *     814
 * ]
 * r = normalizeArray(arr)
 * console.log(r)
 * // => {
 * //   arr: [
 * //     0.19646017699115045,
 * //     0.18761061946902655,
 * //     0,
 * //     0.8247787610619469,
 * //     0.947787610619469,
 * //     0.6398230088495576,
 * //     0.13539823008849558,
 * //     0.45663716814159294,
 * //     1,
 * //     0.7017699115044248
 * //   ],
 * //   min: 21,
 * //   max: 1151,
 * //   range: 1130,
 * //   avg: 596.2
 * // }
 *
 * arr = [{ x: 243, y: 206, z: 95 }, { x: 233, y: 225, z: 146 }, { x: 21, y: 325, z: 22 }, { x: 953, y: 28, z: 223 }, { x: 1092, y: 290, z: 39 }, { x: 744, y: 200, z: 191 }, { x: 174, y: 3, z: 22 }, { x: 537, y: 368, z: 249 }, { x: 1151, y: 371, z: 86 }, { x: 814, y: 252, z: 125 }]
 * r = normalizeArray(arr, ['x', 'y', 'z'])
 * console.log(r)
 * // => [
 * //   {
 * //     arr: [
 * //       0.19646017699115045,
 * //       0.18761061946902655,
 * //       0,
 * //       0.8247787610619469,
 * //       0.947787610619469,
 * //       0.6398230088495576,
 * //       0.13539823008849558,
 * //       0.45663716814159294,
 * //       1,
 * //       0.7017699115044248
 * //     ],
 * //     min: 21,
 * //     max: 1151,
 * //     range: 1130,
 * //     avg: 596.2
 * //   },
 * //   {
 * //     arr: [
 * //       0.5516304347826086,
 * //       0.6032608695652174,
 * //       0.875,
 * //       0.06793478260869565,
 * //       0.779891304347826,
 * //       0.5353260869565217,
 * //       0,
 * //       0.9918478260869565,
 * //       1,
 * //       0.6766304347826086
 * //     ],
 * //     min: 3,
 * //     max: 371,
 * //     range: 368,
 * //     avg: 226.8
 * //   },
 * //   {
 * //     arr: [
 * //       0.32158590308370044,
 * //       0.5462555066079295,
 * //       0,
 * //       0.8854625550660793,
 * //       0.07488986784140969,
 * //       0.7444933920704846,
 * //       0,
 * //       1,
 * //       0.28193832599118945,
 * //       0.45374449339207046
 * //     ],
 * //     min: 22,
 * //     max: 249,
 * //     range: 227,
 * //     avg: 119.8
 * //   }
 * // ]
 *
 */
function normalizeArray(arr, keys = []) {

    //check psSrc
    if (!isearr(arr)) {
        return {
            err: 'arr is not an effective array'
        }
    }

    //keys
    if (size(keys) > 0) {

        //check
        let v0 = get(arr, 0)
        if (!iseobj(v0)) {
            return {
                err: 'arr is not an effective array of objects'
            }
        }

        //arrt, 提取指定keys
        let arrt = []
        each(arr, (dt) => {
            let cs = []
            each(keys, (k) => {
                cs.push(get(dt, k, ''))
            })
            arrt.push(cs)
        })

        //save
        arr = arrt

    }

    //normalizeArrayCore
    let r = normalizeArrayCore(arr)

    return r
}


export default normalizeArray
