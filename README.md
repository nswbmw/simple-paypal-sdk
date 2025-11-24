## simple-paypal-sdk

Simple PayPal SDK for Node.js.

### Install

```sh
$ npm i simple-paypal-sdk --save
```

### Example

```js
import crypto from 'node:crypto'
import PayPal from 'simple-paypal-sdk'

const paypalClient = new PayPal({
  clientId: 'xxx',
  clientSecret: 'xxx',
  environment: 'sandbox'
})

;(async () => {
  const res = await paypalClient.execute({
    method: 'POST',
    url: '/v2/checkout/orders',
    headers: {
      'PayPal-Request-Id': crypto.randomUUID()
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

  /*
  {
    id: '0VK013084V996834D',
    status: 'PAYER_ACTION_REQUIRED',
    payment_source: { paypal: {} },
    links: [
      {
        href: 'https://api.sandbox.paypal.com/v2/checkout/orders/0VK013084V996834D',
        rel: 'self',
        method: 'GET'
      },
      {
        href: 'https://www.sandbox.paypal.com/checkoutnow?token=0VK013084V996834D',
        rel: 'payer-action',
        method: 'GET'
      }
    ]
  }
  */
  console.log(res)
})().catch(console.error)
```
