const FUNNY_NAMES = [
  'hund_dog',
  'kaffe_coffee',
  'brød_bread',
  'hygge_cozy',
  'ost_cheese',
  'is_icecream',
  'ø_island',
  'tak_thanks',
  'sjov_fun',
  'skov_forest',
  'drøm_dream',
  'skål_cheers',
  'æble_apple',
  'bjørn_bear',
  'eventyr_fairytale',
  'sol_sun',
  'fisk_fish',
  'kage_cake',
  'blomst_flower',
  'fugl_bird',
  'hav_ocean',
  'bog_book',
  'kat_cat',
  'regn_rain',
  'vind_wind',
  'sne_snow',
  'stol_chair',
  'bold_ball',
  'smør_butter',
  'sko_shoe',
] as const

export function generateRandomNickname(): string {
  const name = FUNNY_NAMES[Math.floor(Math.random() * FUNNY_NAMES.length)]
  const num = Math.floor(Math.random() * 100)
  return `${name}_${num}`
}
