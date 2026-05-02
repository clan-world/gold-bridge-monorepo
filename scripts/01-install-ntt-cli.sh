#!/usr/bin/env bash
set -euo pipefail

INSTALL_URL="${NTT_INSTALL_URL:-https://raw.githubusercontent.com/wormhole-foundation/native-token-transfers/main/cli/install.sh}"
installer="$(mktemp)"
trap 'rm -f "$installer"' EXIT

curl -fsSL "$INSTALL_URL" -o "$installer"
echo "Downloaded Wormhole NTT installer to: $installer"

if [[ "${NTT_INSTALL_ASSUME_YES:-false}" != "true" ]]; then
  if [[ -t 0 ]]; then
    echo "Review the installer before executing it:"
    echo "  less $installer"
    read -r -p "Run this installer now? Type YES to continue: " confirmation
    [[ "$confirmation" == "YES" ]] || {
      echo "Aborted. Set NTT_INSTALL_ASSUME_YES=true to run non-interactively."
      exit 1
    }
  else
    echo "Refusing to execute a downloaded installer non-interactively." >&2
    echo "Set NTT_INSTALL_ASSUME_YES=true after reviewing the installer source." >&2
    exit 1
  fi
fi

bash "$installer"
ntt --version
