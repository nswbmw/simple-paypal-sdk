const request = require('request-promise')
const MemoryCache = require('memory-cache')
const HttpsProxyAgent = require('https-proxy-agent')
const { SocksProxyAgent } = require('socks-proxy-agent')

const pkg = require('./package')
const cache = new MemoryCache.Cache()

function PayPal (options = {}) {
  this.clientId = options.clientId || options.client_id
  this.clientSecret = options.clientSecret || options.client_secret
  this.environment = options.environment || 'sandbox'

  if (!this.clientId || !this.clientSecret) {
    throw new Error('No clientId or clientSecret')
  }

  const proxy = options.proxy
  if (proxy) {
    if (!['http', 'socks'].includes(proxy.protocol)) {
      throw new Error('proxy.protocol must be one of ["http", "socks"]')
    }
    this.agent = (proxy.protocol === 'http')
      ? new HttpsProxyAgent((proxy.username && proxy.password)
        ? `http://${proxy.username}:${proxy.password}@${proxy.host}:${proxy.port}`
        : `http://${proxy.host}:${proxy.port}`
      )
      : new SocksProxyAgent((proxy.username && proxy.password)
        ? `socks://${proxy.username}:${proxy.password}@${proxy.host}:${proxy.port}`
        : `socks://${proxy.host}:${proxy.port}`
      )
  }

  return this
}

PayPal.prototype._getURL = function (url) {
  url = url.replace(/^\//, '')
  return (this.environment === 'sandbox')
    ? `https://api.sandbox.paypal.com/${url}`
    : `https://api.paypal.com/${url}`
}

PayPal.prototype._authenticate = async function () {
  const url = `${this._getURL('v1/oauth2/token')}`
  const key = `${pkg.name}:accessToken`
  const accessToken = cache.get(key)
  if (accessToken) {
    return accessToken
  }

  /*
  {
    scope: 'https://uri.paypal.com/services/invoicing https://uri.paypal.com/services/vault/payment-tokens/read https://uri.paypal.com/services/disputes/read-buyer https://uri.paypal.com/services/payments/realtimepayment https://uri.paypal.com/services/disputes/update-seller https://uri.paypal.com/services/payments/payment/authcapture openid https://uri.paypal.com/services/disputes/read-seller Braintree:Vault https://uri.paypal.com/services/payments/refund https://api.paypal.com/v1/vault/credit-card https://api.paypal.com/v1/payments/.* https://uri.paypal.com/payments/payouts https://uri.paypal.com/services/vault/payment-tokens/readwrite https://api.paypal.com/v1/vault/credit-card/.* https://uri.paypal.com/services/subscriptions https://uri.paypal.com/services/applications/webhooks',
    access_token: 'A21AAJOo41Vq1b7ZBzSdgkcZ4H1MlymTRrcNk9E4K892VJc2WshgT1KB0CvRjt5Cx_J59lGOWQTxKzQ-UMgJqKYriBjUmrVyA',
    token_type: 'Bearer',
    app_id: 'APP-80W284484P519543T',
    expires_in: 32342,
    nonce: '2023-03-14T11:11:09Z_eWb4VNducCmzC9kIK4MjcwXbC9ZuCzlz_LnnhcLeN8'
  }
   */
  const response = await request({
    method: 'post',
    url,
    json: true,
    headers: {
      Authorization: `Basic ${Buffer.from(this.clientId + ':' + this.clientSecret).toString('base64')}`,
    },
    form: {
      grant_type: 'client_credentials'
    },
    agent: this.agent
  })

  cache.put(key, response.access_token, response.expires_in * 1000 - 30000)

  return response.access_token
}

PayPal.prototype.execute = async function ({ method = 'get', url, headers = {}, body }) {
  url = this._getURL(url)

  const accessToken = await this._authenticate()
  const payload = {
    method,
    url,
    json: true,
    headers: Object.assign({
      Authorization: `Bearer ${accessToken}`
    }, headers),
    agent: this.agent
  }

  if (body) {
    payload.body = body
  }

  return request(payload)
}

module.exports = PayPal
