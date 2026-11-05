// The settings for each environment (test site). The tests read them from here,
// so no test has a site address or a name-tag written inside it.
//
// YOU CHANGE ONE THING: ME, your name-tag from the UCTP top bar
// ("You are: Ana-4821" -> 'Ana-4821'). Keep the quotes.
const ME = process.env.UCTP_NAME_TAG || 'Ana-4821';

const environments = {
  staging: {
    BASE_URL: 'https://city-treasurer-staging.aiqe.pro',  // the training copy of UCTP
    TENANT: 'TAGAYTAY',
  },
  // At your company you add more here, for example:
  // qa: { BASE_URL: 'https://qa.my-company.example', TENANT: '...' },
};

const name = process.env.TEST_ENV || 'staging';          // which environment to test
const env = environments[name];
if (!env) throw new Error(`Unknown TEST_ENV "${name}". Use one of: ${Object.keys(environments).join(', ')}`);

module.exports = {
  ENV: name,
  BASE_URL: process.env.BASE_URL || env.BASE_URL,        // a BASE_URL setting wins over the file
  TENANT: env.TENANT,
  ME,
  // The browsers npm run test:watch uses, in run order (Charter360 sends its own list to the runner).
  browsers: ['chrome', 'firefox'],
};
