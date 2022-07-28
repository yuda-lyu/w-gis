import get from 'lodash/get'
import each from 'lodash/each'


function parseGeometryCollection(data) {

    //gs
    let gs = get(data, 'geometry.geometries', [])

    //pgs
    let pgs = []
    each(gs, (v) => {
        if (v.type === 'Polygon') {
            pgs.push(v.coordinates)
        }
        else if (v.type === 'MultiPolygon') {
            each(v.coordinates, (vv) => {
                pgs.push(vv)
            })
        }
    })

    return pgs
}


export default parseGeometryCollection
