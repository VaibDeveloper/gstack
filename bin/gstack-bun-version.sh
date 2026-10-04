# shellcheck shell=bash
# gstack-bun-version.sh — the one source for the Bun versions gstack needs.
# Sourced, never executed: ./setup refuses or warns from it before writing
# anything, and bin/gstack-session-update reads the INCOMING release's copy
# (git show) before advancing a live checkout. test/bun-version-drift.test.ts
# keeps it equal to package.json engines.bun, every CI pin, setup's install
# hint and README. Bash 3.2 builtins only.
#
# GSTACK_BUN_FLOOR is the security floor. Older Bun accepts
# --no-compile-autoload-dotenv/--no-compile-autoload-bunfig but ignores them,
# so gstack's compiled tools would read a project's .env. Verified by a
# compiled probe (a binary built with all four no-autoload flags, run beside a
# .env): Bun 1.3.2 loads it, 1.3.3 and 1.4.0 do not.
# GSTACK_BUN_TESTED is the supported minimum: the CI pin and engines.bun.
GSTACK_BUN_FLOOR="1.3.3"
GSTACK_BUN_TESTED="1.4.0"

# _gstack_bun_parse <version> — sets _gb_core ("MAJOR MINOR PATCH" as decimal
# integers) and _gb_pre (prerelease, may be empty); returns 1 when malformed.
# A leading "v" and "+build" metadata are ignored.
_gstack_bun_parse() {
  _gb_v="${1#v}"; _gb_v="${_gb_v%%+*}"; _gb_pre=""
  case "$_gb_v" in
    *-*) _gb_pre="${_gb_v#*-}"; _gb_v="${_gb_v%%-*}"; [ -n "$_gb_pre" ] || return 1 ;;
  esac
  case "$_gb_v" in *.*.*) ;; *) return 1 ;; esac
  _gb_maj="${_gb_v%%.*}"; _gb_rest="${_gb_v#*.}"; _gb_min="${_gb_rest%%.*}"; _gb_pat="${_gb_rest#*.}"
  case "$_gb_maj" in ''|*[!0-9]*) return 1 ;; esac
  case "$_gb_min" in ''|*[!0-9]*) return 1 ;; esac
  case "$_gb_pat" in ''|*[!0-9]*) return 1 ;; esac
  case "$_gb_pre" in *[!0-9A-Za-z.-]*) return 1 ;; esac
  _gb_core="$((10#$_gb_maj)) $((10#$_gb_min)) $((10#$_gb_pat))"
}

# _gstack_bun_below <version> <release> — true when version sorts below the
# release. Prerelease rule (semver): 1.3.3-canary.1 is below 1.3.3 and above
# 1.3.2, so a prerelease of the floor itself is refused.
_gstack_bun_below() {
  _gstack_bun_parse "$2" || return 1
  set -- "$1" $_gb_core
  _gstack_bun_parse "$1" || return 1
  set -- "$@" $_gb_core
  [ "$5" -ne "$2" ] && { [ "$5" -lt "$2" ]; return; }
  [ "$6" -ne "$3" ] && { [ "$6" -lt "$3" ]; return; }
  [ "$7" -ne "$4" ] && { [ "$7" -lt "$4" ]; return; }
  [ -n "$_gb_pre" ]
}

# gstack_bun_status <version> [floor] — prints too-old, untested, ok or
# malformed. The optional floor lets the auto-updater apply the incoming
# release's floor with this release's comparison rule.
gstack_bun_status() {
  if ! _gstack_bun_parse "$1"; then echo malformed
  elif _gstack_bun_below "$1" "${2:-$GSTACK_BUN_FLOOR}"; then echo too-old
  elif _gstack_bun_below "$1" "$GSTACK_BUN_TESTED"; then echo untested
  else echo ok
  fi
}
