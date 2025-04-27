// https://nitro.unjs.io/config
export default defineNitroConfig({
  compatibilityDate: '2025-04-26',
  srcDir: 'server',

  runtimeConfig: {
    db: {
      host: '',
      port: 5432,
      user: '',
      pass: '',
      name: '',
    },
  },
});
