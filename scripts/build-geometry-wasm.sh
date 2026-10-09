#!/bin/sh
set -eu

project_dir=$(CDPATH= cd -- "$(dirname -- "$0")/.." && pwd)
image="emscripten/emsdk:3.1.64"

if command -v emcmake >/dev/null 2>&1; then
  cd "$project_dir/wasm"
  set -- -S . -B build -DCMAKE_BUILD_TYPE=Release
  if [ -n "${VCGLIB_SOURCE_DIR:-}" ]; then
    set -- "$@" "-DFETCHCONTENT_SOURCE_DIR_VCGLIB=$VCGLIB_SOURCE_DIR"
  fi
  emcmake cmake "$@"
  cmake --build build --target ocra-geometry --parallel
  exit 0
fi

emsdk_dir="${EMSDK_DIR:-/private/tmp/ocra-emsdk}"
if [ -x "$emsdk_dir/upstream/emscripten/emcmake" ]; then
  cd "$project_dir/wasm"
  set -- -S . -B build -DCMAKE_BUILD_TYPE=Release
  if [ -n "${VCGLIB_SOURCE_DIR:-}" ]; then
    set -- "$@" "-DFETCHCONTENT_SOURCE_DIR_VCGLIB=$VCGLIB_SOURCE_DIR"
  fi
  PATH="$emsdk_dir/upstream/emscripten:$PATH" \
    "$emsdk_dir/upstream/emscripten/emcmake" cmake "$@"
  cmake --build build --target ocra-geometry --parallel
  exit 0
fi

docker run --rm \
  --user "$(id -u):$(id -g)" \
  --volume "$project_dir:/work" \
  --workdir /work/wasm \
  "$image" \
  sh -lc 'emcmake cmake -S . -B build -DCMAKE_BUILD_TYPE=Release && cmake --build build --target ocra-geometry --parallel'
