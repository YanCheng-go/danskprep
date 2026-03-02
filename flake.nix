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
            nodejs_20      # Frontend runtime (npm bundled)
            python312      # Script runtime
            uv             # Python package manager
            supabase-cli   # DB migrations + type generation
            # Linux users running Playwright scrapers: add system deps here
            # e.g. at-spi2-atk, cups, cairo, pango, nss, etc.
          ];

          shellHook = ''
            echo "DanskPrep dev environment"
            echo "  Node:     $(node --version)"
            echo "  Python:   $(python3.12 --version)"
            echo "  uv:       $(uv --version)"
            echo "  Supabase: $(supabase --version)"
          '';
        };
      }
    );
}
