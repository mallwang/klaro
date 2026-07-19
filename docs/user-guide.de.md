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
13. [Eine selbst gehostete Instanz aktualisieren](#13-eine-selbst-gehostete-instanz-aktualisieren)
14. [Feldreferenz](#14-feldreferenz)
15. [FAQ](#15-faq)
16. [Admin-Diagnose](#16-admin-diagnose)

---

## 1. Orientierung

Die App hat eine dauerhaft sichtbare Navigationsleiste auf der linken Seite. Sie ist in zwei Bereiche unterteilt:

**App** — für jeden angemeldeten Benutzer verfügbar:

| Seite | URL | Zweck |
|-------|-----|-------|
| Dashboard | `/` | Ausgabenübersicht, Verlängerungen, abgelaufene Verträge, inaktive Verträge |
| Verträge | `/contracts` | Vollständige Liste; Erstellen, Importieren, Exportieren |
| Mein Konto | `/account` | Anzeigename, E-Mail, Passwort, Konto löschen |
| FAQ | `/faq` | Häufig gestellte Fragen |

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

Aktive Verträge, deren Enddatum in der Vergangenheit liegt, erscheinen in einem gelb hervorgehobenen Bereich. Es wird angezeigt, wie viele Tage jeder Vertrag überfällig ist. Klicke auf eine Zeile, um direkt zur Bearbeitungsseite zu gelangen. Verträge mit dem Status **Inaktiv** erscheinen hier nie, auch nicht mit einem vergangenen Enddatum — siehe [Inaktive Verträge](#inaktive-verträge) unten.

### Inaktive Verträge

Verträge mit dem Status **Inaktiv** werden in einem separaten, grau dargestellten Bereich "Inaktive Verträge" unterhalb der abgelaufenen Verträge aus dem Fokus gehalten. Dieser Bereich ist standardmäßig eingeklappt und zeigt nur an, wie viele inaktive Verträge vorhanden sind; klicke auf die Überschrift, um ihn aufzuklappen und die vollständige Liste mit Links zu den jeweiligen Bearbeitungsseiten zu sehen. Hast du keine inaktiven Verträge, erscheint dieser Bereich gar nicht.

---

## 3. Vertragsliste

Öffne **Verträge** über die Navigation, um alle Verträge in einer Tabelle zu sehen.

Die Tabelle ist kompakt gestaltet – jede Zeile passt bei normaler Desktop-Breite in eine einzige Zeile. Vertragsbezeichnungen, die zu lang für die Spalte sind, werden mit einem Auslassungszeichen (…) gekürzt; der vollständige Name ist immer auf der Bearbeitungsseite sichtbar.

### Sortierung

Klicke auf eine Spaltenüberschrift, um nach dieser Spalte zu sortieren. Ein weiterer Klick kehrt die Reihenfolge um. Ein dritter Klick hebt die Sortierung auf. Die aktive Sortierrichtung wird mit einem kleinen Pfeil nach oben oder unten angezeigt.

Verfügbare Sortierspalten: Name, Kategorie, Betrag, Status, Enddatum.

### Zeilenaktionen

Jede Zeile hat zwei kompakte Aktionsschaltflächen:

| Schaltfläche | Funktion |
|--------------|---------|
| Bearbeiten | Öffnet das Bearbeitungsformular des Vertrags |
| Löschen | Zeigt eine Inline-Bestätigung; klicke auf **Bestätigen** zum Löschen oder auf **Abbrechen** |

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

- **Betrag** — gib eine Zahl ein; rechts neben dem Feld erscheint ein statisches **EUR**-Badge.
- **Startdatum / Enddatum** — ein Klick auf das Feld öffnet einen Datumsauswähler. Um ein bereits gesetztes Datum zu löschen, klicke auf das **×**-Symbol, das im Feld erscheint.
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

Wenn du die App öffnest und keine aktive Sitzung hast, landest du auf der Anmeldeseite. Die Seite zeigt ein zweispaltiges Layout: links ein dekoratives Bildfenster, rechts das Anmeldeformular (auf mobilen Geräten ist das Bildfenster ausgeblendet und das Formular nimmt die volle Breite ein). Gib deine E-Mail-Adresse und dein Passwort ein und klicke auf **Anmelden**, um fortzufahren. Über die Schaltfläche **Abmelden** am unteren Rand der Seitenleiste beendest du deine Sitzung auf diesem Gerät.

Wenn du zu oft hintereinander das falsche Passwort eingibst, wird das Konto vorübergehend gesperrt — warte ein paar Minuten und versuche es dann erneut mit dem richtigen Passwort.

### Passwort vergessen

Wenn du dein Passwort vergessen hast, klicke auf den Link **Passwort vergessen?** unter dem Anmeldeformular. Die Seite wechselt zum Formular „Passwort vergessen" — noch innerhalb desselben zweispaltigen Layouts — ohne die Seite neu zu laden. Gib deine E-Mail-Adresse ein und klicke auf **Link zum Zurücksetzen senden**. Die App zeigt immer eine generische Erfolgsmeldung („Wenn ein Konto mit dieser E-Mail existiert, wurde ein Link zum Zurücksetzen des Passworts gesendet."), unabhängig davon, ob die E-Mail-Adresse registriert ist — dies verhindert, dass Angreifer herausfinden können, welche E-Mail-Adressen im System sind.

Prüfe deinen Posteingang auf eine E-Mail mit einem Zurücksetzungslink. Klicke auf den Link, um die Seite **Neues Passwort festlegen** zu öffnen. Gib ein neues Passwort ein (mindestens 8 Zeichen) und bestätige es, dann klicke auf **Passwort zurücksetzen**. Du wirst automatisch angemeldet und zum Dashboard weitergeleitet. Der Link läuft nach 1 Stunde ab und kann nur einmal verwendet werden. Wenn du einen weiteren Zurücksetzungslink anforderst, werden alle vorherigen Links ungültig.

### Öffentliche Selbstregistrierung

Wenn du keine Einladung hast, klicke unter dem Anmeldeformular auf **Noch kein Konto? Registrieren**. Die Seite wechselt zum Registrierungsformular — noch innerhalb desselben zweispaltigen Layouts — ohne neu zu laden. Gib eine E-Mail-Adresse und ein Passwort (mindestens 8 Zeichen) ein und klicke auf **Registrieren**.

Ist die E-Mail-Adresse verfügbar, siehst du die Bestätigung **Prüfe deine E-Mails**, und ein Bestätigungslink wird an diese Adresse gesendet. Öffne den Link, um deine Adresse zu bestätigen; deine Anfrage wandert danach in die Prüfwarteschlange eines Administrators, und alle Administratoren werden per E-Mail benachrichtigt. Du kannst dich anmelden, sobald ein Administrator deine Anfrage genehmigt hat — siehe [Registrierungsanfragen prüfen](#registrierungsanfragen-prüfen-nur-administratoren) weiter unten.

Das Registrierungsformular wird in folgenden Fällen mit einer generischen Fehlermeldung abgelehnt:

- Die E-Mail-Adresse gehört bereits zu einem aktiven oder archivierten Konto, einer ausstehenden Einladung oder einer anderen Registrierungsanfrage (bestätigt, unbestätigt oder zuvor abgelehnt) — der genaue Grund wird nie preisgegeben, um nicht zu verraten, welche Adressen registriert sind.
- Das Passwort erfüllt nicht die Mindestlänge.

Der Bestätigungslink läuft nach 7 Tagen ab; eine abgelaufene, nie geöffnete Anfrage wird automatisch entfernt und gibt die Adresse für einen neuen Versuch frei. Ein bereits verwendeter Link zeigt eine eigene Meldung „bereits verwendet".

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

Um jemanden zum Haushalt hinzuzufügen, öffne **Konten** im Admin-Bereich der Seitenleiste. Scrolle hinter die Kontentabelle zum Abschnitt **Ausstehende Einladungen**, gib die E-Mail-Adresse der Person in das Eingabefeld ein und klicke auf **Einladung senden**. Die App schickt der Person einen Link, über den sie ihr eigenes Passwort festlegen und sich anmelden kann. Die Einladung läuft nach 7 Tagen ab; du kannst sie jederzeit aus der direkt darunter liegenden Einladungstabelle heraus erneut senden.

Die Einladungstabelle zeigt alle bisherigen Einladungen und ihren Status:

> **Automatische Bereinigung**: Angenommene, zurückgezogene und ersetzte Einladungseinträge werden nach 30 Tagen automatisch entfernt. Ausstehende Einladungen, die bereits abgelaufen sind, werden beim nächsten Neustart des Servers entfernt.

| Status | Bedeutung |
|--------|----------|
| Ausstehend | Gesendet, noch nicht angenommen |
| Abgelaufen | Frist abgelaufen, bevor die Person angenommen hat |
| Angenommen | Die Person hat ihr Passwort festgelegt und sich angemeldet |
| Widerrufen | Du hast die Einladung zurückgezogen |

Für ausstehende und abgelaufene Einladungen stehen zwei Aktionen zur Verfügung: **Erneut senden** (sendet einen neuen Link) und **Widerrufen** (bricht die Einladung ab).

### Registrierungsanfragen prüfen (nur Administratoren)

Unterhalb des Einladungsbereichs auf der Admin-Seite **Konten** listet eine Tabelle **Registrierungsanfragen** alle Personen, die eine öffentliche Registrierungsanfrage eingereicht haben (siehe [Öffentliche Selbstregistrierung](#öffentliche-selbstregistrierung)), zusammen mit Status und Einreichungsdatum:

| Status | Bedeutung |
|--------|----------|
| Unbestätigt | Eingereicht, aber die Person hat die Bestätigungs-E-Mail noch nicht geöffnet |
| Wartet auf Genehmigung | Bestätigt — für einen Administrator sichtbar und bearbeitbar |
| Abgelehnt | Ein Administrator hat die Anfrage abgelehnt; der Grund (falls angegeben) wird angezeigt |

> **Blockierende Bedingung**: Nur Anfragen, die auf Genehmigung warten, können genehmigt oder abgelehnt werden — unbestätigte Einträge werden zur Übersicht angezeigt, ihre Aktionsschaltflächen haben aber keine Wirkung, bis die Person ihre E-Mail-Adresse bestätigt hat. Dies entspricht dem Prinzip des Alleiniger-Administrator-Schutzes an anderer Stelle in der App: Eine Aktion wird bewusst zurückgehalten, bis ihre Voraussetzung erfüllt ist.

- **Genehmigen** — legt ein aktives Mitgliedskonto mit der von der Person angegebenen E-Mail-Adresse und dem Passwort an und sendet ihr dieselbe Willkommens-E-Mail wie einem eingeladenen Mitglied. Die Anfrage verschwindet nach der Genehmigung aus dieser Tabelle.
- **Ablehnen** — öffnet ein Eingabefeld für eine optionale Begründung, markiert die Anfrage dann als abgelehnt und sendet der Person eine E-Mail mit dieser Begründung (oder einer allgemeinen Nachricht, falls keine angegeben wurde). Der abgelehnte Eintrag bleibt in der Tabelle bestehen — und die E-Mail-Adresse bleibt für eine neue Registrierung gesperrt —, bis du ihn löschst.
- **Löschen** — entfernt den Eintrag unabhängig vom Status. Bei einer abgelehnten Anfrage ist dies die einzige Möglichkeit, die E-Mail-Adresse für einen zukünftigen Registrierungsversuch freizugeben.

Handeln zwei Administratoren gleichzeitig an derselben Anfrage, wird die zweite Aktion mit einer Meldung zum aktuellen Status der Anfrage abgelehnt.

### Konten verwalten (nur Administratoren)

Die Kontentabelle auf der **Konten**-Seite listet alle Konten mit Anzeigename, E-Mail-Adresse, Rolle und Status auf. Verfügbare Aktionen:

- **Archivieren** — entzieht der Person den Zugriff. Archivierte Konten können sich nicht anmelden; ihre Verträge bleiben erhalten. Du kannst dies mit „Reaktivieren" rückgängig machen.
- **Reaktivieren** — stellt den Zugriff auf ein archiviertes Konto samt aller zugehörigen Verträge wieder her.
- **Zum Administrator machen / Zum Mitglied machen** — ändert die Rolle des Kontos.
- **Löschen** — entfernt ein archiviertes Konto und alle zugehörigen Daten dauerhaft. Dieser Vorgang kann nicht rückgängig gemacht werden. Nur für archivierte Konten verfügbar.

Die App stellt sicher, dass stets mindestens ein aktiver Administrator vorhanden ist. Archivieren, Zurückstufen und Löschen sind für den letzten verbliebenen Administrator deaktiviert, damit sich der Haushalt nie selbst aus der Kontoverwaltung aussperrt.

> **Hinweis**: Wenn ein Konto dauerhaft gelöscht wird, wird seine E-Mail-Adresse für eine erneute Verwendung freigegeben. Wurde die Adresse bereits einem neuen Konto zugewiesen (z. B. nach einer erneuten Einladung), zeigt der alte archivierte Eintrag „E-Mail neu vergeben" statt der Adresse, und „Reaktivieren" ist nicht mehr verfügbar.

### SMTP-Test (nur Administratoren)

Am unteren Rand der **Konten**-Seite befindet sich der Abschnitt **Test-E-Mail senden**. Gib eine beliebige E-Mail-Adresse ein und klicke auf **Senden**, um zu prüfen, ob der ausgehende E-Mail-Versand korrekt konfiguriert ist. Nutze dies nach einer Änderung der SMTP-Einstellungen, um den Versand zu testen, bevor du Benutzer einlädst.

### Anbieter-Logo-Cache (nur Administratoren)

Die App ruft Anbieter-Logos über das eigene Backend ab und speichert sie in einem lokalen Cache, damit sie bei erneuten Aufrufen sofort geladen werden. Wenn ein Anbieter sein Logo aktualisiert hat und die alte Version noch angezeigt wird, kann ein Administrator den Cache leeren:

1. `DELETE /api/admin/logos/cache` mit einer aktiven Administrator-Sitzung aufrufen – zum Beispiel mit `curl`:
   ```bash
   curl -X DELETE http://localhost:3001/api/admin/logos/cache \
     -H "Cookie: session=<deine-session-cookie>"
   ```
2. Die Antwort gibt an, wie viele Cache-Einträge entfernt wurden: `{ "deleted": N }`.
3. Beim nächsten Aufruf eines Logos ruft das Backend es erneut vom Logo-Dienst ab und füllt den Cache wieder auf.

> **Hinweis**: Für den Logo-Abruf muss `LOGO_DEV_TOKEN` in der Server-Umgebung gesetzt sein. Ohne diesen Token wird für alle Anbieter ein generisches Symbol angezeigt.

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

## 13. Eine selbst gehostete Instanz aktualisieren

Klaro wird als Docker-Image auf Docker Hub (`walefish/klaro`) veröffentlicht. Für ein Update ist kein Quellcode-Checkout erforderlich.

### So wird aktualisiert

1. Ein Terminal im Verzeichnis öffnen, das die `docker-compose.yml`-Datei enthält.
2. Das neue Image herunterladen und den Container neu starten:

   ```bash
   docker compose pull
   docker compose up -d
   ```

Docker ersetzt den laufenden Container durch das neue Image. Die Datenbank (standardmäßig unter `./data/contracts.db` gespeichert) ist als Volume eingebunden und wird beim Update nicht verändert.

### Versions-Tags

Jedes Release veröffentlicht zwei Docker-Tags:

| Tag | Bedeutung |
|-----|-----------|
| `walefish/klaro:latest` | Zeigt immer auf das aktuellste stabile Release |
| `walefish/klaro:vX.Y.Z` | Eine festgelegte Version (z. B. `v1.2.0`), nach dem Push unveränderlich |

`docker-compose.yml` verwendet standardmäßig `latest`. Um eine bestimmte Version festzulegen, die `image:`-Zeile anpassen:

```yaml
image: walefish/klaro:v1.2.0
```

### Laufende Version prüfen

Nach einem Update die Browser-Entwicklertools öffnen → Netzwerk → beliebige API-Anfrage → Antwort-Header. Der Header `x-klaro-version` zeigt die laufende Version. Alternativ die Docker-Hub-Tags-Seite (`hub.docker.com/r/walefish/klaro/tags`) aufrufen und die Digests vergleichen.

---

## 14. Feldreferenz

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

---

## 15. FAQ

Die FAQ-Seite beantwortet häufig gestellte Fragen zur App.

**Erreichbarkeit**: Klicke im App-Bereich der Seitennavigation auf **FAQ**, oder navigiere direkt zu `/faq`.

### FAQ lesen

Die Seite zeigt links eine dekorative Illustration und rechts eine Akkordeon-Liste mit Fragen (auf Mobilgeräten übereinander gestapelt). Klicke auf eine Frage, um die Antwort einzublenden. Klicke erneut auf dieselbe Frage, um sie wieder auszublenden.

### Sprache

Die FAQ-Inhalte folgen der aktiven App-Sprache. Wenn du die Sprache wechselst (siehe [Abschnitt 9](#9-sprache)), aktualisieren sich alle Fragen und Antworten automatisch ohne Neuladen der Seite.

### FAQ-Inhalte aktualisieren

Fragen und Antworten sind in den Übersetzungsdateien der App gespeichert (`en.json` und `de.json`). Um einen Eintrag hinzuzufügen, zu bearbeiten oder zu entfernen, ändere das Array `faq.items` in der entsprechenden Datei — Änderungen am Anwendungscode sind nicht erforderlich. Ein Neuerstellen der App ist nötig, damit die Änderungen wirksam werden.

## 16. Admin-Diagnose

Die Diagnose-Seite gibt Administratoren einen schnellen Überblick über den Systemzustand — nützlich bei der Fehlersuche in einer Bereitstellung oder beim Melden eines Problems.

**Erreichbarkeit**: Wechsle in der Seitennavigation in den Bereich **Admin** und klicke auf **Diagnose** (unter **Konten verwalten**), oder navigiere direkt zu `/admin/diagnostics`. Diese Seite ist **nur für Administratoren** zugänglich: abgemeldete Besucher werden zur Anmeldung weitergeleitet, angemeldete Nicht-Administratoren zum Dashboard (und sehen den Admin-Bereich gar nicht erst).

### Was angezeigt wird

Die Seite ist in drei Abschnitte gegliedert:

- **Versionen** — die laufende Anwendungsversion, die Version der SQLite-Datenbank-Engine und die Node.js-Laufzeitversion.
- **Systemprüfungen** — Plattform und CPU-Architektur; ob die App in einem Container läuft; ob ein Reverse-Proxy erkannt wurde (und welcher Forwarded-Header dies verraten hat); ausgehender Internetzugang; DNS-Auflösung; WebSocket-Unterstützungsstatus; die aktuelle Serverzeit in UTC und lokaler Zeit; die Uhrenabweichung gegenüber einer vertrauenswürdigen externen Zeitquelle; ob die konfigurierte öffentliche Domain (`APP_URL`) mit dem Host der eingehenden Anfrage übereinstimmt; und ob die Verbindung über HTTPS erfolgt.
- **Umgebungsvariablen** — der konfigurierte SMTP-Host, -Port, -Absenderadresse und -Absendername; sowie ob die logo.dev-Anbieter-Logo-Integration konfiguriert ist.

> **Konfigurationswerte, kein Versandtest**: Die SMTP-Felder zeigen die tatsächlich konfigurierten Werte für Host/Port/Absenderadresse/Absendername (nützlich, um einen Tippfehler oder veralteten Wert zu erkennen), versuchen aber nie einen echten Versand — das logo.dev-Feld zeigt nur konfiguriert/nicht konfiguriert. Um den tatsächlichen SMTP-Versand zu prüfen, verwende stattdessen **Testmail senden** auf der Konten-Seite.

Jede Prüfung zeigt ein farbiges Status-Badge — grün für OK, gelb für eine Warnung (z. B. eine abweichende Domain, eine Uhrenabweichung über dem Schwellenwert oder eine fehlende SMTP-Einstellung), rot für eine fehlgeschlagene oder abgelaufene Prüfung. Eine einzelne langsame oder fehlgeschlagene Prüfung (z. B. fehlender Internetzugang) verhindert nie, dass der Rest der Seite geladen wird — jede Live-Prüfung hat ihr eigenes Timeout (standardmäßig 5 Sekunden).

Auf dieser Seite werden niemals geheime Werte angezeigt (SMTP-Benutzername/-Passwort, Datenbankdateipfad, Tokens) — nur nicht-geheime Konfiguration wie der SMTP-Host und die Absenderadresse.

### Fallback ohne JavaScript

Dieselben Informationen sind auch als reine HTML-Seite unter derselben Adresse (`/admin/diagnostics`) verfügbar, direkt erreichbar (z. B. über `curl` oder einen Browser mit deaktiviertem JavaScript) — nützlich, wenn das JavaScript-Bundle der Haupt-App nicht geladen werden kann. Sie zeigt dieselben Abschnitte „Versionen" und „Systemprüfungen" ohne clientseitiges Skript.
