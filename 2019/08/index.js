const fs = require('fs')
const { promisify } = require('util')

const readFileAsync = promisify(fs.readFile)

const CC_RESET = '\x1b[0m'
const CC_BGBLACK = '\x1b[40m'
const CC_BGWHITE = '\x1b[47m'

function readPuzzleInput () {
  return readFileAsync('input', { encoding: 'utf8' })
}

function parsePuzzleInput (input, width, height) {
  const heightRegex = new RegExp('\\d{1,' + (width * height) + '}', 'g')
  const widthRegex = new RegExp('\\d{1,' + width + '}', 'g')
  return input.match(heightRegex).map(layer => layer.match(widthRegex).map(row => row.split('').map(pixel => parseInt(pixel))))
}

function countDigitsInLayer (layer) {
  return layer.reduce((accR, row) => {Object.entries(row.reduce((accP, pixel) => {accP[pixel] = (accP[pixel] || 0) + 1; return accP}, {})).map(entry => {accR[entry[0]] = (accR[entry[0]] || 0) + entry[1]; return accR}); return accR}, {})
}

async function one () {
  const input = await readPuzzleInput()
  const width = 25
  const height = 6

  const parsedInput = parsePuzzleInput(input, width, height)

  const lowestZeroesLayer = parsedInput.map(layer => countDigitsInLayer(layer)).reduce((acc, layerDigits) => layerDigits[0] < acc[0] ? layerDigits : acc)
  return lowestZeroesLayer[1] * lowestZeroesLayer[2]
}

async function two () {
  const input = await readPuzzleInput()
  const width = 25
  const height = 6

  const parsedInput = parsePuzzleInput(input, width, height)

  let output = ''

  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      let layerValue
      for (let l = 0; l < parsedInput.length; l++) {
        if (parsedInput[l][y][x] < 2) {
          layerValue = parsedInput[l][y][x]
          break
        }
      }
      if (layerValue < 1) {
        output += CC_RESET
      } else {
        output += CC_BGWHITE
      }
      output += ' '
    }
    output += CC_RESET + '\n'
  }

  return output
}

one().then(console.log).then(two).then(console.log)
