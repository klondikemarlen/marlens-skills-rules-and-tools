import { spawnSync } from "node:child_process"
import { createHash } from "node:crypto"
import { once } from "node:events"
import { constants } from "node:fs"
import { access, lstat, mkdir, open, readFile, rm, writeFile } from "node:fs/promises"
import { createRequire } from "node:module"
import { homedir } from "node:os"
import { delimiter, isAbsolute, join, resolve } from "node:path"
import { pathToFileURL } from "node:url"

const ownerMarker = ".mssrt-screenshot-owner"

export async function withScreenshotFirefoxProfile(batch, options, operate) {
  if (process.platform !== "linux") {
    throw new Error("The managed Firefox publisher requires Linux and its `flock` utility.")
  }

  const root =
    options.profileRoot ??
    join(process.env.XDG_STATE_HOME || join(homedir(), ".local", "state"), "mssrt-pr-screenshots")
  if (!isAbsolute(root)) {
    throw new Error("Use an absolute private directory for `--profile-root`.")
  }

  await mkdir(root, { recursive: true, mode: 0o700 })
  await requirePrivateDirectory(root)
  const worktree = spawnSync("git", ["-C", root, "rev-parse", "--is-inside-work-tree"], {
    encoding: "utf8",
  })
  if (worktree.stdout?.trim() === "true") {
    throw new Error(
      "Keep the managed Firefox profile outside any Git checkout. Choose a different private profile root."
    )
  }

  const scope = `${batch.owner}/${batch.repo}`.toLowerCase()
  const directory = join(root, createHash("sha256").update(scope).digest("hex"))
  await mkdir(directory, { recursive: true, mode: 0o700 })
  await requirePrivateDirectory(directory)
  let browserSession

  const lock = await open(
    join(directory, "operation.lock"),
    constants.O_CREAT | constants.O_RDWR | constants.O_NOFOLLOW,
    0o600
  )
  try {
    const acquired = spawnSync("flock", ["-n", "-E", "75", "3"], {
      stdio: ["ignore", "ignore", "ignore", lock.fd],
    })
    if (acquired.status === 75) {
      throw new Error(
        "A managed Firefox publishing action is already running for this repository. Wait for it to finish."
      )
    }
    if (acquired.status !== 0) {
      throw new Error(
        "Could not acquire the managed profile lock. Check the Linux `flock` installation and state filesystem."
      )
    }
    return await operate({
      directory,
      connect: async (pr, confirm) => {
        const driver = await resolveFirefoxBinding(options.binding)
        const firefox = await resolveFirefoxExecutable(options.firefox)
        const session = new ScreenshotFirefoxProfile(directory, scope, driver, firefox, confirm)
        try {
          const page = await session.authenticate(pr)
          browserSession = session
          return page
        } catch (error) {
          await session.close()
          throw error
        }
      },
      revoke: () => revokeProfile(directory, scope),
    })
  } finally {
    try {
      await browserSession?.close()
    } finally {
      await lock.close()
    }
  }
}

class ScreenshotFirefoxProfile {
  constructor(directory, scope, binding, firefox, confirm) {
    this.profile = join(directory, "firefox")
    this.active = join(directory, "firefox-active.json")
    this.scope = scope
    this.binding = binding
    this.firefox = firefox
    this.confirm = confirm
  }

  async authenticate(pr) {
    await requireNoOwnedBrowser(this.active)
    await prepareManagedProfile(this.profile, this.scope)
    let page = await this.open(pr.url, true)
    let login = await currentGitHubAccount(page, pr.url)
    if (!login) {
      if (
        !(await this.confirm(
          "The managed Firefox profile is signed out. Open a separate Firefox window for manual GitHub sign-in/MFA?"
        ))
      ) {
        throw new Error("Authentication cancelled. No attachment was uploaded.")
      }
      await this.close()
      page = await this.open(pr.url, false)
      if (
        !(await this.confirm(
          "Switch to the owned Firefox window, finish GitHub sign-in/MFA, then confirm here. Returning without confirming cancels publication."
        ))
      ) {
        throw new Error("Authentication cancelled. No attachment was uploaded.")
      }
      if (!(await currentGitHubAccount(page, pr.url))) {
        throw new Error(
          "Firefox has not returned to the signed-in PR. Complete sign-in there before retrying."
        )
      }
      await this.close()
      page = await this.open(pr.url, true)
      login = await currentGitHubAccount(page, pr.url)
    }
    if (!login || login.toLowerCase() !== pr.actor.toLowerCase()) {
      throw new Error(
        "The owned Firefox account did not match the GitHub CLI account for this PR. Sign in to both with the same authorized account."
      )
    }
    return page
  }

  async open(url, headless) {
    await writeFile(this.active, JSON.stringify({ pid: null }), { mode: 0o600, flag: "wx" })
    try {
      this.browser = await this.binding.launch({
        browser: "firefox",
        protocol: "webDriverBiDi",
        executablePath: this.firefox,
        userDataDir: this.profile,
        headless,
        defaultViewport: null,
        args: ["--no-remote"],
        extraPrefsFirefox: { "signon.rememberSignons": false },
      })
      const pid = this.browser.process()?.pid
      if (!Number.isSafeInteger(pid) || pid <= 0) {
        throw new Error("Firefox process unavailable")
      }
      await writeFile(this.active, JSON.stringify({ pid }), { mode: 0o600, flush: true })
      const pages = await this.browser.pages()
      const page = pages[0] ?? (await this.browser.newPage())
      await page.goto(url, { waitUntil: "domcontentloaded" })
      return page
    } catch {
      if (!this.browser) {
        // Puppeteer rejected launch without yielding an owned process to retain.
        await rm(this.active, { force: true })
      }
      throw new Error(
        "The managed Firefox session could not open the PR. Check the compatible Firefox path, Node binding and profile root."
      )
    }
  }

  async close() {
    if (!this.browser) return

    const child = this.browser.process()
    try {
      if (child && child.exitCode === null && child.signalCode === null) {
        await Promise.all([
          once(child, "exit", { signal: AbortSignal.timeout(10_000) }),
          this.browser.close(),
        ])
      } else {
        await this.browser.close()
      }
      if (!child) throw new Error("Firefox process unavailable")
    } catch {
      throw new Error(
        "Could not confirm the owned Firefox process exited. Retain its profile and inspect only that managed process."
      )
    }
    this.browser = undefined
    await rm(this.active, { force: true })
  }
}

async function resolveFirefoxExecutable(executable) {
  const candidates = executable
    ? [resolve(executable)]
    : (process.env.PATH ?? "")
        .split(delimiter)
        .filter(Boolean)
        .map((directory) => resolve(directory, "firefox"))
  for (const candidate of candidates) {
    try {
      await access(candidate, constants.X_OK)
      return candidate
    } catch {
      // Only an executable accessible to this user can launch the owned session.
    }
  }
  throw new Error("Firefox is not executable. Supply the installed binary with `--firefox`.")
}

async function resolveFirefoxBinding(packageJson) {
  const loaders = [createRequire(resolve("package.json")), createRequire(import.meta.url)]
  if (packageJson) {
    if (!isAbsolute(packageJson))
      throw new Error("`--binding` needs an absolute Puppeteer package.json path.")
    try {
      const metadata = JSON.parse(await readFile(packageJson, "utf8"))
      if (metadata.name !== "puppeteer-core" && metadata.name !== "puppeteer") {
        throw new Error("Unexpected binding package")
      }
      return await importBinding(createRequire(packageJson), metadata.name)
    } catch {
      throw incompatibleBinding()
    }
  }
  for (const loader of loaders) {
    for (const name of ["puppeteer-core", "puppeteer"]) {
      try {
        return await importBinding(loader, name)
      } catch {
        // An optional installation that cannot load is not a usable Firefox binding.
      }
    }
  }
  throw incompatibleBinding()
}

function incompatibleBinding() {
  return new Error(
    "No usable installed Puppeteer binding was found. Select its package.json with `--binding` and use the supported Node/Firefox pair."
  )
}

async function importBinding(require, name) {
  const binding = await import(pathToFileURL(require.resolve(name)).href)
  if (typeof binding.launch !== "function") throw incompatibleBinding()
  return binding
}

async function currentGitHubAccount(page, expectedUrl) {
  const current = new URL(page.url())
  const expected = new URL(expectedUrl)
  if (current.origin !== expected.origin) {
    throw new Error(
      "Firefox left GitHub before sign-in could be confirmed. Inspect the owned sign-in handoff."
    )
  }
  if (current.pathname === "/login") return null
  if (current.pathname.toLowerCase() !== expected.pathname.toLowerCase()) {
    throw new Error("Firefox did not reach the authorized GitHub pull request.")
  }

  const account = await page.evaluate(() => ({
    login: globalThis.document.querySelector('meta[name="user-login"]')?.content,
    signInOffered: Boolean(globalThis.document.querySelector('a[href^="/login"]')),
  }))
  if (account.login) return account.login
  if (account.signInOffered) return null

  throw new Error(
    "Firefox could not determine the GitHub sign-in state. Check access to this exact PR."
  )
}

async function requirePrivateDirectory(directory) {
  const details = await lstat(directory)
  if (
    !details.isDirectory() ||
    details.uid !== process.getuid() ||
    (details.mode & 0o777) !== 0o700
  ) {
    throw new Error(
      "Managed Firefox storage must be an owned, non-symlink directory with permissions 0700."
    )
  }
}

async function prepareManagedProfile(profile, scope) {
  try {
    await mkdir(profile, { mode: 0o700 })
  } catch (error) {
    if (error.code !== "EEXIST") throw error
    await confirmManagedProfile(profile, scope)
    return
  }
  await writeFile(join(profile, ownerMarker), scope, { mode: 0o600, flag: "wx" })
}

async function confirmManagedProfile(profile, scope) {
  await requirePrivateDirectory(profile)
  const marker = join(profile, ownerMarker)
  const details = await lstat(marker).catch(() => null)
  if (
    !details?.isFile() ||
    details.uid !== process.getuid() ||
    (details.mode & 0o777) !== 0o600 ||
    (await readFile(marker, "utf8")) !== scope
  ) {
    throw new Error(
      "Firefox profile ownership is not established. Do not open, copy, or delete this profile."
    )
  }
}

async function requireNoOwnedBrowser(active) {
  let ownership
  try {
    ownership = JSON.parse(await readFile(active, "utf8"))
  } catch (error) {
    if (error.code === "ENOENT") return
    throw new Error(
      "The managed browser ownership record is unreadable. Inspect the owned process before using this profile.",
      { cause: error }
    )
  }

  if (Number.isSafeInteger(ownership.pid) && ownership.pid > 0) {
    try {
      process.kill(ownership.pid, 0)
    } catch (error) {
      if (error.code !== "ESRCH") throw error
      await rm(active)
      return
    }
  }
  throw new Error(
    "An earlier managed Firefox process may still be active. Confirm that owned process has exited before reusing or revoking this profile."
  )
}

async function revokeProfile(directory, scope) {
  const profile = join(directory, "firefox")
  await requireNoOwnedBrowser(join(directory, "firefox-active.json"))
  try {
    await confirmManagedProfile(profile, scope)
  } catch (error) {
    if (error.code === "ENOENT") return "already-revoked"
    throw error
  }
  await rm(profile, { recursive: true })
  return "revoked"
}

export default withScreenshotFirefoxProfile
