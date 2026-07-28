#!/usr/bin/env node
/**
 * Optional: start ASCPlatform automatically when you log in to macOS.
 *
 *   node scripts/autostart.mjs install     register the LaunchAgent
 *   node scripts/autostart.mjs uninstall   remove it
 *   node scripts/autostart.mjs status      is it registered?
 *
 * This writes a single plist to ~/Library/LaunchAgents. Uninstall removes
 * that file and nothing else — no other part of your system is touched.
 */
import { execFileSync } from 'node:child_process';
import { existsSync, mkdirSync, rmSync, writeFileSync } from 'node:fs';
import { homedir } from 'node:os';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');

const LABEL = 'com.altspot.ascplatform.dev';
const agentDir = resolve(homedir(), 'Library/LaunchAgents');
const plistPath = resolve(agentDir, `${LABEL}.plist`);

function plist() {
  return `<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
  <key>Label</key>
  <string>${LABEL}</string>
  <key>ProgramArguments</key>
  <array>
    <string>${process.execPath}</string>
    <string>${resolve(root, 'scripts/supervisor.mjs')}</string>
  </array>
  <key>WorkingDirectory</key>
  <string>${root}</string>
  <key>EnvironmentVariables</key>
  <dict>
    <key>PORT</key>
    <string>4000</string>
    <key>PATH</key>
    <string>${process.env.PATH ?? '/usr/local/bin:/usr/bin:/bin'}</string>
  </dict>
  <key>RunAtLoad</key>
  <true/>
  <key>KeepAlive</key>
  <true/>
  <key>StandardOutPath</key>
  <string>${resolve(root, '.run/autostart.log')}</string>
  <key>StandardErrorPath</key>
  <string>${resolve(root, '.run/autostart.log')}</string>
</dict>
</plist>
`;
}

function bootout() {
  try {
    execFileSync('launchctl', ['bootout', `gui/${process.getuid?.()}/${LABEL}`], {
      stdio: 'ignore',
    });
  } catch {
    /* not loaded */
  }
}

const command = process.argv[2] ?? 'status';

if (command === 'install') {
  mkdirSync(agentDir, { recursive: true });
  mkdirSync(resolve(root, '.run'), { recursive: true });

  bootout();
  writeFileSync(plistPath, plist());
  execFileSync('launchctl', ['bootstrap', `gui/${process.getuid?.()}`, plistPath], {
    stdio: 'inherit',
  });

  console.log(`Installed. ASCPlatform will start at login on http://localhost:4000`);
  console.log(`Remove any time with: node scripts/autostart.mjs uninstall`);
} else if (command === 'uninstall') {
  bootout();
  if (existsSync(plistPath)) rmSync(plistPath);
  console.log('Removed. ASCPlatform will no longer start at login.');
} else {
  console.log(
    existsSync(plistPath)
      ? `Installed — ${plistPath}`
      : 'Not installed. Run: node scripts/autostart.mjs install',
  );
}
