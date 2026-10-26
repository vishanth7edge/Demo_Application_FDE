#!/usr/bin/env bash
# install-k6 — make sure the k6 CLI is available; install it if it isn't.
# Usage:  bash .claude/skills/QE-Shared/install-k6.sh
#   K6_VERSION=v1.3.0   pin a release (default: latest GitHub release)
#   K6_INSTALL_DIR=...  where the binary goes on Linux/macOS (default: ~/.local/bin)
# Never prompts and never uses sudo: macOS uses Homebrew when present, Windows (Git Bash)
# uses winget/choco, everything else downloads the official release binary from GitHub and
# verifies its SHA-256 against the release's checksums file.
set -euo pipefail

if command -v k6 >/dev/null 2>&1; then
  echo "k6 already installed: $(k6 version 2>/dev/null | head -n1) ($(command -v k6))"
  exit 0
fi

echo "k6 not found — installing ..."

OS="$(uname -s)"
ARCH="$(uname -m)"

case "$OS" in
  MINGW* | MSYS* | CYGWIN*)
    if command -v winget >/dev/null 2>&1; then
      winget install --id GrafanaLabs.k6 -e --silent --accept-package-agreements --accept-source-agreements
    elif command -v choco >/dev/null 2>&1; then
      choco install k6 -y
    else
      echo "ERROR: no winget or choco found. Install k6 manually: https://grafana.com/docs/k6/latest/set-up/install-k6/" >&2
      exit 1
    fi
    echo "k6 installed. Open a new terminal so it is on PATH, then run: k6 version"
    exit 0
    ;;
  Darwin)
    if command -v brew >/dev/null 2>&1; then
      brew install k6
      echo "k6 installed: $(k6 version | head -n1)"
      exit 0
    fi
    PLATFORM="macos"
    EXT="zip"
    ;;
  Linux)
    PLATFORM="linux"
    EXT="tar.gz"
    ;;
  *)
    echo "ERROR: unsupported OS '$OS'. Install k6 manually: https://grafana.com/docs/k6/latest/set-up/install-k6/" >&2
    exit 1
    ;;
esac

case "$ARCH" in
  x86_64 | amd64) ARCH="amd64" ;;
  arm64 | aarch64) ARCH="arm64" ;;
  *)
    echo "ERROR: unsupported architecture '$ARCH'." >&2
    exit 1
    ;;
esac

for tool in curl tar; do
  command -v "$tool" >/dev/null 2>&1 || { echo "ERROR: '$tool' is required." >&2; exit 1; }
done
if [ "$EXT" = "zip" ]; then
  command -v unzip >/dev/null 2>&1 || { echo "ERROR: 'unzip' is required." >&2; exit 1; }
fi

VERSION="${K6_VERSION:-}"
if [ -z "$VERSION" ]; then
  # /releases/latest redirects to /releases/tag/vX.Y.Z — no API token or jq needed.
  VERSION="$(curl -fsSLI -o /dev/null -w '%{url_effective}' https://github.com/grafana/k6/releases/latest)"
  VERSION="${VERSION##*/}"
fi
case "$VERSION" in v*) ;; *) VERSION="v$VERSION" ;; esac

NAME="k6-${VERSION}-${PLATFORM}-${ARCH}"
BASE_URL="https://github.com/grafana/k6/releases/download/${VERSION}"
INSTALL_DIR="${K6_INSTALL_DIR:-$HOME/.local/bin}"

# Download + extract in a fresh, empty temp dir; removed on exit.
TMP="$(mktemp -d)"
trap 'rm -rf "$TMP"' EXIT

echo "Downloading ${NAME}.${EXT} ..."
curl -fsSL -o "$TMP/${NAME}.${EXT}" "${BASE_URL}/${NAME}.${EXT}"

if curl -fsSL -o "$TMP/checksums.txt" "${BASE_URL}/k6-${VERSION}-checksums.txt"; then
  EXPECTED="$(grep " ${NAME}.${EXT}\$" "$TMP/checksums.txt" | awk '{print $1}')"
  if command -v sha256sum >/dev/null 2>&1; then
    ACTUAL="$(sha256sum "$TMP/${NAME}.${EXT}" | awk '{print $1}')"
  else
    ACTUAL="$(shasum -a 256 "$TMP/${NAME}.${EXT}" | awk '{print $1}')"
  fi
  if [ -z "$EXPECTED" ] || [ "$EXPECTED" != "$ACTUAL" ]; then
    echo "ERROR: checksum mismatch for ${NAME}.${EXT} — aborting." >&2
    exit 1
  fi
  echo "  checksum ok"
else
  echo "  WARN: could not fetch checksums file; skipping verification." >&2
fi

mkdir -p "$TMP/x"
if [ "$EXT" = "zip" ]; then
  unzip -q "$TMP/${NAME}.${EXT}" -d "$TMP/x"
else
  tar -xzf "$TMP/${NAME}.${EXT}" -C "$TMP/x"
fi

mkdir -p "$INSTALL_DIR"
install -m 0755 "$TMP/x/${NAME}/k6" "$INSTALL_DIR/k6"
echo "k6 installed: $("$INSTALL_DIR/k6" version | head -n1) -> $INSTALL_DIR/k6"

case ":$PATH:" in
  *":$INSTALL_DIR:"*) ;;
  *)
    echo "NOTE: $INSTALL_DIR is not on your PATH. Add this to your shell profile:"
    echo "  export PATH=\"$INSTALL_DIR:\$PATH\""
    ;;
esac