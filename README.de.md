[English](README.md) · **Deutsch**

# Personal Contract Management

Eine persönliche Web-App zum Verwalten von Verträgen — Abonnements, Versicherungen, Wohnen, Nebenkosten und mehr. Behalte einen sofortigen Überblick über deine monatlichen Ausgaben und verpasse keine anstehenden Verlängerungen.

## Funktionen

- **Dashboard** — gesamte monatliche Ausgaben aktiver Verträge, Aufschlüsselung nach Kategorie, anstehende Verlängerungen (innerhalb von 30 Tagen) und abgelaufene Verträge
- **Vertragsliste** — sortierbare Tabelle mit Anbieter-Logos und Kategorie-Icons
- **Erstellen / Bearbeiten / Löschen** von Verträgen mit Feldern für Name, Kategorie, Betrag, Abrechnungsintervall, Status, Start-/Enddatum, Service-URL, Kündigungsfrist, Notizen und einem vertragsspezifischen Anonymisierungsschalter
- **Export** — alle Verträge als JSON oder Excel (.xlsx) herunterladen
- **Import** — JSON oder Excel hochladen mit intelligenter Spaltenzuordnung
- **Anonymisierung** — echte Vertragsnamen global oder pro Vertrag mit deterministischen Fantasienamen verbergen
- **Lokalisierung** — Englisch und Deutsch mit gebietsschemaabhängiger Währungs- und Datumsformatierung
- **Mehrbenutzer-Konten** — jedes Familienmitglied meldet sich mit einem eigenen Konto an; Verträge, Dashboards, Exporte und Importe sind pro Konto getrennt; Administratoren können andere Konten erstellen, archivieren, reaktivieren, löschen und deren Rollen verwalten
- **E-Mail-Einladungen** — Administratoren laden neue Benutzer per E-Mail ein; das Einladungs-Panel zeigt ausstehende, angenommene und abgelaufene Einladungen und ermöglicht das erneute Versenden und Widerrufen
- **Kontoeinstellungen** — Benutzer können ihren Anzeigenamen aktualisieren, eine E-Mail-Adressänderung beantragen (per Bestätigungslink verifiziert) und ihr Passwort über die Seite "Mein Konto" ändern
- **E-Mail-Benachrichtigungen** — transaktionale E-Mails für wichtige Ereignisse: E-Mail-Änderungsverifizierung, E-Mail-Änderungsbestätigung und Passwortänderungsbenachrichtigung; Administratoren können über das Admin-Panel eine Test-E-Mail versenden, um die SMTP-Verbindung zu prüfen
- **Konto löschen** — Benutzer können ihr eigenes Konto und alle zugehörigen Verträge dauerhaft löschen; ein "Gefahrenbereich" auf der Kontoeinstellungsseite führt durch den Prozess; ein Modal bietet einen optionalen JSON-Export vor der Bestätigung; alleinige Administratoren werden blockiert, bis ein weiterer Administrator existiert
- **Passwort vergessen** — Benutzer können einen Link zum Zurücksetzen des Passworts per E-Mail anfordern; der Link läuft nach 1 Stunde ab und ist nur einmal gültig; der Ablauf verhindert E-Mail-Aufzählung durch eine generische Erfolgsmeldung unabhängig von der Gültigkeit der E-Mail-Adresse
- **Toast-Benachrichtigungen** — Erfolgs- und Fehlermeldungen auf angemeldeten Seiten (Kontoeinstellungen, Admin-Panel, Vertragsverwaltung) erscheinen als automatisch ausgeblendete Toast-Benachrichtigungen in der oberen rechten Ecke; öffentliche Seiten behalten die direkte Anzeige von Rückmeldungen bei

Eine vollständige Anleitung zur Benutzeroberfläche findest du unter [docs/user-guide.de.md](docs/user-guide.de.md).

## Tech-Stack

| Schicht | Technologie |
|---------|-------------|
| Backend | Fastify + TypeScript + SQLite (better-sqlite3) |
| Frontend | React + TypeScript + Vite + TanStack Query |
| UI | Mantine 7 |
| Testing | Vitest (Unit + Integration), Playwright (E2E) |
| Monorepo | pnpm workspaces |

## Voraussetzungen

- Node.js 22+
- pnpm 9+

## Erste Schritte

```bash
# Abhängigkeiten installieren
pnpm install

# Datenbank einrichten und Beispieldaten laden
pnpm --filter backend db:migrate
pnpm --filter backend db:seed

# Beide Server starten
pnpm dev
```

Öffne [http://localhost:5173](http://localhost:5173).

Die Backend-API läuft unter [http://localhost:3000](http://localhost:3000).

### Anmeldung

Die App erfordert, dass sich jeder Besucher anmeldet. Bei einer frischen Datenbank erstellt `db:migrate` automatisch ein **Administrator**-Konto und gibt dessen E-Mail-Adresse sowie ein Einmal-Passwort in der Konsolenausgabe des Backends aus — melde dich mit diesen Daten an und ändere das Passwort sofort über "Mein Konto". `db:seed` legt zusätzlich zwei einsatzbereite Entwicklungskonten an: `admin@example.test` / `dev-admin-pass` (Administrator) und `member@example.test` / `dev-member-pass` (Mitglied). Details findest du unter [Konten & Anmeldung](docs/user-guide.de.md#10-konten--anmeldung) im Benutzerhandbuch.

## Tests ausführen

```bash
# Alle Unit- und Integrationstests
pnpm test

# End-to-End-Tests (laufende App erforderlich)
pnpm --filter frontend test:e2e
```

## Projektstruktur

```
packages/
├── shared/       # Gemeinsame TypeScript-Typen und Zod-Schemas
├── backend/      # Fastify-API-Server
│   ├── src/db/           # SQLite-Schema, Client, Migrationen, Seed
│   ├── src/routes/       # Route-Handler
│   └── src/services/     # Geschäftslogik
└── frontend/     # React + Vite SPA
    ├── src/components/   # UI-Komponenten
    ├── src/pages/        # Seitenkomponenten
    └── src/services/     # API-Hooks (TanStack Query)
```

## Bereitstellung

Die App lässt sich als einzelnes Docker-Image verpacken und selbst hosten, z. B. auf einem Homeserver.

**Voraussetzungen**: [Docker](https://docs.docker.com/get-docker/) und Docker Compose (in Docker Desktop enthalten / `docker compose`).

```bash
# Image bauen
docker build -t pcm .

# App starten (erstellt beim ersten Start auch ./data)
docker compose up -d
```

Die App ist anschließend unter **http://localhost:3001** erreichbar. Die SQLite-Datenbank wird unter `./data/contracts.db` auf dem Host gespeichert und übersteht somit Container-Neustarts und -Neuerstellungen.

Beim ersten Start mit einer frischen Datenbank werden die E-Mail-Adresse und ein Einmal-Passwort des Administrator-Kontos in den Container-Logs ausgegeben — führe `docker compose logs` aus, melde dich an und ändere das Passwort sofort.

**Host-Port ändern**: die Zeile `ports:` in `docker-compose.yml` bearbeiten — nur die linke Seite (Host-Port) muss geändert werden, z. B. macht `"9090:3000"` die App unter Port 9090 erreichbar.

**Speicherort der Datenbank ändern**: die Zeile `volumes:` in `docker-compose.yml` auf ein beliebiges Host-Verzeichnis anpassen, z. B. `/mnt/storage/pcm-data:/data`.

## Datenbankskripte

```bash
pnpm --filter backend db:migrate   # Schema anwenden
pnpm --filter backend db:seed      # Beispielverträge laden
pnpm --filter backend db:reset     # Schema löschen und neu erstellen
```

## Entwicklungsworkflow

Features werden mit [Spec Kit](https://github.com/specstory/spec-kit) nach dem Ablauf Spec → Plan → Tasks → Implementierung entwickelt. Jedes Feature lebt auf einem eigenen Branch und wird über einen Pull Request nach bestandener CI in `main` gemergt.
