const fs = require('fs')
const { promisify } = require('util')

const readFileAsync = promisify(fs.readFile)

function readPuzzleInput () {
  return readFileAsync('input', { encoding: 'utf8' })
}

function parsePuzzleInput (input) {
  return input.split('\n').filter(line => line).map(s => { const split = s.split(')'); return { parent: split[0], child: split[1] } })
}

function Universe () {
  this.planets = {}
  this.orbits = []

  this.getOrCreatePlanet = (name) => {
    if (!this.planets[name]) {
      this.planets[name] = new Planet(name)
    }
    return this.planets[name]
  }

  this.createNewOrbit = (parent, child) => {
    this.orbits.push(new Orbit(parent, child))
  }

  this.parseOrbits = (input) => {
    input.forEach(inputOrbit => {
      const parent = this.getOrCreatePlanet(inputOrbit.parent)
      const child = this.getOrCreatePlanet(inputOrbit.child)
      this.createNewOrbit(parent, child)
    })
  }

  this.countOrbits = () => {
    return this.planets['COM'].countOrbits(0)
  }

  this.countTransfers = () => {
    const youPath = this.planets['YOU'].getPathToRoot()
    const sanPath = this.planets['SAN'].getPathToRoot()

    let i
    for (i = 0; i < Math.min(youPath.length, sanPath.length); i++) {
      if (youPath[i] !== sanPath[i]) {
        break
      }
    }

    return (youPath.length - i - 1) + (sanPath.length - i - 1)
  }
}

function Orbit (parent, child) {
  this.parent = parent
  this.child = child

  this.parent.childOrbits.push(this)
  this.child.parentOrbit = this
}

function Planet (name) {
  this.name = name
  this.childOrbits = []

  this.countOrbits = (x) => x + this.childOrbits.map(childOrbit => childOrbit.child.countOrbits(1 + x)).reduce((a, b) => a + b, 0)

  this.getPathToRoot = () => this.parentOrbit ? this.parentOrbit.parent.getPathToRoot().concat(this) : [this]
}

async function one () {
  const input = await readPuzzleInput()
//   const input = `COM)B
// B)C
// C)D
// D)E
// E)F
// B)G
// G)H
// D)I
// E)J
// J)K
// K)L`

  const parsedInput = parsePuzzleInput(input)

  const universe = new Universe()
  universe.parseOrbits(parsedInput)

  return universe.countOrbits()
}

async function two () {
  const input = await readPuzzleInput()
//   const input = `COM)B
// B)C
// C)D
// D)E
// E)F
// B)G
// G)H
// D)I
// E)J
// J)K
// K)L
// K)YOU
// I)SAN`

  const parsedInput = parsePuzzleInput(input)

  const universe = new Universe()
  universe.parseOrbits(parsedInput)

  return universe.countTransfers()
}

one().then(console.log).then(two).then(console.log)
