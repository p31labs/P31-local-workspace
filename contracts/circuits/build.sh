#!/usr/bin/env bash
set -euo pipefail

CIRCUIT_NAME="MerkleMembership"
CIRCUITS_DIR="$(cd "$(dirname "$0")" && pwd)"
BUILD_DIR="${CIRCUITS_DIR}/build/${CIRCUIT_NAME}"
CIRCUIT_FILE="${CIRCUITS_DIR}/${CIRCUIT_NAME}.circom"
POWERS_OF_TAU="powersOfTau28_hez_final_20.ptau"

mkdir -p "${BUILD_DIR}"

echo "[1/5] Compiling circuit..."
CIRCOMLIB="$(npm root -g)/circomlib/circuits"
circom2 "${CIRCUIT_FILE}" --r1cs --wasm --sym -o "${BUILD_DIR}" -l "${CIRCOMLIB}"

echo "[2/5] Downloading powers of tau..."
if [ ! -f "${BUILD_DIR}/${POWERS_OF_TAU}" ]; then
  curl -sSL "https://hermez.s3-eu-west-1.amazonaws.com/${POWERS_OF_TAU}" -o "${BUILD_DIR}/${POWERS_OF_TAU}"
fi

echo "[3/5] Generating zkey..."
snarkjs groth16 setup "${BUILD_DIR}/${CIRCUIT_NAME}.r1cs" "${BUILD_DIR}/${POWERS_OF_TAU}" "${BUILD_DIR}/${CIRCUIT_NAME}_0000.zkey"
snarkjs zkey contribute "${BUILD_DIR}/${CIRCUIT_NAME}_0000.zkey" "${BUILD_DIR}/${CIRCUIT_NAME}_0001.zkey" --name="P31 Labs entropy" -v -e="p31-sovereign-sbt-$(date +%s)"
snarkjs zkey beacon "${BUILD_DIR}/${CIRCUIT_NAME}_0001.zkey" "${BUILD_DIR}/${CIRCUIT_NAME}_final.zkey" 0102030405060708090a0b0c0d0e0f101112131415161718191a1b1c1d1e1f20 10

echo "[4/5] Exporting verification key..."
snarkjs zkey export verificationkey "${BUILD_DIR}/${CIRCUIT_NAME}_final.zkey" "${BUILD_DIR}/verification_key.json"

echo "[5/5] Exporting Solidity verifier..."
snarkjs zkey export solidityverifier "${BUILD_DIR}/${CIRCUIT_NAME}_final.zkey" "${BUILD_DIR}/verifier.sol"

echo "Done. Build artifacts in ${BUILD_DIR}"
echo "  Circuit:        ${BUILD_DIR}/${CIRCUIT_NAME}.r1cs"
echo "  WASM:           ${BUILD_DIR}/${CIRCUIT_NAME}_js/${CIRCUIT_NAME}.wasm"
echo "  Proving key:    ${BUILD_DIR}/${CIRCUIT_NAME}_final.zkey"
echo "  Verif key:      ${BUILD_DIR}/verification_key.json"
echo "  Solidity vfy:   ${BUILD_DIR}/verifier.sol"
