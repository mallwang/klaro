[English](user-guide.md) · **Deutsch**

# Benutzerhandbuch

<p align="center">
  <img src="../klaro.png" alt="Klaro" width="120" />
</p>

Klaro ist eine lokale Web-App, die alle deine Verträge — Streaming-Dienste, Versicherungspolicen, Handyverträge, Miete, Nebenkosten — an einem Ort zusammenführt. Sie zeigt dir, was du monatlich ausgibst, warnt dich vor automatischen Verlängerungen und informiert dich, wenn Verträge bereits abgelaufen sind.

## Inhaltsverzeichnis

1. [Orientierung](#1-orientierung)
2. [Dashboard](#2-dashboard)
3. [Vertragsliste](#3-vertragsliste)
4. [Vertrag hinzufügen](#4-vertrag-hinzufügen)
5. [Bearbeiten und Löschen](#5-bearbeiten-und-löschen)
6. [Verträge importieren](#6-verträge-importieren)
7. [Verträge exportieren](#7-verträge-exportieren)
8. [Anonymisierung](#8-anonymisierung)
9. [Sprache](#9-sprache)
10. [Konten & Anmeldung](#10-konten--anmeldung)
11. [Zusammenfassungs-E-Mail](#11-zusammenfassungs-e-mail)
12. [E-Mail-Sprache](#12-e-mail-sprache)
13. [Feldreferenz](#13-feldreferenz)

---

## 1. Orientierung

Die App hat eine dauerhaft sichtbare Navigationsleiste auf der linken Seite. Sie ist in zwei Bereiche unterteilt:

**App** — für jeden angemeldeten Benutzer verfügbar:

| Seite | URL | Zweck |
|-------|-----|-------|
| Dashboard | `/` | Ausgabenübersicht, Verlängerungen, abgelaufene Verträge |
| Verträge | `/contracts` | Vollständige Liste; Erstellen, Importieren, Exportieren |
| Mein Konto | `/account` | Anzeigename, E-Mail, Passwort, Konto löschen |

**Admin** — nur für Administratoren sichtbar:

| Seite | URL | Zweck |
|-------|-----|-------|
| Konten | `/admin/accounts` | Benutzer einladen, Konten verwalten |

Die Schaltfläche **Abmelden** befindet sich am unteren Rand der Seitenleiste. Dein Anzeigename und deine Rolle (Administrator / Mitglied) werden direkt darüber angezeigt.

### Rückmeldungen

Erfolgs- und Fehlermeldungen auf angemeldeten Seiten (Kontoeinstellungen, Verwaltung, Vertragsverwaltung) erscheinen als **Toast-Benachrichtigungen** in der oberen rechten Ecke des Bildschirms. Jede Benachrichtigung wird nach 5 Sekunden automatisch ausgeblendet. Öffentliche Seiten (Anmeldung, Passwort zurücksetzen, Einladungsannahme) zeigen Rückmeldungen weiterhin direkt auf der Seite an.

---

## 2. Dashboard

Das Dashboard öffnet sich beim Start der App und gibt dir eine Momentaufnahme deiner aktuellen Situation.

### Monatliche Ausgaben

Die große Zahl oben ist die Summe aller **aktiven** Verträge, umgerechnet auf einen monatlichen Betrag:

| Abrechnungsintervall | Umrechnung |
|---------------------|-----------|
| Wöchentlich | × 52 ÷ 12 |
| Monatlich | × 1 |
| Vierteljährlich | ÷ 3 |
| Jährlich | ÷ 12 |
| Einmalig (Lifetime) | nicht enthalten |

**Beispiel:** Du hast Netflix für 12,99 €/Monat und ein Jahres-Fitnessstudio-Abo für 240 €/Jahr. Das Dashboard zeigt 12,99 € + (240 € ÷ 12) = **32,99 €/Monat**.

### Aufschlüsselung nach Kategorie

Eine Tabelle darunter gruppiert deine aktiven Verträge nach Kategorie und zeigt die monatlichen Ausgaben je Kategorie, sortiert nach Höhe (absteigend).

### Anstehende Verlängerungen

Alle Verträge, deren Enddatum innerhalb der nächsten 30 Tage liegt, erscheinen hier. Jede Zeile zeigt:

- Vertragsname
- Enddatum
- **Kündigungsfrist** — der letzte Tag, an dem du kündigen kannst, ohne für eine weitere Periode gebunden zu sein (Enddatum minus eingestellte Kündigungsfrist)
- Verbleibende Tage, farblich kodiert:
  - **Rot** — Frist bereits abgelaufen
  - **Gelb** — 7 Tage oder weniger verbleibend
  - **Grau** — mehr als 7 Tage verbleibend

**Beispiel:** Dein Mobilfunkvertrag endet am 30. Juni mit einer Kündigungsfrist von 14 Tagen. Die angezeigte Kündigungsfrist ist der 16. Juni. Ist heute der 18. Juni, wird die Zeile rot.

### Abgelaufene Verträge

Verträge, deren Enddatum in der Vergangenheit liegt, erscheinen in einem gelb hervorgehobenen Bereich. Es wird angezeigt, wie viele Tage jeder Vertrag überfällig ist. Klicke auf eine Zeile, um direkt zur Bearbeitungsseite zu gelangen.

---

## 3. Vertragsliste

Öffne **Verträge** über die Navigation, um alle Verträge in einer Tabelle zu sehen.

### Sortierung

Klicke auf eine Spaltenüberschrift, um nach dieser Spalte zu sortieren. Ein weiterer Klick kehrt die Reihenfolge um. Ein dritter Klick hebt die Sortierung auf. Die aktive Sortierrichtung wird mit einem kleinen Pfeil nach oben oder unten angezeigt.

Verfügbare Sortierspalten: Name, Kategorie, Betrag, Status, Enddatum.

### Werkzeugleiste

Die Schaltflächenleiste über der Tabelle enthält:

| Steuerung | Funktion |
|-----------|---------|
| Anonymisierung ein/aus | Verbirgt echte Namen (siehe [Anonymisierung](#8-anonymisierung)) |
| Export | Lädt alle Verträge als JSON oder Excel herunter |
| Import | Öffnet den Import-Assistenten |
| Vertrag hinzufügen | Öffnet das Erstellungsformular |

---

## 4. Vertrag hinzufügen

Klicke auf **Vertrag hinzufügen** in der Vertragsliste. Fülle das Formular aus und klicke auf **Speichern**.

### Formularlayout

Das Formular verwendet ein kompaktes mehrspaltiges Layout, um Scrollen zu reduzieren:

| Zeile | Felder |
|-------|--------|
| Zeile 1 | Name · Kategorie |
| Zeile 2 | Betrag · Abrechnungsintervall |
| Zeile 3 | Status · Startdatum · Enddatum |
| Zeile 4 (linke Hälfte) | Kündigungsfrist |

Auf schmalen Bildschirmen (Smartphones) wechselt das Layout zu einer einspaltigen Ansicht und alle Felder werden untereinander angezeigt.

### Minimales Beispiel — Streaming-Abo

| Feld | Wert |
|------|------|
| Name | Netflix |
| Kategorie | Abonnements |
| Betrag | 12,99 |
| Abrechnungsintervall | Monatlich |

Das ist alles, was du brauchst. Die vier Felder oben sind Pflichtfelder; alles andere ist optional.

### Ausführlicheres Beispiel — Versicherungspolice

| Feld | Wert |
|------|------|
| Name | Hausratversicherung |
| Kategorie | Versicherung |
| Betrag | 180,00 |
| Abrechnungsintervall | Jährlich |
| Status | Aktiv |
| Startdatum | 2024-03-01 |
| Enddatum | 2025-03-01 |
| Kündigungsfrist | 4 Wochen |
| Service-URL | https://meinversicherer.example.com/konto |
| Details | Versicherungsschein-Nr.: INS-4821. Deckung bis 50.000 €. |
| Anonymisieren | aus |

Mit diesen Angaben warnt dich das Dashboard ab dem 1. Februar (28 Tage vor dem 1. März), dass Handlungsbedarf besteht.

### Hinweise zu den Feldern

- **Status** ist standardmäßig Aktiv. Setze ihn auf Inaktiv für Verträge, die du bereits gekündigt hast, aber zur Referenz behalten möchtest.
- **Kündigungsfrist** erfordert sowohl eine Zahl als auch eine Einheit (Tage / Wochen / Monate / Jahre). Lässt du sie leer, gilt das Enddatum selbst als Frist.
- **Service-URL** muss eine gültige URL sein, wenn angegeben. Sie ist in der Tabelle nicht anklickbar, kann aber bequem aus dem Bearbeitungsformular kopiert werden.
- **Details** akzeptiert bis zu 2.000 Zeichen. Ein Zähler erscheint, wenn du dich dem Limit näherst.
- **Anonymisieren** — aktiviere diese Option, um den Namen dieses Vertrags immer zu verbergen, unabhängig vom globalen Schalter.

---

## 5. Bearbeiten und Löschen

### Bearbeiten

Klicke auf den **Bearbeiten**-Link in einer Vertragszeile, um das Bearbeitungsformular zu öffnen. Alle Felder sind vorausgefüllt. Nimm deine Änderungen vor und klicke auf **Änderungen speichern**.

### Löschen

Klicke auf **Löschen** in einer Vertragszeile. Die Schaltfläche wechselt zu **Bestätigen** und **Abbrechen** — klicke auf **Bestätigen**, um den Vertrag dauerhaft zu entfernen, oder auf **Abbrechen**, um den Vorgang abzubrechen.

---

## 6. Verträge importieren

Klicke auf **Import** in der Werkzeugleiste der Vertragsliste. Der Assistent hat fünf Schritte.

### Schritt 1 — Hochladen

Ziehe eine Datei in den Upload-Bereich oder klicke, um zu durchsuchen. Unterstützte Formate:

- **JSON** — ein Array von Objekten, z. B. aus diesem App-Export
- **Excel (.xlsx)** — ein Tabellenblatt mit einer Kopfzeile

Maximale Dateigröße: 5 MB.

### Schritt 2 — Einlesen

Die App liest die Datei und erkennt die Spalten automatisch.

### Schritt 3 — Spalten zuordnen

Jede Spalte aus deiner Datei wird einem Feld in der App zugeordnet. Die App erkennt gängige Synonyme und ordnet sie automatisch zu:

| Wenn deine Spalte heißt… | Wird zugeordnet zu |
|--------------------------|-------------------|
| Service Name, Titel, Bezeichnung | Name |
| Monatliche Kosten, Gebühr, Preis | Betrag |
| Abrechnungsrhythmus, Zahlungszyklus | Abrechnungsintervall |
| Ablauf, Ablaufdatum, Verlängerungsdatum | Enddatum |
| Notizen, Beschreibung, Kommentare | Details |
| Webseite, Link, Homepage | Service-URL |

Pflichtfelder sind mit einem `*` markiert. Ist ein Pflichtfeld nicht zugeordnet, wird die Zeile rot hervorgehoben und muss vor dem Import behoben werden. Optionale Spalten können explizit übersprungen werden.

### Schritt 4 — Importieren

Die App erstellt für jede Zeile einen Vertrag. Zeilen, die die Validierung nicht bestehen (z. B. ungültiger Kategorienwert), werden übersprungen und einzeln gemeldet.

### Schritt 5 — Ergebnis

Eine Zusammenfassung zeigt, wie viele Verträge erstellt wurden und wie viele fehlgeschlagen sind, mit einer zeilenspezifischen Fehlermeldung für Misserfolge. Teilimporte sind möglich — erfolgreich geparste Zeilen werden gespeichert, auch wenn andere fehlschlagen.

### Beispiel-JSON-Datei

```json
[
  {
    "name": "Spotify",
    "category": "SUBSCRIPTIONS",
    "amount": 9.99,
    "billingInterval": "MONTHLY",
    "status": "ACTIVE",
    "endDate": "2025-12-31"
  },
  {
    "name": "Kfz-Versicherung",
    "category": "INSURANCE",
    "amount": 420.00,
    "billingInterval": "YEARLY",
    "startDate": "2025-01-01",
    "endDate": "2026-01-01",
    "cancellationPeriod": { "value": 1, "unit": "MONTHS" }
  }
]
```

Gültige Kategoriewerte: `UTILITIES`, `SUBSCRIPTIONS`, `INSURANCE`, `HOUSING`, `OTHER`

Gültige Abrechnungsintervalle: `WEEKLY`, `MONTHLY`, `QUARTERLY`, `YEARLY`, `LIFETIME`

---

## 7. Verträge exportieren

Klicke auf **Export** in der Werkzeugleiste der Vertragsliste und wähle ein Format.

| Format | Dateiname | Verwendungszweck |
|--------|-----------|-----------------|
| JSON | `contracts-JJJJ-MM-TT.json` | Backup, Reimport, Skripting |
| Excel | `contracts-JJJJ-MM-TT.xlsx` | Tabellenbearbeitung, Weitergabe |

Der Export enthält alle Verträge einschließlich inaktiver. Alle Felder sind enthalten. Der JSON-Export kann direkt wieder in den Import-Assistenten eingelesen werden, ohne Spaltenzuordnung vornehmen zu müssen.

---

## 8. Anonymisierung

Die Anonymisierungsfunktion ersetzt echte Vertragsnamen durch fiktive Firmennamen, sodass du deinen Bildschirm teilen oder Screenshots machen kannst, ohne preiszugeben, welche Dienste du nutzt.

### Globaler Schalter

Klicke auf **Anonymisierung** in der Werkzeugleiste der Vertragsliste. Die Schaltfläche wechselt zwischen:

- **Namen verbergen** — Anonymisierung ist aktiv; echte Namen werden überall ausgeblendet
- **Namen anzeigen** — Anonymisierung ist deaktiviert; echte Namen werden angezeigt

Die Einstellung wird in deinem Browser gespeichert und bleibt über Seitenneuladen hinweg erhalten.

### Einzelvertrag-Flag

Aktiviere das Kontrollkästchen **Anonymisieren** beim Erstellen oder Bearbeiten eines Vertrags, um diesen bestimmten Vertrag immer zu verbergen, auch wenn der globale Schalter deaktiviert ist. Nützlich für besonders sensible Verträge.

### Funktionsweise der Ersetzung

Jeder Vertrag wird anhand seiner internen ID konsistent auf denselben fiktiven Namen abgebildet (z. B. „Aether Dynamics", „Ironveil Corp", „Starfall Industries"). Derselbe Vertrag erhält immer denselben Alias — die Zuordnung ändert sich nie zwischen Sitzungen.

Beträge, Daten, Kategorien und Statuswerte sind unabhängig von der Anonymisierungseinstellung immer sichtbar.

---

## 9. Sprache

Die App unterstützt **Englisch** und **Deutsch**. Verwende die Schaltflächen `EN` / `DE` in der oberen rechten Ecke jeder Seite zum Wechseln. Die Einstellung wird in deinem Browser gespeichert.

Währungsbeträge und Datumsangaben werden entsprechend dem gewählten Gebietsschema formatiert (z. B. `€15,99` und `01.03.2025` auf Deutsch).

---

## 10. Konten & Anmeldung

Jeder Besucher muss sich anmelden. Verträge, Dashboards, Exporte und Importe sind auf das angemeldete Konto beschränkt — niemand kann die Verträge eines anderen Kontos sehen oder ändern.

### An- und Abmelden

Wenn du die App öffnest und keine aktive Sitzung hast, landest du auf der Anmeldeseite. Gib deine E-Mail-Adresse und dein Passwort ein, um fortzufahren. Über die Schaltfläche **Abmelden** am unteren Rand der Seitenleiste beendest du deine Sitzung auf diesem Gerät.

Wenn du zu oft hintereinander das falsche Passwort eingibst, wird das Konto vorübergehend gesperrt — warte ein paar Minuten und versuche es dann erneut mit dem richtigen Passwort.

### Passwort vergessen

Wenn du dein Passwort vergessen hast, klicke auf den Link **Passwort vergessen?** unter dem Anmeldeformular. Gib deine E-Mail-Adresse ein und klicke auf **Link zum Zurücksetzen senden**. Die App zeigt immer eine generische Erfolgsmeldung („Wenn ein Konto mit dieser E-Mail existiert, wurde ein Link zum Zurücksetzen des Passworts gesendet."), unabhängig davon, ob die E-Mail-Adresse registriert ist — dies verhindert, dass Angreifer herausfinden können, welche E-Mail-Adressen im System sind.

Prüfe deinen Posteingang auf eine E-Mail mit einem Zurücksetzungslink. Klicke auf den Link, um die Seite **Neues Passwort festlegen** zu öffnen. Gib ein neues Passwort ein (mindestens 8 Zeichen) und bestätige es, dann klicke auf **Passwort zurücksetzen**. Du wirst automatisch angemeldet und zum Dashboard weitergeleitet. Der Link läuft nach 1 Stunde ab und kann nur einmal verwendet werden. Wenn du einen weiteren Zurücksetzungslink anforderst, werden alle vorherigen Links ungültig.

### Das erste Konto

Beim allerersten Start der App auf einer frischen Installation wird automatisch ein **Administratorkonto** angelegt; dessen E-Mail-Adresse und ein Einmalpasswort werden im Server-Log ausgegeben (sichtbar mit `docker compose logs` oder im Terminal, in dem das Backend läuft). Melde dich mit diesen Zugangsdaten an und **ändere das Passwort sofort** über „Mein Konto".

Falls du von einer älteren Version der App aktualisierst, wird genau dieses Administratorkonto angelegt und **alle deine bestehenden Verträge werden automatisch diesem Konto zugewiesen** — nichts geht verloren.

### Mein Konto

Öffne **Mein Konto** über die Seitenleiste, um dein eigenes Profil zu verwalten. Die Seite ist in zwei Bereiche unterteilt:

#### E-Mail-Einstellungen

**Zusammenfassungs-E-Mail** — abonniere eine regelmäßige Vertragszusammenfassung per E-Mail. Weitere Details unter [Zusammenfassungs-E-Mail](#11-zusammenfassungs-e-mail).

**E-Mail-Sprache** — wähle die Sprache für alle ausgehenden E-Mails. Weitere Details unter [E-Mail-Sprache](#12-e-mail-sprache).

#### Konto

**Anzeigename** — ändere den Namen, der in der Seitenleiste und auf der Kontoverwaltungsseite angezeigt wird. Gib einen neuen Namen ein und klicke auf **Speichern**.

**E-Mail-Adresse** — deine aktuelle Adresse wird angezeigt. Um sie zu ändern, gib die neue Adresse ein und klicke auf **Änderung beantragen**. Die App sendet einen Bestätigungslink an die neue Adresse; klicke darauf, um die Änderung zu bestätigen. Bis zur Bestätigung bleibt deine alte Adresse aktiv, und auf dieser Seite wird ein Hinweis angezeigt. Du kannst jederzeit einen neuen Link anfordern, indem du das Formular erneut absendest.

**Passwort** — gib dein aktuelles Passwort und ein neues ein (mindestens 8 Zeichen) und klicke auf **Passwort ändern**.

### E-Mail-Benachrichtigungen

Die App sendet transaktionale E-Mails bei sicherheitsrelevanten Ereignissen:

| Ereignis | Empfänger |
|----------|----------|
| E-Mail-Adressänderung beantragt | Bestätigungslink an die **neue** Adresse |
| E-Mail-Adressänderung bestätigt | Bestätigung an die **neue** Adresse |
| Passwort geändert | Benachrichtigung an die **aktuelle** Adresse |
| Einladung zum Beitritt | Einladungslink an die **eingeladene** Adresse |

### Konto löschen

Öffne **Mein Konto** und scrolle zum Bereich **Gefahrenzone** am unteren Ende. Klicke auf **Konto löschen**, um den Löschdialog zu öffnen. Der Dialog führt dich durch zwei Schritte:

1. **Export (optional)** — wenn du Verträge hast, kannst du sie per Schaltfläche als JSON herunterladen, bevor du fortfährst. Klicke auf **Überspringen**, wenn du kein Backup benötigst.
2. **Bestätigen** — klicke auf **Konto löschen**, um dein Konto und alle zugehörigen Verträge dauerhaft zu entfernen. Dieser Vorgang kann nicht rückgängig gemacht werden.

> **Alleiniger Administrator**: Bist du der einzige aktive Administrator, ist die Bestätigungsschaltfläche deaktiviert. Du musst zunächst ein anderes Mitglied zum Administrator befördern oder einen anderen Administrator darum bitten.

### Neue Mitglieder einladen (nur Administratoren)

Um jemanden zum Haushalt hinzuzufügen, öffne **Konten** im Admin-Bereich der Seitenleiste und gib die E-Mail-Adresse der Person in das **Einladen**-Formular ein, dann klicke auf **Einladung senden**. Die App schickt der Person einen Link, über den sie ihr eigenes Passwort festlegen und sich anmelden kann. Die Einladung läuft nach 7 Tagen ab; du kannst sie jederzeit aus der Einladungstabelle heraus erneut senden.

Die Einladungstabelle unterhalb des Formulars zeigt alle bisherigen Einladungen und ihren Status:

| Status | Bedeutung |
|--------|----------|
| Ausstehend | Gesendet, noch nicht angenommen |
| Abgelaufen | Frist abgelaufen, bevor die Person angenommen hat |
| Angenommen | Die Person hat ihr Passwort festgelegt und sich angemeldet |
| Widerrufen | Du hast die Einladung zurückgezogen |

Für ausstehende und abgelaufene Einladungen stehen zwei Aktionen zur Verfügung: **Erneut senden** (sendet einen neuen Link) und **Widerrufen** (bricht die Einladung ab).

### Konten verwalten (nur Administratoren)

Die Kontentabelle auf der **Konten**-Seite listet alle Konten mit Anzeigename, E-Mail-Adresse, Rolle und Status auf. Verfügbare Aktionen:

- **Archivieren** — entzieht der Person den Zugriff. Archivierte Konten können sich nicht anmelden; ihre Verträge bleiben erhalten. Du kannst dies mit „Reaktivieren" rückgängig machen.
- **Reaktivieren** — stellt den Zugriff auf ein archiviertes Konto samt aller zugehörigen Verträge wieder her.
- **Zum Administrator machen / Zum Mitglied machen** — ändert die Rolle des Kontos.
- **Löschen** — entfernt ein archiviertes Konto und alle zugehörigen Daten dauerhaft. Dieser Vorgang kann nicht rückgängig gemacht werden. Nur für archivierte Konten verfügbar.

Die App stellt sicher, dass stets mindestens ein aktiver Administrator vorhanden ist. Archivieren, Zurückstufen und Löschen sind für den letzten verbliebenen Administrator deaktiviert, damit sich der Haushalt nie selbst aus der Kontoverwaltung aussperrt.

> **Hinweis**: Wenn ein Konto dauerhaft gelöscht wird, wird seine E-Mail-Adresse für eine erneute Verwendung freigegeben. Wurde die Adresse bereits einem neuen Konto zugewiesen (z. B. nach einer erneuten Einladung), zeigt der alte archivierte Eintrag „E-Mail neu vergeben" statt der Adresse, und „Reaktivieren" ist nicht mehr verfügbar.

### SMTP-Test (nur Administratoren)

Am oberen Rand der **Konten**-Seite befindet sich ein Bereich **Test-E-Mail senden**. Gib eine beliebige E-Mail-Adresse ein und klicke auf **Senden**, um zu prüfen, ob der ausgehende E-Mail-Versand korrekt konfiguriert ist. Nutze dies nach einer Änderung der SMTP-Einstellungen, um den Versand zu testen, bevor du Benutzer einlädst.

---

## 11. Zusammenfassungs-E-Mail

Die Funktion **Zusammenfassungs-E-Mail** ermöglicht es jedem Benutzer, sich für eine regelmäßige Vertragszusammenfassung per E-Mail anzumelden.

### Zusammenfassungs-E-Mail aktivieren

1. Gehe zu **Mein Konto** (`/account`).
2. Suche den Bereich **Zusammenfassungs-E-Mail**.
3. Aktiviere den Schalter **"Sende mir eine regelmäßige Vertragszusammenfassung per E-Mail"**.
4. Wähle eine Häufigkeit — **Wöchentlich** (jeden Montag um 10:00 UTC) oder **Monatlich** (1. des Monats um 10:00 UTC).
5. Klicke auf **Speichern**. Die Einstellungsseite zeigt den nächsten geplanten Sendezeitpunkt an.

### Zusammenfassungs-E-Mail deaktivieren

Deaktiviere den Schalter und klicke auf **Speichern**. Der nächste Sendezeitpunkt verschwindet und es werden keine weiteren E-Mails gesendet.

### Inhalt der E-Mail

- **Gesamte monatliche Ausgaben** — Summe aller aktiven Verträge, normiert auf einen monatlichen Kostenwert.
- **Aufschlüsselung pro Vertrag** — Name, Abrechnungsintervall und monatliches Äquivalent für jeden aktiven Vertrag.
- **Bevorstehende Verlängerungen** — Verträge, deren Enddatum innerhalb der nächsten 30 Tage liegt, sortiert nach Datum.
- **Dashboard-Link** — direkter Link zurück zur App.
- **Handlungsaufruf** — kontextsensitive Nachricht:
  - Wenn keine aktiven Verträge vorhanden sind: Aufforderung, den ersten Vertrag hinzuzufügen.
  - Wenn ein oder mehrere Verträge innerhalb ihrer Kündigungsfrist liegen: Erinnerung, diese vor Ablauf der Frist zu überprüfen.
  - Andernfalls: kein Handlungsaufruf.

### Anonymisierung in E-Mails

Vertragsnamen, die als **anonymisiert** markiert sind, werden in der Zusammenfassungs-E-Mail ausgeblendet (ersetzt durch `––––`), konsistent mit dem Anonymisierungsverhalten in der App.

### Sonderfälle

- **Keine Verträge**: Die E-Mail wird trotzdem gesendet; sie zeigt null Gesamtausgaben und eine leere Aufschlüsselung.
- **Häufigkeitsänderung**: Die nächste E-Mail folgt der neuen Häufigkeit ab dem nächsten geplanten Sendezeitpunkt — keine doppelten oder verpassten Sendungen.
- **SMTP nicht konfiguriert**: Der Scheduler wird nur gestartet, wenn SMTP-Zugangsdaten vorhanden sind. Ohne SMTP-Konfiguration werden keine Zusammenfassungs-E-Mails gesendet.

---

## 12. E-Mail-Sprache

Die Einstellung **E-Mail-Sprache** legt fest, in welcher Sprache alle E-Mails der App an dich verschickt werden — unabhängig von der im Browser eingestellten Sprache.

### E-Mail-Sprache festlegen

1. Gehe zu **Mein Konto** (`/account`).
2. Suche den Bereich **E-Mail-Sprache**.
3. Wähle **English** oder **Deutsch**.
4. Klicke auf **E-Mail-Sprache speichern**.

Alle nachfolgenden E-Mails — Bestätigungslinks, Passwortzurücksetzung, Zusammenfassungen und Benachrichtigungen — werden in der gewählten Sprache zugestellt. Datumsangaben und Beträge werden ebenfalls entsprechend des Gebietsschemas formatiert (z. B. deutsches Format DD.MM.JJJJ und Komma als Dezimaltrennzeichen).

### Standardwert

Neue Konten verwenden standardmäßig **Englisch**.

### Geltungsbereich

Die E-Mail-Sprache ist **unabhängig** von der Browser-/UI-Sprache. Das Ändern der Browsersprache hat keinen Einfluss auf die E-Mail-Sprache und umgekehrt.

### Neue Sprachen hinzufügen

E-Mail-Vorlagen müssen für jede Sprache vorhanden sein, die die UI unterstützt. Wenn eine neue UI-Sprache hinzugefügt wird, müssen gleichzeitig die entsprechenden E-Mail-Vorlagen erstellt werden — ein Vitest-CI-Test erzwingt dies und blockiert den Build, falls Vorlagen fehlen.

---

## 13. Feldreferenz

| Feld | Pflicht | Einschränkungen | Hinweise |
|------|---------|-----------------|---------|
| Name | Ja | 1–200 Zeichen | Wird mit Anbieter-Logo angezeigt |
| Kategorie | Ja | Nebenkosten, Abonnements, Versicherung, Wohnen, Sonstiges | Verwendet in der Dashboard-Aufschlüsselung |
| Betrag | Ja | Zahl ≥ 0 | In deiner lokalen Währung |
| Abrechnungsintervall | Ja | Wöchentlich / Monatlich / Vierteljährlich / Jährlich / Einmalig | Bestimmt das monatliche Äquivalent |
| Status | Ja | Aktiv / Inaktiv | Standard: Aktiv |
| Startdatum | Nein | JJJJ-MM-TT | Zur eigenen Referenz |
| Enddatum | Nein | JJJJ-MM-TT | Steuert Verlängerungs- und Ablaufbenachrichtigungen |
| Kündigungsfrist | Nein | Positive ganze Zahl + Tage/Wochen/Monate/Jahre | Verschiebt die im Dashboard angezeigte Frist |
| Service-URL | Nein | Gültige URL | Link zu deiner Kontoseite |
| Details | Nein | Bis zu 2.000 Zeichen | Versicherungsscheinnummern, Kundennummern, Notizen |
| Anonymisieren | Nein | Ja/Nein | Datenschutz-Flag pro Vertrag |
