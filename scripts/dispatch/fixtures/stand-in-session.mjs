// A stand-in for `claude` used by spawn.test.mjs. Not claude, and does nothing
// a real session does. The first argument picks the behaviour:
//   echo          read all of stdin, print {"length", "sha256"} of it, exit 0
//   exit <code>   print a line and exit with <code>
//   sleep         read stdin, print nothing, and never finish
//   chatty <ms>   print a line every <ms> forever
//   hang          print one line, then never print again and never finish
import { createHash } from 'node:crypto'

const [mode, arg] = process.argv.slice(2)

async function readStdin() {
  const chunks = []
  for await (const chunk of process.stdin) chunks.push(chunk)
  return Buffer.concat(chunks)
}

if (mode === 'echo') {
  const input = await readStdin()
  process.stdout.write(JSON.stringify({
    length: input.toString('utf8').length,
    sha256: createHash('sha256').update(input).digest('hex'),
  }))
} else if (mode === 'exit') {
  process.stdout.write('stand-in output\n')
  process.exit(Number(arg))
} else if (mode === 'sleep') {
  await readStdin()
  setInterval(() => {}, 1000)
} else if (mode === 'chatty') {
  setInterval(() => process.stdout.write('tick\n'), Number(arg))
} else if (mode === 'hang') {
  process.stdout.write('started\n')
  setInterval(() => {}, 1000)
} else {
  process.stderr.write(`unknown mode ${mode}\n`)
  process.exit(2)
}
