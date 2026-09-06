pragma circom 2.1.5;

include "poseidon.circom";

template MerkleMembership(nLevels) {
    signal input leaf;
    signal input pathElements[nLevels];
    signal input pathIndices[nLevels];
    signal input root;

    component hashers[nLevels];
    signal intermediate[nLevels + 1];

    intermediate[0] <== leaf;

    for (var i = 0; i < nLevels; i++) {
        hashers[i] = Poseidon(2);
        hashers[i].inputs[0] <== pathIndices[i] * (pathElements[i] - intermediate[i]) + intermediate[i];
        hashers[i].inputs[1] <== pathIndices[i] * (intermediate[i] - pathElements[i]) + pathElements[i];
        intermediate[i + 1] <== hashers[i].out;
    }

    root === intermediate[nLevels];
}

component main { public [root] } = MerkleMembership(20);
