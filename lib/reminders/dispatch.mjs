import { dispatch } from "./reminders.mjs"

try {
  const result = await dispatch(process.argv[2])
  console.log(JSON.stringify(result))
} catch (error) {
  console.error(`OMP reminder delivery failed: ${error.message}`)
  process.exitCode = 1
}
