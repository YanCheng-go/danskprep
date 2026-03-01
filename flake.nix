{
  description = "DanskPrep development environment";

  inputs = {
    nixpkgs.url = "github:NixOS/nixpkgs/nixpkgs-unstable";
    flake-utils.url = "github:numtide/flake-utils";
  };

  outputs = { self, nixpkgs, flake-utils }:
    flake-utils.lib.eachDefaultSystem (system:
      let
        pkgs = nixpkgs.legacyPackages.${system};
      in {
        devShells.default = pkgs.mkShell {
          packages = with pkgs; [
            # JavaScript / frontend
            nodejs_20
            nodePackages.npm

            # Python — scripts use uv for packages, nix provides the runtime
            python312

            # uv — fast Python package manager
            uv

            # Playwright system dependencies (Linux only; macOS uses system libs)
            # On macOS Chromium downloads its own libs via `playwright install`
          ] ++ pkgs.lib.optionals pkgs.stdenv.isLinux [
            # Playwright browser system deps on Linux
            at-spi2-atk
            atkmm
            cairo
            cups
            dbus
            expat
            fontconfig
            freetype
            gdk-pixbuf
            glib
            gtk3
            libdrm
            libxkbcommon
            mesa
            nspr
            nss
            pango
            xorg.libX11
            xorg.libXcomposite
            xorg.libXdamage
            xorg.libXext
            xorg.libXfixes
            xorg.libXrandr
            xorg.libxcb
            xorg.libXcursor
            xorg.libXi
          ];

          shellHook = ''
            echo "DanskPrep dev environment"
            echo "  Node:   $(node --version)"
            echo "  Python: $(python3.12 --version)"
            echo "  uv:     $(uv --version)"
            echo ""
            echo "First time setup:"
            echo "  cd scripts && uv venv --python 3.12 .venv && uv sync"
            echo "  uv run playwright install chromium"
          '';
        };
      }
    );
}
