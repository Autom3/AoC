const fs = require('fs')
const { promisify } = require('util')

const readFileAsync = promisify(fs.readFile)

function readPuzzleInput () {
  return readFileAsync('input', { encoding: 'utf8' })
}

function parsePuzzleInput (input) {
  return input.split('\n').map(s => {const split = s.split(')'); return {parent: split[0], child: split[1]}})
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
    return this.planets['COM'].countOrbits()
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

  this.countOrbits = () => {return this.childOrbits.reduce((a, b) => a.parent.childOrbits() + b.parent.childOrbits())}
}

function applyOrbitsToPlanets (orbits) {
  orbits.forEach(orbit => {
    orbit.parent.childOrbits.push(orbit)
  })

  return orbits
}

async function one () {
  // const input = await readPuzzleInput()
  const input = `COM)B
B)C
C)D
D)E
E)F
B)G
G)H
D)I
E)J
J)K
K)L`

  const parsedInput = parsePuzzleInput(input)

  const universe = new Universe()
  universe.parseOrbits(parsedInput)

  return universe.countOrbits()
}

one().then(console.log) // .then(two).then(console.log)
