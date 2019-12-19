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
        return inputBuffer.splice(0, 1)[0]
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

function * applySteps (program, inputBuffer) {
  let instructionPointer = 0
  let outputBuffer = []

  while (program.length > instructionPointer) {
    const stepOutput = applyOneStep(program, instructionPointer, inputBuffer)
    inputBuffer = stepOutput.inputBuffer
    outputBuffer = outputBuffer.concat(stepOutput.outputBuffer)
    if (outputBuffer.length > 0) {
      yield { halt: false, inputBuffer: inputBuffer, outputBuffer: outputBuffer }
    }

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

function permute (list) {
  return list.reduce(function innerPermute(res, item, key, arr) {
    return res.concat(arr.length > 1 && arr.slice(0, key).concat(arr.slice(key + 1)).reduce(innerPermute, []).map((perm) => {
      return [item].concat(perm)
    }) || item)
  }, [])
}

function feedbackLoop (program, phases) {
  const initializedPrograms = phases.map(phase => {
    const inputBuffer = [phase]
    const initializedProgram = applySteps(program, inputBuffer)
    return {input: inputBuffer, program: initializedProgram}
  })
  let programIndex = 0
  let nextInput = 0
  let output = {done: false}

  while (!output.done || programIndex < phases.length - 1) {
    if (nextInput) {
      initializedPrograms[programIndex].input.push(nextInput)
    }
    output = initializedPrograms[programIndex].program.next()
    initializedPrograms[programIndex].input = output.value.inputBuffer
    programIndex = (programIndex + 1) % phases.length
    output.value.inputBuffer.forEach(value => {
      initializedPrograms[programIndex].input.push(value)
    })
    nextInput = output.value.outputBuffer.pop()
  }

  return initializedPrograms[programIndex].input[0]
}

async function one () {
  const input = await readPuzzleInput()
  const parsedInput = parsePuzzleInput(input)

  // const parsedInput = [3,15,3,16,1002,16,10,16,1,16,15,15,4,15,99,0,0]
  // const parsedInput = [3,23,3,24,1002,24,10,24,1002,23,-1,23,101,5,23,23,1,24,23,23,4,23,99,0,0]
  // const parsedInput = [3,31,3,32,1002,32,10,32,1001,31,-2,31,1007,31,0,33,1002,33,7,33,1,33,31,31,1,32,31,31,4,31,99,0,0,0]

  return permute([...range(0, 4)]).map(option => option.reduce((input, phase) => applySteps(parsedInput, [phase, input]).next().value.outputBuffer[0], 0)).reduce((a, b) => Math.max(a, b))
}

async function two () {
  const input = await readPuzzleInput()
  const parsedInput = parsePuzzleInput(input)

  // const parsedInput = [3,26,1001,26,-4,26,3,27,1002,27,2,27,1,27,26,27,4,27,1001,28,-1,28,1005,28,6,99,0,0,5]
  // return feedbackLoop(parsedInput, [9,8,7,6,5])

  // const parsedInput = [3,52,1001,52,-5,52,3,53,1,52,56,54,1007,54,5,55,1005,55,26,1001,54,-5,54,1105,1,12,1,53,54,53,1008,54,0,55,1001,55,1,55,2,53,55,53,4,53,1001,56,-1,56,1005,56,6,99,0,0,0,0,10]
  // return feedbackLoop(parsedInput, [9,7,8,5,6])

  return permute([...range(5, 9)]).map(phases => feedbackLoop(parsedInput, phases)).reduce((a, b) => Math.max(a, b))
}

one().then(console.log).then(two).then(console.log)
