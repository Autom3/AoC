const fs = require('fs')
const { promisify } = require('util')

const readFileAsync = promisify(fs.readFile)

function readPuzzleInput () {
  return readFileAsync('input', { encoding: 'utf8' })
}

function parsePuzzleInput (input) {
  return input.split(',').map(i => parseInt(i))
}

function applyOneStep (input, index) {
  const output = input.slice(0)
  const instruction = input[index]
  const a = input[index + 1]
  const b = input[index + 2]
  const outputPosition = input[index + 3]

  if (instruction === 1) {
    output[outputPosition] = input[a] + input[b]
  } else if (instruction === 2) {
    output[outputPosition] = input[a] * input[b]
  } else if (instruction === 99) {
    return { output: output, halt: true }
  } else {
    throw Error('Invalid opcode')
  }

  return { output: output, halt: false }
}

function applySteps (input) {
  for (let i = 0; i < input.length; i += 4) {
    let stepOutput = applyOneStep(input, i)
    if (stepOutput.halt) {
      return input
    }
    input = stepOutput.output
  }
}

async function one () {
  const input = await readPuzzleInput()
  const parsedInput = parsePuzzleInput(input)
  parsedInput[1] = 12
  parsedInput[2] = 2

  // let parsedInput = [1,9,10,3,2,3,11,0,99,30,40,50]

  const output = applySteps(parsedInput)

  return output[0]
}

async function two () {
  const input = await readPuzzleInput()
  const parsedInput = parsePuzzleInput(input)

  let noun = 0
  let verb = 0

  for (noun = 0; noun < 100; noun++) {
    for (verb = 0; verb < 100; verb++) {
      parsedInput[1] = noun
      parsedInput[2] = verb

      const output = applySteps(parsedInput)

      if (output[0] === 19690720) {
        return 100 * noun + verb
      }
    }
  }
}

one().then(console.log).then(two).then(console.log)
