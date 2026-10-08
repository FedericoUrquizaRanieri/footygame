"""Descarga el dataset abierto (CC0) dcaribou/transfermarkt-datasets a data/raw/.

Uso: python scripts/spike/download.py
Tamaño aproximado: 210 MB.
"""
import os
import urllib.request

URL = "https://pub-e682421888d945d684bcae8890b0ec20.r2.dev/data/transfermarkt-datasets.duckdb"
DEST = os.path.join(os.path.dirname(__file__), "..", "..", "data", "raw", "transfermarkt-datasets.duckdb")


def main() -> None:
    dest = os.path.abspath(DEST)
    if os.path.exists(dest):
        print(f"Ya existe: {dest}")
        return
    os.makedirs(os.path.dirname(dest), exist_ok=True)
    print(f"Descargando {URL} ...")
    urllib.request.urlretrieve(URL, dest)
    print(f"Listo: {dest} ({os.path.getsize(dest) / 1e6:.0f} MB)")


if __name__ == "__main__":
    main()
