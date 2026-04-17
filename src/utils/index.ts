export function createPageUrl(pageName: string) {
  return '/' + pageName.replace(/([a-z])([A-Z])/g, '$1-$2').replace(/ /g, '-').toLowerCase();
}
