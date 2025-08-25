export function img(name: string): string {
  try {
    return new URL(`../assets/${name}`, import.meta.url).href
  } catch (error) {
    console.warn(`Failed to load asset: ${name}`, error)
    return `/src/assets/${name}`
  }
}


