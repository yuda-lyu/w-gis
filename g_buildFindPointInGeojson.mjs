import buildFindPointInGeojson from './src/buildFindPointInGeojson.mjs'


let geojson
let p
let r

geojson = `
  {
      'type': 'FeatureCollection',
      'name': 'pgs',
      'features': [
          {
              'type': 'Feature',
              'properties': {
                  'name': 'pgs1',
              },
              'geometry': {
                  'type': 'MultiPolygon',
                  'coordinates': [
                      [
                          [
                              [0, 0],
                              [0, 1],
                              [1, 1],
                              [1, 0],
                              [0, 0],
                          ]
                      ]
                  ]
              }
          },
          {
              'type': 'Feature',
              'properties': {
                  'name': 'pgs2',
              },
              'geometry': {
                  'type': 'MultiPolygon',
                  'coordinates': [
                      [
                          [
                              [1, 1],
                              [1, 2],
                              [2, 2],
                              [2, 1],
                              [1, 1],
                          ]
                      ]
                  ]
              }
          },
      ]
  }
  `
let BD = buildFindPointInGeojson
let bd = new BD()
await bd.init(geojson, { keysPick: 'properties.name' })

p = [0.5, 0.5]
r = await bd.getPoint(p)
console.log(r)
// => 'pgs1'

p = [1.5, 1.5]
r = await bd.getPoint(p)
console.log(r)
// => 'pgs2'

p = [1.5, 0.5]
r = await bd.getPoint(p)
console.log(r)
// => 'unknow'

p = [1.5, 0.5]
r = await bd.getPoint(p, { def: '未知' })
console.log(r)
// => '未知'


//node g_buildFindPointInGeojson.mjs
