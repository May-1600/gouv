# Design — Site narratif data-driven 3D sur les mandats Macron

**Date** : 2026-03-02
**Statut** : Validé
**Approche** : Progressive Enhancement (A)

---

## Vision

Un site web 3D immersif où l'utilisateur scroll à travers un paysage géométrique low-poly représentant les années 2017→2026 des mandats Macron. Les données publiques françaises (data.gouv.fr) sont visualisées spatialement : le terrain, les couleurs et l'atmosphère reflètent le climat économique. Pour chaque événement majeur, l'utilisateur entre dans une pièce 3D explorable contenant des graphiques interactifs et des objets 3D représentant les indicateurs impactés.

---

## Décisions arrêtées

| Décision | Choix | Raison |
|----------|-------|--------|
| Framework front | Next.js 15 (App Router) | ISR, intégration Vercel, écosystème React |
| Moteur 3D | React Three Fiber v9 + Drei + Rapier | Overlay HTML natif dans la 3D, ScrollControls, écosystème pmndrs |
| Navigation principale | Scroll-driven (ScrollControls + useScroll) | Fonctionne sur mobile, narratif, accessible |
| Exploration événements | Pièces 3D explorables (clavier + tactile) | Immersif, isole la complexité par événement |
| Data dans les rooms | Mix objets 3D + panneaux HTML (Recharts) | Visuel immédiat + détails lisibles |
| Style visuel | Abstrait géométrique procédural | Couleurs/formes évoluent avec le climat économique |
| Base de données | Supabase (PostgreSQL) | Cache + state + narratifs |
| Déploiement | Vercel | Cron jobs, preview deployments, edge |
| Implémentation | Progressive Enhancement | Données d'abord, 3D minimal, puis enrichissement |

---

## Architecture technique

```
UTILISATEUR (navigateur / mobile)
        │
NEXT.JS 15 (Vercel)
├── / (SSR) ──────────── landing, SEO, fallback statique
├── /experience (client) ── R3F canvas + ErrorBoundary + Suspense
├── /api/sync (cron) ──── pipeline sync → Supabase
└── /api/indicators ───── API interne pour le front
        │
SUPABASE (PostgreSQL)
├── indicators ────── points de données chiffrés
├── events ────────── chronologie réformes/faits
├── event_indicators ─ jonction événements ↔ indicateurs
├── narratives ────── analyses éditoriales (humaines ou IA)
├── projections ───── scénarios prospectifs
└── sync_log ──────── traçabilité des syncs
```

---

## Modèle de données

### Table `indicators`
```sql
CREATE TABLE indicators (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  category TEXT NOT NULL,          -- 'economie' | 'emploi'
  name TEXT NOT NULL,              -- 'pib', 'dette_pib', 'chomage'...
  date DATE NOT NULL,
  value NUMERIC NOT NULL,
  unit TEXT,                       -- '%', 'Md€', '€', 'index'
  frequency TEXT NOT NULL,         -- 'monthly' | 'quarterly' | 'annual'
  source_dataset_id TEXT,
  source_resource_id TEXT,
  country TEXT DEFAULT 'FR',
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(name, date, country)
);
CREATE INDEX idx_indicators_lookup ON indicators(name, country, date);
```

### Table `events`
```sql
CREATE TABLE events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  date DATE NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  category TEXT,                   -- 'fiscalite', 'emploi', 'crise'...
  sources TEXT[],
  display_order INT
);
```

### Table `event_indicators` (jonction)
```sql
CREATE TABLE event_indicators (
  event_id UUID REFERENCES events(id) ON DELETE CASCADE,
  indicator_name TEXT NOT NULL,
  impact_description TEXT,         -- "PIB chute de 8% au T2 2020"
  PRIMARY KEY (event_id, indicator_name)
);
```

### Table `narratives`
```sql
CREATE TABLE narratives (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  indicator_name TEXT NOT NULL,
  period_start DATE NOT NULL,
  period_end DATE NOT NULL,
  content_before TEXT,
  content_analysis TEXT,
  content_comparison TEXT,
  content_projection TEXT,
  generated_by TEXT DEFAULT 'human',
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(indicator_name, period_start, period_end)
);
```

### Table `projections`
```sql
CREATE TABLE projections (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  indicator_name TEXT NOT NULL,
  scenario TEXT,                   -- 'tendanciel', 'alternatif'...
  data_points JSONB,               -- [{date, value}...]
  methodology TEXT,
  assumptions TEXT
);
```

### Table `sync_log`
```sql
CREATE TABLE sync_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  dataset_id TEXT,
  resource_id TEXT,
  synced_at TIMESTAMPTZ DEFAULT now(),
  rows_updated INT,
  status TEXT,
  error_message TEXT
);
```

---

## Structure du projet

```
/app
  /page.tsx                    → landing SSR (SEO, pitch, fallback statique)
  /experience/page.tsx         → wrapper client de la scène 3D
  /api/sync/route.ts           → Vercel Cron endpoint
  /api/indicators/route.ts     → API interne pour le front

/components
  /three                       → composants R3F (client-only)
    /canvas
      /MainCanvas.tsx          → <Canvas> + ErrorBoundary + Suspense
      /LoadingScreen.tsx       → écran de chargement 3D
    /world
      /Timeline.tsx            → rail scroll principal (2017→2026)
      /Terrain.tsx             → terrain procédural par année
      /YearMarker.tsx          → marqueur d'année sur le chemin
      /Atmosphere.tsx          → ciel, brouillard, lumière par période
    /rooms
      /EventRoom.tsx           → pièce générique (layout + navigation)
      /RoomLoader.tsx          → lazy loading / unloading des pièces
      /RoomControls.tsx        → contrôles clavier + tactile
    /data-viz
      /DataPanel.tsx           → <Html> wrapper pour graphiques
      /DataColumn.tsx          → objet 3D colonne (hauteur = valeur)
      /DataSphere.tsx          → objet 3D sphère (taille = valeur)
      /IndicatorLabel.tsx      → label 3D flottant
  /ui                          → composants React classiques (DOM)
    /Chart.tsx                 → Recharts wrapper
    /Narrative.tsx             → bloc texte narratif
    /MiniMap.tsx               → mini-carte de progression
    /MobileControls.tsx        → joystick tactile pour rooms
    /AccessibleFallback.tsx    → version texte/graphiques sans 3D

/lib
  /supabase.ts                 → client Supabase (singleton)
  /sync
    /pipeline.ts               → orchestration de la sync
    /fetchers.ts               → fetch API Tabulaire data.gouv (REST)
    /transformers.ts           → parsing données brutes → format indicators
  /store.ts                    → Zustand (navigation, room active, données)
  /queries.ts                  → requêtes Supabase typées

/types
  /indicators.ts               → types indicateurs, catégories, fréquences
  /events.ts                   → types événements
  /three.ts                    → types props composants 3D
  /database.ts                 → types générés depuis Supabase

/data
  /events.ts                   → chronologie éditoriale (seed)
  /indicator-config.ts         → config par indicateur (nom, unité, dataset, couleur)

/public
  /models/                     → assets 3D (.glb)
```

---

## Expérience utilisateur

### Navigation principale (scroll)
- L'utilisateur scroll → la caméra avance sur un rail 3D à travers le paysage
- Le scroll % mappe sur la période 2017→2026
- Le terrain et l'atmosphère changent selon le climat économique de la période :
  - 2017-2019 : couleurs chaudes, terrain plat, ciel clair (optimisme post-élection)
  - 2020 : couleurs froides, terrain fracturé, brouillard (COVID)
  - 2021-2022 : couleurs qui reviennent progressivement (reprise)
  - 2023-2024 : couleurs contrastées, terrain agité (tensions sociales, retraites)
  - 2025-2026 : transition vers le présent
- Des marqueurs d'année et d'événements apparaissent le long du chemin

### Salles d'événements (exploration)
- Clic sur un marqueur d'événement → transition caméra animée vers une pièce 3D
- Dans la pièce : navigation clavier (WASD/flèches) ou joystick tactile sur mobile
- Les données sont représentées par :
  - **Objets 3D** : colonnes (hauteur = valeur), sphères (taille = valeur) pour l'impact visuel immédiat
  - **Panneaux HTML** : graphiques Recharts détaillés + texte narratif, ancrés en 3D via `<Html>` de Drei
- Bouton "Retour" → transition caméra retour sur le chemin, la room est démontée

### Chargement
- Phase 1 : écran de chargement avec barre de progression (terrain + données)
- Phase 2 : le terrain et le rail sont rendus, navigation possible
- Phase 3 : les rooms sont chargées à la demande (lazy), démontées au retour

### Mobile & Accessibilité
- Le scroll fonctionne nativement sur mobile
- Les rooms utilisent un joystick tactile virtuel
- La landing page (/) est SSR avec graphiques statiques = version SEO + fallback sans WebGL
- ErrorBoundary : si R3F crash → affiche le fallback accessible

---

## Pipeline de sync

**Méthode** : API Tabulaire data.gouv (REST direct, plus fiable en serverless que le SDK MCP)

**Fréquence** : Vercel Cron hebdomadaire

**Flux** :
1. Le cron déclenche `/api/sync`
2. Pour chaque indicateur configuré dans `/data/indicator-config.ts` :
   a. Fetch l'API Tabulaire data.gouv avec le `resource_id` configuré
   b. Parse la réponse (CSV/JSON) via `/lib/sync/transformers.ts`
   c. Compare avec les données existantes dans Supabase
   d. Upsert les nouvelles données dans `indicators`
3. Si nouvelles données détectées → (optionnel) appel Claude API pour mettre à jour le narratif
4. Log dans `sync_log`

---

## Périmètre MVP (2 axes)

### Axe 1 : Économie
- PIB et croissance (trimestriel)
- Dette publique (% PIB)
- Déficit public
- Budget de l'État (dépenses par mission)

### Axe 2 : Emploi & Pouvoir d'achat
- Taux de chômage (trimestriel)
- Inflation / IPC (mensuel)
- Évolution SMIC / salaires

### Événements MVP (5-6)
- Suppression ISF → IFI (2017)
- Gilets jaunes (2018-2019)
- COVID-19 (2020)
- Plan de relance (2021)
- Réforme des retraites (2023)
- Situation actuelle (2026)

---

## Phases d'implémentation (Approche Progressive Enhancement)

| Phase | Contenu |
|-------|---------|
| **1. Data pipeline** | Scaffolding Next.js, schéma Supabase, sync MCP → 3 indicateurs (PIB, chômage, inflation) |
| **2. Rail 3D minimal** | ScrollControls + caméra sur rail, terrain géométrique simple, 10 stops (2017→2026) |
| **3. Pièces événements** | 2-3 pièces explorables (COVID, Gilets jaunes, Retraites) avec données réelles |
| **4. Polish visuel** | Ambiance par année, transitions, responsive, mobile controls, fallback |

---

## Stack technique complète

| Outil | Usage |
|-------|-------|
| Next.js 15 | Framework, App Router, API Routes, ISR |
| React Three Fiber v9 | Rendu 3D déclaratif |
| @react-three/drei | ScrollControls, Html, KeyboardControls, Text, Environment |
| @react-three/rapier | Physique (collisions dans les rooms) |
| Recharts | Graphiques dans les panneaux HTML |
| Zustand | State management partagé 3D ↔ UI |
| Supabase JS | Client base de données |
| Tailwind CSS | Styling UI |
| TypeScript | Typage |
| Vercel | Déploiement + Cron Jobs |

---

## Datasets data.gouv.fr

### Économie
| Donnée | Dataset ID | Source |
|--------|-----------|--------|
| PIB | `produit-interieur-brut-pib-et-grands-agregats-economiques` | INSEE |
| Comptabilité nationale | `comptabilite-nationale` | INSEE (BDM) |
| Budget État | `jeux-de-donnees-des-situations-mensuelles-budgetaires-de-letat-des-exercices-2013-a-nos-jours` | DGFIP |
| Comparaison dépenses FR/Europe | `comparaison-des-depenses-publiques-en-france-et-en-europe` | DREES |

### Emploi & Pouvoir d'achat
| Donnée | Dataset ID | Source |
|--------|-----------|--------|
| Emploi, chômage séries longues | `activite-emploi-et-chomage-series-longues` | INSEE |
| Chômage Eurostat | `taux-de-chomage-standardise-eurostat-nd` | Banque de France |
| Salaires et SMIC | `series-chronologiques-sur-les-salaires-et-le-cout-du-travail` | INSEE |
| IPC / Inflation | `indice-des-prix-a-la-consommation-jeu-de-donnees-principal` | INSEE |
| Allocataires chômage | `allocataires-de-lassurance-chomage` | France Travail |

---

## Contraintes

- **Neutralité** : les données parlent, pas d'agenda politique
- **Sources** : toujours citer (INSEE, France Travail, DGFIP, DREES...)
- **Licence** : Licence Ouverte / ODbL — réutilisation libre avec mention de source
- **Performance** : lazy loading rooms, dispose on unmount, mobile-first
- **Accessibilité** : fallback SSR sans 3D sur la landing page
