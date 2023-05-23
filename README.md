## simple-paypal-sdk


### No proxy

```js
const PayPal = require('simple-paypal-sdk')
const paypalClient = new PayPal({
  clientId: 'xxx',
  clientSecret: 'xxx',
  environment: 'sandbox'
})

;(async () => {
  const res = await paypalClient.execute({
    method: 'post',
    url: '/v2/checkout/orders',
    headers: {
      'PayPal-Request-Id': '64d280f6-4852-44d2-9572-5f19ed2c0a10'
    },
    body: {
      intent: 'CAPTURE',
      purchase_units: [
        {
          amount: { currency_code: 'USD', value: 0.99 },
          shipping: {
            name: {
              full_name: 'first last'
            },
            type: 'SHIPPING',
            address: {
              country_code: 'US',
              admin_area_1: 'AL',
              admin_area_2: 'city',
              address_line_1: 'line1',
              address_line_2: 'line2',
              postal_code: '10000'
            }
          }
        }
      ],
      payment_source: {
        paypal: {
          experience_context: {
            return_url: 'http://localhost:3000/paypal/success?orderId=1',
            cancel_url: 'http://localhost:3000/paypal/cancel?orderId=1',
            payment_method_preference: 'IMMEDIATE_PAYMENT_REQUIRED',
            shipping_preference: 'SET_PROVIDED_ADDRESS',
            user_action: 'PAY_NOW'
          }
        }
      }
    }
  })
  console.log(res)
})().catch(console.error)
```

### Proxy

```js
const PayPal = require('simple-paypal-sdk')
const paypalClient = new PayPal({
  clientId: 'xxx',
  clientSecret: 'xxx',
  environment: 'production',
  proxy: {
    protocol: 'http', // http|socks
    host: '127.0.0.1',
    port: 1234,
    username: 'admin',
    password: '123456'
  }
})

;(async () => {
  const res = await paypalClient.execute({
    method: 'post',
    url: '/v2/checkout/orders',
    headers: {
      'PayPal-Request-Id': '64d280f6-4852-44d2-9572-5f19ed2c0a10'
    },
    body: {
      intent: 'CAPTURE',
      purchase_units: [
        {
          amount: { currency_code: 'USD', value: 0.99 },
          shipping: {
            name: {
              full_name: 'first last'
            },
            type: 'SHIPPING',
            address: {
              country_code: 'US',
              admin_area_1: 'AL',
              admin_area_2: 'city',
              address_line_1: 'line1',
              address_line_2: 'line2',
              postal_code: '10000'
            }
          }
        }
      ],
      payment_source: {
        paypal: {
          experience_context: {
            return_url: 'http://localhost:3000/paypal/success?orderId=1',
            cancel_url: 'http://localhost:3000/paypal/cancel?orderId=1',
            payment_method_preference: 'IMMEDIATE_PAYMENT_REQUIRED',
            shipping_preference: 'SET_PROVIDED_ADDRESS',
            user_action: 'PAY_NOW'
          }
        }
      }
    }
  })
  console.log(res)
})().catch(console.error)
```
