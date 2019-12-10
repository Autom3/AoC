const { promisify } = require('util')

const fs = require('fs')
const readFileAsync = promisify(fs.readFile)

function getPuzzleInput () {
  return readFileAsync('input', { encoding: 'utf-8' })
}

function parsePuzzleInput (input) {
  return input.split('\n').filter(mass => mass).map(mass => parseInt(mass))
}

function calculateFuelRequirement (mass) {
  return Math.floor(mass / 3) - 2
}

async function one () {
  const input = await getPuzzleInput()
  const parsedInput = parsePuzzleInput(input)

  return parsedInput.map(mass => calculateFuelRequirement(mass)).reduce((mass, accumulator) => mass + accumulator)
}

function calculateTotalFuelRequirement (mass) {
  let fuelRequirement = calculateFuelRequirement(mass)
  if (fuelRequirement <= 0) {
    return 0
  }
  return fuelRequirement + calculateTotalFuelRequirement(fuelRequirement)
}

async function two () {
  const input = await getPuzzleInput()
  const parsedInput = parsePuzzleInput(input)

  return parsedInput.map(mass => calculateTotalFuelRequirement(mass)).reduce((mass, accumulator) => mass + accumulator)
}

one()
  .then(console.log)
  .then(two)
  .then(console.log)
