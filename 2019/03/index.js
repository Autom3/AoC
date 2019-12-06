const fs = require('fs')
const { promisify } = require('util')

const readFileAsync = promisify(fs.readFile)

const CC_RESET = "\x1b[0m"
const CC_BRIGHT = "\x1b[1m"
const CC_DIM = "\x1b[2m"
const CC_UNDERSCORE = "\x1b[4m"
const CC_BLINK = "\x1b[5m"
const CC_REVERSE = "\x1b[7m"
const CC_HIDDEN = "\x1b[8m"

const CC_FGBLACK = "\x1b[30m"
const CC_FGRED = "\x1b[31m"
const CC_FGGREEN = "\x1b[32m"
const CC_FGYELLOW = "\x1b[33m"
const CC_FGBLUE = "\x1b[34m"
const CC_FGMAGENTA = "\x1b[35m"
const CC_FGCYAN = "\x1b[36m"
const CC_FGWHITE = "\x1b[37m"

const CC_BGBLACK = "\x1b[40m"
const CC_BGRED = "\x1b[41m"
const CC_BGGREEN = "\x1b[42m"
const CC_BGYELLOW = "\x1b[43m"
const CC_BGBLUE = "\x1b[44m"
const CC_BGMAGENTA = "\x1b[45m"
const CC_BGCYAN = "\x1b[46m"
const CC_BGWHITE = "\x1b[47m"

function readPuzzleInput () {
  return readFileAsync('input', {encoding: 'utf8'})
}

function parsePuzzleInput (input) {
  return input.split('\n').filter(wire => wire).map(wire =>
    wire.split(',').map(description => ({
      direction: translateDirection(description.substr(0, 1)),
      distance: parseInt(description.substr(1))
    })))
}

function translateDirection (direction) {
  switch (direction) {
    case 'R':
      return {x: 1, y: 0}
    case 'U':
      return {x: 0, y: 1}
    case 'L':
      return {x: -1, y: 0}
    case 'D':
      return {x: 0, y: -1}
  }
}

function registerWirePosition (playfield, x, y, wire, direction, total) {
  if (playfield[x] === undefined) {
    playfield[x] = {}
  }
  if (playfield[x][y] === undefined) {
    playfield[x][y] = []
  }
  playfield[x][y].push({wire: wire, direction: direction, total: total})
}

function registerIntersection (playfield, x, y, intersections) {
  if (playfield[x][y].length > 1 && !(x === 0 && y === 0)) {
    const wireSet = new Set(playfield[x][y].map(position => position.wire))
    if (wireSet.size > 1) {
      intersections.push({x: x, y: y})
    }
  }
}

function findClosestIntersection (intersections) {
  return intersections.reduce((intersection, minimum) => Math.abs(minimum.x) + Math.abs(minimum.y) > Math.abs(intersection.x) + Math.abs(intersection.y) ? intersection : minimum)
}

function findFirstIntersection (playfield, intersections) {
  return intersections.reduce((intersection, minimum) => playfield[intersection.x][intersection.y].reduce((a, b) => a.total + b.total) < playfield[minimum.x][minimum.y].reduce((a, b) => a.total + b.total) ? intersection : minimum)
}

function putWiresOnPlayfield(playfield, parsedInput) {
  const intersections = []
  const totals = []

  parsedInput.forEach((wire, wireIndex) => {
    let currentX = 0
    let currentY = 0
    totals[wireIndex] = -1

    wire.forEach((description) => {
      for (let x = 0; x < (1 + description.distance) * Math.abs(description.direction.x); x += Math.abs(description.direction.x)) {
        if (x < description.distance * Math.abs(description.direction.x)) {
          totals[wireIndex]++
        }
        registerWirePosition(playfield, x * description.direction.x + currentX, currentY, wireIndex, description.direction, totals[wireIndex])
        registerIntersection(playfield, x * description.direction.x + currentX, currentY, intersections)
      }
      for (let y = 0; y < (1 + description.distance) * Math.abs(description.direction.y); y += Math.abs(description.direction.y)) {
        if (y < description.distance * Math.abs(description.direction.y)) {
          totals[wireIndex]++
        }
        registerWirePosition(playfield, currentX, y * description.direction.y + currentY, wireIndex, description.direction, totals[wireIndex])
        registerIntersection(playfield, currentX, y * description.direction.y + currentY, intersections)
      }
      currentX += description.distance * description.direction.x
      currentY += description.distance * description.direction.y
    })
  })

  return intersections
}

function printPlayfield (playfield) {
  const xKeys = Object.keys(playfield).map(x => parseInt(x))
  const yKeys = Array.from(Object.values(playfield).map(y => Object.keys(y).map(y => parseInt(y))).reduce((x, a) => new Set([...x, ...a])))

  const xMin = Math.min(...xKeys)
  const xMax = Math.max(...xKeys)
  const yMin = Math.min(...yKeys)
  const yMax = Math.max(...yKeys)

  console.log(`Size: X (${xMin}, ${xMax})`)
  console.log(`Size: Y (${yMin}, ${yMax})`)

  for (let y = yMax; y >= yMin; y--) {
    let line = ''
    for (let x = xMin; x <= xMax; x++) {
      if (x === 0 && y === 0) {
        line += CC_BGWHITE + CC_FGBLACK + 'o' + CC_RESET
        continue
      }
      const wires = playfield[x][y]
      if (!wires || wires.length === 0) {
        line += CC_RESET + '.'
      } else if (wires.length === 1) {
        if (wires[0].wire === 0) {
          line += CC_FGRED
        } else if (wires[0].wire === 1) {
          line += CC_FGGREEN
        }

        if (wires[0].direction.x !== 0) {
          line += '-'
        } else if (wires[0].direction.y !== 0) {
          line += '|'
        }
      } else {
        const wireSet = new Set(wires.map(position => position.wire))
        if (wireSet.size > 1) {
          line += CC_FGYELLOW
          line += 'X'
          continue
        }

        if (wires[0].wire === 0) {
          line += CC_FGRED
        } else if (wires[0].wire === 1) {
          line += CC_FGGREEN
        }

        line += '+'
      }
    }
    console.log(line)
  }
}

async function one () {
  const input = await readPuzzleInput()
//   const input = `R8,U5,L5,D3
// U7,R6,D4,L4`
//   const input = `R75,D30,R83,U83,L12,D49,R71,U7,L72
// U62,R66,U55,R34,D71,R55,D58,R83`
//   const input = `R98,U47,R26,D63,R33,U87,L62,D20,R33,U53,R51
// U98,R91,D20,R16,D67,R40,U7,R15,U6,R7`
  const parsedInput = parsePuzzleInput(input)

  const playfield = {}

  const intersections = putWiresOnPlayfield(playfield, parsedInput)

  // printPlayfield(playfield)

  const closestIntersection = findClosestIntersection(intersections)
  return Math.abs(closestIntersection.x) + Math.abs(closestIntersection.y)
}

async function two () {
  const input = await readPuzzleInput()
//   const input = `R8,U5,L5,D3
// U7,R6,D4,L4`
//   const input = `R75,D30,R83,U83,L12,D49,R71,U7,L72
// U62,R66,U55,R34,D71,R55,D58,R83`
//   const input = `R98,U47,R26,D63,R33,U87,L62,D20,R33,U53,R51
// U98,R91,D20,R16,D67,R40,U7,R15,U6,R7`
  const parsedInput = parsePuzzleInput(input)

  const playfield = {}

  const intersections = putWiresOnPlayfield(playfield, parsedInput)

  // printPlayfield(playfield)

  const closestIntersection = findFirstIntersection(playfield, intersections)
  return playfield[closestIntersection.x][closestIntersection.y].reduce((a, b) => a.total + b.total)
}

one().then(console.log).then(two).then(console.log)
