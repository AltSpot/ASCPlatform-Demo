#!/usr/bin/env bash
# Runs the full reference sweep for the themes named (default: all three),
# restarting the capture browser with --resume for as long as it keeps
# making progress. See scripts/make-reference-plans.mjs.
cd "$(dirname "$0")/.." || exit 1
themes=("$@"); [ ${#themes[@]} -eq 0 ] && themes=(ember ice daylight)
for theme in "${themes[@]}"; do
  plan="screenshots/demo-reference/$theme.plan.json"
  last=-1
  for attempt in 1 2 3 4 5 6 7 8 9 10 11 12; do
    node scripts/shoot.mjs "$plan" --resume > /dev/null 2>&1
    code=$?
    have=$(ls "screenshots/demo-reference/$theme" 2>/dev/null | wc -l)
    echo "$theme: attempt $attempt, exit $code, $have files"
    [ "$code" -eq 0 ] && break
    [ "$have" -eq "$last" ] && [ "$attempt" -gt 2 ] && break
    last=$have
  done
done
