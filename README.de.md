[English](README.md) · **Deutsch**

# Klaro

<p align="center">
  <img src="klaro.png" alt="Klaro" width="120" />
</p>

Eine persönliche Web-App zum Verwalten von Verträgen — Abonnements, Versicherungen, Wohnen, Nebenkosten und mehr. Behalte einen sofortigen Überblick über deine monatlichen Ausgaben und verpasse keine anstehenden Verlängerungen.

## Funktionen

- **Dashboard** — gesamte monatliche Ausgaben aktiver Verträge, Aufschlüsselung nach Kategorie, anstehende Verlängerungen (innerhalb von 30 Tagen) und abgelaufene Verträge
- **Vertragsliste** — kompakte, sortierbare Tabelle mit Anbieter-Logos und Kategorie-Icons; lange Namen werden mit einem Auslassungszeichen (…) gekürzt; Aktionsschaltflächen entsprechen dem Stil der Konto-Verwaltungsseite
- **Erstellen / Bearbeiten / Löschen** von Verträgen mit Feldern für Name, Kategorie, Betrag (mit statischem EUR-Währungsbadge), Abrechnungsintervall, Status, Start-/Enddatum (Datumsauswahl mit optionaler Abwahl), Service-URL, Kündigungsfrist, Notizen und einem vertragsspezifischen Anonymisierungsschalter; das Formular verwendet ein kompaktes mehrspaltiges Layout (Name+Kategorie, Betrag+Intervall sowie Status+Start+Ende teilen sich jeweils eine Zeile), das auf mobilen Geräten zu einer einspaltigen Ansicht wechselt
- **Export** — alle Verträge als JSON oder Excel (.xlsx) herunterladen
- **Import** — JSON oder Excel hochladen mit intelligenter Spaltenzuordnung
- **Anonymisierung** — echte Vertragsnamen global oder pro Vertrag mit deterministischen Fantasienamen verbergen
- **Lokalisierung** — Englisch und Deutsch mit gebietsschemaabhängiger Währungs- und Datumsformatierung
- **Mehrbenutzer-Konten** — jedes Familienmitglied meldet sich mit einem eigenen Konto an; Verträge, Dashboards, Exporte und Importe sind pro Konto getrennt; Administratoren können andere Konten erstellen, archivieren, reaktivieren, löschen und deren Rollen verwalten
- **E-Mail-Einladungen** — Administratoren laden neue Benutzer per E-Mail über ein integriertes Einladefeld im Abschnitt „Ausstehende Einladungen" ein; die Einladungstabelle direkt darunter zeigt ausstehende, angenommene und abgelaufene Einladungen und ermöglicht das erneute Versenden und Widerrufen
- **Kontoeinstellungen** — die Seite „Mein Konto" ist in zwei Bereiche unterteilt: **E-Mail-Einstellungen** (Zusammenfassungs-E-Mail und E-Mail-Sprache) und **Konto** (Anzeigename, E-Mail-Adressänderung, Passwort und Kontolöschung)
- **E-Mail-Benachrichtigungen** — transaktionale E-Mails für wichtige Ereignisse: E-Mail-Änderungsverifizierung, E-Mail-Änderungsbestätigung und Passwortänderungsbenachrichtigung; Administratoren können über das Admin-Panel eine Test-E-Mail versenden, um die SMTP-Verbindung zu prüfen
- **Konto löschen** — Benutzer können ihr eigenes Konto und alle zugehörigen Verträge dauerhaft löschen; ein "Gefahrenbereich" auf der Kontoeinstellungsseite führt durch den Prozess; ein Modal bietet einen optionalen JSON-Export vor der Bestätigung; alleinige Administratoren werden blockiert, bis ein weiterer Administrator existiert
- **Passwort vergessen** — Benutzer können einen Link zum Zurücksetzen des Passworts per E-Mail anfordern; der Link läuft nach 1 Stunde ab und ist nur einmal gültig; der Ablauf verhindert E-Mail-Aufzählung durch eine generische Erfolgsmeldung unabhängig von der Gültigkeit der E-Mail-Adresse
- **Zusammenfassungs-E-Mail** — Benutzer können eine wöchentliche (jeden Montag) oder monatliche (1. des Monats) Vertragszusammenfassung per E-Mail abonnieren, die um 10:00 UTC zugestellt wird; die E-Mail enthält die monatlichen Gesamtausgaben, eine Aufschlüsselung pro Vertrag, bevorstehende Verlängerungen, einen Dashboard-Link und einen kontextsensitiven Handlungsaufruf; Einstellungen werden in den Kontoeinstellungen verwaltet, die auch den nächsten geplanten Sendezeitpunkt anzeigen; anonymisierte Vertragsnamen werden in der E-Mail verborgen
- **E-Mail-Spracheinstellung** — Benutzer können die Sprache für alle ausgehenden E-Mails (Verifizierung, Passwortzurücksetzung, Zusammenfassung usw.) unabhängig von ihrer Browser-/UI-Sprache festlegen; die Einstellung wird in den Kontoeinstellungen unter „E-Mail-Sprache" vorgenommen; unterstützte Sprachen sind Englisch und Deutsch; Datums- und Währungsangaben in E-Mails werden entsprechend dem gewählten Gebietsschema formatiert
- **Toast-Benachrichtigungen** — Erfolgs- und Fehlermeldungen auf angemeldeten Seiten (Kontoeinstellungen, Admin-Panel, Vertragsverwaltung) erscheinen als automatisch ausgeblendete Toast-Benachrichtigungen in der oberen rechten Ecke; öffentliche Seiten behalten die direkte Anzeige von Rückmeldungen bei
- **FAQ** — eine eigene FAQ-Seite, die über die Seitennavigation erreichbar ist; zeigt Fragen und Antworten in einem Akkordeon-Layout neben einer dekorativen Illustration; die Inhalte werden über die i18n-Übersetzungsdateien verwaltet (keine Code-Änderungen nötig, um Fragen oder Antworten zu aktualisieren); vollständig auf Englisch und Deutsch lokalisiert

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

- Node.js 24+
- pnpm 10+

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

Die App wird als Docker-Image unter [`walefish/klaro`](https://hub.docker.com/r/walefish/klaro) auf Docker Hub veröffentlicht. Sie lässt sich auf jedem Rechner mit Docker selbst hosten — ohne Quellcode-Checkout.

**Voraussetzungen**: [Docker](https://docs.docker.com/get-docker/) und Docker Compose (in Docker Desktop enthalten / `docker compose`).

```bash
# Aktuelles Image herunterladen und App starten
docker compose pull
docker compose up -d
```

Die App ist anschließend unter **http://localhost:3001** erreichbar. Die SQLite-Datenbank wird unter `./data/contracts.db` auf dem Host gespeichert und übersteht somit Container-Neustarts und -Neuerstellungen.

Beim ersten Start mit einer frischen Datenbank werden die E-Mail-Adresse und ein Einmal-Passwort des Administrator-Kontos in den Container-Logs ausgegeben — führe `docker compose logs` aus, melde dich an und ändere das Passwort sofort.

**Host-Port ändern**: die Zeile `ports:` in `docker-compose.yml` bearbeiten — nur die linke Seite (Host-Port) muss geändert werden, z. B. macht `"9090:3000"` die App unter Port 9090 erreichbar.

**Speicherort der Datenbank ändern**: die Zeile `volumes:` in `docker-compose.yml` auf ein beliebiges Host-Verzeichnis anpassen, z. B. `/mnt/storage/pcm-data:/data`.

**Anbieter-Logos aktivieren**: Die App ruft Logo-Bilder über das eigene Backend ab, sodass der Token serverseitig bleibt. `LOGO_DEV_TOKEN` in `docker-compose.yml` auskommentieren und mit einem Token von [logo.dev](https://logo.dev) befüllen:

```yaml
environment:
  LOGO_DEV_TOKEN: pk_dein_token_hier
```

Ohne diesen Token funktioniert die App normal — statt Anbieter-Logos wird ein generisches Symbol angezeigt.

**Auf eine neuere Version aktualisieren**: `docker compose pull && docker compose up -d` ausführen — Docker lädt das neue `latest`-Image und startet den Container neu. Die Daten bleiben dabei unberührt.

## Releases

Releases folgen [Conventional Commits](https://www.conventionalcommits.org/) und [Semantic Versioning](https://semver.org/). Jedes Release erzeugt:

- einen Versions-Bump in `package.json`
- einen neuen Eintrag in `CHANGELOG.md`
- einen Git-Tag `vX.Y.Z`
- ein Docker-Image auf `walefish/klaro` mit den Tags `latest` und `vX.Y.Z`

**Für Maintainer** — um ein Release zu erstellen, den `/release`-Skill von Claude Code aufrufen:

```
/release
```

Der Skill führt durch eine Dry-Run-Vorschau, fordert eine Bestätigung an, führt `pnpm run release` aus, verifiziert das Ergebnis und generiert formatierte GitHub-Release-Notizen. Nach der Bestätigung `git push --follow-tags` ausführen, um den Tag zu veröffentlichen und den Docker-CI-Workflow automatisch auszulösen.

## Datenbankskripte

```bash
pnpm --filter backend db:migrate   # Schema anwenden
pnpm --filter backend db:seed      # Beispielverträge laden
pnpm --filter backend db:reset     # Schema löschen und neu erstellen
```

## Entwicklungsworkflow

Features werden mit [Spec Kit](https://github.com/specstory/spec-kit) nach dem Ablauf Spec → Plan → Tasks → Implementierung entwickelt. Jedes Feature lebt auf einem eigenen Branch und wird über einen Pull Request nach bestandener CI in `main` gemergt.
