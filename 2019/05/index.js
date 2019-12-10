const fs = require('fs')
const { promisify } = require('util')

const readFileAsync = promisify(fs.readFile)

function readPuzzleInput () {
  return readFileAsync('input', { encoding: 'utf8' })
}

function parsePuzzleInput (input) {
  return input.split(',').map(i => parseInt(i))
}

function * range (start, end) {
  for (let i = start; i <= end; i++) {
    yield i
  }
}

const instructions = {
  1: {
    f: (a, b, out) => {
      return { output: a + b, write: out }
    },
    out: 2
  },
  2: {
    f: (a, b, out) => {
      return { output: a * b, write: out }
    },
    out: 2
  },
  3: {
    f: (out, input) => {
      return { output: input, write: out }
    },
    out: 0,
    input: 1
  },
  4: {
    f: (out) => {
      return { output: out }
    },
    output: true
  },
  5: {
    f: (c, i) => {
      if (c) {
        return { jump: i }
      }
      return {}
    },
    jump: 1
  },
  6: {
    f: (c, i) => {
      if (c === 0) {
        return { jump: i }
      }
      return {}
    },
    jump: 1
  },
  7: {
    f: (a, b, out) => {
      return { output: a < b ? 1 : 0, write: out }
    },
    out: 2
  },
  8: {
    f: (a, b, out) => {
      return { output: a === b ? 1 : 0, write: out }
    },
    out: 2
  },
  99: {
    f: () => {
      return { halt: true }
    }
  }
}

function parseInstruction (intcode) {
  const opcode = intcode % 100
  const rawParamModes = Math.floor(intcode / 100).toString().split('').map(x => parseInt(x))

  const instruction = instructions[opcode]
  if (!instruction) {
    throw Error('Invalid opcode: ' + opcode)
  }

  const paramModes = [...range(0, instruction.f.length - 1)].map(i => rawParamModes[rawParamModes.length - i - 1] || 0)

  return { instruction: instruction, paramModes: paramModes }
}

const paramModeExtractors = {
  '0': (program, index) => program[index],
  '1': (program, index) => index
}
function getParam (program, index, mode) {
  const paramModeExtractor = paramModeExtractors[mode]
  if (!paramModeExtractor) {
    throw Error('Invalid parameter mode')
  }

  return paramModeExtractor(program, index)
}

function getParams (program, index, instruction, inputBuffer) {
  inputBuffer = inputBuffer.slice(0)
  return {
    params: instruction.paramModes.map((paramMode, i) => {
      if (i === instruction.instruction.input) {
        return inputBuffer.pop(0)
      }
      if (i === instruction.instruction.out) {
        return program[index + 1 + i]
      } else {
        return getParam(program, program[index + 1 + i], paramMode)
      }
    }),
    inputBuffer: inputBuffer
  }
}

function applyOneStep (program, index, inputBuffer) {
  // console.log('Apply one step:', index, program)
  const intcode = program[index]
  const instruction = parseInstruction(intcode)
  const params = getParams(program, index, instruction, inputBuffer)

  instruction.params = params.params
  inputBuffer = params.inputBuffer

  // console.log('Running instruction:', intcode, instruction)
  const instructionOutput = instruction.instruction.f(...instruction.params)
  const outputProgram = program.slice(0)
  // console.log('Instruction output:', instructionOutput)
  if (instructionOutput.write !== undefined && instructionOutput.output !== undefined) {
    // console.log('Morphing program: writing', instructionOutput.output, 'to position', instructionOutput.write)
    outputProgram[instructionOutput.write] = instructionOutput.output
  }

  const outputBuffer = []
  if (instructionOutput.output !== undefined && instruction.instruction.output !== undefined) {
    outputBuffer.push(instructionOutput.output)
  }

  return { program: outputProgram, halt: instructionOutput.halt, steps: instruction.instruction.f.length - (instruction.instruction.input ? 1 : 0), inputBuffer: inputBuffer, outputBuffer: outputBuffer, jump: instructionOutput.jump }
}

function applySteps (program, inputBuffer) {
  let instructionPointer = 0
  let outputBuffer = []

  while (program.length > instructionPointer) {
    const stepOutput = applyOneStep(program, instructionPointer, inputBuffer)
    inputBuffer = stepOutput.inputBuffer
    outputBuffer = outputBuffer.concat(stepOutput.outputBuffer)

    if (stepOutput.halt) {
      return { halt: true, inputBuffer: inputBuffer, outputBuffer: outputBuffer }
    }

    program = stepOutput.program

    if (stepOutput.jump !== undefined) {
      instructionPointer = stepOutput.jump
    } else {
      instructionPointer += stepOutput.steps + 1
    }
  }

  return { program: program, inputBuffer: inputBuffer, outputBuffer: outputBuffer }
}

async function one () {
  const input = await readPuzzleInput()
  const parsedInput = parsePuzzleInput(input)

  // const parsedInput = [1002,4,3,4,33]
  // const parsedInput = [3, 0, 4, 0, 99]
  const inputBuffer = [1]

  const output = applySteps(parsedInput, inputBuffer)

  return output
}

async function two () {
  const input = await readPuzzleInput()
  const parsedInput = parsePuzzleInput(input)

  // const parsedInput = [3,3,1107,-1,8,3,4,3,99]
  // const parsedInput = [3,12,6,12,15,1,13,14,13,4,13,99,-1,0,1,9]
  // const parsedInput = [3,21,1008,21,8,20,1005,20,22,107,8,21,20,1006,20,31,1106,0,36,98,0,0,1002,21,125,20,4,20,1105,1,46,104,999,1105,1,46,1101,1000,1,20,4,20,1105,1,46,98,99]

  const inputBuffer = [5]

  const output = applySteps(parsedInput, inputBuffer)

  return output
}

one().then(console.log).then(two).then(console.log)
