/**
 * Seed script — run via: npx tsx scripts/seed.ts
 * Seeds the events table from hardcoded timeline data.
 */
import { config } from 'dotenv'
config({ path: '.env.local' })
import { createClient } from '@supabase/supabase-js'

const TIMELINE_EVENTS = [
  {
    date: '2017-05-14',
    title: 'Élection Emmanuel Macron',
    description:
      'Élection du président avec 66,1% des voix au second tour face à Marine Le Pen.',
    category: 'reforme',
    indicatorNames: ['pib', 'chomage'],
    sources: ['https://www.conseil-constitutionnel.fr/'],
    displayOrder: 1,
  },
  {
    date: '2017-12-30',
    title: 'Suppression ISF → IFI',
    description:
      "Remplacement de l'Impôt de Solidarité sur la Fortune par l'Impôt sur la Fortune Immobilière. Flat tax de 30% sur les revenus du capital.",
    category: 'fiscalite',
    indicatorNames: ['pib'],
    sources: ['https://www.legifrance.gouv.fr/'],
    displayOrder: 2,
  },
  {
    date: '2018-11-17',
    title: 'Mouvement des Gilets jaunes',
    description:
      "Mouvement social déclenché par la hausse de la taxe carbone sur les carburants. Concessions gouvernementales : prime d'activité, annulation taxe carbone.",
    category: 'social',
    indicatorNames: ['inflation_ipc', 'pib'],
    sources: [],
    displayOrder: 3,
  },
  {
    date: '2020-03-17',
    title: 'Premier confinement COVID-19',
    description:
      'Confinement national strict. PIB chute de -7,9% sur l\'année. Mise en place du "quoi qu\'il en coûte".',
    category: 'crise',
    indicatorNames: ['pib', 'chomage', 'inflation_ipc'],
    sources: [],
    displayOrder: 4,
  },
  {
    date: '2021-09-03',
    title: 'Plan France Relance',
    description:
      'Plan de relance de 100 Md€ : transition écologique, compétitivité, cohésion. Prolongé par France 2030 (34 Md€).',
    category: 'reforme',
    indicatorNames: ['pib', 'chomage'],
    sources: ['https://www.economie.gouv.fr/plan-de-relance'],
    displayOrder: 5,
  },
  {
    date: '2023-04-14',
    title: 'Réforme des retraites (49.3)',
    description:
      "Recul de l'âge légal de départ de 62 à 64 ans. Adoption par 49.3. Mouvement social massif.",
    category: 'reforme',
    indicatorNames: ['chomage'],
    sources: ['https://www.legifrance.gouv.fr/'],
    displayOrder: 6,
  },
]

async function seed() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  if (!supabaseUrl || !supabaseKey) {
    console.error('Missing NEXT_PUBLIC_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_ANON_KEY')
    process.exit(1)
  }

  const supabase = createClient(supabaseUrl, supabaseKey)

  console.log('Seeding events...')

  for (const event of TIMELINE_EVENTS) {
    const { data: inserted, error } = await supabase
      .from('events')
      .insert({
        date: event.date,
        title: event.title,
        description: event.description,
        category: event.category,
        sources: event.sources,
        display_order: event.displayOrder,
      })
      .select()
      .single()

    if (error) {
      console.error(`  ✗ ${event.title}: ${error.message}`)
      continue
    }

    console.log(`  ✓ ${event.title}`)

    // Insert event_indicators junction
    for (const indicatorName of event.indicatorNames) {
      const { error: junctionError } = await supabase
        .from('event_indicators')
        .insert({
          event_id: inserted.id,
          indicator_name: indicatorName,
        })

      if (junctionError) {
        console.error(`    ✗ link ${indicatorName}: ${junctionError.message}`)
      }
    }
  }

  console.log('Done!')
}

seed().catch(console.error)
