import MemoryCache from 'memory-cache'

const cache = new MemoryCache.Cache()

class PayPal {
  constructor (options = {}) {
    this.clientId = options.clientId || options.client_id
    this.clientSecret = options.clientSecret || options.client_secret
    this.environment = options.environment || 'sandbox'

    if (!this.clientId || !this.clientSecret) {
      throw new TypeError('No clientId or clientSecret')
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
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        Authorization: `Basic ${btoa(`${this.clientId}:${this.clientSecret}`)}`,
        'Content-Type': 'application/x-www-form-urlencoded'
      },
      body: 'grant_type=client_credentials'
    })

    if (!response.ok) {
      const text = await response.text()
      throw new Error(`PayPal OAuth failed with status ${response.status}: ${text}`)
    }

    const data = await response.json()
    cache.put(key, data.access_token, data.expires_in * 1000 - 30000)

    return data.access_token
  }

  async execute ({ method = 'GET', url, headers = {}, body }) {
    const accessToken = await this._authenticate()

    const fetchOptions = {
      method,
      headers: Object.assign({
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/x-www-form-urlencoded'
      }, headers)
    }

    if (typeof body === 'string') {
      fetchOptions.body = body
    } else {
      if (body != null) {
        fetchOptions.body = new URLSearchParams(body)
      }
    }

    const response = await fetch(this._getURL(url), fetchOptions)

    if (!response.ok) {
      const text = await response.text()
      throw new Error(`PayPal request failed with status ${response.status}: ${text}`)
    }

    const data = await response.json()
    return data
  }
}

export default PayPal
