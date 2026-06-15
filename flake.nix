{
  description = "P31 Labs Andromeda — hermetic dev shell and CI builds";

  inputs = {
    nixpkgs.url = "github:NixOS/nixpkgs/nixos-unstable";
    flake-utils.url = "github:numtide/flake-utils";
    rust-overlay.url = "github:oxalica/rust-overlay";
  };

  outputs =
    {
      self,
      nixpkgs,
      flake-utils,
      rust-overlay,
    }:
    flake-utils.lib.eachDefaultSystem (
      system:
      let
        pkgs = import nixpkgs {
          inherit system;
          overlays = [ (import rust-overlay) ];
        };
      in
      {
        devShells.default = pkgs.mkShell {
          buildInputs = with pkgs; [
            # Rust toolchain with wasm target
            (rust-bin.stable.latest.default.override {
              extensions = [ "rust-src" "rust-analyzer" "clippy" "rustfmt" ];
              targets = [ "wasm32-unknown-unknown" ];
            })

            # Node.js 22 LTS + pnpm
            nodejs_22
            pnpm

            # Rust wasm build tool
            wasm-pack

            # System deps for native builds
            openssl
            pkg-config
            gcc
            gnumake

            # Utilities
            git
            curl
            wget
            jq
            python3
          ]
          ++ pkgs.lib.optionals pkgs.stdenv.isLinux [ ]
          ++ pkgs.lib.optionals pkgs.stdenv.isDarwin (with pkgs; [
            libiconv
            darwin.apple_sdk.frameworks.Security
            darwin.apple_sdk.frameworks.WebKit2
          ]);

          shellHook = ''
            echo "P31 Labs Andromeda — dev shell"
            echo "  Node:  $(node --version)"
            echo "  pnpm:  $(pnpm --version)"
            echo "  Rust:  $(rustc --version)"
            echo "  wasm:  $(wasm-pack --version 2>/dev/null || echo 'wasm-pack ready')"
            echo ""
            echo "Install wrangler:  npm install -g wrangler@4.100.0"
            echo "Run 'pnpm install' then 'pnpm build' for full build."
          '';
        };
      }
    );
}
