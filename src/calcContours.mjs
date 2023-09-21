import each from 'lodash/each'
import map from 'lodash/map'
import min from 'lodash/min'
import max from 'lodash/max'
import get from 'lodash/get'
import take from 'lodash/take'
import size from 'lodash/size'
import cloneDeep from 'lodash/cloneDeep'
import isearr from 'wsemi/src/isearr.mjs'
import isestr from 'wsemi/src/isestr.mjs'
import isfun from 'wsemi/src/isfun.mjs'
import ispnum from 'wsemi/src/ispnum.mjs'
import isbol from 'wsemi/src/isbol.mjs'
import iseobj from 'wsemi/src/iseobj.mjs'
import cdbl from 'wsemi/src/cdbl.mjs'
import oc from 'wsemi/src/color.mjs'
import { tricontour } from 'd3-tricontour'
import ptsXYZtoArr from './ptsXYZtoArr.mjs'
import getAreaMultiPolygonSm from './getAreaMultiPolygonSm.mjs'
import getCentroidMultiPolygon from './getCentroidMultiPolygon.mjs'
import clipMultiPolygon from './clipMultiPolygon.mjs'
import intersectMultiPolygon from './intersectMultiPolygon.mjs'
import invCoordMultiPolygon from './invCoordMultiPolygon.mjs'


function getContours(pts, thresholds) {

    //tricontour
    let tric = tricontour()

    //thresholds
    if (isearr(thresholds)) {
        tric.thresholds(thresholds) //[0, 25, 50]
    }

    //calc
    let contours = tric(pts)
    // console.log('calcContours contours1', contours)
    // contours = [contours[0], contours[1], contours[2], contours[3]]
    // console.log('calcContours contours2', contours)

    //偵測從最末數來第一個無效多邊形
    let ub = size(contours) - 1
    for (let i = ub; i >= 1; i--) {

        //ipre
        let ipre = i - 1

        //contourPre
        let contourPre = contours[ipre]

        //coordinatesPre
        let coordinatesPre = get(contourPre, 'coordinates', [])

        //nPre
        let nPre = size(coordinatesPre)

        //contourNow
        let contourNow = contours[i]

        //coordinatesNow
        let coordinatesNow = get(contourNow, 'coordinates', [])

        //nNow
        let nNow = size(coordinatesNow)

        //check
        if (nPre > 0 && nNow === 0) {
            //找到從最末數來第一個無效多邊形

            //set sepZone=top
            contours[i].sepZone = 'top'

            //take
            contours = take(contours, i + 1)

            break
        }

    }

    return contours
}


/**
 * 不規則點基於三角化網格計算等值線圖
 *
 * Unit Test: {@link https://github.com/yuda-lyu/w-gis/blob/master/test/calcContours.test.mjs Github}
 * @memberOf w-gis
 * @param {Array} points 輸入點陣列，各點可為[{x:x1,y:y1},{x:x2,y:y2},...]物件型態，或可為[[x1,y1],[x2,y2],...]陣列型態
 * @param {String} [opt.keyX='x'] 輸入點物件之x座標欄位字串，預設'x'
 * @param {String} [opt.keyY='y'] 輸入點物件之y座標欄位字串，預設'y'
 * @param {String} [opt.keyZ='z'] 輸入點物件之z座標或值欄位字串，預設'z'
 * @param {Array} [opt.containInner=null] 輸入等值線圖須保留之MultiPolygon陣列，也就是等值線圖取交集，預設null
 * @param {Array} [opt.clipInner=null] 輸入等值線圖須剔除以內之MultiPolygon陣列，也就是等值線圖取差集，預設null
 * @param {Array} [opt.clipOuter=null] 輸入等值線圖須剔除以外之MultiPolygon陣列，效果同containInner是等值線圖取交集，預設null
 * @param {Array} [opt.thresholds=null] 輸入指定等值線切分值陣列，預設null
 * @param {Boolean} [opt.withStyle=false] 輸入是否給予樣式布林值，若returnGeojson給予true也會強制給予樣式，預設false
 * @param {Function} [opt.kpGradientColor={0: 'rgb(255, 255, 255)',0.2: 'rgb(254, 178, 76)',0.4: 'rgb(252, 78, 42)',0.6: 'rgb(220, 58, 38)',0.8: 'rgb(200, 40, 23)',1: 'rgb(180, 30, 60)'}] 輸入內插顏色用梯度物件，預設{0: 'rgb(255, 255, 255)',0.2: 'rgb(254, 178, 76)',0.4: 'rgb(252, 78, 42)',0.6: 'rgb(220, 58, 38)',0.8: 'rgb(200, 40, 23)',1: 'rgb(180, 30, 60)'}
 * @param {Function} [opt.funGetFillColor=null] 輸入內插面顏色用函數，輸入為(k,n)，分別代表當前等值線指標與最大指標(也就是等值線數-1)，不提供函數時使用預設kpGradientColor進行內插，預設null
 * @param {Number} [opt.fillOpacity=0.2] 輸入面顏色透明度數字，預設0.2
 * @param {Number} [opt.lineColor=''] 輸入線顏色字串，若有funGetLineColor則優先使用，若無則預設使用面顏色，預設''
 * @param {Function} [opt.funGetLineColor=null] 輸入內插線顏色用函數，若有給予則覆蓋lineColor，輸入為(k,n)，分別代表當前等值線指標與最大指標(也就是等值線數-1)，不提供函數時使用預設為面顏色，預設null
 * @param {Number} [opt.lineOpacity=1] 輸入線顏色透明度數字，預設1
 * @param {Number} [opt.lineWidth=1] 輸入線寬度數字，預設1
 * @param {Boolean} [opt.returnGeojson=false] 輸入是否回傳GeoJSON布林值，若為true會強制withStyle給予true，預設false
 * @returns {Array|Object} 回傳點物件陣列或點物件，若使用returnWithVariogram=true則回傳物件資訊，若發生錯誤則回傳錯誤訊息物件
 * @example
 *
 * let opt
 * let pgs
 *
 * let points = [
 *     [24.325, 120.786, 0], [23.944, 120.968, 10], [24.884, 121.234, 20], [24.579, 121.345, 80], [24.664, 121.761, 40], [23.803, 121.397, 30],
 *     [23.727, 120.772, 0], [23.539, 120.975, 0], [23.612, 121.434, 0],
 *     [23.193, 120.355, 22], [23.456, 120.890, 42], [23.280, 120.551, 25], [23.162, 121.247, 5],
 * ]
 *
 * let containInner = [ //此結構代表1個polygon, leaflet可支援顯示, 但turf做intersect不支援, 故l-contour會通過toMultiPolygon轉換才能支援
 *     [
 *         [24.28, 120.842], [24.494, 121.203], [24.314, 121.190], [24.232, 121.109], [24.249, 120.910],
 *     ],
 *     [
 *         [24.217, 120.851], [24.172, 121.242], [24.059, 121.333], [24.001, 121.055],
 *     ],
 * ]
 *
 * let clipInner = [ //此結構代表1個polygon, leaflet可支援顯示, 但turf做difference不支援, 故l-contour會通過toMultiPolygon轉換才能支援
 *     [
 *         [24.28, 120.842], [24.494, 121.203], [24.314, 121.190], [24.232, 121.109], [24.249, 120.910],
 *     ],
 *     [
 *         [24.217, 120.851], [24.172, 121.242], [24.059, 121.333], [24.001, 121.055],
 *     ],
 * ]
 *
 * let clipOuter = [
 *     [24.585, 120.79], [24.9, 121.620], [23.984, 121.6], [23.941, 121.196], [24.585, 120.79]
 * ]
 *
 * let thresholds = [0, 5, 10, 20, 30, 40, 55, 70, 85]
 *
 * opt = {
 *     containInner,
 *     // clipInner,
 *     // clipOuter,
 *     // thresholds,
 * }
 * pgs = calcContours(points, opt)
 * fs.writeFileSync('./calcContours1.json', JSON.stringify(pgs), 'utf8')
 * console.log(pgs)
 * // => [
 * //   {
 * //     sepZone: '',
 * //     latLngs: [ [Array], [Array] ],
 * //     effectArea: 8816415983.520641,
 * //     effectAreaCentroid: [ 23.973333333333333, 121.13616666666665 ],
 * //     range: { text: '0 - 10', low: 0, up: 10 },
 * //     center: [ 23.973333333333333, 121.13616666666665 ]
 * //   },
 * //   {
 * //     sepZone: '',
 * //     latLngs: [ [Array], [Array], [Array] ],
 * //     effectArea: 6313849792.51668,
 * //     effectAreaCentroid: [ 23.80531082115246, 121.00212446033244 ],
 * //     range: { text: '10 - 20', low: 10, up: 20 },
 * //     center: [ 23.973333333333333, 121.13616666666665 ]
 * //   },
 * //   {
 * //     sepZone: '',
 * //     latLngs: [ [Array], [Array] ],
 * //     effectArea: 4644527033.145393,
 * //     effectAreaCentroid: [ 23.791076270349798, 120.96719391394832 ],
 * //     range: { text: '20 - 30', low: 20, up: 30 },
 * //     center: [ 23.973333333333333, 121.13616666666665 ]
 * //   },
 * //   {
 * //     sepZone: '',
 * //     latLngs: [ [Array], [Array] ],
 * //     effectArea: 3211476473.817216,
 * //     effectAreaCentroid: [ 24.025569342289934, 121.2215115677248 ],
 * //     range: { text: '30 - 40', low: 30, up: 40 },
 * //     center: [ 23.973333333333333, 121.13616666666665 ]
 * //   },
 * //   {
 * //     sepZone: '',
 * //     latLngs: [ [Array], [Array] ],
 * //     effectArea: 2077979122.6009896,
 * //     effectAreaCentroid: [ 24.155744629924033, 121.28620957869633 ],
 * //     range: { text: '40 - 50', low: 40, up: 50 },
 * //     center: [ 23.973333333333333, 121.13616666666665 ]
 * //   },
 * //   {
 * //     sepZone: '',
 * //     latLngs: [ [Array] ],
 * //     effectArea: 1165016840.7246127,
 * //     effectAreaCentroid: [ 24.45565142857143, 121.3283007142857 ],
 * //     range: { text: '50 - 60', low: 50, up: 60 },
 * //     center: [ 23.973333333333333, 121.13616666666665 ]
 * //   }
 * // ]
 *
 * opt = {
 *     // containInner,
 *     clipInner,
 *     // clipOuter,
 *     // thresholds,
 * }
 * pgs = calcContours(points, opt)
 * fs.writeFileSync('./calcContours2.json', JSON.stringify(pgs), 'utf8')
 * console.log(pgs)
 * // => [
 * //   {
 * //     sepZone: '',
 * //     latLngs: [ [Array] ],
 * //     effectArea: 8816415983.520641,
 * //     effectAreaCentroid: [ 23.973333333333333, 121.13616666666665 ],
 * //     range: { text: '0 - 10', low: 0, up: 10 },
 * //     center: [ 23.973333333333333, 121.13616666666665 ]
 * //   },
 * //   {
 * //     sepZone: '',
 * //     latLngs: [ [Array], [Array], [Array], [Array] ],
 * //     effectArea: 6313849792.51668,
 * //     effectAreaCentroid: [ 23.80531082115246, 121.00212446033244 ],
 * //     range: { text: '10 - 20', low: 10, up: 20 },
 * //     center: [ 23.973333333333333, 121.13616666666665 ]
 * //   },
 * //   {
 * //     sepZone: '',
 * //     latLngs: [ [Array], [Array], [Array], [Array], [Array] ],
 * //     effectArea: 4644527033.145393,
 * //     effectAreaCentroid: [ 23.791076270349798, 120.96719391394832 ],
 * //     range: { text: '20 - 30', low: 20, up: 30 },
 * //     center: [ 23.973333333333333, 121.13616666666665 ]
 * //   },
 * //   {
 * //     sepZone: '',
 * //     latLngs: [ [Array], [Array], [Array], [Array] ],
 * //     effectArea: 3211476473.817216,
 * //     effectAreaCentroid: [ 24.025569342289934, 121.2215115677248 ],
 * //     range: { text: '30 - 40', low: 30, up: 40 },
 * //     center: [ 23.973333333333333, 121.13616666666665 ]
 * //   },
 * //   {
 * //     sepZone: '',
 * //     latLngs: [ [Array], [Array] ],
 * //     effectArea: 2077979122.6009896,
 * //     effectAreaCentroid: [ 24.155744629924033, 121.28620957869633 ],
 * //     range: { text: '40 - 50', low: 40, up: 50 },
 * //     center: [ 23.973333333333333, 121.13616666666665 ]
 * //   },
 * //   {
 * //     sepZone: '',
 * //     latLngs: [ [Array] ],
 * //     effectArea: 1165016840.7246127,
 * //     effectAreaCentroid: [ 24.45565142857143, 121.3283007142857 ],
 * //     range: { text: '50 - 60', low: 50, up: 60 },
 * //     center: [ 23.973333333333333, 121.13616666666665 ]
 * //   },
 * //   {
 * //     sepZone: '',
 * //     latLngs: [ [Array] ],
 * //     effectArea: 517569529.67260885,
 * //     effectAreaCentroid: [ 24.49676761904762, 121.33386714285714 ],
 * //     range: { text: '60 - 70', low: 60, up: 70 },
 * //     center: [ 23.973333333333333, 121.13616666666665 ]
 * //   },
 * //   {
 * //     sepZone: 'top',
 * //     latLngs: [ [Array] ],
 * //     effectArea: 129338350.80859056,
 * //     effectAreaCentroid: [ 24.537883809523812, 121.33943357142857 ],
 * //     range: { text: '70 - 80', low: 70, up: 80 },
 * //     center: [ 23.973333333333333, 121.13616666666665 ]
 * //   }
 * // ]
 *
 * opt = {
 *     // containInner,
 *     // clipInner,
 *     clipOuter,
 *     // thresholds,
 * }
 * pgs = calcContours(points, opt)
 * fs.writeFileSync('./calcContours3.json', JSON.stringify(pgs), 'utf8')
 * console.log(pgs)
 * // => [
 * //   {
 * //     sepZone: '',
 * //     latLngs: [ [Array] ],
 * //     effectArea: 8816415983.520641,
 * //     effectAreaCentroid: [ 23.973333333333333, 121.13616666666665 ],
 * //     range: { text: '0 - 10', low: 0, up: 10 },
 * //     center: [ 23.973333333333333, 121.13616666666665 ]
 * //   },
 * //   {
 * //     sepZone: '',
 * //     latLngs: [ [Array], [Array] ],
 * //     effectArea: 6313849792.51668,
 * //     effectAreaCentroid: [ 23.80531082115246, 121.00212446033244 ],
 * //     range: { text: '10 - 20', low: 10, up: 20 },
 * //     center: [ 23.973333333333333, 121.13616666666665 ]
 * //   },
 * //   {
 * //     sepZone: '',
 * //     latLngs: [ [Array], [Array], [Array], [Array] ],
 * //     effectArea: 4644527033.145393,
 * //     effectAreaCentroid: [ 23.791076270349798, 120.96719391394832 ],
 * //     range: { text: '20 - 30', low: 20, up: 30 },
 * //     center: [ 23.973333333333333, 121.13616666666665 ]
 * //   },
 * //   {
 * //     sepZone: '',
 * //     latLngs: [ [Array], [Array], [Array] ],
 * //     effectArea: 3211476473.817216,
 * //     effectAreaCentroid: [ 24.025569342289934, 121.2215115677248 ],
 * //     range: { text: '30 - 40', low: 30, up: 40 },
 * //     center: [ 23.973333333333333, 121.13616666666665 ]
 * //   },
 * //   {
 * //     sepZone: '',
 * //     latLngs: [ [Array] ],
 * //     effectArea: 2077979122.6009896,
 * //     effectAreaCentroid: [ 24.155744629924033, 121.28620957869633 ],
 * //     range: { text: '40 - 50', low: 40, up: 50 },
 * //     center: [ 23.973333333333333, 121.13616666666665 ]
 * //   },
 * //   {
 * //     sepZone: '',
 * //     latLngs: [ [Array] ],
 * //     effectArea: 1165016840.7246127,
 * //     effectAreaCentroid: [ 24.45565142857143, 121.3283007142857 ],
 * //     range: { text: '50 - 60', low: 50, up: 60 },
 * //     center: [ 23.973333333333333, 121.13616666666665 ]
 * //   },
 * //   {
 * //     sepZone: '',
 * //     latLngs: [ [Array] ],
 * //     effectArea: 517569529.67260885,
 * //     effectAreaCentroid: [ 24.49676761904762, 121.33386714285714 ],
 * //     range: { text: '60 - 70', low: 60, up: 70 },
 * //     center: [ 23.973333333333333, 121.13616666666665 ]
 * //   },
 * //   {
 * //     sepZone: 'top',
 * //     latLngs: [ [Array] ],
 * //     effectArea: 129338350.80859056,
 * //     effectAreaCentroid: [ 24.537883809523812, 121.33943357142857 ],
 * //     range: { text: '70 - 80', low: 70, up: 80 },
 * //     center: [ 23.973333333333333, 121.13616666666665 ]
 * //   }
 * // ]
 *
 * opt = {
 *     // containInner,
 *     // clipInner,
 *     // clipOuter,
 *     thresholds,
 * }
 * pgs = calcContours(points, opt)
 * fs.writeFileSync('./calcContours4.json', JSON.stringify(pgs), 'utf8')
 * console.log(pgs)
 * // => [
 * //   {
 * //     sepZone: '',
 * //     latLngs: [ [Array] ],
 * //     effectArea: 8816415983.520641,
 * //     effectAreaCentroid: [ 23.973333333333333, 121.13616666666665 ],
 * //     range: { text: '0 - 5', low: 0, up: 5 },
 * //     center: [ 23.973333333333333, 121.13616666666665 ]
 * //   },
 * //   {
 * //     sepZone: '',
 * //     latLngs: [ [Array], [Array] ],
 * //     effectArea: 7186533231.875366,
 * //     effectAreaCentroid: [ 23.802593637502845, 121.01686739291412 ],
 * //     range: { text: '5 - 10', low: 5, up: 10 },
 * //     center: [ 23.973333333333333, 121.13616666666665 ]
 * //   },
 * //   {
 * //     sepZone: '',
 * //     latLngs: [ [Array], [Array] ],
 * //     effectArea: 6313849792.51668,
 * //     effectAreaCentroid: [ 23.80531082115246, 121.00212446033244 ],
 * //     range: { text: '10 - 20', low: 10, up: 20 },
 * //     center: [ 23.973333333333333, 121.13616666666665 ]
 * //   },
 * //   {
 * //     sepZone: '',
 * //     latLngs: [ [Array], [Array] ],
 * //     effectArea: 4644527033.145393,
 * //     effectAreaCentroid: [ 23.791076270349798, 120.96719391394832 ],
 * //     range: { text: '20 - 30', low: 20, up: 30 },
 * //     center: [ 23.973333333333333, 121.13616666666665 ]
 * //   },
 * //   {
 * //     sepZone: '',
 * //     latLngs: [ [Array], [Array] ],
 * //     effectArea: 3211476473.817216,
 * //     effectAreaCentroid: [ 24.025569342289934, 121.2215115677248 ],
 * //     range: { text: '30 - 40', low: 30, up: 40 },
 * //     center: [ 23.973333333333333, 121.13616666666665 ]
 * //   },
 * //   {
 * //     sepZone: '',
 * //     latLngs: [ [Array], [Array] ],
 * //     effectArea: 2077979122.6009896,
 * //     effectAreaCentroid: [ 24.155744629924033, 121.28620957869633 ],
 * //     range: { text: '40 - 55', low: 40, up: 55 },
 * //     center: [ 23.973333333333333, 121.13616666666665 ]
 * //   },
 * //   {
 * //     sepZone: '',
 * //     latLngs: [ [Array] ],
 * //     effectArea: 808871008.3417139,
 * //     effectAreaCentroid: [ 24.476209523809523, 121.33108392857142 ],
 * //     range: { text: '55 - 70', low: 55, up: 70 },
 * //     center: [ 23.973333333333333, 121.13616666666665 ]
 * //   },
 * //   {
 * //     sepZone: 'top',
 * //     latLngs: [ [Array] ],
 * //     effectArea: 129338350.80859056,
 * //     effectAreaCentroid: [ 24.537883809523812, 121.33943357142857 ],
 * //     range: { text: '70 - 85', low: 70, up: 85 },
 * //     center: [ 23.973333333333333, 121.13616666666665 ]
 * //   }
 * // ]
 *
 * opt = {
 *     withStyle: true,
 *     // returnGeojson: true,
 * }
 * pgs = calcContours(points, opt)
 * fs.writeFileSync('./calcContours5.json', JSON.stringify(pgs), 'utf8')
 * console.log(pgs)
 * // => [
 * //   {
 * //     sepZone: '',
 * //     latLngs: [ [Array] ],
 * //     effectArea: 8816415983.520641,
 * //     effectAreaCentroid: [ 23.973333333333333, 121.13616666666665 ],
 * //     range: { text: '0 - 10', low: 0, up: 10 },
 * //     center: [ 23.973333333333333, 121.13616666666665 ],
 * //     style: {
 * //       color: 'rgba(255, 255, 255, 1)',
 * //       weight: 1,
 * //       fillColor: 'rgba(255, 255, 255, 1)',
 * //       fillOpacity: 0.2,
 * //       stroke: 'rgba(255, 255, 255, 1)',
 * //       'stroke-width': 1,
 * //       'stroke-opacity': 1,
 * //       fill: 'rgba(255, 255, 255, 1)',
 * //       'fill-opacity': 0.2
 * //     }
 * //   },
 * //   {
 * //     sepZone: '',
 * //     latLngs: [ [Array], [Array] ],
 * //     effectArea: 6313849792.51668,
 * //     effectAreaCentroid: [ 23.80531082115246, 121.00212446033244 ],
 * //     range: { text: '10 - 20', low: 10, up: 20 },
 * //     center: [ 23.973333333333333, 121.13616666666665 ],
 * //     style: {
 * //       color: 'rgba(254, 200, 127, 1)',
 * //       weight: 1,
 * //       fillColor: 'rgba(254, 200, 127, 1)',
 * //       fillOpacity: 0.2,
 * //       stroke: 'rgba(254, 200, 127, 1)',
 * //       'stroke-width': 1,
 * //       'stroke-opacity': 1,
 * //       fill: 'rgba(254, 200, 127, 1)',
 * //       'fill-opacity': 0.2
 * //     }
 * //   },
 * //   {
 * //     sepZone: '',
 * //     latLngs: [ [Array], [Array] ],
 * //     effectArea: 4644527033.145393,
 * //     effectAreaCentroid: [ 23.791076270349798, 120.96719391394832 ],
 * //     range: { text: '20 - 30', low: 20, up: 30 },
 * //     center: [ 23.973333333333333, 121.13616666666665 ],
 * //     style: {
 * //       color: 'rgba(253, 135, 61, 1)',
 * //       weight: 1,
 * //       fillColor: 'rgba(253, 135, 61, 1)',
 * //       fillOpacity: 0.2,
 * //       stroke: 'rgba(253, 135, 61, 1)',
 * //       'stroke-width': 1,
 * //       'stroke-opacity': 1,
 * //       fill: 'rgba(253, 135, 61, 1)',
 * //       'fill-opacity': 0.2
 * //     }
 * //   },
 * //   {
 * //     sepZone: '',
 * //     latLngs: [ [Array], [Array] ],
 * //     effectArea: 3211476473.817216,
 * //     effectAreaCentroid: [ 24.025569342289934, 121.2215115677248 ],
 * //     range: { text: '30 - 40', low: 30, up: 40 },
 * //     center: [ 23.973333333333333, 121.13616666666665 ],
 * //     style: {
 * //       color: 'rgba(247, 75, 41, 1)',
 * //       weight: 1,
 * //       fillColor: 'rgba(247, 75, 41, 1)',
 * //       fillOpacity: 0.2,
 * //       stroke: 'rgba(247, 75, 41, 1)',
 * //       'stroke-width': 1,
 * //       'stroke-opacity': 1,
 * //       fill: 'rgba(247, 75, 41, 1)',
 * //       'fill-opacity': 0.2
 * //     }
 * //   },
 * //   {
 * //     sepZone: '',
 * //     latLngs: [ [Array], [Array] ],
 * //     effectArea: 2077979122.6009896,
 * //     effectAreaCentroid: [ 24.155744629924033, 121.28620957869633 ],
 * //     range: { text: '40 - 50', low: 40, up: 50 },
 * //     center: [ 23.973333333333333, 121.13616666666665 ],
 * //     style: {
 * //       color: 'rgba(225, 61, 39, 1)',
 * //       weight: 1,
 * //       fillColor: 'rgba(225, 61, 39, 1)',
 * //       fillOpacity: 0.2,
 * //       stroke: 'rgba(225, 61, 39, 1)',
 * //       'stroke-width': 1,
 * //       'stroke-opacity': 1,
 * //       fill: 'rgba(225, 61, 39, 1)',
 * //       'fill-opacity': 0.2
 * //     }
 * //   },
 * //   {
 * //     sepZone: '',
 * //     latLngs: [ [Array] ],
 * //     effectArea: 1165016840.7246127,
 * //     effectAreaCentroid: [ 24.45565142857143, 121.3283007142857 ],
 * //     range: { text: '50 - 60', low: 50, up: 60 },
 * //     center: [ 23.973333333333333, 121.13616666666665 ],
 * //     style: {
 * //       color: 'rgba(209, 48, 29, 1)',
 * //       weight: 1,
 * //       fillColor: 'rgba(209, 48, 29, 1)',
 * //       fillOpacity: 0.2,
 * //       stroke: 'rgba(209, 48, 29, 1)',
 * //       'stroke-width': 1,
 * //       'stroke-opacity': 1,
 * //       fill: 'rgba(209, 48, 29, 1)',
 * //       'fill-opacity': 0.2
 * //     }
 * //   },
 * //   {
 * //     sepZone: '',
 * //     latLngs: [ [Array] ],
 * //     effectArea: 517569529.67260885,
 * //     effectAreaCentroid: [ 24.49676761904762, 121.33386714285714 ],
 * //     range: { text: '60 - 70', low: 60, up: 70 },
 * //     center: [ 23.973333333333333, 121.13616666666665 ],
 * //     style: {
 * //       color: 'rgba(194, 37, 34, 1)',
 * //       weight: 1,
 * //       fillColor: 'rgba(194, 37, 34, 1)',
 * //       fillOpacity: 0.2,
 * //       stroke: 'rgba(194, 37, 34, 1)',
 * //       'stroke-width': 1,
 * //       'stroke-opacity': 1,
 * //       fill: 'rgba(194, 37, 34, 1)',
 * //       'fill-opacity': 0.2
 * //     }
 * //   },
 * //   {
 * //     sepZone: 'top',
 * //     latLngs: [ [Array] ],
 * //     effectArea: 129338350.80859056,
 * //     effectAreaCentroid: [ 24.537883809523812, 121.33943357142857 ],
 * //     range: { text: '70 - 80', low: 70, up: 80 },
 * //     center: [ 23.973333333333333, 121.13616666666665 ],
 * //     style: {
 * //       color: 'rgba(180, 30, 60, 1)',
 * //       weight: 1,
 * //       fillColor: 'rgba(180, 30, 60, 1)',
 * //       fillOpacity: 0.2,
 * //       stroke: 'rgba(180, 30, 60, 1)',
 * //       'stroke-width': 1,
 * //       'stroke-opacity': 1,
 * //       fill: 'rgba(180, 30, 60, 1)',
 * //       'fill-opacity': 0.2
 * //     }
 * //   }
 * // ]
 *
 * opt = {
 *     withStyle: true,
 *     returnGeojson: true,
 * }
 * pgs = calcContours(points, opt)
 * fs.writeFileSync('./calcContours6.json', JSON.stringify(pgs), 'utf8')
 * console.log(pgs)
 * // => {
 * //   type: 'FeatureCollection',
 * //   features: [
 * //     { type: 'Feature', properties: [Object], geometry: [Object] },
 * //     { type: 'Feature', properties: [Object], geometry: [Object] },
 * //     { type: 'Feature', properties: [Object], geometry: [Object] },
 * //     { type: 'Feature', properties: [Object], geometry: [Object] },
 * //     { type: 'Feature', properties: [Object], geometry: [Object] },
 * //     { type: 'Feature', properties: [Object], geometry: [Object] },
 * //     { type: 'Feature', properties: [Object], geometry: [Object] },
 * //     { type: 'Feature', properties: [Object], geometry: [Object] }
 * //   ]
 * // }
 *
 */
function calcContours(points, opt = {}) {

    //check psSrc
    if (!isearr(points)) {
        return {
            err: 'points is not an array'
        }
    }

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

    //withStyle
    let withStyle = get(opt, 'withStyle')
    if (!isbol(withStyle)) {
        withStyle = false
    }

    //returnGeojson
    let returnGeojson = get(opt, 'returnGeojson')
    if (!isbol(returnGeojson)) {
        returnGeojson = false
    }

    //ptsXYZtoArr
    points = ptsXYZtoArr(points, { ...opt, returnObjArray: false })

    //containInner
    let containInner = get(opt, 'containInner', null)

    //clipInner
    let clipInner = get(opt, 'clipInner', null)

    //clipOuter
    let clipOuter = get(opt, 'clipOuter', null)

    //thresholds
    let thresholds = get(opt, 'thresholds', null)

    //useThresholds
    let useThresholds = isearr(thresholds)

    //valueMin, valueMax
    let valueMin = points[0][2]
    let valueMax = points[0][2]
    for (let i = 1; i < size(points); i++) {
        let value = points[i][2]
        if (valueMin > value) {
            valueMin = value
        }
        if (valueMax < value) {
            valueMax = value
        }
    }
    // console.log('valueMin', valueMin, 'valueMax', valueMax)

    //contours
    let contours = getContours(points, thresholds)
    // console.log('contours', cloneDeep(contours), 'thresholds', thresholds)

    //check
    if (!isearr(contours)) {
        // console.log('can not calculate contours', contours)
        return []
    }
    // console.log('contours.length', contours.length)

    //polylines
    let polylines = map(contours, (v, k) => {
        return {
            sepZone: get(v, 'sepZone', ''),
            latLngs: v.coordinates,
            level: v.value,
            effectArea: getAreaMultiPolygonSm(v.coordinates),
            effectAreaCentroid: getCentroidMultiPolygon(v.coordinates), //要先計算, 否則之後會被相減計算成真實等值區域, 就不是影響區域的中心了
        }
    })
    // console.log('polylines from contours', cloneDeep(polylines))

    //check, 若沒有設定thresholds則不需要補虛擬polyline
    if (!useThresholds) {

        //pmin, pmax
        let ls = map(polylines, 'level')
        let pmin = min(ls)
        let pmax = max(ls)
        // console.log('pmin', pmin, 'pmax', pmax)

        //實際數據有超出contours的最大值, 添加虛擬polyline
        if (pmax < valueMax) {
            console.log('非預期: pmax < valueMax', pmax < valueMax, pmax, valueMax)
            polylines.push({
                mode: 'virtualEnd',
                sepZone: '',
                latLngs: [],
                level: valueMax,
                effectArea: 0,
                effectAreaCentroid: null,
            })
        }

        //實際數據有低於contours的最小值, 添加虛擬polyline
        if (pmin > valueMin) {
            console.log('非預期: pmin > valueMin', pmin > valueMin, pmin, valueMin)
            let pl = {
                mode: 'virtualStart',
                sepZone: '',
                latLngs: [],
                level: valueMin,
                effectArea: 0,
                effectAreaCentroid: null,
            }
            polylines = [pl, ...polylines]
        }

    }
    // console.log('polylines for vartual level', cloneDeep(polylines))

    //若沒有設定thresholds則自動修正level, 因tricontour會給出繪圖間距而不是實際資料間距, 故會出現level值大於或小於原數據上下限
    if (!useThresholds) {
        each(polylines, (v, k) => {
            v.level = Math.min(v.level, valueMax)
            v.level = Math.max(v.level, valueMin)
        })
    }
    // console.log('polylines for limit level', cloneDeep(polylines))

    //polygonSets, 剔除下1個多邊形區域, 為實際需繪製的等值區
    let polygonSets = []
    for (let i = 0; i <= polylines.length - 2; i++) {

        //p0, p1
        let p0 = polylines[i]
        let p1 = polylines[i + 1]
        // console.log(i, 'p0', p0, p0.level, 'p1', p1, p1.level)

        //latLngs0, latLngs1
        let latLngs0 = p0.latLngs
        let latLngs1 = p1.latLngs

        //range
        let range = {
            text: `${polylines[i].level} - ${polylines[i + 1].level}`,
            low: polylines[i].level,
            up: polylines[i + 1].level,
        }

        //clipMultiPolygon
        let latLngs = []
        latLngs = clipMultiPolygon(latLngs0, latLngs1)
        if (p0.mode === 'virtualStart') { //若為virtualStart, 則代表直接使用下1個polylines成為等值區域, 方能代表凹陷區
            latLngs = latLngs1 //因為既有屬性都是取前者, 故若virtualStart係使用後者p1, 就代表全部polygonSet都會有真實effectArea
        }
        else if (p1.sepZone === 'top') { //若後者sepZone為top, 代表無多邊形數據, 得要使用前者多邊形建構
            latLngs = latLngs0
        }
        else {
            latLngs = clipMultiPolygon(latLngs0, latLngs1)
        }

        //p
        let p = cloneDeep(p0)

        //delete level, 已轉成range
        delete p.level

        //ps
        let ps = {
            ...p,
            sepZone: get(p1, 'sepZone', ''),
            latLngs,
            range,
        }

        //push
        polygonSets.push(ps)

    }
    // console.log('polygonSets from polylines', cloneDeep(polygonSets))

    //polygonsContainInner, 保留指定多polygon以內區域
    if (true) {
        let t = []
        each(polygonSets, (polygonSet, k) => {

            //latLngs
            let latLngs = null
            if (isearr(containInner)) {

                //intersectMultiPolygon
                latLngs = intersectMultiPolygon(polygonSet.latLngs, containInner)

            }
            else {
                latLngs = polygonSet.latLngs
            }

            //check
            if (size(latLngs) > 0) {
                t.push({
                    ...polygonSet,
                    latLngs,
                })
            }

        })
        polygonSets = t
    }
    // console.log('polygonSets for polygonsContainInner', cloneDeep(polygonSets))

    //polygonsClipInner, 剔除指定多polygon以內區域
    if (true) {
        let t = []
        each(polygonSets, (polygonSet, k) => {

            //latLngs
            let latLngs = null
            if (isearr(clipInner)) {

                //clipMultiPolygon
                latLngs = clipMultiPolygon(polygonSet.latLngs, clipInner)

            }
            else {
                latLngs = polygonSet.latLngs
            }

            //check
            if (size(latLngs) > 0) {
                t.push({
                    ...polygonSet,
                    latLngs,
                })
            }

        })
        polygonSets = t
    }
    // console.log('polygonSets for polygonsClipInner', cloneDeep(polygonSets))

    //polygonClipOuter, 剔除指定polygon以外區域
    if (true) {
        let t = []
        each(polygonSets, (polygonSet) => {

            //latLngs
            let latLngs = null
            if (isearr(clipOuter)) {

                //intersectMultiPolygon
                latLngs = intersectMultiPolygon(polygonSet.latLngs, clipOuter)

            }
            else {
                latLngs = polygonSet.latLngs
            }

            //check
            if (size(latLngs) > 0) {
                t.push({
                    ...polygonSet,
                    latLngs,
                })
            }

        })
        polygonSets = t
    }
    // console.log('polygonSets for polygonClipOuter', cloneDeep(polygonSets))

    //center
    if (true) {
        let areaMax = 0
        let areaInd = null
        let areaCentroid = null
        each(polygonSets, (polygonSet, k) => {
            if (areaMax < polygonSet.effectArea) {
                areaInd = k
                areaMax = polygonSet.effectArea
                areaCentroid = polygonSet.effectAreaCentroid
            }
        })
        if (areaInd === null) {
            // console.log('can not calculate centroid of contour', polygonSets)
            return []
        }

        //add center
        each(polygonSets, (polygonSet, k) => {
            polygonSets[k].center = areaCentroid
        })

    }

    //withStyle
    if (withStyle || returnGeojson) {

        //kpGradientColor
        let kpGradientColor = get(opt, 'kpGradientColor', null)
        if (!iseobj(kpGradientColor)) {
            kpGradientColor = {
                0: 'rgb(255, 255, 255)',
                0.2: 'rgb(254, 178, 76)',
                0.4: 'rgb(252, 78, 42)',
                0.6: 'rgb(220, 58, 38)',
                0.8: 'rgb(200, 40, 23)',
                1: 'rgb(180, 30, 60)',
            }
        }

        //funGetFillColor
        let funGetFillColor = get(opt, 'funGetFillColor', null)
        if (!isfun(funGetFillColor)) {
            let fun = oc.interp(kpGradientColor)
            funGetFillColor = (k, n) => {
                let c = ''
                if (n > 0) {
                    c = fun(k / n)
                }
                else {
                    c = fun(1)
                }
                return c
            }
        }

        //fillOpacity
        let fillOpacity = get(opt, 'fillOpacity', null)
        if (!ispnum(fillOpacity)) {
            fillOpacity = 0.2
        }
        fillOpacity = cdbl(fillOpacity)

        //lineColor
        let lineColor = get(opt, 'lineColor', null)
        if (!isestr(lineColor)) {
            lineColor = ''
        }

        //funGetLineColor
        let funGetLineColor = get(opt, 'funGetLineColor', null)

        //lineOpacity
        let lineOpacity = get(opt, 'lineOpacity', null)
        if (!ispnum(lineOpacity)) {
            lineOpacity = 1
        }
        lineOpacity = cdbl(lineOpacity)

        //lineWidth
        let lineWidth = get(opt, 'lineWidth', null)
        if (!ispnum(lineWidth)) {
            lineWidth = 1
        }
        lineWidth = cdbl(lineWidth)

        //add style
        let ub = polygonSets.length - 1
        polygonSets = map(polygonSets, (polygonSet, k) => {
        // console.log(k, 'polygonSet', polygonSet)

            //fillColor
            let fillColor = funGetFillColor(k, ub)
            // console.log('fillColor', fillColor)

            //strokeColor
            let strokeColor = ''
            if (isfun(funGetLineColor)) {
                strokeColor = funGetLineColor(k, ub)
                // console.log('strokeColor(funGetLineColor)', strokeColor)
            }
            else if (isestr(lineColor)) {
                strokeColor = lineColor
                // console.log('strokeColor(lineColor)', strokeColor)
            }
            else {
                strokeColor = fillColor
                // console.log('strokeColor(fillColor)', strokeColor)
            }
            // console.log('strokeColor', strokeColor)

            //strokeWidth
            let strokeWidth = lineWidth

            //strokeOpacity
            let strokeOpacity = lineOpacity

            //style
            let style = {

                //leaflet
                'color': strokeColor,
                'weight': strokeWidth,
                fillColor,
                fillOpacity,

                //svg, mapbox
                'stroke': strokeColor,
                'stroke-width': strokeWidth,
                'stroke-opacity': strokeOpacity,
                'fill': fillColor,
                'fill-opacity': fillOpacity,

            }

            return {
                ...polygonSet,
                style,
            }

        })
        // polygonSets = [polygonSets[0]]
        // polygonSets = [polygonSets[1]]
        // console.log('polygonSets', cloneDeep(polygonSets))

    }

    //returnGeojson
    let r = polygonSets
    if (returnGeojson) {
        let features = map(polygonSets, (v) => {

            //invCoordMultiPolygon, GeoJSON是先經後緯
            let lngLats = invCoordMultiPolygon(v.latLngs)

            //o
            let o = {
                type: 'Feature',
                properties: {
                    style: v.style,
                },
                geometry: {
                    'type': 'MultiPolygon',
                    'coordinates': lngLats,
                }
            }

            return o
        })
        r = {
            type: 'FeatureCollection',
            features,
        }
    }


    return r
}


export default calcContours
