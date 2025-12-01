import request from 'lite-request'
import MemoryCache from 'memory-cache'
import { HttpsProxyAgent } from 'https-proxy-agent'
import { SocksProxyAgent } from 'socks-proxy-agent'

const cache = new MemoryCache.Cache()

class PayPal {
  constructor (options = {}) {
    this.clientId = options.clientId || options.client_id
    this.clientSecret = options.clientSecret || options.client_secret
    this.environment = options.environment || 'sandbox'

    if (!this.clientId || !this.clientSecret) {
      throw new TypeError('No clientId or clientSecret')
    }

    const proxy = options.proxy
    if (proxy) {
      if (typeof proxy === 'string') {
        if (proxy.startsWith('http://')) {
          this.agent = new HttpsProxyAgent(proxy)
        } else if (proxy.startsWith('socks://')) {
          this.agent = new SocksProxyAgent(proxy)
        }
      } else if (typeof proxy === 'object') {
        if (!['http', 'socks'].includes(proxy.protocol)) {
          throw new TypeError('proxy.protocol must be one of ["http", "socks"]')
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
    }
  }

  _getURL (url) {
    if (url.startsWith('https://')) {
      return url
    }
    url = url.replace(/^\//, '')
    return (this.environment === 'sandbox')
      ? `https://api.sandbox.paypal.com/${url}`
      : `https://api.paypal.com/${url}`
  }

  async _authenticate () {
    const url = `${this._getURL('v1/oauth2/token')}`
    const key = `paypal:${this.environment}:${this.clientId}:${this.clientSecret}:accessToken`
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
      method: 'POST',
      url,
      headers: {
        Authorization: `Basic ${Buffer.from(this.clientId + ':' + this.clientSecret).toString('base64')}`,
      },
      form: {
        grant_type: 'client_credentials'
      },
      json: true,
      agent: this.agent
    })

    const data = response.data
    cache.put(key, data.access_token, data.expires_in * 1000 - 30000)

    return data.access_token
  }

  async execute ({ method = 'GET', url, headers = {}, body }) {
    const accessToken = await this._authenticate()
    const payload = {
      method,
      url: this._getURL(url),
      headers: Object.assign({
        Authorization: `Bearer ${accessToken}`
      }, headers),
      json: true,
      agent: this.agent
    }

    if (body) {
      payload.body = body
    }

    const response = await request(payload)

    return response.data
  }
}

export default PayPal
