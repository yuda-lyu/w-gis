import get from 'lodash-es/get'
import parseGeometryCollection from './parseGeometryCollection.mjs'


function distilMultiPolygon(r) {
    //因turf計算後可能產生多種幾何類型, 例如Polygon,MultiPolygon,LineString,GeometryCollection, 故將全部轉成MultiPolygon後回傳

    //type
    let type = get(r, 'geometry.type', '')

    //pgNew
    let pgNew = get(r, 'geometry.coordinates', [])

    if (type === 'Polygon') {
        return [pgNew]
    }
    else if (type === 'MultiPolygon') {
        return pgNew
    }
    else if (type === 'GeometryCollection') {
        return parseGeometryCollection(r)
    }
    else {
        // console.log('type', type, r)
        return []
    }
}


export default distilMultiPolygon
